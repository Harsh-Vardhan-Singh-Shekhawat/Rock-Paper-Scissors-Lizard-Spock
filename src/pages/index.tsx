import type { NextPage } from "next";
import NavBar from "../components/NavBar";
import CreateGame from "../components/CreateGame";

import CurrentGame from "../components/CurrentGame";
import { Toaster } from "react-hot-toast";

const Home: NextPage = () => {
  return (
    <div>
      <NavBar />
      <div className=" py-4 px-12 pb-[100px] ">
        <CreateGame />
        <CurrentGame />
      </div>
      <Toaster />
    </div>
  );
};

export default Home;
