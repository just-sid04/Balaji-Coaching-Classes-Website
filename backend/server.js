require('dotenv').config();
const app = require('./src/app');
const { startCronJobs } = require('./src/services/cron');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Balaji Test Portal API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  startCronJobs();
});
