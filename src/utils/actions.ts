import { erc20Abi, getAddress, parseUnits, toHex } from 'viem';
import { Offer, Wallets } from '../types/common';
import { ROUTER, SWAP_FEE } from './constants';
import { useSwapRouter, useTokenContract, useTokenInfo } from './getters';
import { walletClient } from './client';
import { privateKeyToAccount } from 'viem/accounts';
import { abi as aggregatorABI } from './abis/aggregator.json';
import { decryptPrivateKey } from './encryptions';

export const buy = async (
  address: string,
  amount: string,
  offer: Offer,
  _account: Wallets,
  slippage: number = 0.5
) => {
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

  const amountOutAfterFee =
    Number(amount) * Number(offer.amountOut) -
    0.1 * Number(amount) * Number(offer.amountOut);
  const amountOutParsed = parseUnits(
    (amountOutAfterFee * ((100 - slippage) / 100)).toString(),
    tokenDetails?.decimals as any
  );
  const trade = [
    toHex(amountInParsed),
    toHex(amountOutParsed),
    (bestOffer as any).path,
    (bestOffer as any).adapters,
  ];
  console.log(trade);
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
};

export const sell = async (
  address: string,
  amount: string,
  offer: Offer,
  _account: Wallets,
  slippage: number = 0.5
) => {
  const tokenInContract = useTokenContract(address);
  const allowance = await tokenInContract?.read.allowance([
    _account.address,
    ROUTER,
  ]);
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

  const amountOutAfterFee =
    Number(amount) * Number(offer.amountOut) -
    0.1 * Number(amount) * Number(offer.amountOut);
  const amountOutParsed = parseUnits(
    (amountOutAfterFee * ((100 - slippage) / 100)).toString(),
    tokenDetails?.decimals as any
  );
  const decryptedKey = await decryptPrivateKey(
    _account.address,
    _account.privateKey
  );
  const account = privateKeyToAccount(decryptedKey as any);

  if ((allowance as any).lt(amountInParsed)) {
    const approvalTx = await walletClient.writeContract({
      account,
      address: address as any,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ROUTER, amountInParsed - (allowance as bigint)],
    });

    console.log('approve', approvalTx);
  }
  //     const weth = WETH[chainId ?? 84531];
  const trade = [
    toHex(amountInParsed),
    toHex(amountOutParsed),
    (bestOffer as any).path,
    (bestOffer as any).adapters,
  ];
  console.log(trade);
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
