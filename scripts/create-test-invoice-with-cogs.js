const { PrismaClient } = require('@prisma/client');

async function createTestInvoiceWithCOGS() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('🔧 CREATING TEST INVOICE WITH COGS-ENABLED ITEMS');
    
    // First, get a company to work with
    const company = await prisma.company.findFirst({
      select: { id: true, legalName: true }
    });
    
    if (!company) {
      console.error('❌ No company found in database');
      return null;
    }
    
    console.log(`📊 Using company: ${company.legalName} (ID: ${company.id})`);
    
    // Create test products with costs
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Premium Consulting Service',
          description: 'High-value consulting with measurable costs',
          price: 150.00,
          currency: 'USD',
          cost: 75.00,  // 50% margin
          costCurrency: 'USD',
          companyId: company.id,
          isActive: true
        }
      }),
      prisma.product.create({
        data: {
          name: 'Software License',
          description: 'Annual software license with licensing costs',
          price: 500.00,
          currency: 'USD',
          cost: 200.00,  // 60% margin
          costCurrency: 'USD',
          companyId: company.id,
          isActive: true
        }
      }),
      prisma.product.create({
        data: {
          name: 'Training Workshop',
          description: 'Educational workshop with material costs',
          price: 300.00,
          currency: 'USD',
          cost: 120.00,  // 60% margin
          costCurrency: 'USD',
          companyId: company.id,
          isActive: true
        }
      })
    ]);
    
    console.log(`✅ Created ${products.length} test products with costs`);
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name}: $${product.price} (Cost: $${product.cost})`);
    });
    
    // Get or create a test client
    let client = await prisma.client.findFirst({
      where: { companyId: company.id },
      select: { id: true, name: true }
    });
    
    if (!client) {
      client = await prisma.client.create({
        data: {
          clientType: 'Business',
          name: 'COGS Test Client Corp',
          contactPersonName: 'John Doe',
          email: 'john@cogstestclient.com',
          phone: '+1-555-0123',
          address: '123 Test Street',
          city: 'Test City',
          zipCode: '12345',
          country: 'United States',
          industry: 'Technology',
          companyId: company.id
        }
      });
    }
    
    console.log(`📋 Using client: ${client.name} (ID: ${client.id})`);
    
    // Create invoice with items
    const invoiceNumber = `INV-COGS-${Date.now()}`;
    const issueDate = new Date();
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    // Calculate totals
    const items = [
      { product: products[0], quantity: 2 },  // 2 consulting services
      { product: products[1], quantity: 1 },  // 1 software license
      { product: products[2], quantity: 3 }   // 3 training workshops
    ];
    
    let subtotal = 0;
    let totalCOGS = 0;
    
    items.forEach(item => {
      const itemTotal = item.product.price * item.quantity;
      const itemCOGS = item.product.cost * item.quantity;
      subtotal += itemTotal;
      totalCOGS += itemCOGS;
    });
    
    const taxRate = 0.1; // 10% tax
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;
    
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName: client.name,
        clientEmail: 'john@cogstestclient.com',
        clientAddress: '123 Test Street, Test City, 12345',
        subtotal,
        currency: 'USD',
        status: 'sent',
        dueDate,
        issueDate,
        template: 'professional',
        taxRate,
        taxAmount,
        totalAmount,
        fromCompanyId: company.id,
        clientId: client.id,
        notes: 'Test invoice created for COGS calculation testing'
      }
    });
    
    console.log(`📄 Created invoice: ${invoiceNumber} (ID: ${invoice.id})`);
    
    // Create invoice items
    const invoiceItems = await Promise.all(
      items.map((item, index) => 
        prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            productId: item.product.id,
            productName: item.product.name,
            description: item.product.description,
            quantity: item.quantity,
            unitPrice: item.product.price,
            currency: 'USD',
            total: item.product.price * item.quantity
          }
        })
      )
    );
    
    console.log(`✅ Created ${invoiceItems.length} invoice items`);
    
    // Display the complete invoice with COGS analysis
    console.log('\n📊 INVOICE DETAILS WITH COGS ANALYSIS:');
    console.log(`Invoice Number: ${invoiceNumber}`);
    console.log(`Client: ${client.name}`);
    console.log(`Status: ${invoice.status}`);
    console.log(`Total Amount: $${totalAmount.toFixed(2)}`);
    console.log('\nItems:');
    
    items.forEach((item, index) => {
      const itemTotal = item.product.price * item.quantity;
      const itemCOGS = item.product.cost * item.quantity;
      console.log(`  ${index + 1}. ${item.product.name}`);
      console.log(`     Quantity: ${item.quantity}`);
      console.log(`     Unit Price: $${item.product.price.toFixed(2)}`);
      console.log(`     Unit Cost: $${item.product.cost.toFixed(2)}`);
      console.log(`     Item Total: $${itemTotal.toFixed(2)}`);
      console.log(`     Item COGS: $${itemCOGS.toFixed(2)}`);
      console.log(`     Item Profit: $${(itemTotal - itemCOGS).toFixed(2)}`);
    });
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`Subtotal: $${subtotal.toFixed(2)}`);
    console.log(`Tax (${(taxRate * 100)}%): $${taxAmount.toFixed(2)}`);
    console.log(`Total Amount: $${totalAmount.toFixed(2)}`);
    console.log(`Total COGS: $${totalCOGS.toFixed(2)}`);
    console.log(`Gross Profit: $${(subtotal - totalCOGS).toFixed(2)}`);
    console.log(`Profit Margin: ${(((subtotal - totalCOGS) / subtotal) * 100).toFixed(1)}%`);
    
    return {
      invoice,
      invoiceItems,
      products,
      totalCOGS,
      grossProfit: subtotal - totalCOGS,
      profitMargin: ((subtotal - totalCOGS) / subtotal) * 100
    };
    
  } catch (error) {
    console.error('❌ Error creating test invoice:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// If this script is run directly, execute the function
if (require.main === module) {
  createTestInvoiceWithCOGS()
    .then((result) => {
      if (result) {
        console.log(`\n✅ SUCCESS! Test invoice created: ${result.invoice.invoiceNumber}`);
        console.log(`🎯 Use this invoice number to test COGS calculation functionality`);
        console.log(`📊 Expected COGS: $${result.totalCOGS.toFixed(2)}`);
        console.log(`💰 Expected Gross Profit: $${result.grossProfit.toFixed(2)}`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script error:', error);
      process.exit(1);
    });
}

module.exports = { createTestInvoiceWithCOGS };