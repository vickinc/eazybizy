export interface BlockchainBalance {
  address: string;
  blockchain: string;
  network: string;
  balance: number;
  unit: string;
  lastUpdated: Date;
  isLive: boolean;
  tokenType: 'native' | 'erc20' | 'bep20' | 'trc20' | 'spl' | 'contract';
  tokenContract?: string;
  error?: string;
}

export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  amount: number;
  currency: string;
  type: 'incoming' | 'outgoing' | 'internal' | 'fee';
  status: 'success' | 'failed' | 'pending';
  gasUsed?: number;
  gasFee?: number;
  contractAddress?: string;
  tokenType?: 'native' | 'erc20' | 'bep20' | 'trc20' | 'spl' | 'contract';
  blockchain: string;
  network: string;
}

export interface TransactionImportResult {
  success: boolean;
  totalTransactions: number;
  importedTransactions: number;
  duplicateTransactions: number;
  failedTransactions: number;
  errors: string[];
  startDate?: Date;
  endDate?: Date;
  walletAddress: string;
  currencies: string[];
}

export interface TransactionImportOptions {
  walletAddress: string;
  blockchain: string;
  network?: string;
  currencies?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  overwriteDuplicates?: boolean;
  createInitialBalances?: boolean;
}

export interface TransactionImportStatus {
  id: string;
  walletId: string;
  walletAddress: string;
  blockchain: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    totalCurrencies: number;
    completedCurrencies: number;
    currentCurrency?: string;
    totalTransactions: number;
    processedTransactions: number;
  };
  result?: TransactionImportResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}