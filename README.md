## Building Rock-Paper-Scissors-Spock-Lizard Game

- <a href="./src/utils/RPS.sol" >RPS.sol</a>
- Reference -> https://en.wikipedia.org/wiki/Rock_paper_scissors#Additional_weapons

## Salt Generation Function

- Salt is securely generated using entropy from the operating system.
- reference -> https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator

- <a href="./src/utils/Helpers.ts" >file reference</a>

```typescript
export const generateRandomUint256 = (): bigint => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);

  const hexString = Array.from(array, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

  const uint256 = BigInt("0x" + hexString);
  return uint256;
};
```

## Mongodb database storage for notifications

- <a href="./src/utils/Game.ts" >Game.ts</a>

```typescript
export interface IGame extends Document {
  time: string;
  createdBy: string;
  createdFor: string;
  contractAddress: string;
  ethValue: string;
  isPlayed: boolean;
  winner: string;
  j1Timeout: boolean;
  j2Timeout: boolean;
}
```

- <a href="./src/utils/ActiveUser.ts" >ActiveUsers.ts</a>

```typescript
interface IActiveUser extends Document {
  address: string;
}
```

## Local storage

- <a href="./src/components/CurrentGame.tsx:18" >CurrentGame.ts</a>

```typescript
interface IGameSelfCreated {
  move: string;
  salt: string;
  ethValue: string;
  otherPlayer: string;
  contractAddress: string;
  deploymentTime: string;
}
```
