# Blockchain Wallet Balance Integration

This document describes the implementation of real-time blockchain wallet balance fetching using CryptoAPIs.io.

## Features Implemented

### 1. Real-time Blockchain Balance Fetching
- Fetches live on-chain balances for cryptocurrency wallets
- Supports Ethereum, Binance Smart Chain, and Polygon networks
- Compares on-chain balance vs calculated balance from transactions
- Detects discrepancies and provides helpful warnings

### 2. User Interface Enhancements
- **Blockchain Balance Section**: Shows on-chain balance alongside calculated balance
- **Refresh Button**: Manually refresh blockchain balance for individual wallets
- **Status Indicators**: Visual indicators for sync status (synced/syncing/error)
- **Discrepancy Warnings**: Alerts when on-chain and calculated balances differ
- **Loading States**: Proper loading indicators during blockchain fetching

### 3. Performance Optimizations
- **15-minute cache**: API responses cached to reduce API calls and costs
- **Batch processing**: Multiple wallets can be processed efficiently
- **Optional enrichment**: Blockchain data fetching is opt-in to preserve SSR performance
- **Error handling**: Graceful fallbacks when blockchain API is unavailable

## Setup Instructions

### 1. Get CryptoAPIs Key
1. Sign up at [https://cryptoapis.io/](https://cryptoapis.io/)
2. Get your API key from the dashboard
3. Add to your environment variables:

```bash
# Add to .env.local
CRYPTO_APIS_KEY="your-crypto-apis-key-here"
```

### 2. Configure Crypto Wallets
1. Go to Accounting → Banks & Wallets
2. Add a new Digital Wallet
3. Select "Cryptocurrency" as wallet type
4. Fill in:
   - **Wallet Name**: e.g., "My MetaMask Wallet"
   - **Wallet Address**: Your Ethereum address (e.g., `0x742d35...`)
   - **Blockchain Network**: e.g., "Ethereum"
   - **Supported Cryptocurrencies**: Select which tokens this wallet holds

### 3. View Blockchain Balances
1. Navigate to Accounting → Bookkeeping → Balances
2. Find your crypto wallets in the list
3. Look for the purple "Blockchain Balance" section
4. Click "Refresh" to fetch the latest on-chain balance

## API Endpoints

### POST /api/blockchain/balance
Fetch balance for a single wallet address.

**Request:**
```json
{
  "address": "0x742d35cc769c3b7c25d3c670628c6b4f9901b44b",
  "blockchain": "ethereum",
  "network": "mainnet",
  "forceRefresh": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x742d35cc769c3b7c25d3c670628c6b4f9901b44b",
    "blockchain": "ethereum",
    "network": "mainnet",
    "balance": 1.25,
    "unit": "ETH",
    "lastUpdated": "2025-08-05T19:30:00.000Z",
    "isLive": true
  },
  "cached": false
}
```

### PUT /api/blockchain/balance
Fetch balances for multiple wallets (batch operation).

**Request:**
```json
{
  "wallets": [
    {
      "address": "0x742d35cc769c3b7c25d3c670628c6b4f9901b44b",
      "blockchain": "ethereum",
      "network": "mainnet"
    }
  ],
  "forceRefresh": true
}
```

## Supported Blockchains

| Blockchain | Network | Native Unit | Status |
|------------|---------|-------------|---------|
| Ethereum | mainnet | ETH | ✅ Supported |
| Ethereum | sepolia | ETH | ✅ Supported (testnet) |
| Binance Smart Chain | mainnet | BNB | ✅ Supported |
| Binance Smart Chain | testnet | BNB | ✅ Supported (testnet) |
| Polygon | mainnet | MATIC | ✅ Supported |
| Polygon | mumbai | MATIC | ✅ Supported (testnet) |

## Cost Considerations

- **CryptoAPIs Cost**: 500 credits per balance query
- **Caching**: 15-minute cache reduces API calls
- **Batch Processing**: Multiple wallets processed in batches of 5

## Error Handling

### Common Errors
- **API Key Not Configured**: Check your `CRYPTO_APIS_KEY` environment variable
- **Invalid Address**: Ensure wallet address is valid for the specified blockchain
- **Network Issues**: API timeout or network connectivity problems
- **Rate Limits**: Exceeded API rate limits (rare with caching)

### Error Display
- Errors are shown in red alert boxes at the top of the Balance page
- Individual wallet errors are displayed in the blockchain balance section
- Success messages are shown in green for 3 seconds

## Development Notes

### Architecture
- **BlockchainAPIService**: Core service for CryptoAPIs integration
- **BalanceBusinessService**: Enhanced to optionally enrich with blockchain data
- **BalanceListItem**: Updated UI component with blockchain balance display
- **BalanceSSRService**: Server-side rendering with optional blockchain enrichment

### Type Definitions
- **BlockchainBalance**: Core blockchain balance interface
- **WalletBlockchainData**: Wallet-specific blockchain metadata
- **CryptoAPIsBalanceResponse**: API response structure

### Testing
To test the integration:
1. Set up a test wallet with a known Ethereum address
2. Add some test transactions in the app
3. Compare the calculated balance vs on-chain balance
4. Test refresh functionality and error handling

## Future Enhancements

1. **Token Balance Support**: Fetch ERC-20, BEP-20 token balances
2. **Automatic Sync**: Periodic background balance updates
3. **Transaction Import**: Import blockchain transactions automatically
4. **Multi-Network Support**: Support for more blockchain networks
5. **Balance History**: Track balance changes over time
6. **Notifications**: Alert on significant balance changes

## Troubleshooting

### Blockchain Balance Not Showing
1. Check if wallet is marked as "Cryptocurrency" type
2. Verify wallet address is valid and properly formatted
3. Ensure `CRYPTO_APIS_KEY` is set in environment variables
4. Check browser console for API errors

### Discrepancy Warnings
Balance discrepancies can occur due to:
- **Unrecorded Transactions**: Transfers not entered in the system
- **Pending Transactions**: Blockchain transactions not yet confirmed
- **External Transfers**: Direct wallet-to-wallet transfers
- **Gas Fees**: Transaction fees reducing wallet balance

### Performance Issues
- Blockchain fetching adds 1-3 seconds to page load
- Use the `includeBlockchainBalances: false` parameter to disable
- Consider enabling only for specific wallets or user roles

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify API key configuration
3. Test with a known working Ethereum address
4. Contact CryptoAPIs support for API-specific issues