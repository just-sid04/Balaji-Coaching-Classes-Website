const bcrypt = require('bcryptjs');

// Only require prisma inside functions to avoid top-level issues during module load
const seed = async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    console.log('🌱 Seeding database...');

    // Create Super Admin
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@balaji.edu';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
    const adminName = process.env.SEED_ADMIN_NAME || 'Prof. Ravindra Thakare';

    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      console.log(`Admin already exists: ${adminEmail}`);
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
        },
      });
      console.log(`✅ Admin created: ${adminEmail}`);
    }

    // Seed categories
    const categories = [
      { name: 'JEE', description: 'Joint Entrance Examination', sortOrder: 1 },
      { name: 'NEET', description: 'National Eligibility cum Entrance Test', sortOrder: 2 },
      { name: 'MHT-CET', description: 'Maharashtra Common Entrance Test', sortOrder: 3 },
    ];

    for (const cat of categories) {
      const existing = await prisma.category.findUnique({ where: { name: cat.name } });
      if (!existing) {
        const createdCat = await prisma.category.create({ data: cat });
        console.log(`✅ Category: ${cat.name}`);

        // Seed subcategories
        const subcategories = [
          { name: '11th', sortOrder: 1 },
          { name: '12th', sortOrder: 2 },
          { name: 'Dropper', sortOrder: 3 },
        ];

        for (const sub of subcategories) {
          const createdSub = await prisma.subcategory.create({
            data: { ...sub, categoryId: createdCat.id },
          });
          console.log(`  ✅ Subcategory: ${cat.name} > ${sub.name}`);

          // Seed sections
          const sections = [
            { name: 'Full Test Series', sortOrder: 1 },
            { name: 'Chapter-wise Tests', sortOrder: 2 },
            { name: 'Subject-wise Tests', sortOrder: 3 },
            { name: 'Mock Tests', sortOrder: 4 },
            { name: 'Previous Year Papers', sortOrder: 5 },
          ];

          for (const sec of sections) {
            await prisma.section.create({
              data: { ...sec, subcategoryId: createdSub.id },
            });
          }
        }
      }
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log(`\n🔑 Admin Login:\n   Email: ${adminEmail}\n   Password: ${adminPassword}`);
    console.log('\n⚠️  Please change your admin password after first login!\n');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

require('dotenv').config();
seed();
