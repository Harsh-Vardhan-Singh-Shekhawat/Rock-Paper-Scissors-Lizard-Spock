import { useEffect, useState } from "react";
import {
  fetchCurrentGame,
  handlePlayedGame,
  removeGame,
  updateJ1Timeout,
  updateJ2Timeout,
  updateWinner,
} from "../utils/Helpers";
import { IGame } from "../utils/Game";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import Move from "../utils/Move";
import RPSContractData from "../utils/RPSContractData";
import { waitForTransactionReceipt } from "viem/actions";
import { ethers } from "ethers";
import toast from "react-hot-toast";

interface IGameSelfCreated {
  move: string;
  salt: string;
  ethValue: string;
  otherPlayer: string;
  contractAddress: string;
  deploymentTime: string;
}

const CurrentGame = () => {
  const account = useAccount();
  const client = usePublicClient();
  const [move, setMove] = useState<Move>();
  const [createdByData, setCreatedByData] = useState<IGameSelfCreated>();
  const [gameData, setGameData] = useState<IGame>();
  const [gameCreatedForYou, setGameCreatedForYou] = useState<IGame>();
  const { data: walletClient } = useWalletClient();
  const [startTime, setStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  const [j2TimeoutLoader, setJ2TimeoutLoader] = useState(false);
  const [j1TimeoutLoader, setJ1TimeoutLoader] = useState(false);
  const [solveLoader, setSolveLoader] = useState(false);
  const [playLoader, setPlayLoader] = useState(false);

  const reset = () => {
    setMove(undefined);
    setCreatedByData(undefined);
    setGameCreatedForYou(undefined);
    setGameData(undefined);
    setTimeLeft(300);
    setStartTime(0);
  };

  /**
   * //////////////////////////////////////////////////////////////
   *                         TIMEOUT EFFECTS
   * //////////////////////////////////////////////////////////////
   */
  useEffect(() => {
    const endTime = startTime + 5 * 60 * 1000;

    const interval = setInterval(() => {
      const currentTime = new Date().getTime();
      const remainingTime = Math.max(
        Math.floor((endTime - currentTime) / 1000),
        0
      ); // Time left in seconds

      setTimeLeft(remainingTime);

      if (remainingTime === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (gameCreatedForYou !== undefined) {
      setStartTime(new Date(gameCreatedForYou.time).getTime());
    } else if (createdByData !== undefined) {
      setStartTime(new Date(createdByData.deploymentTime).getTime());
    }
  }, [createdByData, gameCreatedForYou]);

  /**
   *  //////////////////////////////////////////////////////////////
   *                            LOCAL STORAGE
   * //////////////////////////////////////////////////////////////
   */
  useEffect(() => {
    const getValue = () => {
      const createdGameData = localStorage.getItem("game");
      if (createdGameData !== null) {
        const value = JSON.parse(createdGameData);
        setCreatedByData(value);
      }
    };
    getValue();
    const handleStorageChange = () => {
      getValue();
    };
    // Add event listener for storage changes
    window.addEventListener("storage", handleStorageChange);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // this is for the current user who have created the new game
  useEffect(() => {
    const getDataValues = async () => {
      if (account.status === "connected") {
        if (createdByData !== undefined) {
          const gameDataFetched = await fetchCurrentGame(
            createdByData.otherPlayer
          );
          if (gameData !== undefined) {
            if (!gameData.isPlayed && gameDataFetched.isPlayed) {
              toast.success("Other player has played his move!");
            }
            // timeout session left - if timeout then remove this things locally
            if (!gameData.j1Timeout && gameDataFetched.j1Timeout) {
              toast.error("You take too much time to solve!");
              localStorage.clear();
              await removeGame(account.address, createdByData.otherPlayer);
              reset();
              return;
            }
          }

          setGameData(gameDataFetched);
        }
      }
    };

    const intervalId = setInterval(getDataValues, 5000);
    return () => clearInterval(intervalId);
  }, [account.status, createdByData, gameData]);

  // this is for the other user for whom game is created
  useEffect(() => {
    const getDataValues = async () => {
      if (account.status === "connected" && createdByData === undefined) {
        const gameDataFetched = await fetchCurrentGame(account.address);
        if (gameDataFetched === undefined) return;

        if (gameCreatedForYou === undefined) toast.success("New Game for you!");
        if (gameCreatedForYou !== undefined) {
          if (
            gameCreatedForYou.winner === null &&
            gameDataFetched.winner !== null
          ) {
            if (gameDataFetched.winner === account.address) {
              // show notification you won user b
              toast.success("You Won!");
            } else {
              // show notification you lose user b
              toast.error("You Lose!");
            }
            await removeGame(
              gameDataFetched.createdBy,
              gameDataFetched.createdFor
            );
            reset();
            return;
          }
          if (!gameCreatedForYou.j2Timeout && gameDataFetched.j2Timeout) {
            toast.error("You took too much time to play!");
            await removeGame(
              gameCreatedForYou.createdBy,
              gameCreatedForYou.createdFor
            );
            reset();
            return;
          }
        }

        setGameCreatedForYou(gameDataFetched);
      }
    };

    const intervalId = setInterval(getDataValues, 5000);
    return () => clearInterval(intervalId);
  }, [account.status, gameCreatedForYou]);

  const play = async () => {
    try {
      if (gameCreatedForYou !== undefined && account.status === "connected") {
        if (move === Move.Null) {
          toast.error("Choose a move!");
          return;
        }
        setPlayLoader(true);
        const hash = await walletClient?.writeContract({
          abi: RPSContractData.abi,
          functionName: "play",
          args: [Move[move as number]],
          value: BigInt(gameCreatedForYou.ethValue),
          address: gameCreatedForYou.contractAddress as `0x${string}`,
          account: account.address,
        });
        if (walletClient && hash !== undefined) {
          await waitForTransactionReceipt(walletClient, { hash: hash });
        }
        await handlePlayedGame(account.address);
        toast.success("You played successfully, wait for owner to solve this!");
        setPlayLoader(false);
      }
    } catch (e) {
      setPlayLoader(false);
      console.log("error while sending play tx : ", e);
    }
  };

  const solve = async () => {
    try {
      if (createdByData !== undefined && account.status === "connected") {
        setSolveLoader(true);
        const balanceBefore = await client?.getBalance({
          address: account.address,
        });
        const hash = await walletClient?.writeContract({
          abi: RPSContractData.abi,
          functionName: "solve",
          args: [
            Move[createdByData.move as unknown as number],
            createdByData.salt,
          ],
          address: createdByData.contractAddress as `0x${string}`,
          account: account.address,
        });
        if (walletClient && hash !== undefined) {
          await waitForTransactionReceipt(walletClient, { hash: hash });
        }
        const balanceAfter = await client?.getBalance({
          address: account.address,
        });
        if (balanceAfter !== undefined && balanceBefore !== undefined) {
          if (balanceAfter > balanceBefore) {
            // user a wins show notification and set winner in db
            toast.success("You Won!");
            await updateWinner(account.address, createdByData.otherPlayer); // winner, address (createdFor)
          } else {
            // user b wins set winner in db
            toast.error("You Lose!");
            await updateWinner(
              createdByData.otherPlayer,
              createdByData.otherPlayer
            ); // winner, address (createdFor)
          }
        }
        localStorage.clear();
        reset();
        setSolveLoader(false);
        // remove data from local storage and database
        //based on balance update send notification who is the winner
      }
    } catch (e) {
      setSolveLoader(false);
      console.log("error while sending solve tx : ", e);
    }
  };

  // if user a i.e. who created the game didn't solve this game
  const j1Timeout = async () => {
    try {
      if (gameCreatedForYou !== undefined && account.status === "connected") {
        setJ1TimeoutLoader(true);
        const hash = await walletClient?.writeContract({
          abi: RPSContractData.abi,
          functionName: "j1Timeout",
          address: gameCreatedForYou.contractAddress as `0x${string}`,
          account: account.address,
        });
        if (walletClient && hash !== undefined) {
          await waitForTransactionReceipt(walletClient, { hash: hash });
        }

        await updateJ1Timeout(
          gameCreatedForYou.createdBy,
          gameCreatedForYou.createdFor
        );

        toast.success("Timeout successfully!");
        reset();
        setJ1TimeoutLoader(false);
      }
    } catch (e) {
      setJ1TimeoutLoader(false);
      console.log("error while sending solve tx : ", e);
    }
  };

  //   if user b i.e. the game created for didn't play
  const j2Timeout = async () => {
    try {
      if (createdByData !== undefined && account.status === "connected") {
        setJ2TimeoutLoader(true);
        const hash = await walletClient?.writeContract({
          abi: RPSContractData.abi,
          functionName: "j2Timeout",
          address: createdByData.contractAddress as `0x${string}`,
          account: account.address,
        });
        if (walletClient && hash !== undefined) {
          await waitForTransactionReceipt(walletClient, { hash: hash });
        }
        await updateJ2Timeout(account.address, createdByData.otherPlayer);
        localStorage.clear();
        reset();
        toast.success("Timeout successfully!");
        setJ2TimeoutLoader(false);
      }
    } catch (e) {
      setJ2TimeoutLoader(false);
      console.log("error while sending solve tx : ", e);
    }
  };

  if (createdByData === undefined && gameCreatedForYou === undefined) {
    return (
      <div>
        <div className="heading">Current Games</div>
        <div className="font-light text-sm">No Active Game</div>
      </div>
    );
  }

  return (
    <div>
      <div className="heading">Current Games</div>
      <div>
        {createdByData !== undefined && (
          <div>
            <div className="sub-heading mt-2 ">Your Move</div>
            <div className="input-tag text-center "> {createdByData.move} </div>
            <div className="sub-heading"> Your Salt </div>
            <div className="input-tag text-center"> {createdByData.salt} </div>
            <div className="sub-heading"> Other Player Address </div>

            <div className="input-tag text-center">
              {createdByData.otherPlayer}
            </div>

            {timeLeft === 0 && !gameData?.isPlayed && (
              <div className="flex flex-col items-center">
                {j2TimeoutLoader ? (
                  <div>
                    <span className="loader"></span>
                  </div>
                ) : (
                  <button onClick={j2Timeout} className="button-tag">
                    TIMEOUT
                  </button>
                )}
              </div>
            )}

            {timeLeft !== 0 && !gameData?.isPlayed && (
              <div className="text-center my-2 font-semibold">
                TIME LEFT FOR TIMEOUT : {timeLeft}s
              </div>
            )}

            <br />
            <div>
              {gameData?.isPlayed ? (
                <div className="flex flex-col items-center">
                  {solveLoader ? (
                    <div>
                      <span className="loader"></span>
                    </div>
                  ) : (
                    <button onClick={solve} className="button-tag">
                      SOLVE
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center font-semibold">
                  !! THE OTHER PLAYER HASN'T PLAYED THE GAME YET !!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        {gameCreatedForYou !== undefined && (
          <div>
            <div className="sub-heading"> Game Created By </div>
            <div className="input-tag text-center ">
              {gameCreatedForYou?.createdBy}
            </div>
            <div className="sub-heading">Contract Address</div>
            <div className="input-tag text-center">
              {gameCreatedForYou?.contractAddress}
            </div>
            <div className="sub-heading">ETH value to stake</div>
            <div className="input-tag text-center">
              {ethers.formatEther(gameCreatedForYou?.ethValue) + " ETH"}
            </div>
            <div>
              <p className="sub-heading">Choose your move</p>
              <select
                id="moveDropdown"
                value={move}
                onChange={(e: any) => {
                  setMove(e.target.value);
                }}
                className="input-tag"
              >
                {Object.keys(Move)
                  .filter((key) => isNaN(Number(key))) // Filter out numeric keys
                  .map((move) => (
                    <option key={move} value={move}>
                      {move}
                    </option>
                  ))}
              </select>
            </div>
            {!gameCreatedForYou.isPlayed && (
              <div className="flex flex-col items-center">
                {playLoader ? (
                  <div>
                    <span className="loader"></span>
                  </div>
                ) : (
                  <button onClick={play} className="button-tag">
                    PLAY
                  </button>
                )}
              </div>
            )}

            {timeLeft !== 0 && gameCreatedForYou.isPlayed && (
              <div className="text-center my-2 font-semibold">
                TIME LEFT FOR TIMEOUT : {timeLeft}s
              </div>
            )}

            {timeLeft === 0 && gameCreatedForYou.isPlayed && (
              <div className="flex flex-col items-center">
                {j1TimeoutLoader ? (
                  <div>
                    <span className="loader"></span>
                  </div>
                ) : (
                  <button onClick={j1Timeout} className="button-tag">
                    TIMEOUT
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentGame;
