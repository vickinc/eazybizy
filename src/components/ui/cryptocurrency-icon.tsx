import React from 'react';

interface CryptocurrencyIconProps {
  currency: string;
  className?: string;
}

export const CryptocurrencyIcon: React.FC<CryptocurrencyIconProps> = ({ currency, className = "h-4 w-4" }) => {
  const getCryptocurrencyIcon = (currency: string) => {
    switch (currency.toLowerCase()) {
      case 'eth':
      case 'ethereum':
        return <img src="/crypto-logos/ethereum-eth-logo.png" className={className} alt="Ethereum" />;
      case 'btc':
      case 'bitcoin':
        return <img src="/crypto-logos/bitcoin-btc-logo.png" className={className} alt="Bitcoin" />;
      case 'usdt':
      case 'tether':
        return <img src="/crypto-logos/tether-usdt-logo.png" className={className} alt="Tether (USDT)" />;
      case 'usdc':
        return <img src="/crypto-logos/usd-coin-usdc-logo.png" className={className} alt="USD Coin (USDC)" />;
      case 'sol':
      case 'solana':
        return <img src="/crypto-logos/solana-sol-logo.png" className={className} alt="Solana" />;
      case 'trx':
      case 'tron':
        return <img src="/crypto-logos/tron-trx-logo.png" className={className} alt="Tron" />;
      case 'bnb':
      case 'binance':
        return <img src="/crypto-logos/bnb-bnb-logo.png" className={className} alt="BNB" />;
      case 'busd':
        return <img src="/crypto-logos/binance-usd-busd-logo.png" className={className} alt="Binance USD" />;
      default:
        // Fallback to a generic crypto icon or just show the currency symbol
        return (
          <div className={`${className} rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs`}>
            {currency.substring(0, 3).toUpperCase()}
          </div>
        );
    }
  };

  return getCryptocurrencyIcon(currency);
};