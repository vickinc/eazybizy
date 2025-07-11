# Google Calendar Integration Setup Guide

This guide explains how to set up Google Calendar integration with two-way sync, timezone handling, conflict detection, and security measures.

## Prerequisites

- Google Cloud Platform account
- Google Calendar API enabled
- OAuth 2.0 credentials configured

## Step 1: Google Cloud Platform Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Note your project ID

2. **Enable Google Calendar API**
   - Navigate to APIs & Services > Library
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
   - Download the credentials JSON file

## Step 2: Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Encryption for storing OAuth tokens
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Next.js (required for OAuth callback)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### How to get these values:

1. **GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET**
   - From the downloaded credentials JSON file
   - Or from Google Cloud Console > APIs & Services > Credentials

2. **ENCRYPTION_KEY**
   - Generate a 32-character random string
   - Used to encrypt OAuth tokens in the database
   - Example: `your_32_character_encryption_key_here`

3. **NEXTAUTH_URL**
   - Your application's base URL
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

4. **NEXTAUTH_SECRET**
   - Generate a random string for session encryption
   - You can use: `openssl rand -base64 32`

## Step 3: Database Migration

The database schema has been updated to support Google Calendar integration. Run the migration:

```bash
npx prisma migrate dev
```

## Features Implemented

### 1. OAuth Authentication
- Secure Google OAuth 2.0 flow
- Token encryption and secure storage
- Automatic token refresh
- Account connection/disconnection

### 2. Two-Way Synchronization
- **Push**: Local events → Google Calendar
- **Pull**: Google Calendar → Local events  
- **Bidirectional**: Automatic two-way sync
- Conflict detection and resolution

### 3. Timezone Support
- User timezone selection
- Automatic timezone conversion
- DST (Daylight Saving Time) handling
- Cross-timezone event scheduling

### 4. Security Measures
- **Rate Limiting**: 5 sync requests per minute per IP
- **Token Encryption**: All OAuth tokens encrypted at rest
- **CSRF Protection**: State parameter validation
- **Input Validation**: Comprehensive input sanitization
- **Scope Limitation**: Minimal required OAuth scopes

### 5. Conflict Detection
- Overlapping event detection
- Conflict resolution strategies
- ETag-based change detection
- Last-modified timestamps

## API Endpoints

### Authentication
- `GET /api/auth/google` - Generate OAuth URL
- `POST /api/auth/google` - Handle OAuth callback
- `DELETE /api/auth/google` - Disconnect Google account

### Calendar Management
- `GET /api/calendar/google/calendars` - List user's calendars
- `POST /api/calendar/google/calendars` - Set primary calendar

### Synchronization
- `GET /api/calendar/sync/google` - Get sync status
- `POST /api/calendar/sync/google` - Trigger manual sync

### User Settings
- `GET /api/user/timezone` - Get user timezone
- `POST /api/user/timezone` - Update user timezone

## UI Components

### Calendar Settings Dialog
- Google account connection status
- Calendar selection dropdown
- Timezone configuration
- Sync statistics and history
- Manual sync trigger

### Event Creation/Editing
- Timezone-aware date/time picking
- Google Calendar sync indicators
- Conflict warnings
- Location and recurrence support

## Usage Instructions

### For End Users

1. **Connect Google Calendar**
   - Click "Settings" in the calendar page
   - Click "Connect Google Calendar"
   - Authorize the application
   - Select which Google Calendar to sync with

2. **Set Timezone**
   - Go to Calendar Settings
   - Select your timezone from the dropdown
   - All events will be displayed in your local timezone

3. **Sync Events**
   - Sync happens automatically when events are created/edited
   - Manual sync available in settings
   - View sync history and statistics

4. **Manage Conflicts**
   - System detects overlapping events
   - Provides resolution options
   - Maintains event integrity

### For Developers

1. **Testing OAuth Flow**
   ```bash
   # Test OAuth URL generation
   curl -X GET http://localhost:3000/api/auth/google
   
   # Test sync status
   curl -X GET http://localhost:3000/api/calendar/sync/google
   ```

2. **Debugging Sync Issues**
   - Check browser console for errors
   - Review sync logs in Calendar Settings
   - Verify timezone settings
   - Check Google Calendar API quotas

3. **Rate Limiting**
   - 5 sync requests per minute per IP
   - Implement exponential backoff for retries
   - Monitor rate limit errors

## Error Handling

### Common Issues

1. **"Google Calendar not connected"**
   - User needs to connect their Google account
   - Check if OAuth tokens are valid
   - Verify environment variables

2. **"Failed to sync with Google Calendar"**
   - Check Google Calendar API quotas
   - Verify network connectivity
   - Review sync logs for specific errors

3. **"Rate limit exceeded"**
   - User is making too many sync requests
   - Implement client-side rate limiting
   - Wait before retrying

4. **"Invalid timezone"**
   - Provided timezone is not recognized
   - Use timezone validation utility
   - Default to UTC if invalid

### Monitoring

1. **Sync Statistics**
   - Track successful/failed syncs
   - Monitor sync frequency
   - Identify common error patterns

2. **Performance Metrics**
   - Sync duration
   - API response times
   - Database query performance

3. **Error Logging**
   - Comprehensive error messages
   - Stack traces for debugging
   - User-friendly error displays

## Security Considerations

1. **Token Security**
   - All OAuth tokens are encrypted
   - Tokens are never logged
   - Automatic token rotation

2. **Data Privacy**
   - Only calendar data is accessed
   - No personal information stored
   - User can disconnect at any time

3. **API Security**
   - Rate limiting prevents abuse
   - Input validation prevents injection
   - CORS properly configured

## Production Deployment

1. **Environment Variables**
   - Use secure secret management
   - Different values for prod/staging
   - Regular key rotation

2. **Database**
   - Ensure proper indexing
   - Monitor connection pools
   - Regular backups

3. **Monitoring**
   - Set up error alerting
   - Monitor API quotas
   - Track sync performance

## Troubleshooting

### Local Development

1. **OAuth Not Working**
   - Check redirect URI matches exactly
   - Verify Google Cloud project settings
   - Ensure localhost is allowed

2. **Sync Failing**
   - Check network connectivity
   - Verify API credentials
   - Review error logs

3. **Timezone Issues**
   - Check browser timezone detection
   - Verify server timezone settings
   - Test with different timezones

### Production Issues

1. **High Error Rate**
   - Check Google API quotas
   - Monitor rate limiting
   - Review server logs

2. **Performance Problems**
   - Optimize database queries
   - Implement caching
   - Consider background processing

3. **Security Alerts**
   - Rotate encryption keys
   - Review access logs
   - Update dependencies

## Support

For issues or questions:
1. Check the error messages in Calendar Settings
2. Review the sync history for patterns
3. Verify environment variables are set correctly
4. Test with a fresh Google account connection

## Changelog

- **v1.0.0**: Initial Google Calendar integration
  - OAuth authentication
  - Two-way sync
  - Timezone support
  - Conflict detection
  - Security measures