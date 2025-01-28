import { useEffect, useState } from "react";
import { fetchCurrentGame } from "../utils/Helpers";
import { IGame } from "../utils/Game";

import { useAccount } from "wagmi";

const CurrentGame = () => {
  const account = useAccount();

  const [createdByData, setCreatedByData] = useState({
    move: "",
    salt: "",
    ethValue: "",
    otherPlayer: "",
    contractAddress: "",
    deployemntTime: "",
  });

  const [gameCreatedForYou, setGameCreatedForYou] = useState<IGame>();

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
        const gameData = await fetchCurrentGame(account.address);
        console.log("game data : ", gameData);
        if (gameData !== true) {
          setGameCreatedForYou(gameData);
        }
      }
    };

    //this interval need to be changed
    // if some created the game no need to check
    // if once fetched from db then there is no need to check again until the game finish
    const intervalId = setInterval(getGame, 11000);
    return () => clearInterval(intervalId);
  }, [account.status]);
  return (
    <div>
      <h1>Current Game</h1>
    </div>
  );
};

export default CurrentGame;
