import { getAddress, parseUnits, toHex } from 'viem';
import { Offer, Wallets } from '../types/common';
import { ROUTER, SWAP_FEE } from './constants';
import {
  useContract,
  useSwapRouter,
  useTokenContract,
  useTokenInfo,
} from './getters';
import { walletClient } from './client';
import { privateKeyToAccount } from 'viem/accounts';
import { abi as aggregatorABI } from './abis/aggregator.json';
import { decryptPrivateKey } from './encryptions';

export const buy = async (
  address: string,
  amount: string,
  offer: Offer,
  _account: Wallets
) => {
  // const tokenDetails = await useTokenInfo(address);
  // const tokenInContract = useTokenContract(address);
  // const allowance = await tokenInContract?.read.allowance([
  //   account.address,
  //   ROUTER,
  // ]);
  const routerContract = useSwapRouter();

  const amountInParsed = parseUnits(amount, 18);
  const [tokenDetails, bestOffer] = await Promise.all([
    useTokenInfo(address),
    routerContract?.read.findBestPath([
      amountInParsed,
      offer.tokenIn,
      offer.tokenOut,
      2,
    ]),
  ]);
  const amountOutParsed = parseUnits(
    (
      Number(amount) * Number(offer.amountOut) -
      0.1 * Number(amount) * Number(offer.amountOut)
    ).toString(),
    tokenDetails?.decimals as any
  );
  // contract.findBestPath(amountInFormatted, tokenIn, tokenOut, maxSteps)

  // const bestOffer = await routerContract?.read.findBestPath([
  //   amountInParsed,
  //   offer.tokenIn,
  //   offer.tokenOut,
  //   2,
  // ]);

  // if ((allowance as any).lt(amountInParsed)) {
  //   const approvalTx = await tokenInContract?.write.approve([
  //     ROUTER,
  //     parseUnits(amount, 18),
  //   ]);
  //   await approvalTx.wait();
  // }
  //     const weth = WETH[chainId ?? 84531];
  const trade = [
    toHex(amountInParsed),
    toHex(amountOutParsed),
    (bestOffer as any).path,
    (bestOffer as any).adapters,
  ];
  console.log(trade);
  // const swapTx = await routerContract?.write.swap(
  //   [trade, account, toHex(SWAP_FEE)],
  //   {
  //     value: amountInParsed,
  //   }
  // );
  const decryptedKey = await decryptPrivateKey(
    _account.address,
    _account.privateKey
  );
  const account = privateKeyToAccount(decryptedKey as any);
  const swapTx = await walletClient.writeContract({
    account,
    address: ROUTER,
    abi: aggregatorABI,
    functionName: 'swap',
    args: [trade, _account.address, toHex(SWAP_FEE)],
    // args: [],
    value: amountInParsed,
  });
  return swapTx;
  // const awaitedTx = await swapTx.wait();
};
