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

const allowedOrigins = [
  'https://leaditoai.com',
  'https://www.leaditoai.com',
  'https://admin.leaditoai.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Explicitly handle OPTIONS preflight for all routes
app.options('*', cors());
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
  let retries = 5;

  while (retries) {
    try {
      await sequelize.authenticate({ logging: false });
      console.log('✅ Connection to the database has been established successfully.');

      await sequelize.sync({ alter: true, logging: false });
      console.log('✅ Database synchronized.');

      app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
      });
      return; // Exit loop on success
    } catch (error) {
      console.log(`❌ DB not ready, retrying... (${retries} retries left). Error: ${error.message}`);
      retries--;
      if (retries === 0) {
        console.error('❌ Could not connect to the database after maximum retries.');
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds
    }
  }
}

startServer();

module.exports = app;
