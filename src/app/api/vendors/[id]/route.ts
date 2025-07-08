import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            isActive: true
          }
        }
      }
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vendor);

  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Extract productIds from body
    const { productIds = [], ...vendorData } = body;

    // Use transaction to update vendor and product assignments
    const result = await prisma.$transaction(async (tx) => {
      // First, remove this vendor from all products that were previously assigned to it
      await tx.product.updateMany({
        where: { vendorId: id },
        data: { vendorId: null }
      });

      // Then, assign selected products to this vendor
      if (productIds.length > 0) {
        await tx.product.updateMany({
          where: { 
            id: { in: productIds },
            companyId: existingVendor.companyId // Ensure products belong to same company
          },
          data: { vendorId: id }
        });
      }

      // Finally, update the vendor itself
      const updatedVendor = await tx.vendor.update({
        where: { id },
        data: {
          companyName: vendorData.companyName,
          contactPerson: vendorData.contactPerson,
          contactEmail: vendorData.contactEmail,
          phone: vendorData.phone,
          website: vendorData.website,
          paymentTerms: vendorData.paymentTerms,
          currency: vendorData.currency,
          paymentMethod: vendorData.paymentMethod,
          billingAddress: vendorData.billingAddress,
          itemsServicesSold: vendorData.itemsServicesSold,
          notes: vendorData.notes,
          companyRegistrationNr: vendorData.companyRegistrationNr,
          vatNr: vendorData.vatNr,
          vendorCountry: vendorData.vendorCountry,
          isActive: vendorData.isActive,
          updatedAt: new Date()
        },
        include: {
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
              logo: true
            }
          },
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              currency: true,
              isActive: true
            }
          }
        }
      });

      return updatedVendor;
    });

    // Invalidate vendor caches after successful update
    CacheInvalidationService.invalidateOnVendorMutation(result.id, result.companyId).catch(error => 
      console.error('Failed to invalidate caches after vendor update:', error)
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Check if vendor has associated products
    const productCount = await prisma.product.count({
      where: { vendorId: id }
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vendor with associated products. Please remove products first.' },
        { status: 400 }
      );
    }

    // Delete vendor
    await prisma.vendor.delete({
      where: { id }
    });

    // Invalidate vendor caches after successful deletion
    CacheInvalidationService.invalidateOnVendorMutation(id, existingVendor.companyId).catch(error => 
      console.error('Failed to invalidate caches after vendor deletion:', error)
    );

    return NextResponse.json({ success: true, message: 'Vendor deleted successfully' });

  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}