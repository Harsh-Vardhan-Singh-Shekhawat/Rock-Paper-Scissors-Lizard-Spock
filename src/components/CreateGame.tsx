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
import { toBytes } from "viem";

interface ActiveUser {
  _id: string;
  address: string;
}

const CreateGame = () => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const account = useAccount();
  const [otherPlayer, setOtherPlayer] = useState("");
  const [move, setMove] = useState<Move>();
  const [ethValue, setEthValue] = useState();
  const [salt, setSalt] = useState("");
  const [canCreateGame, setCanCreateGame] = useState(false);
  const [creatingGameLoader, setCreateingGameLoader] = useState(false);
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    const configCanUserCreateGame = async () => {
      try {
        if (account.status !== "connected") return;
        const createGameData = localStorage.getItem("game");
        // user haven't createad a game yet

        if (createGameData === null) {
          console.log("null value from local database");
          const dbData = await fetchCurrentGame(account.address);
          console.log("dbData : ", dbData);
          if (dbData) {
            setCanCreateGame(true);
          }
        }
      } catch (e) {
        console.log("error : ", e);
      }
    };
    configCanUserCreateGame();
  }, [account.status]);

  const createGame = async () => {
    if (canCreateGame) {
      //user can only create a new game if this is true
      try {
        setCreateingGameLoader(true);
        const provider = new ethers.BrowserProvider(walletClient?.transport);
        const signer = await provider.getSigner();
        const contractFactory = new ethers.ContractFactory(
          RPSContractData.abi,
          RPSContractData.bytecode,
          signer
        );
        const valueInWei = ethers.parseEther(ethValue || "0");
        const deployementTx = await contractFactory.deploy(
          ethers.keccak256(toBytes(Move[move as number] + salt)),
          otherPlayer,
          {
            value: valueInWei,
          }
        );

        const time = new Date();
        const data = {
          move: move,
          salt: salt,
          ethValue: ethValue,
          otherPlayer: otherPlayer,
          contractAddress: await deployementTx.getAddress(),
          deploymentTime: time,
        };
        localStorage.setItem("game", JSON.stringify(data));
        window.dispatchEvent(new Event("storage"));

        await handleNewGame(
          time.toString(),
          (account.address ?? "").toString(),
          otherPlayer,
          await deployementTx.getAddress()
        );
        setCreateingGameLoader(false);
      } catch (error) {
        console.error(error);
        setCreateingGameLoader(false);
      }
    }
  };
  const generateSalt = async () => {
    setSalt(generateRandomUint256().toString());
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
    fetchActiveUsers();
    const intervalId = setInterval(fetchActiveUsers, 11000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="grid grid-cols-2  ">
      <div>
        <div>Active Users</div>
        {activeUsers.length === 0 ? (
          <p>No active users found.</p>
        ) : (
          <div className="flex flex-col">
            {activeUsers.map((user) => (
              <button key={user._id}>
                {user.address === account.address
                  ? user.address + " (you)"
                  : user.address}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <div>Create New Game</div>
        <div>
          <p>Other Player Address</p>
          <input
            type="text"
            value={otherPlayer}
            onChange={(e: any) => {
              setOtherPlayer(e.target.value);
            }}
            placeholder="0x"
          />
        </div>

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

        <div>
          <p>Salt Value</p>
          <input placeholder="--" value={salt} />
          <button onClick={generateSalt}>GEMERATE SALT</button>
        </div>

        <div>
          <p>Enter ETH amount to stake</p>
          <input
            type="number"
            value={ethValue}
            onChange={(e: any) => {
              setEthValue(e.target.value);
            }}
            placeholder="0.0"
          />
        </div>
        <div>
          {creatingGameLoader ? (
            <div>
              <span></span>
            </div>
          ) : (
            <button type="submit" onClick={createGame}>
              {canCreateGame ? "Create Game" : "Game already created"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGame;
