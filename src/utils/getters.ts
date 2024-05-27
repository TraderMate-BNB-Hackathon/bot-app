import axios, { AxiosResponse } from 'axios';
import { DEXSCREENER_API, ROUTER, WNATIVE } from './constants';
import {
  formatEther,
  formatUnits,
  getContract,
  isAddress,
  zeroAddress,
} from 'viem';
import { client } from './client';
import { add, isNil, trim } from 'lodash';
import { erc20Abi } from 'viem';
import { abi as aggregatorABI } from './abis/aggregator.json';

export const useContract = (
  address: string,
  ABI: any
  // useProviderIfNecessary: boolean = true
) => {
  if (!address) return null;
  if (!ABI) return null;

  if (address === zeroAddress || isNil(address) || trim(address).length === 0)
    return null;

  if (!isAddress(address)) return null;

  return getContract({ address: address, abi: ABI, client: client });
};

export const usePrice = async (tokenOut: string, tokenIn: string = WNATIVE) => {
  const routerContract = useContract(ROUTER, aggregatorABI);
  const price = await routerContract?.read.query([tokenIn, tokenOut, 1]);
  return price;
};

export const useSellPrice = async (
  tokenOut: string,
  tokenIn: string = WNATIVE
) => {
  const routerContract = useContract(ROUTER, aggregatorABI);
  const price = await routerContract?.read.query([tokenIn, tokenOut, 1]);
  return price;
};
export const useSwapRouter = () => useContract(ROUTER, aggregatorABI);

export const useTokenInfo = async (address: string) => {
  const tokenContract = useContract(address, erc20Abi);
  if (!tokenContract) return null;
  const [name, symbol, decimals] = await Promise.all([
    tokenContract.read.name([]),
    tokenContract.read.symbol([]),
    tokenContract.read.decimals([]),
    tokenContract.read.totalSupply([]),
  ]);
  console.log({
    name,
    symbol,
    decimals,
  });
  return {
    name,
    symbol,
    decimals,
  };
};

export const useTokenContract = (address: string) =>
  useContract(address, erc20Abi);

export const useTokenBalance = async (token: string, address: string) => {
  const tokenContract = useContract(token, erc20Abi);
  if (!tokenContract) return null;
  const [balance, decimal] = await Promise.all([
    tokenContract.read.balanceOf([address]),
    tokenContract.read.decimals([]),
  ]);
  return formatUnits(balance as any, decimal as any);
};

export const useRawTokenBalance = async (token: string, address: string) => {
  const tokenContract = useContract(token, erc20Abi);
  if (!tokenContract) return null;
  return await tokenContract.read.balanceOf([address]);
};

export const useTokenDetails = async (address: string, to?: string) => {
  const tokenContract = useContract(address, erc20Abi);
  console.log(tokenContract);
  if (!tokenContract) return null;
  const [name, symbol, decimals, totalSupply, price] = await Promise.all([
    tokenContract.read.name([]),
    tokenContract.read.symbol([]),
    tokenContract.read.decimals([]),
    tokenContract.read.totalSupply([]),
    // {},
    to ? usePrice(to, address) : usePrice(address),
  ]);

  return {
    address,
    name,
    symbol,
    decimals,
    totalSupply: formatUnits(totalSupply as any, decimals as any),
    // price,
    price,
  };
};

export const useSellTokenDetails = async (tokenOut: string) => {
  const tokenContract = useContract(tokenOut, erc20Abi);
  console.log(tokenContract);
  if (!tokenContract) return null;
  const [name, symbol, decimals, totalSupply, price] = await Promise.all([
    tokenContract.read.name([]),
    tokenContract.read.symbol([]),
    tokenContract.read.decimals([]),
    tokenContract.read.totalSupply([]),
    // {},
    useSellPrice(tokenOut),
  ]);

  return {
    tokenOut,
    name,
    symbol,
    decimals,
    totalSupply: formatUnits(totalSupply as any, decimals as any),
    // price,
    price,
  };
};

// const name = await erc20Contract.name();
//           const symbol = await erc20Contract.symbol();
//           const decimals = await erc20Contract.decimals();
//           const totalSupply = formatUnits(await erc20Contract.totalSupply(), decimals);
