const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');

// Route files
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const subscriptionRoutes = require('./routes/subscription');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);   // covers /api/plans, /api/user/*, /api/ads-results, /api/leads
app.use('/api/subscription', subscriptionRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

async function startServer() {
  try {
    await sequelize.authenticate({ logging: false });
    console.log('✅ Connection to the database has been established successfully.');

    await sequelize.sync({ alter: true, logging: false });
    console.log('✅ Database synchronized.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
