/* ── NAV SCROLL ── */
const nav = document.getElementById('mainNav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

/* ── HAMBURGER ── */
const ham = document.getElementById('hamburger');
const mob = document.getElementById('mobileMenu');
if (ham && mob) {
  ham.addEventListener('click', () => mob.classList.toggle('open'));
}
function closeMobile() { if (mob) mob.classList.remove('open'); }

/* ── REVEAL ON SCROLL ── */
const revealEls = document.querySelectorAll('.reveal, .reveal-l, .reveal-r');
if (revealEls.length) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  revealEls.forEach(el => obs.observe(el));
}

/* ── COUNTER ANIMATION ── */
const counters = document.querySelectorAll('.num[data-target]');
if (counters.length) {
  const cObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '+';
      let current  = 0;
      const step   = Math.max(1, Math.ceil(target / 60));
      const timer  = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current + suffix;
      }, 22);
      cObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => cObs.observe(c));
}

/* ── PRODUCT FILTER (products page) ── */
const filterBtns = document.querySelectorAll('.filter-btn');
const productCards = document.querySelectorAll('.product-card[data-category]');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.filter;
    productCards.forEach(card => {
      const show = cat === 'all' || card.dataset.category === cat;
      card.style.opacity    = show ? '1' : '0';
      card.style.transform  = show ? '' : 'scale(.95)';
      card.style.display    = show ? '' : 'none';
      setTimeout(() => { if (show) card.style.opacity = '1'; }, 10);
    });
  });
});

/* ── ENQUIRY FORM ── */
const enquiryForm = document.getElementById('enquiryForm');
if (enquiryForm) {
  enquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = enquiryForm.querySelector('.submit-btn');
    const msg = document.getElementById('formMsg');
    btn.textContent = 'Sending...';
    btn.disabled    = true;

    const data = {
      name     : enquiryForm.querySelector('[name=name]').value,
      phone    : enquiryForm.querySelector('[name=phone]').value,
      email    : enquiryForm.querySelector('[name=email]').value,
      product  : enquiryForm.querySelector('[name=product]').value,
      city     : enquiryForm.querySelector('[name=city]').value,
      quantity : enquiryForm.querySelector('[name=quantity]').value,
      message  : enquiryForm.querySelector('[name=message]').value
    };

    try {
      const res  = await fetch('/api/enquiry', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify(data)
      });
      const json = await res.json();

      if (json.success) {
        msg.className  = 'form-msg success';
        msg.textContent = '✅ Thank you! We will contact you within 24 hours. Enquiry ID: #' + json.enquiryId;
        msg.style.display = 'block';
        enquiryForm.reset();
      } else {
        throw new Error(json.error);
      }
    } catch (err) {
      msg.className  = 'form-msg error';
      msg.textContent = '❌ ' + (err.message || 'Something went wrong. Please call us directly.');
      msg.style.display = 'block';
    } finally {
      btn.textContent = 'Send Enquiry →';
      btn.disabled    = false;
    }
  });
}

/* ── SCROLL TO CONTACT + AUTO-SELECT PRODUCT ── */
function enquireProduct(productName) {
  const contactSection = document.getElementById('contact');
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const sel = document.querySelector('[name=product]');
      if (sel) sel.value = productName;
    }, 700);
  } else {
    window.location.href = '/contact?product=' + encodeURIComponent(productName);
  }
}

/* ── AUTO-FILL PRODUCT FROM URL PARAM ── */
const urlParams = new URLSearchParams(window.location.search);
const preProduct = urlParams.get('product');
if (preProduct) {
  setTimeout(() => {
    const sel = document.querySelector('[name=product]');
    if (sel) sel.value = preProduct;
  }, 300);
}
