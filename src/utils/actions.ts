import {
  erc20Abi,
  formatUnits,
  fromHex,
  getAddress,
  parseUnits,
  toHex,
} from 'viem';
import { Offer, Wallets } from '../types/common';
import { ROUTER, SWAP_FEE, WNATIVE } from './constants';
import {
  useSellTokenDetails,
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
  _account: Wallets,
  slippage: number = 0
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
    0.5 * Number(amount) * Number(offer.amountOut);
  const amountOutParsed = parseUnits(
    amountOutAfterFee.toString(),
    tokenDetails?.decimals! as any
  );
  console.log(amountInParsed);
  const trade = [
    toHex(amountInParsed),
    toHex(amountOutParsed),
    (bestOffer as any).path,
    (bestOffer as any).adapters,
  ];
  console.log(
    'trade log',
    amountOutParsed,
    amountOutParsed * BigInt(2),
    amountOutAfterFee,
    offer.amountOut,
    1 / offer.amountOut,
    bestOffer,
    'submitted',
    trade
  );
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
  slippage: number
) => {
  const tokenInContract = useTokenContract(address);
  const allowance = await tokenInContract?.read.allowance([
    _account.address,
    ROUTER,
  ]);
  const routerContract = useSwapRouter();

  const amountInParsed = Number(amount);
  const [tokenDetails, bestOffer] = await Promise.all([
    useSellTokenDetails(address),
    routerContract?.read.findBestPath([
      amountInParsed,
      offer.tokenOut,
      offer.tokenIn,
      2,
    ]),
  ]);

  const formattedAmount =
    Number(amount) / 10 ** ((tokenDetails?.decimals as any) ?? 0);
  const amountOutAfterFee =
    Number(formattedAmount) * Number(1 / offer.amountOut) -
    0.2 * Number(formattedAmount) * Number(1 / offer.amountOut);
  const amountOutParsed =
    amountOutAfterFee * 10 ** ((tokenDetails?.decimals as any) ?? 0);
  const decryptedKey = await decryptPrivateKey(
    _account.address,
    _account.privateKey
  );
  const account = privateKeyToAccount(decryptedKey as any);

  if (Number(allowance as any) < amountInParsed) {
    const approvalTx = await walletClient.writeContract({
      account,
      address: address as any,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ROUTER, amountInParsed],
    });

    console.log('approve', approvalTx);
  }
  //     const weth = WETH[chainId ?? 84531];
  const trade = [
    parseInt(amountInParsed.toString()),
    parseInt(amountOutParsed.toString()),
    (bestOffer as any).path,
    (bestOffer as any).adapters,
  ];

  console.log(
    parseInt(amountInParsed.toString()),
    parseInt(amountOutParsed.toString()),
    amountInParsed,
    amountOutParsed
  );
  const swapTx = await walletClient.writeContract({
    account,
    address: ROUTER,
    abi: aggregatorABI,
    functionName: 'swap',
    args: [trade, _account.address, toHex(SWAP_FEE)],
    // args: [],
    value: parseUnits('0', 18),
  });
  return swapTx;
  // const awaitedTx = await swapTx.wait();
};
