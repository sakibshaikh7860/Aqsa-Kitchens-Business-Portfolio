require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* -- Security & Performance Middleware -- */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -- Rate Limiter (prevent spam on enquiry form) -- */
const limiter = rateLimit({
  windowMs : 15 * 60 * 1000, // 15 minutes
  max      : 100,
  message  : { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

/* -- Static Files -- */
app.use(express.static(path.join(__dirname, '../public')));

/* -- View Engine -- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

/* -- Routes -- */
app.use('/', require('./routes/pages'));
app.use('/api', require('./routes/api'));

/* -- Health Check (for Docker/ECS/K8s) -- */
app.get('/health', (req, res) => {
  res.status(200).json({
    status    : 'healthy',
    app       : 'aqsa-kitchens',
    version   : process.env.APP_VERSION || '1.0.0',
    timestamp : new Date().toISOString(),
    uptime    : process.uptime()
  });
});

/* -- 404 Handler -- */
app.use((req, res) => {
  res.status(404).render('404', {
    title       : 'Page Not Found - Aqsa Kitchen\'s',
    currentPage : '404'
  });
});

/* -- Error Handler -- */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

/* -- Start Server -- */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Aqsa Kitchen's server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app; // export for testing
