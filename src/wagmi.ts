import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { holesky } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Rock Paper Scissors Lizard Spock",
  projectId: "rock-paper-scissors-lizard-spock",
  chains: [holesky],
  ssr: true,
});
