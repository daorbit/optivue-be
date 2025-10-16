const express = require('express');
const indexRouter = require('./routes/index');
const logger = require('./middleware/logger');

const app = express();

// Middleware
app.use(express.json());
app.use(logger);

// Routes
app.use('/', indexRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;