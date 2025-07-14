const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Sample note titles and content variations
const noteTitles = [
  "Meeting Notes", "Project Update", "Client Follow-up", "Weekly Review", "Budget Planning",
  "Marketing Strategy", "Sales Review", "Development Sprint", "Team Standup", "Product Launch",
  "Research Findings", "Competitor Analysis", "Customer Feedback", "Invoice Review", "Expense Report",
  "Contract Discussion", "Partnership Meeting", "Training Session", "Performance Review", "Goal Setting",
  "Risk Assessment", "Quality Assurance", "Technical Debt", "User Testing", "Feature Planning",
  "Stakeholder Update", "Vendor Meeting", "Legal Review", "Compliance Check", "Security Audit",
  "Database Migration", "API Documentation", "Code Review", "Bug Triage", "Release Planning",
  "Client Onboarding", "Employee Training", "Process Improvement", "Tool Evaluation", "Cost Analysis",
  "Timeline Review", "Resource Planning", "Market Research", "Brand Strategy", "Content Planning",
  "Social Media", "Email Campaign", "Website Update", "SEO Strategy", "Analytics Review",
  "Customer Support", "Help Desk", "Technical Support", "User Guide", "System Maintenance"
];

const noteContents = [
  "Important discussion points and action items from today's meeting.",
  "Updated project timeline and deliverables for the next quarter.",
  "Follow-up actions required after client presentation.",
  "Weekly progress review and upcoming priorities.",
  "Budget allocation and financial planning for new initiatives.",
  "Strategic marketing approach for the upcoming product launch.",
  "Sales performance metrics and improvement opportunities.",
  "Sprint planning and development milestones achieved.",
  "Daily standup notes and blockers to address.",
  "Product launch preparations and go-to-market strategy.",
  "Research insights and recommendations for implementation.",
  "Competitive landscape analysis and positioning strategy.",
  "Customer feedback compilation and improvement suggestions.",
  "Invoice processing and payment tracking updates.",
  "Monthly expense report and cost optimization opportunities.",
  "Contract terms discussion and negotiation points.",
  "Partnership opportunities and collaboration possibilities.",
  "Training materials and knowledge transfer sessions.",
  "Performance evaluation and development planning.",
  "Quarterly goal setting and success metrics definition.",
  "Risk identification and mitigation strategies.",
  "Quality standards and testing procedures review.",
  "Technical debt assessment and cleanup priorities.",
  "User acceptance testing results and feedback.",
  "Feature requirements and development roadmap.",
  "Stakeholder communication and status updates.",
  "Vendor evaluation and procurement decisions.",
  "Legal compliance and regulatory requirements.",
  "Compliance audit findings and corrective actions.",
  "Security assessment and vulnerability management.",
  "Database optimization and performance improvements.",
  "API endpoints documentation and integration guides.",
  "Code quality review and best practices implementation.",
  "Bug prioritization and resolution timeline.",
  "Release coordination and deployment checklist.",
  "Client onboarding process and welcome materials.",
  "Employee development and skill enhancement programs.",
  "Workflow optimization and efficiency improvements.",
  "Software evaluation and technology stack decisions.",
  "Cost-benefit analysis and resource optimization.",
  "Project timeline adjustments and milestone tracking.",
  "Resource allocation and capacity planning.",
  "Market trends analysis and business opportunities.",
  "Brand positioning and messaging strategy.",
  "Content creation and editorial calendar planning.",
  "Social media engagement and community building.",
  "Email marketing campaigns and performance metrics.",
  "Website improvements and user experience enhancements.",
  "Search engine optimization and content strategy.",
  "Analytics reporting and data-driven insights."
];

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const tags = [
  ['meeting', 'important'], ['project', 'deadline'], ['client', 'follow-up'],
  ['review', 'weekly'], ['budget', 'planning'], ['marketing', 'strategy'],
  ['sales', 'performance'], ['development', 'sprint'], ['team', 'standup'],
  ['product', 'launch'], ['research', 'analysis'], ['competitor', 'market'],
  ['customer', 'feedback'], ['invoice', 'finance'], ['expense', 'report'],
  ['contract', 'legal'], ['partnership', 'collaboration'], ['training', 'learning'],
  ['performance', 'review'], ['goals', 'planning'], ['risk', 'management'],
  ['quality', 'testing'], ['technical', 'debt'], ['user', 'testing'],
  ['feature', 'development'], ['stakeholder', 'communication'], ['vendor', 'procurement'],
  ['legal', 'compliance'], ['audit', 'security'], ['database', 'optimization'],
  ['api', 'documentation'], ['code', 'review'], ['bug', 'fix'],
  ['release', 'deployment'], ['onboarding', 'client'], ['employee', 'development'],
  ['process', 'improvement'], ['tool', 'evaluation'], ['cost', 'analysis'],
  ['timeline', 'milestone'], ['resource', 'planning'], ['market', 'research'],
  ['brand', 'strategy'], ['content', 'creation'], ['social', 'media'],
  ['email', 'campaign'], ['website', 'update'], ['seo', 'optimization'],
  ['analytics', 'reporting'], ['support', 'help']
];

