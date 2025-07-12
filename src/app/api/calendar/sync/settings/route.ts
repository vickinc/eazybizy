import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// Get sync settings
export async function GET(request: NextRequest) {
  try {
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: {
        id: true,
        googleAutoSyncEnabled: true,
        googleDefaultCalendarId: true,
        googleSyncEnabled: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      autoSyncEnabled: user.googleAutoSyncEnabled !== false, // Default to true
      defaultCalendarId: user.googleDefaultCalendarId || 'primary',
      googleSyncEnabled: user.googleSyncEnabled
    });
  } catch (error) {
    console.error('Error getting sync settings:', error);
    return NextResponse.json(
      { error: 'Failed to get sync settings' },
      { status: 500 }
    );
  }
}

// Update sync settings
export async function POST(request: NextRequest) {
  try {
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { autoSyncEnabled, defaultCalendarId } = await request.json();

    // Update user settings
    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleAutoSyncEnabled: autoSyncEnabled,
        googleDefaultCalendarId: defaultCalendarId
      }
    });

    return NextResponse.json({
      success: true,
      autoSyncEnabled,
      defaultCalendarId
    });
  } catch (error) {
    console.error('Error updating sync settings:', error);
    return NextResponse.json(
      { error: 'Failed to update sync settings' },
      { status: 500 }
    );
  }
}