const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// Public: Get all categories with subcategories and sections
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            sections: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Public: Get published test count
router.get('/stats', async (req, res) => {
  try {
    const [testCount, studentCount] = await Promise.all([
      prisma.test.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
    ]);
    res.json({ testCount, studentCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
