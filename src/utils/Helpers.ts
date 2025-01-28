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

export const generateRandomUint256 = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);

  const hexString = Array.from(array, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

  const uint256 = BigInt("0x" + hexString);
  return uint256;
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
      return true;
    }
  } catch (err) {
    console.error("Error fetching current game:", err);
  }
};

export const handleNewGame = async (
  time: string,
  createdBy: string,
  createdFor: string,
  contractAddress: string
) => {
  try {
    const response = await fetch("/api/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "POST",
        data: { time, createdBy, createdFor, contractAddress },
      }),
    });
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error(error);
  }
};
