const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixCryptoInitialBalances() {
  console.log('🚀 Starting crypto wallet initial balance fix...')

  try {
    // Get all digital wallets
    const digitalWallets = await prisma.digitalWallet.findMany({
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
          },
        },
      },
    })

    console.log(`📋 Found ${digitalWallets.length} digital wallets`)

    // Get existing initial balances for wallets
    const existingInitialBalances = await prisma.initialBalance.findMany({
      where: {
        accountType: 'wallet'
      }
    })

    console.log(`💰 Found ${existingInitialBalances.length} existing wallet initial balances`)

    const missingBalances = []
    const cryptoWallets = []

    // Process each wallet
    for (const wallet of digitalWallets) {
      if (wallet.walletType?.toLowerCase() !== 'crypto') {
        continue // Skip non-crypto wallets
      }

      cryptoWallets.push(wallet)

      // Parse currencies string into array if it exists
      let currenciesArray = []
      if (wallet.currencies) {
        if (Array.isArray(wallet.currencies)) {
          currenciesArray = wallet.currencies
        } else if (typeof wallet.currencies === 'string') {
          currenciesArray = wallet.currencies.split(',').map(c => c.trim()).filter(c => c.length > 0)
        }
      }
      
      // For multi-currency wallets, create entries for each supported currency
      if (currenciesArray.length > 0) {
        console.log(`🔍 Processing multi-currency wallet: ${wallet.walletName} - Currencies: ${currenciesArray.join(', ')}`)
        
        for (const currency of currenciesArray) {
          const hasInitialBalance = existingInitialBalances.some(
            ib => ib.accountId === wallet.id && ib.currency === currency
          )
          
          if (!hasInitialBalance) {
            console.log(`❌ Missing initial balance: ${wallet.walletName} (${currency})`)
            missingBalances.push({
              accountId: wallet.id,
              accountType: 'wallet',
              currency,
              amount: 0,
              companyId: wallet.companyId,
              notes: `Auto-generated initial balance for ${wallet.walletName} (${currency})`
            })
          } else {
            console.log(`✅ Has initial balance: ${wallet.walletName} (${currency})`)
          }
        }
      } else {
        // Single currency wallet
        console.log(`🔍 Processing single-currency wallet: ${wallet.walletName} - Currency: ${wallet.currency}`)
        
        const hasInitialBalance = existingInitialBalances.some(
          ib => ib.accountId === wallet.id && ib.currency === wallet.currency
        )
        
        if (!hasInitialBalance) {
          console.log(`❌ Missing initial balance: ${wallet.walletName} (${wallet.currency})`)
          missingBalances.push({
            accountId: wallet.id,
            accountType: 'wallet',
            currency: wallet.currency,
            amount: 0,
            companyId: wallet.companyId,
            notes: `Auto-generated initial balance for ${wallet.walletName} (${wallet.currency})`
          })
        } else {
          console.log(`✅ Has initial balance: ${wallet.walletName} (${wallet.currency})`)
        }
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Crypto wallets found: ${cryptoWallets.length}`)
    console.log(`   Missing initial balances: ${missingBalances.length}`)

    if (missingBalances.length > 0) {
      console.log(`\n🔧 Creating missing initial balance records...`)
      
      const createdBalances = []
      for (const balance of missingBalances) {
        try {
          const created = await prisma.initialBalance.create({
            data: balance
          })
          createdBalances.push(created)
          console.log(`✅ Created: ${balance.accountId} (${balance.currency}) - ${balance.amount}`)
        } catch (error) {
          console.error(`❌ Failed to create: ${balance.accountId} (${balance.currency})`, error.message)
        }
      }

      console.log(`\n🎉 Successfully created ${createdBalances.length} initial balance records!`)
    } else {
      console.log(`\n✅ All crypto wallets already have initial balance records!`)
    }

  } catch (error) {
    console.error('❌ Error fixing crypto initial balances:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCryptoInitialBalances().catch(console.error)