import { organizations, campaigns, leads, services, users, memberships, opportunities, offlineActivities, assets } from '../shared/schema.js';
import { db } from '../server/db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Create Organization
    const [org] = await db.insert(organizations).values({
      name: 'Stratikey Demo Company',
      plan: 'business',
    }).returning();
    
    console.log('✅ Organization created:', org.id);

    // 2. Create Admin User
    const hashedPassword = await bcrypt.hash('admin123!', 12);
    const [adminUser] = await db.insert(users).values({
      email: 'admin@stratikey-demo.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Stratikey',
    }).returning();

    console.log('✅ Admin user created:', adminUser.id);

    // 3. Create Membership (Admin role)
    const [membership] = await db.insert(memberships).values({
      role: 'ORG_ADMIN',
      organizationId: org.id,
      userId: adminUser.id,
    }).returning();

    console.log('✅ Membership created:', membership.id);

    // 4. Create Campaign
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

    // 5. Create Service
    const [service] = await db.insert(services).values({
      name: 'Gestione Social Media Avanzata',
      description: 'Gestione completa dei canali social con creazione contenuti, programmazione post, community management e reporting mensile. Include strategia editoriale personalizzata e analisi delle performance.',
      basePrice: 899.99,
      category: 'marketing',
      isActive: true,
    }).returning();

    console.log('✅ Service created:', service.id);

    // 6. Create Lead
    const [lead] = await db.insert(leads).values({
      organizationId: org.id,
      ownerId: adminUser.id,
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

    // 7. Create Opportunity
    const [opportunity] = await db.insert(opportunities).values({
      organizationId: org.id,
      leadId: lead.id,
      ownerId: adminUser.id,
      title: 'Sistema CRM InnovaTech',
      stage: 'PROPOSAL',
      amount: 25000,
      currency: 'EUR',
      closeDate: new Date('2024-06-15'),
      priority: 'P1',
    }).returning();

    console.log('✅ Opportunity created:', opportunity.id);

    // 8. Create PDF Asset
    const [pdfAsset] = await db.insert(assets).values({
      organizationId: org.id,
      type: 'DOC',
      mimeType: 'application/pdf',
      sizeBytes: 2048576, // 2MB
      checksumSha256: 'mock-pdf-hash-12345',
      url: '/mock-assets/fiera-tech-expo-2024.pdf',
      title: 'Fiera Tech Expo 2024 - Brochure.pdf',
    }).returning();

    console.log('✅ PDF Asset created:', pdfAsset.id);

    // 9. Create Offline Activity (Fiera)
    const [offlineActivity] = await db.insert(offlineActivities).values({
      organizationId: org.id,
      createdByUserId: adminUser.id,
      title: 'Partecipazione Tech Expo Milano 2024',
      type: 'FIERA',
      activityDate: new Date('2024-10-15'),
      budget: 850000, // 8500 EUR in centesimi
      description: 'Partecipazione alla principale fiera tecnologica italiana con stand espositivo personalizzato, presentazioni sui nostri servizi CRM e networking con potenziali clienti B2B.',
      assetIds: [pdfAsset.id],
    }).returning();

    console.log('✅ Offline Activity created:', offlineActivity.id);

    console.log('🎉 Seed completed successfully!');
    console.log(`
📊 Created:
- Organization: ${org.name} (${org.id})
- Admin User: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})
- Campaign: ${campaign.name} (${campaign.id}) 
- Service: ${service.name} (${service.id})
- Lead: ${lead.firstName} ${lead.lastName} (${lead.id})
- Opportunity: ${opportunity.title} (${opportunity.id})
- Offline Activity: ${offlineActivity.title} (${offlineActivity.id})
- PDF Asset: ${pdfAsset.title} (${pdfAsset.id})
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