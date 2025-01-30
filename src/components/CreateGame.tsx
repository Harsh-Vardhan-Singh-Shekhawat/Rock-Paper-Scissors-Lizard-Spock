import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import Move from "../utils/Move";
import {
  fetchCurrentGame,
  generateRandomUint256,
  handleNewGame,
} from "../utils/Helpers";
import _default from "next/dist/build/templates/pages";
import { ethers } from "ethers";
import RPSContractData from "../utils/RPSContractData";
import toast from "react-hot-toast";

interface ActiveUser {
  _id: string;
  address: string;
}

const CreateGame = () => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const account = useAccount();
  const [otherPlayer, setOtherPlayer] = useState("");
  const [move, setMove] = useState<Move>(Move.Null);
  const [ethValue, setEthValue] = useState();
  const [salt, setSalt] = useState<bigint>();
  const [canCreateGame, setCanCreateGame] = useState(false);
  const [creatingGameLoader, setCreateingGameLoader] = useState(false);
  const { data: walletClient } = useWalletClient();

  const reset = () => {
    setOtherPlayer("");
    setMove(Move.Null);
    setEthValue(undefined);
    setSalt(undefined);
    setCanCreateGame(false);
  };

  useEffect(() => {
    const configCanUserCreateGame = async () => {
      try {
        if (account.status !== "connected") return;
        const createGameData = localStorage.getItem("game");
        // user haven't createad a game yet
        if (createGameData === null) {
          const dbData = await fetchCurrentGame(account.address);
          if (dbData === undefined) {
            setCanCreateGame(true);
          }
        }
      } catch (e) {
        console.log("error : ", e);
      }
    };
    const intervalId = setInterval(configCanUserCreateGame, 4000);
    return () => clearInterval(intervalId);
  }, [account.status]);

  const createGame = async () => {
    if (canCreateGame) {
      //user can only create a new game if this is true
      if (move === Move.Null) {
        toast.error("Choose a move!");
        return;
      }
      try {
        setCreateingGameLoader(true);
        const eipProvider = walletClient?.transport;
        if (eipProvider === undefined) return;
        const provider = new ethers.BrowserProvider(eipProvider);
        const signer = await provider.getSigner();
        const contractFactory = new ethers.ContractFactory(
          RPSContractData.abi,
          RPSContractData.bytecode,
          signer
        );
        const valueInWei = ethers.parseEther(ethValue || "0");
        const _move = Move[move] as unknown as bigint;
        const deployementTx = await contractFactory.deploy(
          ethers.solidityPackedKeccak256(["uint8", "uint256"], [_move, salt]),
          otherPlayer,
          {
            value: valueInWei,
          }
        );
        const response = await deployementTx.waitForDeployment();

        const time = new Date();

        const data = {
          move: move,
          salt: salt?.toString() ?? "",
          ethValue: ethValue,
          otherPlayer: otherPlayer,
          contractAddress: await response.getAddress(),
          deploymentTime: time.toString(),
        };
        localStorage.setItem("game", JSON.stringify(data));
        window.dispatchEvent(new Event("storage"));

        await handleNewGame(
          time.toString(),
          (account.address ?? "").toString(),
          otherPlayer,
          await response.getAddress(),
          valueInWei.toString()
        );
        toast.success("Game Created Successfully!");
        reset();
        setCanCreateGame(false);
        setCreateingGameLoader(false);
      } catch (error) {
        console.error(error);
        setCreateingGameLoader(false);
      }
    } else {
      toast.error("Already in a Game!");
    }
  };

  const generateSalt = async () => {
    setSalt(generateRandomUint256());
    toast.success("Salt Created!");
  };

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) {
          throw new Error("Failed to fetch active users");
        }
        const data = await response.json();
        setActiveUsers(data.data);
      } catch (err) {
        console.log(err);
      }
    };
    const intervalId = setInterval(fetchActiveUsers, 8000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="grid grid-cols-2  ">
      <div>
        <div className="heading">Active Users</div>
        <p className="font-light text-sm">Select user to play game with.</p>

        {activeUsers.length === 0 ? (
          <p>No active users found.</p>
        ) : (
          <div className="flex flex-col mr-12 ">
            {activeUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => {
                  if (user.address === account.address) return;
                  setOtherPlayer(user.address);
                }}
                className="active-user"
              >
                {user.address === account.address
                  ? user.address + " (YOU)"
                  : user.address}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mr-[120px]">
        <div className="heading mb-6 ">Create New Game</div>
        <div>
          <p className="sub-heading">Other Player Address</p>
          <input
            type="text"
            value={otherPlayer}
            onChange={(e: any) => {
              setOtherPlayer(e.target.value);
            }}
            className="input-tag"
            placeholder="0x"
          />
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

        <div>
          <p className="sub-heading">Salt Value</p>
          <input
            placeholder="--"
            value={salt?.toString()}
            className="input-tag"
            disabled={true}
          />
          <button onClick={generateSalt} className="button-tag">
            GENERATE SALT
          </button>
        </div>

        <div>
          <p className="sub-heading">Enter ETH amount to stake</p>
          <input
            type="number"
            value={ethValue}
            onChange={(e: any) => {
              setEthValue(e.target.value);
            }}
            placeholder="0.0"
            className="input-tag"
          />
        </div>
        <div className="flex flex-col items-center">
          {creatingGameLoader ? (
            <div>
              <span className="loader"></span>
            </div>
          ) : (
            <button type="submit" onClick={createGame} className="button-tag">
              {canCreateGame ? "CREATE GAME" : "GAME ALREADY CREATED"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGame;
