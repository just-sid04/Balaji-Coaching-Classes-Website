const cron = require('node-cron');
const prisma = require('../lib/prisma');

const startCronJobs = () => {
  // Run every 5 minutes: auto-expire tests past their expiryDate
  cron.schedule('*/5 * * * *', async () => {
    try {
      const result = await prisma.test.updateMany({
        where: {
          status: 'PUBLISHED',
          expiryDate: { lt: new Date() },
        },
        data: { status: 'EXPIRED' },
      });
      if (result.count > 0) {
        console.log(`[Cron] Auto-expired ${result.count} test(s)`);
      }
    } catch (err) {
      console.error('[Cron] Auto-expire error:', err.message);
    }
  });

  // Run every minute: auto-publish scheduled tests
  cron.schedule('* * * * *', async () => {
    try {
      const result = await prisma.test.updateMany({
        where: {
          status: 'SCHEDULED',
          startDate: { lte: new Date() },
        },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });
      if (result.count > 0) {
        console.log(`[Cron] Auto-published ${result.count} scheduled test(s)`);
      }
    } catch (err) {
      console.error('[Cron] Auto-publish error:', err.message);
    }
  });

  console.log('⏰ Cron jobs started (auto-expire & auto-publish)');
};

module.exports = { startCronJobs };
