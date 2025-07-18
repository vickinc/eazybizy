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
    const invoice = await prisma.invoice.findUnique({
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
            address: true,
            phone: true,
            email: true,
            website: true,
            vatNumber: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            clientType: true,
            address: true,
            city: true,
            zipCode: true,
            country: true,
            phone: true,
            website: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                currency: true,
              },
            },
          },
        },
        paymentMethodInvoices: {
          include: {
            paymentMethod: {
              select: {
                id: true,
                name: true,
                type: true,
                accountName: true,
                bankName: true,
                iban: true,
                swiftCode: true,
                walletAddress: true,
                currency: true,
                details: true,
              },
            },
          },
        },
        paymentSources: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Resolve polymorphic payment sources and add payment method names
    const paymentMethodNames = []
    
    // Process new polymorphic payment sources
    if (invoice.paymentSources && invoice.paymentSources.length > 0) {
      for (const source of invoice.paymentSources) {
        try {
          let name = ''
          
          if (source.sourceType === 'BANK_ACCOUNT') {
            const bankAccount = await prisma.bankAccount.findUnique({
              where: { id: source.sourceId },
              select: { bankName: true, accountName: true, currency: true }
            })
            if (bankAccount) {
              name = `${bankAccount.bankName} (${bankAccount.currency})`
            }
          } else if (source.sourceType === 'DIGITAL_WALLET') {
            const digitalWallet = await prisma.digitalWallet.findUnique({
              where: { id: source.sourceId },
              select: { walletType: true, walletName: true, currency: true }
            })
            if (digitalWallet) {
              name = `${digitalWallet.walletType} (${digitalWallet.currency})`
            }
          } else if (source.sourceType === 'PAYMENT_METHOD') {
            const paymentMethod = await prisma.paymentMethod.findUnique({
              where: { id: source.sourceId },
              select: { name: true, currency: true }
            })
            if (paymentMethod) {
              name = `${paymentMethod.name} (${paymentMethod.currency})`
            }
          }
          
          if (name) {
            paymentMethodNames.push(name)
          }
        } catch (error) {
          console.error(`Error resolving payment source ${source.sourceType}:${source.sourceId}`, error)
        }
      }
    }
    
    // Fallback to old payment method invoices if no polymorphic sources
    if (paymentMethodNames.length === 0 && invoice.paymentMethodInvoices) {
      for (const pmi of invoice.paymentMethodInvoices) {
        if (pmi.paymentMethod) {
          paymentMethodNames.push(`${pmi.paymentMethod.name} (${pmi.paymentMethod.currency})`)
        }
      }
    }

    return NextResponse.json({
      ...invoice,
      paymentMethodNames
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
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
    
    // If this is just a status update (like archiving), use simpler approach
    if (Object.keys(body).length === 1 && body.status) {
      const updatedInvoice = await prisma.invoice.update({
        where: { id: params.id },
        data: { status: body.status },
      })

      // Invalidate related caches after successful update
      CacheInvalidationService.invalidateOnInvoiceMutation(
        updatedInvoice.id,
        updatedInvoice.fromCompanyId,
        updatedInvoice.clientId || undefined
      ).catch(error => 
        console.error('Failed to invalidate caches after invoice update:', error)
      )

      return NextResponse.json(updatedInvoice)
    }

    // For full updates, use the complete logic
    const {
      invoiceNumber,
      clientName,
      clientEmail,
      clientAddress,
      clientId,
      subtotal,
      currency,
      status,
      dueDate,
      issueDate,
      paidDate,
      template,
      taxRate,
      taxAmount,
      totalAmount,
      fromCompanyId,
      notes,
      items = [],
      paymentMethodIds = [],
    } = body

    // Process payment method IDs to handle unified format (bank_, wallet_, or direct IDs)
    const processedPaymentMethods = []
    
    for (const paymentMethodId of (paymentMethodIds || [])) {
      if (paymentMethodId.startsWith('bank_') || paymentMethodId.startsWith('wallet_')) {
        // For bank accounts and digital wallets, create or find equivalent PaymentMethod record
        const actualId = paymentMethodId.replace(/^(bank_|wallet_)/, '')
        
        if (paymentMethodId.startsWith('bank_')) {
          // Find the bank account and create/find corresponding PaymentMethod
          const bankAccount = await prisma.bankAccount.findUnique({
            where: { id: actualId }
          })
          
          if (bankAccount) {
            // Create or find existing PaymentMethod for this bank account
            const existingPaymentMethod = await prisma.paymentMethod.findFirst({
              where: {
                companyId: bankAccount.companyId,
                type: 'BANK',
                bankName: bankAccount.bankName,
                accountName: bankAccount.accountName,
                iban: bankAccount.iban
              }
            })
            
            if (existingPaymentMethod) {
              processedPaymentMethods.push(existingPaymentMethod.id)
            } else {
              // Create new PaymentMethod record for this bank account
              const newPaymentMethod = await prisma.paymentMethod.create({
                data: {
                  type: 'BANK',
                  name: `${bankAccount.bankName} - ${bankAccount.accountName}`,
                  companyId: bankAccount.companyId,
                  accountName: bankAccount.accountName,
                  bankName: bankAccount.bankName,
                  bankAddress: bankAccount.bankAddress,
                  iban: bankAccount.iban,
                  swiftCode: bankAccount.swiftCode,
                  accountNumber: bankAccount.accountNumber || '',
                  currency: bankAccount.currency,
                  details: bankAccount.notes || '',
                }
              })
              processedPaymentMethods.push(newPaymentMethod.id)
            }
          }
        } else if (paymentMethodId.startsWith('wallet_')) {
          // Find the digital wallet and create/find corresponding PaymentMethod
          const digitalWallet = await prisma.digitalWallet.findUnique({
            where: { id: actualId }
          })
          
          if (digitalWallet) {
            // Create or find existing PaymentMethod for this digital wallet
            const existingPaymentMethod = await prisma.paymentMethod.findFirst({
              where: {
                companyId: digitalWallet.companyId,
                type: 'WALLET',
                walletAddress: digitalWallet.walletAddress
              }
            })
            
            if (existingPaymentMethod) {
              processedPaymentMethods.push(existingPaymentMethod.id)
            } else {
              // Create new PaymentMethod record for this digital wallet
              const newPaymentMethod = await prisma.paymentMethod.create({
                data: {
                  type: 'WALLET',
                  name: `${digitalWallet.walletType} - ${digitalWallet.walletName}`,
                  companyId: digitalWallet.companyId,
                  walletAddress: digitalWallet.walletAddress,
                  currency: digitalWallet.currency,
                  details: digitalWallet.notes || '',
                }
              })
              processedPaymentMethods.push(newPaymentMethod.id)
            }
          }
        }
      } else {
        // Direct PaymentMethod ID, use as-is
        processedPaymentMethods.push(paymentMethodId)
      }
    }

    // Use transaction to update invoice, items, and payment methods
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Delete existing items and payment method associations
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      })
      
      await tx.paymentMethodInvoice.deleteMany({
        where: { invoiceId: params.id },
      })

      // Update invoice with new data
      return await tx.invoice.update({
        where: { id: params.id },
        data: {
          invoiceNumber,
          clientName,
          clientEmail,
          clientAddress,
          clientId,
          subtotal,
          currency,
          status,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          issueDate: issueDate ? new Date(issueDate) : undefined,
          paidDate: paidDate ? new Date(paidDate) : null,
          template,
          taxRate,
          taxAmount,
          totalAmount,
          fromCompanyId,
          notes,
          items: {
            create: items.map((item: unknown) => ({
              productId: item.productId,
              productName: item.productName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              currency: item.currency,
              total: item.total,
            })),
          },
          paymentMethodInvoices: {
            create: processedPaymentMethods.map((paymentMethodId: string) => ({
              paymentMethodId,
            })),
          },
        },
        include: {
          company: true,
          client: true,
          items: {
            include: {
              product: true,
            },
          },
          paymentMethodInvoices: {
            include: {
              paymentMethod: true,
            },
          },
        },
      })
    })

    // Invalidate related caches after successful update
    CacheInvalidationService.invalidateOnInvoiceMutation(
      updatedInvoice.id,
      updatedInvoice.fromCompanyId,
      updatedInvoice.clientId || undefined
    ).catch(error => 
      console.error('Failed to invalidate caches after invoice update:', error)
    )

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Delete invoice (cascade will handle items and payment method associations)
    await prisma.invoice.delete({
      where: { id: params.id },
    })

    // Invalidate related caches after successful deletion
    CacheInvalidationService.invalidateOnInvoiceMutation(
      params.id,
      invoice.fromCompanyId,
      invoice.clientId || undefined
    ).catch(error => 
      console.error('Failed to invalidate caches after invoice deletion:', error)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}