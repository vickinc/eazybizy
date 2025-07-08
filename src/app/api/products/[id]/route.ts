import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
            isActive: true,
          },
        },
        invoiceItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            total: true,
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                clientName: true,
                status: true,
                issueDate: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            invoiceItems: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json()
    
    const {
      name,
      description,
      price,
      currency,
      cost,
      costCurrency,
      isActive,
      companyId,
      vendorId,
    } = body

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price,
        currency,
        cost,
        costCurrency,
        isActive,
        companyId: companyId || null,
        vendorId: vendorId || null,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            invoiceItems: true,
          },
        },
      },
    })

    // Invalidate caches after successful update
    CacheInvalidationService.invalidateOnProductMutation(updatedProduct.id, updatedProduct.companyId).catch(error => 
      console.error('Failed to invalidate caches after product update:', error)
    )

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            invoiceItems: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product is used in invoices
    if (product._count.invoiceItems > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete product that is used in invoices',
          details: `This product is referenced in ${product._count.invoiceItems} invoice item(s). To delete this product, you must first remove it from all invoices or archive the product instead.`,
          invoiceItemsCount: product._count.invoiceItems,
          suggestion: 'Consider deactivating the product instead of deleting it.'
        },
        { status: 400 }
      )
    }

    // Delete product
    await prisma.product.delete({
      where: { id: params.id },
    })

    // Invalidate caches after successful deletion
    CacheInvalidationService.invalidateOnProductMutation(params.id, product.companyId).catch(error => 
      console.error('Failed to invalidate caches after product deletion:', error)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}