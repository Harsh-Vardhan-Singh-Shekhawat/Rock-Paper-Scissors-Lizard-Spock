import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useAccount, useAccountEffect } from "wagmi";
import { handleAcitveUser, removeUnActiveUser } from "../utils/Helpers";

const NavBar = () => {
  const [address, setAddress] = useState("");
  const account = useAccount();
  const [newConnect, setNewConnection] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeunload", (event) => {
      if (account.address) {
        removeUnActiveUser(account.address);
      }
    });
  });

  useEffect(() => {
    if (account.status === "connected" && !newConnect) {
      setAddress(account.address);
      handleAcitveUser(account.address);
    }
  }, [account]);

  useAccountEffect({
    onConnect(data) {
      setNewConnection(true);
      setAddress(data.address);
      handleAcitveUser(data.address);
    },
    onDisconnect() {
      removeUnActiveUser(address);
      setAddress("");
    },
  });

  return (
    <div className=" bg-gray-200 py-4 px-12 flex flex-row items-center	 justify-between ">
      <div />
      <ConnectButton />
    </div>
  );
};

export default NavBar;
