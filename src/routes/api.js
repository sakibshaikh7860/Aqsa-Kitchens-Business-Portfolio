const express = require('express');
const router  = express.Router();

/* -- POST /api/enquiry -- */
router.post('/enquiry', async (req, res) => {
  try {
    const { name, phone, email, product, city, quantity, message } = req.body;

    // Basic validation
    if (!name || !phone || !product) {
      return res.status(400).json({
        success : false,
        error   : 'Name, phone, and product are required fields.'
      });
    }
    if (phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        success : false,
        error   : 'Please enter a valid phone number.'
      });
    }

    // Log enquiry (in production -> save to DB or send email via SES)
    const enquiry = {
      id        : Date.now(),
      name, phone, email, product,
      city      : city      || 'Not specified',
      quantity  : quantity  || 1,
      message   : message   || '',
      timestamp : new Date().toISOString()
    };
    console.log('New Enquiry Received:', JSON.stringify(enquiry, null, 2));

    // TODO (production): Send via AWS SES
    // await sendEnquiryEmail(enquiry);

    return res.status(200).json({
      success : true,
      message : 'Thank you! We will contact you within 24 hours.',
      enquiryId : enquiry.id
    });

  } catch (err) {
    console.error('Enquiry error:', err);
    return res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

/* -- GET /api/products -- (JSON API) -- */
router.get('/products', (req, res) => {
  const { products } = require('./pages');
  const { category } = req.query;
  const data = category ? products.filter(p => p.category === category) : products;
  res.json({ success: true, count: data.length, products: data });
});

/* -- GET /api/status -- */
router.get('/status', (req, res) => {
  res.json({
    success : true,
    service : 'Aqsa Kitchen\'s API',
    version : process.env.APP_VERSION || '1.0.0',
    env     : process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
