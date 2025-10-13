import React from 'react';

interface BlockchainIconProps {
  blockchain?: string;
  className?: string;
}

export const BlockchainIcon: React.FC<BlockchainIconProps> = ({ blockchain, className = "h-6 w-6" }) => {
  const chain = blockchain?.toLowerCase() || '';
  
  // Return appropriate logo image for different blockchains
  switch (chain) {
    case 'ethereum':
    case 'eth':
      return <img src="/crypto-logos/ethereum-eth-logo.png" className={className} alt="Ethereum" />;
      
    case 'binance-smart-chain':
    case 'bsc':
    case 'bnb':
      return <img src="/crypto-logos/bnb-bnb-logo.png" className={className} alt="BNB Smart Chain" />;
      
    case 'tron':
    case 'trx':
      return <img src="/crypto-logos/tron-trx-logo.png" className={className} alt="Tron" />;
      
    case 'solana':
    case 'sol':
      return <img src="/crypto-logos/solana-sol-logo.png" className={className} alt="Solana" />;
      
    case 'bitcoin':
    case 'btc':
      return <img src="/crypto-logos/bitcoin-btc-logo.png" className={className} alt="Bitcoin" />;
      
    case 'polygon':
    case 'matic':
      // Use inline SVG for Polygon since we don't have the PNG yet
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 7.5L20 10V17L15.5 19.5L11 17V10L15.5 7.5Z" fill="#8247E5"/>
          <path d="M4 7.5L8.5 10V17L4 19.5V7.5Z" fill="#8247E5"/>
        </svg>
      );
      
    case 'avalanche':
    case 'avax':
      // Use inline SVG for Avalanche since we don't have the PNG yet
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 20H21L12 2Z" fill="#E84142"/>
          <path d="M12 8L9 14H15L12 8Z" fill="white"/>
        </svg>
      );
      
    case 'arbitrum':
      // Use inline SVG for Arbitrum since we don't have the PNG yet
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 9V15L12 22L21 15V9L12 2Z" fill="#2D374B"/>
          <path d="M12 6L7 10V14L12 18L17 14V10L12 6Z" fill="#28A0F0"/>
        </svg>
      );
      
    case 'optimism':
      // Use inline SVG for Optimism since we don't have the PNG yet
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FF0420"/>
          <path d="M8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12Z" fill="white"/>
        </svg>
      );
      
    case 'base':
      // Base blockchain logo - blue rounded rectangle
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="5" width="16" height="14" rx="2" fill="#0000FF"/>
        </svg>
      );
      
    case 'fantom':
    case 'ftm':
      // Use inline SVG for Fantom since we don't have the PNG yet
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#1969FF"/>
          <path d="M12 3L4 12L12 21L20 12L12 3ZM12 7L8 12L12 17L16 12L12 7Z" fill="white"/>
        </svg>
      );
      
    case 'near':
      // Use inline SVG for Near since we don't have the PNG yet
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="#000000"/>
          <path d="M12 8L9 10V14L12 16L15 14V10L12 8Z" fill="white"/>
        </svg>
      );
      
    case 'cosmos':
    case 'atom':
      // Use inline SVG for Cosmos since we don't have the PNG yet
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#2E3148"/>
          <circle cx="12" cy="12" r="2" fill="#FFFFFF"/>
          <circle cx="12" cy="6" r="1.5" fill="#FFFFFF"/>
          <circle cx="18" cy="12" r="1.5" fill="#FFFFFF"/>
          <circle cx="12" cy="18" r="1.5" fill="#FFFFFF"/>
          <circle cx="6" cy="12" r="1.5" fill="#FFFFFF"/>
        </svg>
      );
      
    case 'cardano':
    case 'ada':
      // Use inline SVG for Cardano since we don't have the PNG yet
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#0033AD"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
          <circle cx="12" cy="7" r="1" fill="white"/>
          <circle cx="12" cy="17" r="1" fill="white"/>
          <circle cx="7" cy="12" r="1" fill="white"/>
          <circle cx="17" cy="12" r="1" fill="white"/>
        </svg>
      );
      
    case 'polkadot':
    case 'dot':
      // Use inline SVG for Polkadot since we don't have the PNG yet
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#E6007A"/>
          <circle cx="12" cy="8" r="2" fill="white"/>
          <circle cx="8" cy="14" r="2" fill="white"/>
          <circle cx="16" cy="14" r="2" fill="white"/>
        </svg>
      );
      
    default:
      // Generic wallet icon for unknown blockchains
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z" fill="#94A3B8"/>
        </svg>
      );
  }
};

// Export a separate component for currency icons (USDT, USDC, etc.)
export const CurrencyIcon: React.FC<{ currency?: string; className?: string }> = ({ currency, className = "h-6 w-6" }) => {
  const curr = currency?.toUpperCase() || '';
  
  switch (curr) {
    case 'USDT':
      return <img src="/crypto-logos/tether-usdt-logo.png" className={className} alt="Tether" />;
    case 'USDC':
      return <img src="/crypto-logos/usd-coin-usdc-logo.png" className={className} alt="USD Coin" />;
    default:
      return null;
  }
};