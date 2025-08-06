export interface BlockchainBalance {
  address: string;
  blockchain: string;
  network: string;
  balance: number;
  unit: string;
  lastUpdated: Date;
  isLive: boolean;
  error?: string;
  tokenContract?: string; // For tokens (contract address or mint address)
  tokenType?: 'native' | 'erc20' | 'bep20' | 'spl' | 'trc20'; // Token type
}

export interface CryptoAPIsBalanceResponse {
  apiVersion: string;
  requestId: string;
  context?: string;
  data: {
    item: {
      confirmedBalance: {
        amount: string;
        unit: string;
      };
    };
  };
}

export interface CryptoAPIsTokenResponse {
  apiVersion: string;
  requestId: string;
  context?: string;
  data: {
    items: Array<{
      confirmedBalance: {
        amount: string;
        unit: string;
      };
      contractAddress: string;
      name: string;
      symbol: string;
      type: string;
    }>;
  };
}

export interface BlockchainNetwork {
  blockchain: string;
  network: string;
  displayName: string;
  unit: string;
  isTestnet: boolean;
}

export interface WalletBlockchainData {
  walletId: string;
  address: string;
  blockchain: string;
  network?: string;
  balances?: BlockchainBalance[];
  lastSyncedAt?: Date;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  syncError?: string;
}

export interface BlockchainAPIError {
  code: string;
  message: string;
  details?: any;
}

// Supported blockchains and their networks
export const SUPPORTED_BLOCKCHAINS: BlockchainNetwork[] = [
  {
    blockchain: 'ethereum',
    network: 'mainnet',
    displayName: 'Ethereum Mainnet',
    unit: 'ETH',
    isTestnet: false
  },
  {
    blockchain: 'ethereum',
    network: 'sepolia',
    displayName: 'Ethereum Sepolia Testnet',
    unit: 'ETH',
    isTestnet: true
  },
  {
    blockchain: 'binance-smart-chain',
    network: 'mainnet',
    displayName: 'Binance Smart Chain',
    unit: 'BNB',
    isTestnet: false
  },
  {
    blockchain: 'binance-smart-chain',
    network: 'testnet',
    displayName: 'BSC Testnet',
    unit: 'BNB',
    isTestnet: true
  },
  {
    blockchain: 'polygon',
    network: 'mainnet',
    displayName: 'Polygon',
    unit: 'MATIC',
    isTestnet: false
  },
  {
    blockchain: 'polygon',
    network: 'mumbai',
    displayName: 'Polygon Mumbai Testnet',
    unit: 'MATIC',
    isTestnet: true
  }
];

// Helper function to find blockchain network
export function findBlockchainNetwork(blockchain: string, network?: string): BlockchainNetwork | undefined {
  const normalizedBlockchain = blockchain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const normalizedNetwork = (network || 'mainnet').toLowerCase();
  
  return SUPPORTED_BLOCKCHAINS.find(
    bn => bn.blockchain === normalizedBlockchain && bn.network === normalizedNetwork
  );
}

// Helper to check if a blockchain is supported
export function isSupportedBlockchain(blockchain: string): boolean {
  const normalizedBlockchain = blockchain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return SUPPORTED_BLOCKCHAINS.some(bn => bn.blockchain === normalizedBlockchain);
}

// ERC-20 Token Configuration
export interface TokenContract {
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  blockchain: string;
  network: string;
}

// Supported ERC-20 tokens
export const SUPPORTED_ERC20_TOKENS: TokenContract[] = [
  {
    symbol: 'USDT',
    name: 'Tether USD',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    blockchain: 'ethereum',
    network: 'mainnet'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    blockchain: 'ethereum',
    network: 'mainnet'
  }
];

// Helper function to find token contract info
export function findTokenContract(symbol: string, blockchain: string, network: string = 'mainnet'): TokenContract | undefined {
  const normalizedBlockchain = blockchain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const normalizedNetwork = network.toLowerCase();
  const normalizedSymbol = symbol.toUpperCase();
  
  return SUPPORTED_ERC20_TOKENS.find(
    token => token.symbol === normalizedSymbol && 
             token.blockchain === normalizedBlockchain && 
             token.network === normalizedNetwork
  );
}

// Helper to check if a token is a native blockchain token (ETH, BNB, MATIC)
export function isNativeToken(symbol: string, blockchain: string): boolean {
  const normalizedBlockchain = blockchain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const normalizedSymbol = symbol.toUpperCase();
  
  const nativeTokenMap: Record<string, string> = {
    'ethereum': 'ETH',
    'binance-smart-chain': 'BNB',
    'polygon': 'MATIC'
  };
  
  return nativeTokenMap[normalizedBlockchain] === normalizedSymbol;
}

// Helper to check if a token is an ERC-20 token
export function isERC20Token(symbol: string, blockchain: string, network: string = 'mainnet'): boolean {
  return findTokenContract(symbol, blockchain, network) !== undefined;
}