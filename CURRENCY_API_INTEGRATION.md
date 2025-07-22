# Currency API Integration Guide

## Overview

This implementation integrates API Ninjas (api-ninjas.com) to provide automatic currency rate fetching for both current and historical exchange rates.

## Features Implemented

### 1. **Live Currency Rate Fetching**
- Get current exchange rates for all major FIAT currencies
- Automatic rate updates with real-time API calls
- Preserves user customizations while updating rates

### 2. **Historical Currency Rates**
- Fetch exchange rates for any past date
- Support for date range queries (up to 31 days)
- Historical data analysis capabilities

### 3. **Smart Rate Management**
- Merges API data with existing user rates
- Maintains user customizations while updating stale rates
- Automatic backup to localStorage for offline usage

### 4. **Rate Limiting & Error Handling**
- Displays API quota usage information
- Graceful handling of rate limit exceeded scenarios
- Comprehensive error messages and user feedback

## API Endpoints Created

### `/api/currency-rates/latest`
**GET** - Fetch latest currency rates
```
Query Parameters:
- base_currency: Base currency (default: USD)
- currencies: Comma-separated currency codes (optional)

Response:
{
  "success": true,
  "data": [...currency rates array...],
  "meta": {
    "baseCurrency": "USD",
    "totalCurrencies": 168,
    "responseTime": 245,
    "rateLimit": {
      "limitMonth": 5000,
      "remainingMonth": 4987
    }
  }
}
```

**POST** - Same functionality with JSON body for complex requests

### `/api/currency-rates/historical`
**GET** - Fetch historical currency rates
```
Query Parameters:
- date: Specific date (YYYY-MM-DD) OR
- start_date & end_date: Date range (max 31 days)
- base_currency: Base currency (default: USD)
- currencies: Comma-separated currency codes (optional)

Response:
{
  "success": true,
  "data": [...historical rates...],
  "meta": {
    "date": "2025-01-15",
    "baseCurrency": "USD",
    "totalCurrencies": 168,
    "responseTime": 312,
    "rateLimit": {...}
  }
}
```

**POST** - Same functionality with JSON body

## Setup Instructions

### 1. Get API Key
1. Visit [api-ninjas.com](https://api-ninjas.com/)
2. Sign up for a free account
3. Get your API key from the dashboard

### 2. Environment Configuration
Add to your `.env.local` file:
```env
API_NINJAS_KEY=your-api-key-here
```

### 3. Rate Limits
Free plan includes:
- 10,000 requests per month
- Rate limits may vary by endpoint
- Both exchange rates and crypto prices count against quota

## User Interface

### API Controls Panel
The currency rates page now includes:

1. **Live Rates Section**
   - "Get Latest Rates" button for current exchange rates
   - Real-time success/error feedback
   - API quota usage display

2. **Historical Rates Section**
   - Date picker for selecting historical dates
   - "Get Historical Rates" button
   - Validation prevents future dates

3. **Status Indicators**
   - API configuration status
   - Rate limit remaining/total display
   - Success/error message handling

### Enhanced Info Banner
- Shows API availability status
- Provides guidance on manual vs automatic rates
- Links to API documentation when needed

## File Structure

```
src/
├── services/
│   └── integrations/
│       └── currencyAPIService.ts          # Core API integration service
├── app/api/
│   └── currency-rates/
│       ├── latest/route.ts                # Latest rates API endpoint
│       └── historical/route.ts            # Historical rates API endpoint
├── components/features/
│   └── CurrencyRatesAPIControls.tsx       # UI controls for API functionality
├── services/business/
│   └── currencyRatesBusinessService.ts    # Enhanced with API merge logic
└── hooks/
    └── useCurrencyRatesManagement.tsx     # Updated with API integration
```

## Business Logic Enhancements

### Rate Merging Strategy
1. **Preserve User Customizations**: Custom rates set by users are maintained
2. **Update Stale Rates**: Only rates older than threshold are updated from API
3. **Smart Conflict Resolution**: User rates take precedence over API rates
4. **Backup Strategy**: All rates backed up to localStorage before API updates

### Error Handling
- **API Key Missing**: Clear instructions for setup
- **Rate Limit Exceeded**: Shows remaining quota and retry guidance  
- **Network Errors**: Graceful fallback with informative messages
- **Invalid Data**: Validation with specific error descriptions

### Performance Optimizations
- **Request Deduplication**: Prevents duplicate API calls
- **Smart Caching**: Balances fresh data with performance
- **Progressive Loading**: UI remains responsive during API calls
- **Batch Updates**: Efficient state management for large datasets

## API Response Handling

### Data Transformation
The service automatically converts Free Currency API responses to the application's internal format:

```typescript
// API Response Format
{
  "USD": { "code": "USD", "value": 1.078121 }
}

// Internal Format
{
  code: "USD",
  name: "US Dollar", 
  rate: 1.078121,
  type: "fiat",
  lastUpdated: "2025-07-22T12:00:00.000Z"
}
```

### Rate Limit Headers
The integration monitors API usage via response headers:
- `X-RateLimit-Limit-Quota-Month`: Total monthly requests
- `X-RateLimit-Remaining-Quota-Month`: Remaining requests

## Testing

### Manual Testing
1. **Without API Key**:
   - Should show configuration instructions
   - Manual rates should work normally

2. **With API Key**:
   - API controls should appear
   - Latest rates button should fetch current data
   - Historical rates should work with date picker
   - Rate limits should display correctly

### API Endpoint Testing
```bash
# Test latest rates
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/currency-rates/latest

# Test historical rates
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/currency-rates/historical?date=2025-01-15"
```

## Security Considerations

### API Key Protection
- API key stored securely in environment variables
- Never exposed to client-side code
- Server-side only API calls

### Rate Limiting
- Built-in protection against quota exhaustion
- User feedback for rate limit status
- Graceful degradation when limits reached

### Input Validation
- Date format validation for historical requests
- Currency code validation
- Request size limits to prevent abuse

## Future Enhancements

### Planned Features
1. **Automatic Scheduled Updates**: Background job to update rates daily
2. **Currency Rate Alerts**: Notify when rates change significantly  
3. **Multiple API Providers**: Fallback to other currency APIs
4. **Advanced Analytics**: Rate change tracking and trend analysis
5. **Export Functionality**: Download historical rate data as CSV/Excel

### Database Integration
When rates move from localStorage to database:
1. Migration script for existing data
2. Multi-user rate sharing capabilities
3. Company-specific rate customizations
4. Audit trail for rate changes

## Troubleshooting

### Common Issues

**"API not configured" message**:
- Ensure `FREE_CURRENCY_API_KEY` is set in environment
- Restart the development server after adding the key

**Rate limit exceeded**:
- Check quota usage in the UI
- Wait until next month for quota reset
- Consider upgrading API plan for higher limits

**Historical dates not working**:
- Ensure date format is YYYY-MM-DD
- Check that date is not in the future
- Verify API key has historical data access

**Rates not updating**:
- Check browser console for error messages
- Verify network connectivity
- Ensure API key is valid and has remaining quota

## Support

For issues related to:
- **API Ninjas**: Visit [api-ninjas.com](https://api-ninjas.com/) for documentation and support
- **Implementation bugs**: Check application logs and browser console
- **Feature requests**: Document in project issue tracker