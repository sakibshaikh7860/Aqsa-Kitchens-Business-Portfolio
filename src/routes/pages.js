const express = require('express');
const router  = express.Router();

/* -- Products Data -- */
const products = [
  {
    id         : 1,
    name       : 'Classic 3-Shelf Kitchen Trolley',
    category   : 'trolley',
    tag        : 'BESTSELLER',
    emoji      : '🍽️',
    desc       : 'Stainless steel frame with 3 open shelves. Perfect for everyday kitchen storage and easy mobility.',
    features   : ['SS 304 Grade', 'Heavy Duty Wheels', 'Rust-Proof'],
    material   : 'Stainless Steel 304',
    size       : 'Custom Available'
  },
  {
    id         : 2,
    name       : "Chef's Modular Trolley",
    category   : 'trolley',
    tag        : 'PREMIUM',
    emoji      : '🔪',
    desc       : 'Designed for professional kitchens with knife holders, spice rack and deep shelf capacity.',
    features   : ['Modular Design', 'Knife Block', 'Locking Wheels'],
    material   : 'Stainless Steel 304',
    size       : 'Custom Available'
  },
  {
    id         : 3,
    name       : 'Compact Corner Trolley',
    category   : 'trolley',
    tag        : 'COMPACT',
    emoji      : '🥘',
    desc       : 'Space-saving L-shaped design ideal for small kitchens. Fits perfectly in corners.',
    features   : ['Corner-Fit', 'Space Saver', '2-Shelf'],
    material   : 'Stainless Steel',
    size       : 'Custom Available'
  },
  {
    id         : 4,
    name       : 'Custom Restaurant Rack',
    category   : 'trolley',
    tag        : 'CUSTOM',
    emoji      : '🍲',
    desc       : 'Built-to-order for restaurants and dhabas. Choose height, width, shelf count, and wheel type.',
    features   : ['Made-to-Order', 'Commercial Grade', 'Bulk Discount'],
    material   : 'Heavy Gauge SS',
    size       : 'Fully Custom'
  },
  {
    id         : 5,
    name       : 'Modular Kitchen Cabinet',
    category   : 'furniture',
    tag        : 'NEW',
    emoji      : '🪵',
    desc       : 'Premium modular kitchen cabinets with soft-close hinges and scratch-resistant finish.',
    features   : ['Soft-Close', 'Scratch-Resistant', 'Modular'],
    material   : 'Marine Plywood + SS',
    size       : 'Custom Available'
  },
  {
    id         : 6,
    name       : 'Kitchen Island Table',
    category   : 'furniture',
    tag        : 'POPULAR',
    emoji      : '🏝️',
    desc       : 'Freestanding kitchen island with SS top and wooden base. Perfect for open kitchens.',
    features   : ['SS Top', 'Storage Below', 'Elegant Design'],
    material   : 'SS + Hardwood',
    size       : 'Standard & Custom'
  },
  {
    id         : 7,
    name       : 'Wall-Mount Spice Rack',
    category   : 'furniture',
    tag        : null,
    emoji      : '🌶️',
    desc       : 'Space-efficient wall-mounted spice organizer. Keeps your countertop clutter-free.',
    features   : ['Wall-Mount', 'Easy Install', 'SS Frame'],
    material   : 'Stainless Steel',
    size       : 'Standard'
  },
  {
    id         : 8,
    name       : 'Tea & Snack Trolley',
    category   : 'trolley',
    tag        : null,
    emoji      : '☕',
    desc       : 'Elegant serving trolley for drawing rooms and offices. Powder-coated with silent wheels.',
    features   : ['Elegant Design', 'Powder Coated', 'Silent Wheels'],
    material   : 'MS + Powder Coat',
    size       : 'Standard'
  }
];

const testimonials = [
  { name: 'Raju Patil',   role: 'Restaurant Owner, Pune',   stars: 5, text: 'Got a custom 4-shelf trolley for my restaurant kitchen. The quality is outstanding and was delivered within a week. Highly recommend!', avatar: '👨‍🍳' },
  { name: 'Saira Khan',   role: 'Homemaker, Mumbai',        stars: 5, text: 'Ordered a compact corner trolley for my small apartment kitchen. Fits perfectly and the SS finish is exactly as shown.', avatar: '👩' },
  { name: 'Arjun Mehta',  role: 'Cloud Kitchen Owner, Nashik', stars: 5, text: 'We ordered 10 trolleys for our cloud kitchen. Every single one is perfect. Custom size, perfect weld quality, and great pricing for bulk.', avatar: '👨‍💼' }
];

/* -- HOME -- */
router.get('/', (req, res) => {
  res.render('index', {
    title        : "Aqsa Kitchen's — Premium Kitchen Trolleys & Furniture",
    products,
    testimonials,
    currentPage  : 'home'
  });
});

/* -- PRODUCTS PAGE -- */
router.get('/products', (req, res) => {
  const { category } = req.query;
  const filtered = category
    ? products.filter(p => p.category === category)
    : products;
  res.render('products', {
    title       : "Products — Aqsa Kitchen's",
    products    : filtered,
    category    : category || 'all',
    currentPage : 'products'
  });
});

/* -- ABOUT PAGE -- */
router.get('/about', (req, res) => {
  res.render('about', {
    title       : "About Us — Aqsa Kitchen's",
    currentPage : 'about'
  });
});

/* -- CONTACT PAGE -- */
router.get('/contact', (req, res) => {
  res.render('contact', {
    title       : "Contact Us — Aqsa Kitchen's",
    currentPage : 'contact'
  });
});

module.exports = router;
module.exports.products = products;
