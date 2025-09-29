import { organizations, campaigns, leads, services } from '../shared/schema.js';
import { db } from '../server/db.js';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Create Organization
    const [org] = await db.insert(organizations).values({
      name: 'Stratikey Demo Company',
      plan: 'business',
    }).returning();
    
    console.log('✅ Organization created:', org.id);

    // 2. Create Campaign
    const [campaign] = await db.insert(campaigns).values({
      organizationId: org.id,
      name: 'Campagna di Lancio Primavera 2024',
      type: 'MIXED',
      status: 'ACTIVE',
      objective: 'Aumentare awareness del brand e generare lead qualificati per il trimestre Q2',
      budget: 15000,
      priority: 'P1',
      startAt: new Date('2024-03-01'),
      endAt: new Date('2024-05-31'),
    }).returning();

    console.log('✅ Campaign created:', campaign.id);

    // 3. Create Lead
    const [lead] = await db.insert(leads).values({
      organizationId: org.id,
      source: 'Website',
      firstName: 'Marco',
      lastName: 'Antonelli',
      email: 'marco.antonelli@innovatech.it',
      phone: '+39 340 123 4567',
      company: 'InnovaTech Solutions SRL',
      status: 'qualified',
      priority: 'P1',
    }).returning();

    console.log('✅ Lead created:', lead.id);

    // 4. Create Service
    const [service] = await db.insert(services).values({
      name: 'Gestione Social Media Avanzata',
      description: 'Gestione completa dei canali social con creazione contenuti, programmazione post, community management e reporting mensile. Include strategia editoriale personalizzata e analisi delle performance.',
      basePrice: 899.99,
      category: 'marketing',
      isActive: true,
    }).returning();

    console.log('✅ Service created:', service.id);

    console.log('🎉 Seed completed successfully!');
    console.log(`
📊 Created:
- Organization: ${org.name} (${org.id})
- Campaign: ${campaign.name} (${campaign.id}) 
- Lead: ${lead.firstName} ${lead.lastName} (${lead.id})
- Service: ${service.name} (${service.id})
    `);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    // Connection handled by db instance
  }
}

seed().catch((error) => {
  console.error('❌ Seed script failed:', error);
  process.exit(1);
});