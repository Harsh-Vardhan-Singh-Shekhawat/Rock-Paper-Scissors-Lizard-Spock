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