async function addTestNotes() {
  try {
    console.log('Starting to add 500 test notes...');
    
    // Get existing companies to link notes to
    const companies = await prisma.company.findMany({
      where: { status: 'ACTIVE' },
      take: 10
    });
    
    if (companies.length === 0) {
      console.log('No active companies found. Creating a test company...');
      const testCompany = await prisma.company.create({
        data: {
          legalName: 'Test Company Ltd',
          tradingName: 'Test Company',
          status: 'ACTIVE',
          industry: 'Technology',
          countryOfRegistration: 'US',
          baseCurrency: 'USD',
          registrationNo: 'TEST123456',
          registrationDate: new Date(),
          address: '123 Test Street, Test City, TC 12345',
          phone: '+1-555-0123',
          email: 'test@testcompany.com',
          website: 'https://testcompany.com'
        }
      });
      companies.push(testCompany);
    }
    
    // Get some events to link notes to (optional)
    const events = await prisma.calendarEvent.findMany({
      take: 20
    });
    
    const notes = [];
    const batchSize = 50; // Process in batches to avoid memory issues
    
    for (let i = 0; i < 500; i++) {
      const title = noteTitles[Math.floor(Math.random() * noteTitles.length)];
      const content = noteContents[Math.floor(Math.random() * noteContents.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const selectedTags = tags[Math.floor(Math.random() * tags.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const isStandalone = Math.random() > 0.3; // 70% standalone, 30% event-linked
      const event = !isStandalone && events.length > 0 
        ? events[Math.floor(Math.random() * events.length)] 
        : null;
      
      // Add some variation to creation dates (spread over last 30 days)
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
      
      // Randomly mark some as completed (about 20%)
      const isCompleted = Math.random() < 0.2;
      const completedAt = isCompleted ? new Date() : null;
      
      notes.push({
        title: `${title} #${i + 1}`,
        content: `${content}\n\nNote ID: ${i + 1}\nGenerated for performance testing.`,
        priority,
        tags: JSON.stringify(selectedTags), // Convert array to JSON string
        companyId: company.id,
        isStandalone,
        eventId: event?.id || null,
        isCompleted,
        completedAt,
        createdAt,
        updatedAt: createdAt
      });
      
      // Process in batches
      if (notes.length === batchSize || i === 499) {
        console.log(`Adding batch of ${notes.length} notes (${i + 1}/500)...`);
        await prisma.note.createMany({
          data: notes
        });
        notes.length = 0; // Clear the array
      }
    }
    
    console.log('✅ Successfully added 500 test notes!');
    
    // Show summary
    const totalNotes = await prisma.note.count();
    const activeNotes = await prisma.note.count({ where: { isCompleted: false } });
    const completedNotes = await prisma.note.count({ where: { isCompleted: true } });
    
    console.log('\n📊 Notes Summary:');
    console.log(`Total notes: ${totalNotes}`);
    console.log(`Active notes: ${activeNotes}`);
    console.log(`Completed notes: ${completedNotes}`);
    
  } catch (error) {
    console.error('Error adding test notes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestNotes();