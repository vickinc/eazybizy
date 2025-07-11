import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Google OAuth credentials not configured');
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Handle OAuth callback from Google
export async function GET(request: NextRequest) {
  try {
    console.log('OAuth callback received');
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This contains the user email
    const error = searchParams.get('error');

    console.log('OAuth params:', { code: !!code, state, error });

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/calendar?error=oauth_failed`);
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/calendar?error=no_code`);
    }

    console.log('Exchanging code for tokens...');
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('Tokens received:', { 
      hasAccessToken: !!tokens.access_token, 
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date 
    });

    if (!tokens.access_token) {
      console.error('No access token received');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/calendar?error=no_token`);
    }

    console.log('Getting user info from Google...');
    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    console.log('Google user info:', { 
      email: userInfo.data.email, 
      id: userInfo.data.id 
    });

    if (!userInfo.data.email) {
      console.error('No email received from Google');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/calendar?error=no_email`);
    }

    console.log('Looking up user in database...');
    // Find user in database using state (email) or Google email
    const user = await prisma.user.findUnique({
      where: { email: state || userInfo.data.email }
    });

    console.log('User found:', { userId: user?.id, userEmail: user?.email });

    if (!user) {
      console.error('User not found in database');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/calendar?error=user_not_found`);
    }

    console.log('Encrypting tokens...');
    // Encrypt tokens before storing
    const encryptedAccessToken = tokens.access_token ? encrypt(tokens.access_token) : null;
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

    console.log('Updating user with Google credentials...');
    // Update user with Google credentials
    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: userInfo.data.id || null,
        googleEmail: userInfo.data.email,
        googleAccessToken: encryptedAccessToken,
        googleRefreshToken: encryptedRefreshToken,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        googleSyncEnabled: true,
        lastGoogleSync: new Date()
      }
    });

    console.log('OAuth callback successful, redirecting...');
    // Redirect back to calendar page with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/calendar?success=google_connected`);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/calendar?error=callback_failed`);
  }
}