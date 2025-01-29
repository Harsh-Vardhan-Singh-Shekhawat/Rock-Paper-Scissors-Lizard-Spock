import { useEffect, useState } from "react";
import {
  fetchCurrentGame,
  handlePlayedGame,
  removeGame,
  updateWinner,
} from "../utils/Helpers";
import { IGame } from "../utils/Game";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import Move from "../utils/Move";
import RPSContractData from "../utils/RPSContractData";
import { waitForTransactionReceipt } from "viem/actions";

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
  const { data: walletClient } = useWalletClient();
  const [gameCreatedForYou, setGameCreatedForYou] = useState<IGame>();
  const [startTime, setStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

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
      console.log("deplyment time");
      console.log("create by data : ", createdByData);
      console.log(createdByData.deploymentTime);
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

  useEffect(() => {
    const getGame = async () => {
      if (account.status === "connected") {
        console.log("cread by data : ", createdByData);
        if (createdByData !== undefined) {
          console.log("self");
          const gameData = await fetchCurrentGame(createdByData.otherPlayer);
          if (gameData === undefined) return;
          console.log("game data from db user a : ", gameData);
          // show notification based on you loose or fail and then remove the entry from db
          if (gameData.winner !== null) {
            if (gameData.winner === account.address) {
              // show notification you won
              console.log("user A won");
            } else {
              // show notification you lose
              console.log("user A lose");
            }
            setTimeout(() => {
              const removeData = async () => {
                await removeGame(account.address, createdByData.otherPlayer);
              };
              removeData;
            }, 10000);

            reset();
          }
          setGameData(gameData);
        } else {
          console.log("hello world");
          const gameData = await fetchCurrentGame(account.address);
          if (gameData === undefined) return;
          console.log("game data from db user b : ", gameData);
          // if winner exists then delete the db entry and show notificaiton
          if (gameData.winner !== null) {
            if (gameData.winner === account.address) {
              // show notification you won
              console.log("user B won");
            } else {
              // show notification you lose
              console.log("user B lose");
            }
            if (gameCreatedForYou !== undefined)
              setTimeout(() => {
                const removeData = async () => {
                  await removeGame(
                    gameCreatedForYou?.createdBy,
                    gameCreatedForYou?.createdFor
                  );
                };
                removeData;
              }, 10000);
            reset();
          }
          setGameCreatedForYou(gameData);
        }
      }
    };
    getGame();
    const intervalId = setInterval(getGame, 8000);

    return () => clearInterval(intervalId);
  }, [account.status, createdByData, gameCreatedForYou]);

  const play = async () => {
    try {
      if (gameCreatedForYou !== undefined && account.status === "connected") {
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
      }
    } catch (e) {
      console.log("error while sending play tx : ", e);
    }
  };

  const solve = async () => {
    try {
      if (createdByData !== undefined && account.status === "connected") {
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
            await updateWinner(account.address, createdByData.otherPlayer); // winner, address (createdFor)
          } else {
            // user b wins set winner in db
            await updateWinner(
              createdByData.otherPlayer,
              createdByData.otherPlayer
            ); // winner, address (createdFor)
          }
        }
        localStorage.clear();

        // remove data from local storage and database
        //based on balance update send notification who is the winner
      }
    } catch (e) {
      console.log("error while sending solve tx : ", e);
    }
  };

  // if user a i.e. who created the game didn't solve this game
  const j1Timeout = async () => {
    try {
      if (gameCreatedForYou !== undefined && account.status === "connected") {
        const hash = await walletClient?.writeContract({
          abi: RPSContractData.abi,
          functionName: "j1Timeout",
          address: gameCreatedForYou.contractAddress as `0x${string}`,
          account: account.address,
        });
        if (walletClient && hash !== undefined) {
          await waitForTransactionReceipt(walletClient, { hash: hash });
        }
      }
    } catch (e) {
      console.log("error while sending solve tx : ", e);
    }
  };

  //   if user b i.e. the game created for didn't play
  const j2Timeout = async () => {
    try {
      if (createdByData !== undefined && account.status === "connected") {
        const hash = await walletClient?.writeContract({
          abi: RPSContractData.abi,
          functionName: "j2Timeout",
          address: createdByData.contractAddress as `0x${string}`,
          account: account.address,
        });
        if (walletClient && hash !== undefined) {
          await waitForTransactionReceipt(walletClient, { hash: hash });
        }
      }
    } catch (e) {
      console.log("error while sending solve tx : ", e);
    }
  };

  return (
    <div>
      <div>current games</div>

      <div>
        {createdByData !== undefined && (
          <div>
            <div>your move</div>
            <div> {createdByData.move} </div>
            <div> your salt </div>
            <div> {createdByData.salt} </div>
            <div> other player </div>

            <div> {createdByData.otherPlayer} </div>
            {timeLeft !== 0 ? (
              <div>time left : {timeLeft} seconds</div>
            ) : (
              <button onClick={j2Timeout}>
                time out if user a failed to respond
              </button>
            )}
            {/* if user played then this timeout won't work  */}
            <br />
            <div>
              {gameData?.isPlayed
                ? "game is played by other user you can find the winnder"
                : "other user haven't played the game yet"}
            </div>
            <button onClick={solve}>find winner</button>
          </div>
        )}
      </div>

      <div>
        {gameCreatedForYou !== undefined && (
          <div>
            <div> created by </div>
            <div> {gameCreatedForYou?.createdBy} </div>
            <div>contract address </div>
            <div> {gameCreatedForYou?.contractAddress} </div>
            <div>eth value to stake</div>
            <div>{gameCreatedForYou?.ethValue}</div>
            <div>
              <p>Choose your move</p>
              <select
                id="moveDropdown"
                value={move}
                onChange={(e: any) => {
                  setMove(e.target.value);
                }}
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
            <button onClick={play}>play</button>
            <br />
            {timeLeft !== 0 ? (
              <div>time left : {timeLeft} seconds</div>
            ) : (
              <button onClick={j1Timeout}>
                time out if user a failed to respond
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentGame;
