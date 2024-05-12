import { createPublicClient, createWalletClient, http } from "viem";

import { fantom } from "viem/chains";

export const client = createPublicClient({
  chain: fantom,
  transport: http(),
});
export const walletClient = createWalletClient({
  chain: fantom,
  transport: http(),
});
