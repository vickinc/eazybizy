import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService';

// GET /api/business-cards/[id] - Get single business card
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessCard = await prisma.businessCard.findUnique({
      where: { id: params.id },
      include: {
        company: true
      }
    });

    if (!businessCard) {
      return NextResponse.json(
        { error: 'Business card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...businessCard,
      qrValue: businessCard.qrType === 'WEBSITE' ? businessCard.company.website : businessCard.company.email
    });

  } catch (error) {
    console.error('Error fetching business card:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business card' },
      { status: 500 }
    );
  }
}

// PUT /api/business-cards/[id] - Update business card
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { personName, position, qrType, template, isArchived } = body;

    // Check if business card exists
    const existingCard = await prisma.businessCard.findUnique({
      where: { id: params.id },
      include: { company: true }
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: 'Business card not found' },
        { status: 404 }
      );
    }

    // Determine QR value if qrType is being updated
    let qrValue = existingCard.qrValue;
    if (qrType && qrType !== existingCard.qrType) {
      qrValue = qrType === 'WEBSITE' ? existingCard.company.website : existingCard.company.email;
    }

    // Update business card
    const updatedBusinessCard = await prisma.businessCard.update({
      where: { id: params.id },
      data: {
        ...(personName !== undefined && { personName }),
        ...(position !== undefined && { position }),
        ...(qrType !== undefined && { qrType: qrType.toUpperCase(), qrValue }),
        ...(template !== undefined && { template: template.toUpperCase() }),
        ...(isArchived !== undefined && { isArchived })
      },
      include: {
        company: true
      }
    });

    // Invalidate business cards caches after update
    await CacheInvalidationService.invalidateOnBusinessCardMutation(params.id, existingCard.companyId);

    return NextResponse.json({
      ...updatedBusinessCard,
      qrValue: updatedBusinessCard.qrType === 'WEBSITE' ? updatedBusinessCard.company.website : updatedBusinessCard.company.email
    });

  } catch (error) {
    console.error('Error updating business card:', error);
    return NextResponse.json(
      { error: 'Failed to update business card' },
      { status: 500 }
    );
  }
}

// DELETE /api/business-cards/[id] - Delete business card
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if business card exists
    const existingCard = await prisma.businessCard.findUnique({
      where: { id: params.id }
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: 'Business card not found' },
        { status: 404 }
      );
    }

    // Delete business card
    await prisma.businessCard.delete({
      where: { id: params.id }
    });

    // Invalidate business cards caches after deletion
    await CacheInvalidationService.invalidateOnBusinessCardMutation(params.id, existingCard.companyId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting business card:', error);
    return NextResponse.json(
      { error: 'Failed to delete business card' },
      { status: 500 }
    );
  }
}