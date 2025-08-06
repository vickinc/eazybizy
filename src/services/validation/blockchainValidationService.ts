/**
 * Blockchain address validation service compatible with Alchemy API
 * Validates wallet addresses for different blockchain networks
 */

export interface BlockchainNetwork {
  value: string;
  label: string;
  alchemyName: string;
  addressPattern: RegExp;
  description: string;
  supportedCurrencies: string[];
}

export class BlockchainValidationService {
  static readonly SUPPORTED_BLOCKCHAINS: BlockchainNetwork[] = [
    {
      value: 'bitcoin',
      label: 'Bitcoin',
      alchemyName: 'bitcoin',
      addressPattern: /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,87}$/,
      description: 'Bitcoin mainnet addresses',
      supportedCurrencies: ['BTC']
    },
    {
      value: 'ethereum',
      label: 'Ethereum',
      alchemyName: 'ethereum',
      addressPattern: /^0x[a-fA-F0-9]{40}$/,
      description: 'Ethereum and ERC-20 token addresses',
      supportedCurrencies: ['ETH', 'USDT', 'USDC']
    },
    {
      value: 'solana',
      label: 'Solana',
      alchemyName: 'solana',
      addressPattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
      description: 'Solana program and token addresses',
      supportedCurrencies: ['SOL', 'USDT', 'USDC']
    },
    {
      value: 'binance-smart-chain',
      label: 'Binance Chain',
      alchemyName: 'bsc',
      addressPattern: /^0x[a-fA-F0-9]{40}$/,
      description: 'Binance Smart Chain (BEP-20) addresses',
      supportedCurrencies: ['BNB', 'USDT', 'USDC', 'BUSD']
    },
    {
      value: 'tron',
      label: 'Tron',
      alchemyName: 'tron',
      addressPattern: /^T[A-Za-z1-9]{33}$/,
      description: 'Tron (TRC-20) addresses',
      supportedCurrencies: ['TRX', 'USDT', 'USDC']
    }
  ];

  /**
   * Validates a wallet address for a specific blockchain
   */
  static validateAddress(address: string, blockchain: string): {
    isValid: boolean;
    error?: string;
    blockchain?: BlockchainNetwork;
  } {
    if (!address || !blockchain) {
      return {
        isValid: false,
        error: 'Address and blockchain are required'
      };
    }

    const blockchainConfig = this.SUPPORTED_BLOCKCHAINS.find(
      b => b.value === blockchain.toLowerCase() || b.alchemyName === blockchain.toLowerCase()
    );

    if (!blockchainConfig) {
      return {
        isValid: false,
        error: `Unsupported blockchain: ${blockchain}`
      };
    }

    const trimmedAddress = address.trim();
    const isValidFormat = blockchainConfig.addressPattern.test(trimmedAddress);

    if (!isValidFormat) {
      return {
        isValid: false,
        error: `Invalid ${blockchainConfig.label} address format`,
        blockchain: blockchainConfig
      };
    }

    // Additional validation for specific blockchains
    switch (blockchainConfig.value) {
      case 'bitcoin':
        return this.validateBitcoinAddress(trimmedAddress, blockchainConfig);
      case 'ethereum':
      case 'binance-smart-chain':
        return this.validateEthereumLikeAddress(trimmedAddress, blockchainConfig);
      case 'solana':
        return this.validateSolanaAddress(trimmedAddress, blockchainConfig);
      case 'tron':
        return this.validateTronAddress(trimmedAddress, blockchainConfig);
      default:
        return {
          isValid: true,
          blockchain: blockchainConfig
        };
    }
  }

  /**
   * Bitcoin address validation
   */
  private static validateBitcoinAddress(address: string, blockchain: BlockchainNetwork) {
    // Legacy addresses (P2PKH): start with 1
    if (address.startsWith('1')) {
      if (address.length < 26 || address.length > 35) {
        return {
          isValid: false,
          error: 'Bitcoin legacy address must be 26-35 characters',
          blockchain
        };
      }
    }
    // Script addresses (P2SH): start with 3
    else if (address.startsWith('3')) {
      if (address.length < 26 || address.length > 35) {
        return {
          isValid: false,
          error: 'Bitcoin script address must be 26-35 characters',
          blockchain
        };
      }
    }
    // Bech32 addresses (P2WPKH/P2WSH): start with bc1
    else if (address.startsWith('bc1')) {
      if (address.length < 39 || address.length > 87) {
        return {
          isValid: false,
          error: 'Bitcoin bech32 address must be 39-87 characters',
          blockchain
        };
      }
    }

    return { isValid: true, blockchain };
  }

  /**
   * Ethereum-like address validation (Ethereum, BSC)
   */
  private static validateEthereumLikeAddress(address: string, blockchain: BlockchainNetwork) {
    if (address.length !== 42) {
      return {
        isValid: false,
        error: `${blockchain.label} address must be exactly 42 characters`,
        blockchain
      };
    }

    // Check for mixed case (EIP-55 checksum)
    const hasUpperCase = /[A-F]/.test(address.slice(2));
    const hasLowerCase = /[a-f]/.test(address.slice(2));
    
    if (hasUpperCase && hasLowerCase) {
      // This is likely a checksummed address, but we won't validate the checksum
      // as it requires additional complexity and is not strictly necessary
    }

    return { isValid: true, blockchain };
  }

  /**
   * Solana address validation
   */
  private static validateSolanaAddress(address: string, blockchain: BlockchainNetwork) {
    if (address.length < 32 || address.length > 44) {
      return {
        isValid: false,
        error: 'Solana address must be 32-44 characters',
        blockchain
      };
    }

    // Solana addresses are base58 encoded, exclude problematic characters
    const base58Pattern = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Pattern.test(address)) {
      return {
        isValid: false,
        error: 'Solana address contains invalid characters',
        blockchain
      };
    }

    return { isValid: true, blockchain };
  }

  /**
   * Tron address validation
   */
  private static validateTronAddress(address: string, blockchain: BlockchainNetwork) {
    if (address.length !== 34) {
      return {
        isValid: false,
        error: 'Tron address must be exactly 34 characters',
        blockchain
      };
    }

    if (!address.startsWith('T')) {
      return {
        isValid: false,
        error: 'Tron address must start with T',
        blockchain
      };
    }

    return { isValid: true, blockchain };
  }

  /**
   * Get blockchain configuration by value
   */
  static getBlockchain(value: string): BlockchainNetwork | undefined {
    return this.SUPPORTED_BLOCKCHAINS.find(
      b => b.value === value.toLowerCase() || b.alchemyName === value.toLowerCase()
    );
  }

  /**
   * Get all supported blockchains for dropdown
   */
  static getSupportedBlockchains(): BlockchainNetwork[] {
    return this.SUPPORTED_BLOCKCHAINS;
  }

  /**
   * Get supported currencies for a specific blockchain
   */
  static getSupportedCurrencies(blockchain: string): string[] {
    const blockchainConfig = this.getBlockchain(blockchain);
    return blockchainConfig ? blockchainConfig.supportedCurrencies : [];
  }

  /**
   * Get address format hint for UI
   */
  static getAddressFormatHint(blockchain: string): string {
    const blockchainConfig = this.getBlockchain(blockchain);
    if (!blockchainConfig) return 'Enter wallet address';

    switch (blockchainConfig.value) {
      case 'bitcoin':
        return 'e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa or bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      case 'ethereum':
        return 'e.g., 0x742d35Cc6634C0532925a3b8D8FD0dd4A3d0C3F8';
      case 'binance-smart-chain':
        return 'e.g., 0x742d35Cc6634C0532925a3b8D8FD0dd4A3d0C3F8';
      case 'solana':
        return 'e.g., 7dHbWXmci3dT8UFYWyTGAXRtGM8ZKt4bT4KzF2LtSLqD';
      case 'tron':
        return 'e.g., TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH';
      default:
        return 'Enter wallet address';
    }
  }
}