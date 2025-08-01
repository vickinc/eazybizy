#!/usr/bin/env node

/**
 * Script to generate anniversary events for existing companies that don't have them yet
 * This is useful for companies created before the automatic anniversary generation was implemented
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateMissingAnniversaryEvents() {
  try {
    console.log('🔍 Finding companies without anniversary events...');
    
    // Get all companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        tradingName: true,
        registrationDate: true
      }
    });

    console.log(`📊 Found ${companies.length} companies total`);

    // Get all existing anniversary events 
    const existingAnniversaryEvents = await prisma.calendarEvent.findMany({
      where: {
        isAutoGenerated: true,
        type: 'ANNIVERSARY'
      },
      select: {
        companyId: true
      }
    });

    const companiesWithEvents = new Set(existingAnniversaryEvents.map(e => e.companyId));
    console.log(`📅 Found ${companiesWithEvents.size} companies with existing anniversary events`);

    // Find companies without anniversary events
    const companiesWithoutEvents = companies.filter(company => 
      company.id && !companiesWithEvents.has(company.id)
    );

    console.log(`🎯 Found ${companiesWithoutEvents.length} companies without anniversary events`);

    if (companiesWithoutEvents.length === 0) {
      console.log('✅ All companies already have anniversary events');
      return;
    }

    // Generate anniversary events for each company
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2); // Next 2 years

    let successCount = 0;
    let errorCount = 0;

    for (const company of companiesWithoutEvents) {
      try {
        console.log(`\n📝 Generating events for: ${company.tradingName} (ID: ${company.id})`);
        
        if (!company.registrationDate) {
          console.log(`   ⚠️  Skipping - no registration date`);
          continue;
        }

        const regDate = new Date(company.registrationDate);
        const anniversaries = [];

        // Generate anniversary events for next 2 years
        for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
          const anniversaryDate = new Date(year, regDate.getMonth(), regDate.getDate());
          
          // Only include if within range and after registration
          if (anniversaryDate >= startDate && 
              anniversaryDate <= endDate && 
              anniversaryDate >= regDate) {
            
            const yearsOld = year - regDate.getFullYear();
            const eventId = `anniversary-${company.id}-${year}`;
            
            let title, description;
            if (yearsOld === 0) {
              title = `🎉 ${company.tradingName} - Registration Day`;
              description = `Today marks the registration day of ${company.tradingName}! The company was registered on ${regDate.toLocaleDateString('en-GB')}.`;
            } else {
              const suffix = getOrdinalSuffix(yearsOld);
              title = `🎂 ${company.tradingName} - ${yearsOld}${suffix} Anniversary`;
              description = `Today marks the ${yearsOld}${suffix} anniversary of ${company.tradingName}! The company was registered on ${regDate.toLocaleDateString('en-GB')}.`;
            }

            anniversaries.push({
              id: eventId,
              title,
              description,
              date: anniversaryDate,
              time: '09:00',
              type: 'ANNIVERSARY',
              priority: 'MEDIUM',
              company: company.tradingName,
              companyId: company.id,
              isAutoGenerated: true,
              eventScope: 'company',
              syncEnabled: false,
              participants: '[]'
            });
          }
        }

        if (anniversaries.length > 0) {
          // Use individual creates to handle duplicates properly
          for (const anniversary of anniversaries) {
            try {
              await prisma.calendarEvent.create({
                data: anniversary
              });
            } catch (error) {
              if (error.code === 'P2002') {
                // Unique constraint violation - event already exists, skip
                console.log(`     ⚠️  Event ${anniversary.id} already exists, skipping`);
              } else {
                throw error;
              }
            }
          }

          console.log(`   ✅ Created ${anniversaries.length} anniversary events`);
          successCount++;
        } else {
          console.log(`   ℹ️  No anniversary events needed for this time range`);
        }

      } catch (error) {
        console.error(`   ❌ Error generating events for ${company.tradingName}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Generation complete!`);
    console.log(`   ✅ Successfully processed: ${successCount} companies`);
    console.log(`   ❌ Errors: ${errorCount} companies`);

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getOrdinalSuffix(num) {
  const remainder10 = num % 10;
  const remainder100 = num % 100;
  
  if (remainder100 >= 11 && remainder100 <= 13) {
    return 'th';
  }
  
  switch (remainder10) {
    case 1: return 'st';
    case 2: return 'nd'; 
    case 3: return 'rd';
    default: return 'th';
  }
}

// Run the script
generateMissingAnniversaryEvents();