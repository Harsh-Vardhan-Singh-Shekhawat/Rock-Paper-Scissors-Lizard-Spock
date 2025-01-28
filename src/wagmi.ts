import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, polygonAmoy } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Rock Paper Scissors Lizard Spock",
  projectId: "rock-paper-scissors-lizard-spock",
  chains: [polygonAmoy],
  ssr: true,
});
