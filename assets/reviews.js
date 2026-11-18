
/* =====================================================
   SKYNTH — CLIENT REVIEWS
   Loads published reviews and submits new reviews.
   Includes a mouse-draggable / touch-scroll carousel.
   Existing Google Apps Script API and form workflow retained.
===================================================== */

(() => {
  'use strict';

  const API_URL =
    'https://script.google.com/macros/s/AKfycbx0061SOqrY90ukE7YpBOghN2yRwM2iLPyzHO2EvpNQaCGPyNI28a4qyUF_HkrrNj7w/exec';

  const reviewsRoot = document.getElementById('skynthReviews');
  if (!reviewsRoot) return;

  const list = reviewsRoot.querySelector('[data-reviews-list]');
  const reviewsStatus = reviewsRoot.querySelector('[data-reviews-status]');
  const previousButton = reviewsRoot.querySelector('[data-reviews-prev]');
  const nextButton = reviewsRoot.querySelector('[data-reviews-next]');
  const controls = reviewsRoot.querySelector('[data-reviews-controls]');

  const form = document.getElementById('skynthReviewForm');
  const formStatus = document.querySelector('[data-review-form-status]');
  const submitButton = document.querySelector('[data-review-submit]');

  /* =====================================================
     DISPLAY STATUS
  ===================================================== */

  function setReviewsStatus(message, show = true) {
    if (!reviewsStatus) return;
    reviewsStatus.textContent = message;
    reviewsStatus.hidden = !show;
  }

  function setFormStatus(message, type = '') {
    if (!formStatus) return;

    formStatus.textContent = message;
    formStatus.classList.remove('is-success', 'is-error');

    if (type) formStatus.classList.add(`is-${type}`);
  }

  /* =====================================================
     COUNT-UP ANIMATION
     Runs when a number first enters the viewport.
  ===================================================== */

  const reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function formatCounter(value, decimals, suffix) {
    return `${Number(value).toFixed(decimals)}${suffix}`;
  }

  function animateCounter(element) {
    const target = Number(element.dataset.counterTarget);
    const decimals = Number(element.dataset.counterDecimals || 0);
    const suffix = element.dataset.counterSuffix || '';

    if (!Number.isFinite(target)) return;

    element.dataset.counterPlayed = 'true';

    if (reduceMotion || target === 0) {
      element.textContent = formatCounter(target, decimals, suffix);
      return;
    }

    const duration = 1250;
    let startTime = null;

    const frame = timestamp => {
      if (startTime === null) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = target * eased;

      element.textContent = formatCounter(
        progress === 1 ? target : current,
        decimals,
        suffix
      );

      if (progress < 1) {
        window.requestAnimationFrame(frame);
      }
    };

    window.requestAnimationFrame(frame);
  }

  const counterObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          counterObserver.unobserve(entry.target);
          animateCounter(entry.target);
        });
      }, { threshold: 0.45 })
    : null;

  function setAnimatedCounter(element, target, options = {}) {
    if (!element) return;

    if (target === null || target === undefined || !Number.isFinite(Number(target))) {
      element.textContent = '—';
      delete element.dataset.counterTarget;
      return;
    }

    const decimals = Number.isInteger(options.decimals) ? options.decimals : 0;
    const suffix = options.suffix || '';

    element.dataset.counterTarget = String(Number(target));
    element.dataset.counterDecimals = String(decimals);
    element.dataset.counterSuffix = suffix;
    element.dataset.counterPlayed = 'false';
    element.textContent = formatCounter(0, decimals, suffix);

    if (reduceMotion || !counterObserver) {
      element.textContent = formatCounter(Number(target), decimals, suffix);
      element.dataset.counterPlayed = 'true';
      return;
    }

    counterObserver.observe(element);
  }

  // Static counters are initialized here. The Projects completed counter
  // is excluded because its final value must come from Google Calendar.
  document.querySelectorAll('[data-count-up]:not([data-projects-completed])').forEach(element => {
    setAnimatedCounter(element, Number(element.dataset.countUp), {
      decimals: Number(element.dataset.countDecimals || 0),
      suffix: element.dataset.countSuffix || ''
    });
  });

  /* =====================================================
     LOAD COMPLETED PROJECT COUNT FROM GOOGLE CALENDAR API
     The Apps Script endpoint calculates completed bookings
     using Asia/Colombo dates. JSONP is used because the
     Apps Script web app is cross-origin.
  ===================================================== */

  function loadCompletedProjects() {
    const counter = document.querySelector('[data-projects-completed]');
    if (!counter) return;

    const fallbackValue = Number(counter.dataset.countUp || 20);
    const callbackName =
      'skynthProjects_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);

    const script = document.createElement('script');
    let completed = false;
    let timeoutId = null;

    function cleanup() {
      if (timeoutId !== null) window.clearTimeout(timeoutId);

      try {
        delete window[callbackName];
      } catch (error) {
        window[callbackName] = undefined;
      }

      script.remove();
    }

    function showFallback() {
      setAnimatedCounter(counter, fallbackValue, {
        decimals: Number(counter.dataset.countDecimals || 0),
        suffix: counter.dataset.countSuffix || ''
      });
    }

    function finish(data) {
      if (completed) return;
      completed = true;
      cleanup();

      const total = Number(data && data.completedProjects);

      if (
        !data ||
        data.error ||
        !Number.isSafeInteger(total) ||
        total < 0
      ) {
        showFallback();
        return;
      }

      setAnimatedCounter(counter, total, {
        decimals: Number(counter.dataset.countDecimals || 0),
        suffix: counter.dataset.countSuffix || ''
      });
    }

    window[callbackName] = finish;
    script.async = true;
    script.src =
      API_URL +
      '?action=projects&callback=' + encodeURIComponent(callbackName) +
      '&_=' + Date.now();

    script.onerror = () => {
      if (completed) return;
      completed = true;
      cleanup();
      showFallback();
    };

    timeoutId = window.setTimeout(() => {
      if (completed) return;
      completed = true;
      cleanup();
      showFallback();
    }, 15000);

    document.head.appendChild(script);
  }

  /* =====================================================
     STAR PICKER
     Selecting star 4 highlights stars 1–4; selecting star 5
     highlights all five. Hover and keyboard focus preview too.
  ===================================================== */

  const ratingOptionsWrap = form?.querySelector('.skynth-rating-options');
  const ratingOptionLabels = ratingOptionsWrap
    ? [...ratingOptionsWrap.querySelectorAll('.skynth-rating-option')]
    : [];

  function paintRatingStars(level) {
    ratingOptionLabels.forEach((label, index) => {
      const active = index < level;
      label.classList.toggle('is-active', active);
      label.setAttribute('aria-pressed', String(active));
    });
  }

  function getSelectedRating() {
    const selected = form?.querySelector('input[name="rating"]:checked');
    return selected ? Number(selected.value) : 0;
  }

  ratingOptionsWrap?.addEventListener('pointermove', event => {
    const label = event.target.closest('.skynth-rating-option');
    if (!label) return;
    const index = ratingOptionLabels.indexOf(label);
    if (index >= 0) paintRatingStars(index + 1);
  });

  ratingOptionsWrap?.addEventListener('pointerleave', () => {
    paintRatingStars(getSelectedRating());
  });

  ratingOptionsWrap?.addEventListener('focusin', event => {
    const label = event.target.closest('.skynth-rating-option');
    if (!label) return;
    const input = label.querySelector('input[name="rating"]');
    if (input) paintRatingStars(Number(input.value));
  });

  ratingOptionsWrap?.addEventListener('focusout', event => {
    if (!ratingOptionsWrap.contains(event.relatedTarget)) {
      paintRatingStars(getSelectedRating());
    }
  });

  ratingOptionsWrap?.querySelectorAll('input[name="rating"]').forEach(input => {
    input.addEventListener('change', () => paintRatingStars(Number(input.value)));
  });

  /* =====================================================
     CUSTOMER AVATAR HELPERS
     The current API may not return a photo URL yet.
     When a safe HTTPS photo URL is supplied in a review,
     it is displayed; otherwise initials are used.
  ===================================================== */

  function getInitials(name) {
    const parts = String(name || 'SKYNTH Client')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) return 'SC';
    return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
  }

  function getAvatarUrl(review) {
    const possibleFields = [
      'photoUrl', 'photoURL', 'photo_url', 'profilePhoto', 'profile_photo',
      'avatarUrl', 'avatarURL', 'avatar_url', 'imageUrl', 'image_url',
      'profileImage', 'profile_image', 'photo', 'avatar', 'image'
    ];

    let candidate = '';
    for (const field of possibleFields) {
      if (typeof review[field] === 'string' && review[field].trim()) {
        candidate = review[field].trim();
        break;
      }
    }

    if (!candidate || candidate.length > 2000) return '';

    try {
      const url = new URL(candidate, window.location.href);
      if (url.protocol !== 'https:' && url.origin !== window.location.origin) return '';
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return url.href;
    } catch (error) {
      return '';
    }
  }

  function createClientAvatar(review, name) {
    const avatar = document.createElement('span');
    avatar.className = 'skynth-review-avatar';
    avatar.setAttribute('aria-hidden', 'true');

    const initials = getInitials(name);
    const imageUrl = getAvatarUrl(review);

    if (!imageUrl) {
      avatar.textContent = initials;
      return avatar;
    }

    avatar.classList.add('has-image');

    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';

    image.addEventListener('error', () => {
      avatar.classList.remove('has-image');
      image.remove();
      avatar.textContent = initials;
    }, { once: true });

    avatar.appendChild(image);
    return avatar;
  }

  /* =====================================================
     CREATE REVIEW CARD
     Uses textContent to prevent HTML injection.
  ===================================================== */

  function createReviewCard(review) {
    const card = document.createElement('article');
    card.className = 'skynth-review-card';

    const top = document.createElement('div');
    top.className = 'skynth-review-card-top';

    const stars = document.createElement('span');
    stars.className = 'skynth-review-stars';

    const rating = Math.max(1, Math.min(5, Number(review.rating) || 0));
    stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    stars.setAttribute('aria-label', `${rating} out of 5 stars`);

    const quoteMark = document.createElement('span');
    quoteMark.className = 'skynth-review-quote-mark';
    quoteMark.setAttribute('aria-hidden', 'true');
    quoteMark.textContent = '“';

    top.append(stars, quoteMark);

    const reviewText = document.createElement('p');
    reviewText.className = 'skynth-review-text';
    reviewText.textContent = String(review.review || '');

    const footer = document.createElement('div');
    footer.className = 'skynth-review-footer';

    const clientInfo = document.createElement('div');
    clientInfo.className = 'skynth-review-client-block';

    const clientNameValue = String(review.name || 'SKYNTH Client');
    const avatar = createClientAvatar(review, clientNameValue);

    const clientDetails = document.createElement('div');
    clientDetails.className = 'skynth-review-client-details';

    const clientName = document.createElement('strong');
    clientName.className = 'skynth-review-client';
    clientName.textContent = clientNameValue;

    const service = document.createElement('span');
    service.className = 'skynth-review-service';
    service.textContent = String(review.service || '');

    clientDetails.append(clientName, service);
    clientInfo.append(avatar, clientDetails);

    const date = document.createElement('time');
    date.className = 'skynth-review-date';

    if (review.date) {
      date.dateTime = String(review.date);
      const parsedDate = new Date(`${review.date}T00:00:00`);

      date.textContent = Number.isNaN(parsedDate.getTime())
        ? String(review.date)
        : parsedDate.toLocaleDateString('en-LK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
    }

    footer.append(clientInfo, date);
    card.append(top, reviewText, footer);
    return card;
  }

  /* =====================================================
     REVIEW SUMMARY + STAR DISTRIBUTION
     All figures are calculated from published reviews returned
     by the existing Google Apps Script endpoint.
  ===================================================== */

  const reviewSummary = reviewsRoot.querySelector('[data-review-summary]');
  let reviewSummaryIsVisible = false;

  if (reviewSummary && 'IntersectionObserver' in window) {
    const summaryObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reviewSummaryIsVisible = true;
        if (reviewSummary.dataset.ready === 'true') {
          reviewSummary.classList.add('is-animated');
        }
        summaryObserver.unobserve(reviewSummary);
      });
    }, { threshold: 0.2 });

    summaryObserver.observe(reviewSummary);
  } else if (reviewSummary) {
    reviewSummaryIsVisible = true;
  }

  function updateReviewSummary(reviews) {
    const publishedCount = reviews.length;
    const ratings = reviews
      .map(review => Number(review.rating))
      .filter(value => Number.isFinite(value) && value >= 1 && value <= 5);

    const average = ratings.length
      ? ratings.reduce((total, value) => total + value, 0) / ratings.length
      : null;

    document.querySelectorAll('[data-review-count]').forEach(element => {
      setAnimatedCounter(element, publishedCount);
    });

    document.querySelectorAll('[data-review-average]').forEach(element => {
      setAnimatedCounter(element, average, { decimals: 1 });
    });

    document.querySelectorAll('[data-review-rating-caption]').forEach(element => {
      element.textContent = ratings.length
        ? `Based on ${ratings.length} published ${ratings.length === 1 ? 'review' : 'reviews'}`
        : 'No published ratings yet';
    });

    const summaryCount = reviewsRoot.querySelector('[data-review-count-summary]');
    setAnimatedCounter(summaryCount, publishedCount);

    for (let stars = 5; stars >= 1; stars -= 1) {
      const row = reviewsRoot.querySelector(`[data-rating-row="${stars}"]`);
      if (!row) continue;

      const starCount = ratings.filter(rating => rating === stars).length;
      const percentage = ratings.length
        ? Math.round((starCount / ratings.length) * 100)
        : 0;

      const bar = row.querySelector('[data-rating-bar]');
      if (bar) bar.style.setProperty('--rating-fill', `${percentage}%`);

      setAnimatedCounter(row.querySelector('[data-rating-percent]'), percentage, {
        suffix: '%'
      });
      setAnimatedCounter(row.querySelector('[data-rating-total]'), starCount);
    }

    if (reviewSummary) {
      reviewSummary.dataset.ready = 'true';
      reviewSummary.classList.toggle('is-empty', ratings.length === 0);
      if (reviewSummaryIsVisible) reviewSummary.classList.add('is-animated');
    }
  }

  /* =====================================================
     CAROUSEL CONTROLS
     Native horizontal scrolling supports touch and trackpads.
     Mouse users can also grab and drag the review cards.
  ===================================================== */

  function getCarouselStep() {
    if (!list) return 340;

    const card = list.querySelector('.skynth-review-card');
    if (!card) return Math.max(280, list.clientWidth * 0.85);

    const cardWidth = card.getBoundingClientRect().width;
    const styles = window.getComputedStyle(list);
    const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return cardWidth + gap;
  }

  function updateCarouselControls() {
    if (!list) return;

    const maxScroll = Math.max(0, list.scrollWidth - list.clientWidth);
    const hasOverflow = maxScroll > 3;

    if (controls) controls.classList.toggle('is-static', !hasOverflow);

    if (previousButton) {
      previousButton.disabled = !hasOverflow || list.scrollLeft <= 3;
      previousButton.setAttribute('aria-disabled', String(previousButton.disabled));
    }

    if (nextButton) {
      nextButton.disabled = !hasOverflow || list.scrollLeft >= maxScroll - 3;
      nextButton.setAttribute('aria-disabled', String(nextButton.disabled));
    }
  }

  previousButton?.addEventListener('click', () => {
    list?.scrollBy({ left: -getCarouselStep(), behavior: 'smooth' });
  });

  nextButton?.addEventListener('click', () => {
    list?.scrollBy({ left: getCarouselStep(), behavior: 'smooth' });
  });

  if (list) {
    list.addEventListener('scroll', updateCarouselControls, { passive: true });

    list.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        list.scrollBy({ left: -getCarouselStep(), behavior: 'smooth' });
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        list.scrollBy({ left: getCarouselStep(), behavior: 'smooth' });
      }
    });

    let drag = null;

    list.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      if (event.target.closest('button, a, input, textarea, select')) return;

      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: list.scrollLeft,
        moved: false
      };
      list.classList.add('is-grabbable');
      list.setPointerCapture?.(event.pointerId);
    });

    list.addEventListener('pointermove', event => {
      if (!drag || drag.pointerId !== event.pointerId) return;

      const distance = event.clientX - drag.startX;
      if (Math.abs(distance) > 4) drag.moved = true;
      if (drag.moved) {
        event.preventDefault();
        list.classList.add('is-dragging');
        list.scrollLeft = drag.startScrollLeft - distance;
      }
    });

    const finishDrag = event => {
      if (!drag || (event && drag.pointerId !== event.pointerId)) return;
      drag = null;
      list.classList.remove('is-dragging', 'is-grabbable');
      updateCarouselControls();
    };

    list.addEventListener('pointerup', finishDrag);
    list.addEventListener('pointercancel', finishDrag);
    list.addEventListener('lostpointercapture', finishDrag);
  }

  if ('ResizeObserver' in window && list) {
    const resizeObserver = new ResizeObserver(updateCarouselControls);
    resizeObserver.observe(list);
  } else {
    window.addEventListener('resize', updateCarouselControls, { passive: true });
  }

  /* =====================================================
     RENDER PUBLISHED REVIEWS
     The existing Apps Script endpoint is expected to return
     published/approved reviews only, as before.
  ===================================================== */

  function renderReviews(reviews) {
    if (!list) return;

    list.replaceChildren();
    updateReviewSummary(reviews);

    if (!reviews.length) {
      setReviewsStatus(
        'No client reviews have been published yet. Approved reviews will appear here.'
      );
      updateCarouselControls();
      return;
    }

    const fragment = document.createDocumentFragment();
    reviews.forEach(review => fragment.appendChild(createReviewCard(review)));
    list.appendChild(fragment);

    setReviewsStatus('', false);
    updateCarouselControls();
  }

  /* =====================================================
     LOAD REVIEWS USING JSONP
  ===================================================== */

  function loadReviews() {
    if (!list || !reviewsStatus) return;

    setReviewsStatus('Loading client reviews...');

    const callbackName =
      'skynthReviews_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);

    const script = document.createElement('script');
    let completed = false;
    let timeoutId = null;

    function cleanup() {
      if (timeoutId !== null) window.clearTimeout(timeoutId);

      try {
        delete window[callbackName];
      } catch (error) {
        window[callbackName] = undefined;
      }

      script.remove();
    }

    function finish(data) {
      if (completed) return;
      completed = true;
      cleanup();

      if (!data || data.error || !Array.isArray(data.reviews)) {
        updateReviewSummary([]);
        setReviewsStatus('Reviews are temporarily unavailable. Please try again later.');
        return;
      }

      renderReviews(data.reviews);
    }

    window[callbackName] = finish;
    script.async = true;
    script.src =
      API_URL +
      '?action=reviews&callback=' + encodeURIComponent(callbackName) +
      '&_=' + Date.now();

    script.onerror = () => {
      if (completed) return;
      completed = true;
      cleanup();
      updateReviewSummary([]);
      setReviewsStatus(
        'Unable to load reviews right now. Please refresh the page to try again.'
      );
    };

    timeoutId = window.setTimeout(() => {
      if (completed) return;
      completed = true;
      cleanup();
      updateReviewSummary([]);
      setReviewsStatus(
        'Review loading timed out. Please refresh the page to try again.'
      );
    }, 15000);

    document.head.appendChild(script);
  }

  /* =====================================================
     SUBMIT CUSTOMER REVIEW
     Existing form-encoded Apps Script submission retained.
  ===================================================== */

  if (form && submitButton && formStatus) {
    form.addEventListener('submit', async event => {
      event.preventDefault();

      if (!form.reportValidity()) return;
      if (submitButton.disabled) return;

      submitButton.disabled = true;
      submitButton.textContent = 'SENDING...';

      setFormStatus(
        'Sending your review. Please do not close this page...',
        ''
      );

      const payload = new URLSearchParams();
      new FormData(form).forEach((value, key) => {
        payload.append(key, String(value));
      });

      try {
        await fetch(API_URL, {
          method: 'POST',
          mode: 'no-cors',
          credentials: 'omit',
          cache: 'no-store',
          body: payload
        });

        form.reset();
        setFormStatus(
          'Your review request has been sent. It will appear on the website only after SKYNTH approves it.',
          'success'
        );
      } catch (error) {
        setFormStatus(
          'Unable to send your review. Please check your internet connection and try again.',
          'error'
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'SUBMIT REVIEW ↗';
      }
    });
  }

  /* =====================================================
     START
  ===================================================== */

  paintRatingStars(getSelectedRating());
  updateCarouselControls();
  loadCompletedProjects();
  loadReviews();
})();
