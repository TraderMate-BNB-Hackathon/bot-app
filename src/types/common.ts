export interface Wallets {
  privateKey: string;
  address: string;
}

export interface Offer {
  adapter: string;
  tokenIn: string;
  tokenOut: string;
  amountOut: any;
}

export interface portfolioItem {
  address: string;
  entry: number;
}

export interface SessionData {
  selectedOption: any;
  accounts: Wallets[];
  tradeToken?: string;
  selectedWallet?: number;
  //   offer?: Offer[];
  adapter?: string;
  tokenIn?: string;
  tokenOut?: string;
  amountOut?: any;
  slippage?: number;
  portfolio?: Record<string, Record<string, number[]>>;
}
