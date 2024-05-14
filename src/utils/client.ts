import { createPublicClient, createWalletClient, http } from 'viem';

import { opBNBTestnet } from 'viem/chains';

export const client = createPublicClient({
  chain: opBNBTestnet,
  transport: http(),
});
export const walletClient = createWalletClient({
  chain: opBNBTestnet,
  transport: http(),
});
