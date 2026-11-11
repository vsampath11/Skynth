/* SKYNTH shared interactions — redesigned five-page website */
(() => {
  'use strict';

  const header = document.getElementById('siteHeader');
  const menu = document.getElementById('mobileNav');
  const toggle = document.getElementById('menuToggle');
  const close = document.getElementById('menuClose');

  const openMenu = () => {
    if (!menu) return;
    menu.classList.add('open');
    document.body.classList.add('menu-open');
    toggle?.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => {
    if (!menu) return;
    menu.classList.remove('open');
    document.body.classList.remove('menu-open');
    toggle?.setAttribute('aria-expanded', 'false');
  };

  toggle?.addEventListener('click', openMenu);
  close?.addEventListener('click', closeMenu);
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 25);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Show a clear filename placeholder when a local photo has not been added yet.
  const showMissingAsset = (container, text, className = 'media-upload-placeholder') => {
    if (!container || container.querySelector('.' + className)) return;
    const label = document.createElement('span');
    label.className = className;
    label.textContent = text;
    container.appendChild(label);
  };

  document.querySelectorAll('img[data-upload-placeholder]').forEach(img => {
    const missing = () => {
      img.classList.add('media-file-missing');
      showMissingAsset(img.parentElement, 'ADD PHOTO: ' + img.dataset.uploadPlaceholder);
    };
    img.addEventListener('error', missing, { once: true });
    if (img.complete && img.naturalWidth === 0) missing();
  });

  // Existing local fallback images are retained where explicitly requested.
  document.querySelectorAll('img[data-fallback]').forEach(img => {
    img.addEventListener('error', () => {
      const fallback = img.dataset.fallback;
      if (fallback && !img.dataset.fallbackUsed) {
        img.dataset.fallbackUsed = 'true';
        img.src = fallback;
      }
    }, { once: true });
  });

  // Home hero: automatic muted playback, looping, and no player controls.
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.loop = true;
    heroVideo.playsInline = true;
    const revealHero = () => heroVideo.classList.add('is-ready');
    heroVideo.addEventListener('loadeddata', revealHero, { once: true });
    heroVideo.addEventListener('error', () => heroVideo.classList.remove('is-ready'));
    const attempt = heroVideo.play();
    if (attempt?.catch) attempt.catch(() => {
      // If autoplay is blocked, the hero background image remains visible.
    });
  }

  // Portfolio videos: autoplay only as each matching section approaches the viewport.
  // This avoids downloading and playing five category videos at the same time.
  const portfolioVideos = [...document.querySelectorAll('video[data-auto-video]')];
  const configurePortfolioVideo = video => {
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    const frame = video.closest('.page-film-frame');
    const missingName = video.dataset.uploadPlaceholder || 'video.mp4';
    let userPaused = false;
    let programmaticPause = false;
    let failed = false;

    const ready = () => {
      video.classList.add('is-ready');
      frame?.classList.add('has-video');
      frame?.querySelector('.video-upload-placeholder')?.remove();
      failed = false;
    };
    const missing = () => {
      failed = true;
      video.classList.remove('is-ready');
      showMissingAsset(frame, 'ADD VIDEO: ' + missingName, 'media-upload-placeholder video-upload-placeholder');
    };

    video.addEventListener('loadeddata', ready);
    video.addEventListener('canplay', ready);
    video.addEventListener('error', missing);
    video.addEventListener('play', () => { userPaused = false; });
    video.addEventListener('pause', () => {
      if (programmaticPause) {
        programmaticPause = false;
      } else if (!video.ended) {
        userPaused = true;
      }
    });

    const playWhenVisible = () => {
      if (failed || userPaused) return;
      const result = video.play();
      if (result?.catch) result.catch(() => {
        // Native controls remain available if autoplay cannot start.
      });
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            video.preload = 'metadata';
            playWhenVisible();
          } else if (!video.paused) {
            programmaticPause = true;
            video.pause();
          }
        });
      }, { threshold: 0.2, rootMargin: '120px 0px' });
      observer.observe(video);
    } else {
      video.preload = 'metadata';
      playWhenVisible();
    }
  };
  portfolioVideos.forEach(configurePortfolioVideo);

  // Image lightbox.
  const lightbox = document.getElementById('imageLightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const hideLightbox = () => {
    lightbox?.classList.remove('open');
    lightbox?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  };

  document.querySelectorAll('.project-card[data-lightbox-title]').forEach(card => {
    card.addEventListener('click', event => {
      event.preventDefault();
      const img = card.querySelector('img');
      if (!img || !lightbox || !lightboxImage || !img.complete || img.naturalWidth === 0) return;
      lightboxImage.src = img.currentSrc || img.src;
      lightboxImage.alt = img.alt;
      if (lightboxCaption) lightboxCaption.textContent = card.dataset.lightboxTitle || img.alt;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
    });
  });
  lightboxClose?.addEventListener('click', hideLightbox);
  lightbox?.addEventListener('click', event => {
    if (event.target === lightbox) hideLightbox();
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') hideLightbox();
  });

  // Reveal elements when they enter the viewport.
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('visible'));
  }

  // Select the requested service when arriving from an enquiry link.
  const params = new URLSearchParams(window.location.search);
  const serviceSelect = document.getElementById('projectService');
  const requestedService = params.get('service');
  const serviceMap = {
    business: 'Business & Commercial',
    weddings: 'Weddings',
    nature: 'Nature & Travel',
    events: 'Events & Celebrations',
    other: 'Other Creative Project',
    'drone-photography': 'Drone Photography',
    'aerial-videography': 'Aerial Videography',
    'commercial-content': 'Business & Commercial',
    celebrations: 'Events & Celebrations',
    'social-media-content': 'Social Media Video Content',
    'creative-collaboration': 'Other Creative Project'
  };
  if (serviceSelect && requestedService) {
    const desired = serviceMap[requestedService] || requestedService;
    const option = [...serviceSelect.options].find(opt => opt.text.trim().toLowerCase() === desired.toLowerCase());
    if (option) serviceSelect.value = option.value || option.text;
  }

  // Project enquiry form: original Formspree destination retained.
  const form = document.getElementById('projectForm');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const status = document.getElementById('formStatus');
    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button?.textContent || 'SEND ENQUIRY';
    if (button) { button.disabled = true; button.textContent = 'SENDING…'; }
    if (status) status.textContent = 'Sending your enquiry…';
    const data = Object.fromEntries(new FormData(form).entries());
    data._subject = `New SKYNTH Project Request — ${data.service || 'Enquiry'}`;
    try {
      const response = await fetch('https://formspree.io/f/mjybnlpn', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('The online form could not send this enquiry.');
      form.reset();
      if (status) status.textContent = 'Thank you. Your enquiry has been sent successfully.';
    } catch (error) {
      if (status) status.textContent = 'The form could not be sent right now. Please contact SKYNTH directly using WhatsApp or email.';
    } finally {
      if (button) { button.disabled = false; button.textContent = originalLabel; }
    }
  });
})();