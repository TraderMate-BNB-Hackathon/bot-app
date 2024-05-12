import axios, { AxiosResponse } from "axios";
import { DEXSCREENER_API, WNATIVE } from "./constants";
import {
  formatEther,
  formatUnits,
  getContract,
  isAddress,
  zeroAddress,
} from "viem";
import { client } from "./client";
import { isNil, trim } from "lodash";
import { erc20Abi } from "viem";
import { abi as aggregatorABI } from "./abis/aggregator.json";

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

export const usePrice = async (address: string) => {
  const routerContract = useContract(
    "0x2aD08034B26bDD99d41b26e6C6b30BfD58cD70CD",
    aggregatorABI
  );
  const price = await routerContract?.read.query([WNATIVE, address, 1]);
  return price;
};
export const useSwapRouter = () =>
  useContract("0x2aD08034B26bDD99d41b26e6C6b30BfD58cD70CD", aggregatorABI);

export const useTokenInfo = async (address: string) => {
  const tokenContract = useContract(address, erc20Abi);
  if (!tokenContract) return null;
  const [name, symbol, decimals] = await Promise.all([
    tokenContract.read.name([]),
    tokenContract.read.symbol([]),
    tokenContract.read.decimals([]),
    tokenContract.read.totalSupply([]),
  ]);

  return {
    name,
    symbol,
    decimals,
  };
};

export const useTokenContract = (address: string) =>
  useContract(address, erc20Abi);

export const useTokenDetails = async (address: string) => {
  const tokenContract = useContract(address, erc20Abi);
  if (!tokenContract) return null;
  const [name, symbol, decimals, totalSupply, price] = await Promise.all([
    tokenContract.read.name([]),
    tokenContract.read.symbol([]),
    tokenContract.read.decimals([]),
    tokenContract.read.totalSupply([]),
    usePrice(address),
  ]);

  return {
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
