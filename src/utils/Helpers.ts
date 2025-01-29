/**
 * //////////////////////////////////////////////////////////////
 *                    SALT GENERATION FUNCTION
 *  //////////////////////////////////////////////////////////////
 */
export const generateRandomUint256 = (): bigint => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);

  const hexString = Array.from(array, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

  const uint256 = BigInt("0x" + hexString);
  return uint256;
};

export const handleAcitveUser = async (address: string) => {
  try {
    const response = await fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "activeUser",
        data: { address },
      }),
    });
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error(error);
  }
};

export const removeUnActiveUser = async (address: string) => {
  try {
    const response = await fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "removeActiveUser",
        data: { address },
      }),
    });
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error(error);
  }
};

export const fetchCurrentGame = async (address: string) => {
  try {
    const response = await fetch("/api/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "GET",
        data: { address },
      }),
    });

    if (!response.ok) {
      console.log("error finding current game");
    }

    const data = await response.json();

    if (data?.data?.time !== undefined) {
      return data.data;
    } else {
      return undefined;
    }
  } catch (err) {
    console.error("Error fetching current game:", err);
  }
};

export const handleNewGame = async (
  time: string,
  createdBy: string,
  createdFor: string,
  contractAddress: string,
  ethValue: string
) => {
  try {
    const response = await fetch("/api/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "POST",
        data: {
          time,
          createdBy,
          createdFor,
          contractAddress,
          ethValue,
          isPlayed: false,
          winner: null,
          j1Timeout: false,
          j2Timeout: false,
        },
      }),
    });
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error(error);
  }
};

export const handlePlayedGame = async (address: string) => {
  try {
    const response = await fetch("/api/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "PUT",
        data: { address },
      }),
    });
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error(error);
  }
};

export const removeGame = async (createdBy: string, createdFor: string) => {
  try {
    const response = await fetch("/api/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "REMOVE",
        data: { createdBy: createdBy, createdFor: createdFor },
      }),
    });
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error(error);
  }
};

export const updateWinner = async (winner: string, address: string) => {
  try {
    const response = await fetch("/api/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "WINNER",
        data: { winner: winner, address: address },
      }),
    });
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error(error);
  }
};

export const updateJ1Timeout = async (
  createdBy: string,
  createdFor: string
) => {
  try {
    const response = await fetch("/api/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "J1TIMEOUT",
        data: { createdBy: createdBy, createdFor: createdFor },
      }),
    });
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error(error);
  }
};

export const updateJ2Timeout = async (
  createdBy: string,
  createdFor: string
) => {
  try {
    const response = await fetch("/api/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "J2TIMEOUT",
        data: { createdBy: createdBy, createdFor: createdFor },
      }),
    });
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error(error);
  }
};

export const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};
