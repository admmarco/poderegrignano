/* Hero carousel + filmstrip */
(function () {
  var slides     = document.querySelectorAll('.hero-carousel__slide');
  var thumbs     = document.querySelectorAll('.filmstrip-thumb');
  var btnPrev    = document.getElementById('carousel-prev');
  var btnNext    = document.getElementById('carousel-next');
  var btnPause   = document.getElementById('carousel-pause');
  var btnFilm    = document.getElementById('carousel-film');
  var filmstrip  = document.getElementById('hero-filmstrip');
  if (!slides.length) return;

  var current  = 0;
  var paused   = false;
  var filmOpen = false;
  var thumbsLoaded = false;
  var interval = null;
  var DELAY    = 4500;

  /* Slides carry their image in data-bg; only assign it when a slide is
     about to be shown so the browser doesn't fetch all 29 up front. */
  function loadSlide(index) {
    var slide = slides[(index + slides.length) % slides.length];
    if (slide && !slide.style.backgroundImage && slide.dataset.bg) {
      slide.style.backgroundImage = "url('" + slide.dataset.bg + "')";
    }
  }

  function loadThumbs() {
    if (thumbsLoaded) return;
    thumbsLoaded = true;
    thumbs.forEach(function (t) {
      var img = t.querySelector('img[data-src]');
      if (img) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
    });
  }

  function updateThumbs() {
    thumbs.forEach(function (t, i) {
      t.classList.toggle('is-active', i === current);
    });
    /* scroll active thumb into view */
    if (filmOpen && thumbs[current]) {
      thumbs[current].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function goTo(index) {
    slides[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    loadSlide(current);
    loadSlide(current + 1);   /* warm the next one so the crossfade never shows a blank */
    slides[current].classList.add('is-active');
    updateThumbs();
  }

  function start() {
    clearInterval(interval);
    interval = setInterval(function () { goTo(current + 1); }, DELAY);
  }

  function pause() {
    paused = true;
    clearInterval(interval);
    btnPause.classList.add('is-paused');
    btnPause.setAttribute('aria-label', 'Play slideshow');
    btnPause.innerHTML = '';
  }

  function play() {
    paused = false;
    start();
    btnPause.classList.remove('is-paused');
    btnPause.setAttribute('aria-label', 'Pause slideshow');
    btnPause.innerHTML = '&#9646;&#9646;';
  }

  function toggleFilmstrip() {
    filmOpen = !filmOpen;
    filmstrip.classList.toggle('is-open', filmOpen);
    filmstrip.setAttribute('aria-hidden', filmOpen ? 'false' : 'true');
    btnFilm.setAttribute('aria-expanded', filmOpen ? 'true' : 'false');
    btnFilm.style.background = filmOpen ? 'rgba(255,255,255,0.28)' : '';
    if (filmOpen) { loadThumbs(); updateThumbs(); }
  }

  goTo(0);
  start();

  /* Don't advance (and fetch slides) while the tab is in the background */
  document.addEventListener('visibilitychange', function () {
    if (paused) return;
    if (document.hidden) clearInterval(interval); else start();
  });

  btnNext.addEventListener('click', function () { goTo(current + 1); if (!paused) start(); });
  btnPrev.addEventListener('click', function () { goTo(current - 1); if (!paused) start(); });
  btnPause.addEventListener('click', function () { paused ? play() : pause(); });
  btnFilm.addEventListener('click', toggleFilmstrip);

  thumbs.forEach(function (thumb, i) {
    thumb.addEventListener('click', function () {
      goTo(i);
      if (!paused) start();
    });
  });
})();

/* Gallery filter + lightbox */
(function () {
  var filters  = document.querySelectorAll('.gallery-filter');
  var items    = document.querySelectorAll('.photo-grid__item');
  var lightbox = document.getElementById('lightbox');
  var lbImg    = document.getElementById('lb-img');
  var lbClose  = document.getElementById('lb-close');
  var lbPrev   = document.getElementById('lb-prev');
  var lbNext   = document.getElementById('lb-next');
  if (!lightbox) return;

  var visible = [];   // items currently shown (after filter)
  var current = 0;

  var labels = document.querySelectorAll('.photo-grid__label');

  /* ---- Filter ---- */
  function applyFilter(cat) {
    visible = [];
    items.forEach(function (item) {
      var show = cat === 'all' || item.dataset.category === cat;
      item.classList.toggle('is-hidden', !show);
      if (show) visible.push(item);
    });
    /* show labels only in "all" view */
    labels.forEach(function (label) {
      label.classList.toggle('is-hidden', cat !== 'all');
    });
    filters.forEach(function (f) {
      f.classList.toggle('is-active', f.dataset.filter === cat);
      f.setAttribute('aria-selected', f.dataset.filter === cat ? 'true' : 'false');
    });
  }

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFilter(btn.dataset.filter); });
  });

  applyFilter('all');

  /* ---- Lightbox ---- */
  function openAt(index) {
    current = (index + visible.length) % visible.length;
    lbImg.src = visible[current].dataset.src;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function close() {
    lightbox.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  items.forEach(function (item) {
    item.addEventListener('click', function () {
      var idx = visible.indexOf(item);
      if (idx !== -1) openAt(idx);
    });
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', function () { openAt(current - 1); });
  lbNext.addEventListener('click', function () { openAt(current + 1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  openAt(current - 1);
    if (e.key === 'ArrowRight') openAt(current + 1);
  });
})();

/* Scroll-aware nav colour swap + scroll progress bar + scrolled flag */
(function () {
  var nav  = document.querySelector('.nav-rail');
  var hero = document.querySelector('.hero');
  var bar  = document.getElementById('scroll-progress-bar');
  var body = document.body;
  if (!nav || !hero) return;

  function update() {
    var y = window.scrollY;
    var threshold = hero.offsetTop + hero.offsetHeight - nav.offsetHeight;
    nav.classList.toggle('is-past-hero', y >= threshold);
    body.classList.toggle('is-scrolled', y > 40);

    if (bar) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct  = docH > 0 ? (y / docH) * 100 : 0;
      bar.style.width = pct + '%';
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Reveal sections on scroll */
(function () {
  var targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

  targets.forEach(function (el) { io.observe(el); });
})();

/* Web3Forms submission — sends email directly to your inbox */
(function () {
  var form    = document.getElementById('inquiry-form');
  var submit  = document.getElementById('inquiry-submit');
  var success = document.getElementById('form-success');
  var error   = document.getElementById('form-error');
  if (!form) return;

  var requiredFields = ['name', 'email', 'dates'];
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFieldError(fieldName, hasError) {
    var field = form.elements[fieldName];
    var fieldError = form.querySelector('[data-error-for="' + fieldName + '"]');
    if (!field) return;
    field.classList.toggle('is-invalid', hasError);
    field.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    if (fieldError) fieldError.hidden = !hasError;
  }

  function clearFieldErrors() {
    requiredFields.forEach(function (fieldName) {
      setFieldError(fieldName, false);
    });
  }

  function validate() {
    var invalid = false;
    clearFieldErrors();

    requiredFields.forEach(function (fieldName) {
      var field = form.elements[fieldName];
      var value = field ? field.value.trim() : '';
      if (!value) {
        setFieldError(fieldName, true);
        invalid = true;
      }
    });

    var emailValue = form.elements['email'].value.trim();
    if (emailValue && !emailPattern.test(emailValue)) {
      setFieldError('email', true);
      invalid = true;
    }

    return !invalid;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    success.hidden = true;
    error.hidden   = true;

    if (!validate()) {
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending…';

    var data = {
      access_key: 'faba03ac-9408-4cb7-a395-314090f47a27',
      subject:    'Booking inquiry — Podere Grignano',
      name:       form.elements['name'].value.trim(),
      email:      form.elements['email'].value.trim(),
      phone:      form.elements['phone'].value.trim(),
      dates:      form.elements['dates'].value.trim(),
      message:    form.elements['message'].value.trim()
    };

    fetch('https://api.web3forms.com/submit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(data)
    })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        console.log('Web3Forms response:', res);
        if (res.success) {
          form.reset();
          clearFieldErrors();
          success.hidden = false;
          submit.textContent = 'Sent ✓';
        } else {
          error.querySelector('p').textContent = 'Error: ' + (res.message || 'Unknown error');
          error.hidden = false;
          submit.disabled = false;
          submit.textContent = 'Send inquiry';
        }
      })
      .catch(function (err) {
        console.error('Form error:', err);
        error.querySelector('p').textContent = 'Network error — check your connection and try again.';
        error.hidden = false;
        submit.disabled = false;
        submit.textContent = 'Send inquiry';
      });
  });

  requiredFields.forEach(function (fieldName) {
    var field = form.elements[fieldName];
    if (!field) return;
    field.addEventListener('input', function () {
      if (fieldName === 'email') {
        var value = field.value.trim();
        var isInvalid = !value || !emailPattern.test(value);
        setFieldError('email', isInvalid);
        return;
      }
      setFieldError(fieldName, !field.value.trim());
    });
  });
})();
