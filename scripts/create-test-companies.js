const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const testCompanies = [
  {
    legalName: "TechFlow Solutions Ltd",
    tradingName: "TechFlow",
    registrationNo: "12345001",
    registrationDate: new Date("2020-01-15"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL001",
    vatNumber: "GB123456789",
    industry: "Technology",
    address: "123 Innovation Street, London, SW1A 1AA",
    phone: "+44 20 7946 0958",
    email: "contact@techflow.com",
    website: "https://techflow.com",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/3B82F6/white?text=TF",
    facebookUrl: "https://facebook.com/techflow",
    instagramUrl: "https://instagram.com/techflow",
    mainContactEmail: "john.smith@techflow.com",
    mainContactType: "CEO"
  },
  {
    legalName: "Green Energy Partners LLP",
    tradingName: "GreenPower",
    registrationNo: "12345002",
    registrationDate: new Date("2019-03-22"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL002",
    vatNumber: "GB987654321",
    industry: "Energy",
    address: "456 Renewable Avenue, Manchester, M1 2AB",
    phone: "+44 161 234 5678",
    email: "info@greenpower.co.uk",
    website: "https://greenpower.co.uk",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/10B981/white?text=GP",
    facebookUrl: "https://facebook.com/greenpower",
    xUrl: "https://x.com/greenpower",
    mainContactEmail: "sarah.jones@greenpower.co.uk",
    mainContactType: "Managing Director"
  },
  {
    legalName: "Creative Design Studio Inc",
    tradingName: "PixelCraft",
    registrationNo: "12345003",
    registrationDate: new Date("2021-06-10"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL003",
    vatNumber: "GB456789123",
    industry: "Design",
    address: "789 Creative Quarter, Bristol, BS1 3CD",
    phone: "+44 117 456 7890",
    email: "hello@pixelcraft.design",
    website: "https://pixelcraft.design",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/8B5CF6/white?text=PC",
    instagramUrl: "https://instagram.com/pixelcraft",
    youtubeUrl: "https://youtube.com/pixelcraft",
    mainContactEmail: "mike.wilson@pixelcraft.design",
    mainContactType: "Creative Director"
  },
  {
    legalName: "Financial Advisory Group Ltd",
    tradingName: "WealthWise",
    registrationNo: "12345004",
    registrationDate: new Date("2018-09-05"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL004",
    vatNumber: "GB789123456",
    industry: "Finance",
    address: "321 Money Street, Edinburgh, EH1 4EF",
    phone: "+44 131 789 0123",
    email: "contact@wealthwise.co.uk",
    website: "https://wealthwise.co.uk",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/F59E0B/white?text=WW",
    facebookUrl: "https://facebook.com/wealthwise",
    mainContactEmail: "emma.brown@wealthwise.co.uk",
    mainContactType: "Senior Partner"
  },
  {
    legalName: "Urban Construction plc",
    tradingName: "BuildRight",
    registrationNo: "12345005",
    registrationDate: new Date("2017-11-18"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL005",
    vatNumber: "GB321654987",
    industry: "Construction",
    address: "654 Builder's Lane, Birmingham, B1 5GH",
    phone: "+44 121 098 7654",
    email: "info@buildright.com",
    website: "https://buildright.com",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/EF4444/white?text=BR",
    xUrl: "https://x.com/buildright",
    whatsappNumber: "+44 7700 900123",
    mainContactEmail: "david.taylor@buildright.com",
    mainContactType: "Project Manager"
  },
  {
    legalName: "Gourmet Food Distribution Ltd",
    tradingName: "TasteMakers",
    registrationNo: "12345006",
    registrationDate: new Date("2020-04-12"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL006",
    vatNumber: "GB654987321",
    industry: "Food & Beverage",
    address: "987 Culinary Court, Leeds, LS1 6IJ",
    phone: "+44 113 345 6789",
    email: "orders@tastemakers.co.uk",
    website: "https://tastemakers.co.uk",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/F97316/white?text=TM",
    instagramUrl: "https://instagram.com/tastemakers",
    youtubeUrl: "https://youtube.com/tastemakers",
    mainContactEmail: "lucy.clark@tastemakers.co.uk",
    mainContactType: "Head Chef"
  },
  {
    legalName: "Digital Marketing Hub Ltd",
    tradingName: "ClickBoost",
    registrationNo: "12345007",
    registrationDate: new Date("2021-02-28"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL007",
    vatNumber: "GB987321654",
    industry: "Marketing",
    address: "246 Social Media Street, Liverpool, L1 7KL",
    phone: "+44 151 678 9012",
    email: "growth@clickboost.agency",
    website: "https://clickboost.agency",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/06B6D4/white?text=CB",
    facebookUrl: "https://facebook.com/clickboost",
    xUrl: "https://x.com/clickboost",
    instagramUrl: "https://instagram.com/clickboost",
    mainContactEmail: "alex.johnson@clickboost.agency",
    mainContactType: "Marketing Director"
  },
  {
    legalName: "Healthcare Innovations Ltd",
    tradingName: "MediCare Plus",
    registrationNo: "12345008",
    registrationDate: new Date("2019-07-14"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL008",
    vatNumber: "GB147258369",
    industry: "Healthcare",
    address: "135 Wellness Way, Newcastle, NE1 8MN",
    phone: "+44 191 234 5678",
    email: "info@medicareplus.co.uk",
    website: "https://medicareplus.co.uk",
    status: "Passive",
    logo: "https://via.placeholder.com/100x100/10B981/white?text=MP",
    whatsappNumber: "+44 7700 900234",
    telegramNumber: "+44 7700 900234",
    mainContactEmail: "dr.rachel.white@medicareplus.co.uk",
    mainContactType: "Medical Director"
  },
  {
    legalName: "Educational Resources Group",
    tradingName: "LearnSmart",
    registrationNo: "12345009",
    registrationDate: new Date("2018-12-03"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL009",
    vatNumber: "GB369258147",
    industry: "Education",
    address: "579 Knowledge Boulevard, Oxford, OX1 9OP",
    phone: "+44 1865 987 6543",
    email: "contact@learnsmart.edu",
    website: "https://learnsmart.edu",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/8B5CF6/white?text=LS",
    youtubeUrl: "https://youtube.com/learnsmart",
    mainContactEmail: "prof.james.green@learnsmart.edu",
    mainContactType: "Academic Director"
  },
  {
    legalName: "Logistics Express Ltd",
    tradingName: "FastTrack Delivery",
    registrationNo: "12345010",
    registrationDate: new Date("2020-08-20"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL010",
    vatNumber: "GB741852963",
    industry: "Logistics",
    address: "864 Transport Terminal, Sheffield, S1 0QR",
    phone: "+44 114 567 8901",
    email: "dispatch@fasttrack.delivery",
    website: "https://fasttrack.delivery",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/EF4444/white?text=FT",
    whatsappNumber: "+44 7700 900345",
    mainContactEmail: "tom.harris@fasttrack.delivery",
    mainContactType: "Operations Manager"
  },
  {
    legalName: "Fashion Forward Boutique Ltd",
    tradingName: "StyleHub",
    registrationNo: "12345011",
    registrationDate: new Date("2021-01-08"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL011",
    vatNumber: "GB852963741",
    industry: "Fashion",
    address: "420 Trendy Lane, Brighton, BN1 1ST",
    phone: "+44 1273 890 1234",
    email: "hello@stylehub.fashion",
    website: "https://stylehub.fashion",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/EC4899/white?text=SH",
    facebookUrl: "https://facebook.com/stylehub",
    instagramUrl: "https://instagram.com/stylehub",
    mainContactEmail: "sophia.miller@stylehub.fashion",
    mainContactType: "Creative Director"
  },
  {
    legalName: "Automotive Solutions Group",
    tradingName: "CarCare Pro",
    registrationNo: "12345012",
    registrationDate: new Date("2019-05-25"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL012",
    vatNumber: "GB963741852",
    industry: "Automotive",
    address: "753 Motor Mile, Coventry, CV1 2UV",
    phone: "+44 24 7601 2345",
    email: "service@carcarepro.com",
    website: "https://carcarepro.com",
    status: "Passive",
    logo: "https://via.placeholder.com/100x100/6B7280/white?text=CP",
    facebookUrl: "https://facebook.com/carcarepro",
    mainContactEmail: "robert.davis@carcarepro.com",
    mainContactType: "Service Manager"
  },
  {
    legalName: "Property Investment Trust",
    tradingName: "HomeVest",
    registrationNo: "12345013",
    registrationDate: new Date("2017-10-12"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL013",
    vatNumber: "GB159753486",
    industry: "Real Estate",
    address: "192 Property Plaza, Cardiff, CF1 3WX",
    phone: "+44 29 2087 6543",
    email: "invest@homevest.property",
    website: "https://homevest.property",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/059669/white?text=HV",
    xUrl: "https://x.com/homevest",
    mainContactEmail: "jennifer.evans@homevest.property",
    mainContactType: "Investment Director"
  },
  {
    legalName: "Sports Equipment Specialists",
    tradingName: "GameGear",
    registrationNo: "12345014",
    registrationDate: new Date("2020-11-30"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL014",
    vatNumber: "GB486159753",
    industry: "Sports",
    address: "318 Athletic Avenue, Glasgow, G1 4YZ",
    phone: "+44 141 432 1098",
    email: "sales@gamegear.sport",
    website: "https://gamegear.sport",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/DC2626/white?text=GG",
    instagramUrl: "https://instagram.com/gamegear",
    youtubeUrl: "https://youtube.com/gamegear",
    mainContactEmail: "chris.thompson@gamegear.sport",
    mainContactType: "Sales Director"
  },
  {
    legalName: "Environmental Consulting Ltd",
    tradingName: "EcoAdvise",
    registrationNo: "12345015",
    registrationDate: new Date("2018-04-07"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL015",
    vatNumber: "GB753486159",
    industry: "Environmental",
    address: "641 Green Valley Road, Bath, BA1 5AB",
    phone: "+44 1225 678 9012",
    email: "consult@ecoadvise.green",
    website: "https://ecoadvise.green",
    status: "Active",
    logo: "https://via.placeholder.com/100x100/16A34A/white?text=EA",
    facebookUrl: "https://facebook.com/ecoadvise",
    xUrl: "https://x.com/ecoadvise",
    mainContactEmail: "dr.anna.cooper@ecoadvise.green",
    mainContactType: "Environmental Consultant"
  }
]

async function createTestCompanies() {
  console.log('🏢 Creating 15 test companies...')
  
  try {
    // Check if any test companies already exist
    const existingCompanies = await prisma.company.findMany({
      where: {
        registrationNo: {
          in: testCompanies.map(c => c.registrationNo)
        }
      }
    })

    if (existingCompanies.length > 0) {
      console.log(`⚠️  Found ${existingCompanies.length} existing test companies. Deleting them first...`)
      await prisma.company.deleteMany({
        where: {
          registrationNo: {
            in: existingCompanies.map(c => c.registrationNo)
          }
        }
      })
      console.log('✅ Deleted existing test companies')
    }

    // Create all companies
    const createdCompanies = await prisma.company.createMany({
      data: testCompanies
    })

    console.log(`✅ Successfully created ${createdCompanies.count} test companies!`)
    
    // Display summary
    console.log('\n📊 Company Summary:')
    console.log('  - Active companies: 13')
    console.log('  - Passive companies: 2')
    console.log('  - Industries: Technology, Energy, Design, Finance, Construction, Food & Beverage, Marketing, Healthcare, Education, Logistics, Fashion, Automotive, Real Estate, Sports, Environmental')
    
    console.log('\n🚀 Test the optimized SSR performance by visiting /companies')
    console.log('   - Initial load: 6 companies (ultra-fast)')
    console.log('   - Load more: Additional companies with smooth pagination')
    console.log('   - Total available: 15 companies for testing')

  } catch (error) {
    console.error('❌ Error creating test companies:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createTestCompanies()