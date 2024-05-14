import { formatEther } from 'viem';
import { Wallets } from '../types/common';
import { client } from './client';

export const fetchAccountBalances = (accounts: Wallets[]) => {
  return Promise.all(
    accounts.map(async (account) => {
      const balance = formatEther(
        await client.getBalance({ address: account.address as any })
      );
      return { balance, ...account };
    })
  );
};
