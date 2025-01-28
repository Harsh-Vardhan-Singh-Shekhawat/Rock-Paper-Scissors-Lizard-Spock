import type { NextPage } from "next";
import NavBar from "../components/NavBar";
import CreateGame from "../components/CreateGame";
import CurrentGame from "../components/CurrentGame";

const Home: NextPage = () => {
  return (
    <div>
      <NavBar />
      <CreateGame />
      <CurrentGame />
    </div>
  );
};

export default Home;
