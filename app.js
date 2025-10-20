const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const accountRouter = require('./routes/account');
const facebookAdsRouter = require('./routes/facebookAds');
const seoRouter = require('./routes/seo');
const logger = require('./middleware/logger');
require('dotenv').config();

const app = express();

mongoose.connect(process.env.MONGODB_URI)


.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://optivue-fe.vercel.app'],
  credentials: true
}));
app.use(express.json());
app.use(logger);

// Routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/api', accountRouter);
app.use('/api', facebookAdsRouter);
app.use('/api/seo', seoRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;

// Only start the server if not running on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;