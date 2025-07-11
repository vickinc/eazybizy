import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { serverAuthService } from '@/services/auth/authService.server';
import { cookies } from 'next/headers';
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

// Generate Google OAuth URL
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await serverAuthService.getCurrentUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: user.email // Pass user email for verification
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Google OAuth URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' },
      { status: 500 }
    );
  }
}

// Handle OAuth callback
export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.access_token) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 400 });
    }

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data.email) {
      return NextResponse.json({ error: 'Unable to get user email from Google' }, { status: 400 });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: state || userInfo.data.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = tokens.access_token ? encrypt(tokens.access_token) : null;
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

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

    return NextResponse.json({ 
      success: true, 
      user: {
        googleEmail: userInfo.data.email,
        googleId: userInfo.data.id
      }
    });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Google' },
      { status: 500 }
    );
  }
}

// Disconnect Google account
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentUser = await serverAuthService.getCurrentUserFromToken(token);

    if (!currentUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: currentUser.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Clear Google credentials
    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: null,
        googleEmail: null,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleCalendarId: null,
        googleSyncEnabled: false,
        lastGoogleSync: null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google OAuth disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google account' },
      { status: 500 }
    );
  }
}