// Load environment variables (Next.js style)
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📊 DATABASE INSPECTION REPORT');
    console.log('=' .repeat(50));
    
    // Check Companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        tradingName: true,
        legalName: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            notes: true,
            calendarEvents: true
          }
        }
      }
    });
    
    console.log('\n🏢 COMPANIES:');
    console.log(`Total: ${companies.length}`);
    companies.forEach(company => {
      console.log(`  • ${company.tradingName} (ID: ${company.id})`);
      console.log(`    Status: ${company.status}`);
      console.log(`    Notes: ${company._count.notes}, Events: ${company._count.calendarEvents}`);
    });
    
    // Check Notes
    const notes = await prisma.note.findMany({
      include: {
        company: {
          select: {
            tradingName: true
          }
        },
        event: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Show latest 10
    });
    
    console.log('\n📝 NOTES:');
    console.log(`Total: ${notes.length} (showing latest 10)`);
    notes.forEach(note => {
      console.log(`  • "${note.title}"`);
      console.log(`    Priority: ${note.priority} | Completed: ${note.isCompleted ? 'Yes' : 'No'}`);
      console.log(`    Company: ${note.company?.tradingName || 'None'}`);
      console.log(`    Event: ${note.event?.title || 'Standalone'}`);
      console.log(`    Created: ${note.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
    // Check Calendar Events
    const events = await prisma.calendarEvent.findMany({
      include: {
        companyRecord: {
          select: {
            tradingName: true
          }
        },
        _count: {
          select: {
            notes: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 10 // Show latest 10
    });
    
    console.log('\n📅 CALENDAR EVENTS:');
    console.log(`Total: ${events.length} (showing latest 10)`);
    events.forEach(event => {
      console.log(`  • "${event.title}"`);
      console.log(`    Date: ${event.date.toLocaleDateString()} at ${event.time}`);
      console.log(`    Type: ${event.type} | Priority: ${event.priority}`);
      console.log(`    Company: ${event.companyRecord?.tradingName || 'None'}`);
      console.log(`    Linked Notes: ${event._count.notes}`);
      console.log('');
    });
    
    // Database Statistics
    const totalNotes = await prisma.note.count();
    const completedNotes = await prisma.note.count({ where: { isCompleted: true } });
    const standaloneNotes = await prisma.note.count({ where: { isStandalone: true } });
    const totalEvents = await prisma.calendarEvent.count();
    const totalCompanies = await prisma.company.count();
    
    console.log('\n📈 STATISTICS:');
    console.log(`  Companies: ${totalCompanies}`);
    console.log(`  Calendar Events: ${totalEvents}`);
    console.log(`  Notes: ${totalNotes} (${completedNotes} completed, ${standaloneNotes} standalone)`);
    
    console.log('\n✅ Database inspection complete!');
    console.log(`🔗 Visual interface: http://localhost:5556`);
    console.log(`📱 App interface: http://localhost:3000`);
    
  } catch (error) {
    console.error('❌ Error inspecting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the inspection
checkDatabase();