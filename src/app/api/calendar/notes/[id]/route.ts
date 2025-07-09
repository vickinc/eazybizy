import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/calendar/notes/[id] - Get single note
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true
          }
        },
        company: {
          select: {
            id: true,
            legalName: true,
            tradingName: true
          }
        }
      }
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : []
    });

  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/notes/[id] - Update note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      title,
      content,
      tags,
      priority,
      isCompleted,
      isStandalone,
      eventId,
      companyId
    } = body;

    // Check if note exists
    const existingNote = await prisma.note.findUnique({
      where: { id }
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Validate eventId if provided
    if (eventId && eventId !== existingNote.eventId) {
      const event = await prisma.calendarEvent.findUnique({
        where: { id: eventId }
      });
      
      if (!event) {
        return NextResponse.json(
          { error: 'Calendar event not found' },
          { status: 400 }
        );
      }
    }

    // Handle completion timestamp
    const updateData: unknown = {};
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (priority !== undefined) updateData.priority = priority.toUpperCase();
    if (isStandalone !== undefined) updateData.isStandalone = isStandalone;
    if (eventId !== undefined) updateData.eventId = eventId || null;
    if (companyId !== undefined) updateData.companyId = companyId ? parseInt(companyId) : null;
    
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted && !existingNote.isCompleted) {
        updateData.completedAt = new Date();
      } else if (!isCompleted && existingNote.isCompleted) {
        updateData.completedAt = null;
      }
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true
          }
        },
        company: {
          select: {
            id: true,
            legalName: true,
            tradingName: true
          }
        }
      }
    });

    return NextResponse.json({
      ...updatedNote,
      tags: updatedNote.tags ? JSON.parse(updatedNote.tags) : []
    });

  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/notes/[id] - Delete note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if note exists
    const existingNote = await prisma.note.findUnique({
      where: { id }
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Delete the note
    await prisma.note.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Note deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}