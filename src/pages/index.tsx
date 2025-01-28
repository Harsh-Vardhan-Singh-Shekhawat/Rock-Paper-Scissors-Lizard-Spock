import type { NextPage } from "next";
import NavBar from "../components/NavBar";
import CreateGame from "../components/CreateGame";

const Home: NextPage = () => {
  return (
    <div>
      <NavBar />
      <CreateGame />
    </div>
  );
};

export default Home;
