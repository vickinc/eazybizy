const { PrismaClient } = require('@prisma/client');

async function recreateInvoiceItems() {
  const prisma = new PrismaClient();
  
  try {
    // First, find the invoice
    const invoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: 'INV-COGS-1753395074885' }
    });
    
    if (!invoice) {
      console.log('❌ Invoice not found');
      return;
    }
    
    console.log('✅ Found invoice:', invoice.invoiceNumber);
    console.log('Invoice ID:', invoice.id);
    
    // Find or create the products first
    const products = await Promise.all([
      prisma.product.upsert({
        where: { id: 'cogs-test-software' },
        update: {},
        create: {
          id: 'cogs-test-software',
          name: 'Software License',
          description: 'Enterprise software license',
          price: 500.00,
          currency: 'USD',
          cost: 200.00,
          costCurrency: 'USD',
          companyId: invoice.fromCompanyId,
          isActive: true
        }
      }),
      prisma.product.upsert({
        where: { id: 'cogs-test-training' },
        update: {},
        create: {
          id: 'cogs-test-training',
          name: 'Training Workshop',
          description: 'Professional training workshop',
          price: 300.00,
          currency: 'USD',
          cost: 120.00,
          costCurrency: 'USD',
          companyId: invoice.fromCompanyId,
          isActive: true
        }
      }),
      prisma.product.upsert({
        where: { id: 'cogs-test-consulting' },
        update: {},
        create: {
          id: 'cogs-test-consulting',
          name: 'Premium Consulting Service',
          description: 'Premium consulting service',
          price: 150.00,
          currency: 'USD',
          cost: 75.00,
          costCurrency: 'USD',
          companyId: invoice.fromCompanyId,
          isActive: true
        }
      })
    ]);
    
    console.log('✅ Products created/updated:', products.length);
    
    // Create invoice items
    const items = await Promise.all([
      prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: products[0].id,
          productName: products[0].name,
          description: products[0].description,
          quantity: 1,
          unitPrice: 500.00,
          currency: 'USD',
          total: 500.00
        }
      }),
      prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: products[1].id,
          productName: products[1].name,
          description: products[1].description,
          quantity: 3,
          unitPrice: 300.00,
          currency: 'USD',
          total: 900.00
        }
      }),
      prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: products[2].id,
          productName: products[2].name,
          description: products[2].description,
          quantity: 2,
          unitPrice: 150.00,
          currency: 'USD',
          total: 300.00
        }
      })
    ]);
    
    console.log('✅ Invoice items created:', items.length);
    
    // Calculate expected COGS
    const expectedCOGS = 
      (products[0].cost * 1) +  // Software: $200 * 1 = $200
      (products[1].cost * 3) +  // Training: $120 * 3 = $360
      (products[2].cost * 2);   // Consulting: $75 * 2 = $150
    
    console.log('📊 Expected COGS calculation:');
    console.log(`Software License: $${products[0].cost} × 1 = $${products[0].cost * 1}`);
    console.log(`Training Workshop: $${products[1].cost} × 3 = $${products[1].cost * 3}`);
    console.log(`Premium Consulting: $${products[2].cost} × 2 = $${products[2].cost * 2}`);
    console.log(`Total Expected COGS: $${expectedCOGS}`);
    
    // Now change invoice status back to SENT so we can test marking it as paid
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { 
        status: 'SENT',
        paidDate: null
      }
    });
    
    // Delete existing revenue entry so we can recreate it
    await prisma.bookkeepingEntry.deleteMany({
      where: {
        invoiceId: invoice.id,
        isFromInvoice: true
      }
    });
    
    console.log('✅ Invoice status reset to SENT');
    console.log('✅ Previous revenue entries deleted');
    console.log('🎯 Ready for testing! You can now mark the invoice as paid to test COGS calculation.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateInvoiceItems();