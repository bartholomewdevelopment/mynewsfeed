require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const connectDB = require('./config/db');
const { refreshAllFeeds } = require('./services/feedRefresher');
const { seedDefaultData } = require('./services/seeder');
const FeedItem = require('./models/FeedItem');

const app = express();

const archiveOldItems = async () => {
  const fiveDays    = new Date(Date.now() - 5  * 24 * 60 * 60 * 1000);
  const fourteenDays = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // All content archives after 5 days
  const archived = await FeedItem.updateMany(
    { archived: { $ne: true }, publishedAt: { $lt: fiveDays } },
    { $set: { archived: true, archivedReason: 'age' } }
  );
  if (archived.modifiedCount > 0) {
    console.log(`[archive] Auto-archived ${archived.modifiedCount} items older than 5 days`);
  }

  // Hard delete after 14 days total (9 days in archive)
  const deleted = await FeedItem.deleteMany({
    archived: true,
    publishedAt: { $lt: fourteenDays },
  });
  if (deleted.deletedCount > 0) {
    console.log(`[archive] Deleted ${deleted.deletedCount} items older than 14 days`);
  }
};

connectDB().then(async () => {
  await seedDefaultData();
  await archiveOldItems();
  refreshAllFeeds().catch(console.error);
});

const isProd = process.env.NODE_ENV === 'production';
app.use(cors({
  origin: isProd ? process.env.CLIENT_URL : (process.env.CLIENT_URL || 'http://localhost:5174'),
}));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/sources', require('./routes/sources'));
app.use('/api/keywords', require('./routes/keywords'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/sports', require('./routes/sports'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/market', require('./routes/market'));

// Refresh feeds every 15 minutes
cron.schedule('*/15 * * * *', () => {
  console.log('[cron] Running scheduled feed refresh...');
  refreshAllFeeds().catch(console.error);
});

// Auto-archive items older than 14 days — runs every hour
cron.schedule('0 * * * *', () => {
  archiveOldItems().catch(console.error);
});

// In production, serve the React build and handle client-side routing
if (isProd) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
