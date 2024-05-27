import { createPublicClient, createWalletClient, http } from 'viem';

import { bscTestnet } from 'viem/chains';

export const client = createPublicClient({
  chain: bscTestnet,
  transport: http(),
});
export const walletClient = createWalletClient({
  chain: bscTestnet,
  transport: http(),
});
