
/* =====================================================
   SKYNTH — CLIENT REVIEWS
   Loads approved reviews and submits new reviews.
===================================================== */

(() => {
  'use strict';

  const API_URL =
    'https://script.google.com/macros/s/AKfycbx0061SOqrY90ukE7YpBOghN2yRwM2iLPyzHO2EvpNQaCGPyNI28a4qyUF_HkrrNj7w/exec';

  const list = document.querySelector('[data-reviews-list]');
  const reviewsStatus = document.querySelector('[data-reviews-status]');

  const form = document.getElementById('skynthReviewForm');
  const formStatus = document.querySelector('[data-review-form-status]');
  const submitButton = document.querySelector('[data-review-submit]');

  if (!document.getElementById('skynthReviews')) {
    return;
  }


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

    formStatus.classList.remove(
      'is-success',
      'is-error'
    );

    if (type) {
      formStatus.classList.add(`is-${type}`);
    }
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

    const rating = Math.max(
      1,
      Math.min(5, Number(review.rating) || 0)
    );

    stars.textContent =
      '★'.repeat(rating) +
      '☆'.repeat(5 - rating);

    stars.setAttribute(
      'aria-label',
      `${rating} out of 5 stars`
    );

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

    const clientName = document.createElement('strong');
    clientName.className = 'skynth-review-client';
    clientName.textContent = String(review.name || 'SKYNTH Client');

    const service = document.createElement('span');
    service.className = 'skynth-review-service';
    service.textContent = String(review.service || '');

    clientInfo.append(clientName, service);


    const date = document.createElement('time');
    date.className = 'skynth-review-date';

    if (review.date) {
      date.dateTime = String(review.date);

      const parsedDate = new Date(
        `${review.date}T00:00:00`
      );

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
     RENDER APPROVED REVIEWS
  ===================================================== */

  function renderReviews(reviews) {
    if (!list) return;

    list.replaceChildren();

    if (!reviews.length) {
      setReviewsStatus(
        'No client reviews have been published yet. Approved reviews will appear here.'
      );
      return;
    }

    const fragment = document.createDocumentFragment();

    reviews.forEach(review => {
      fragment.appendChild(createReviewCard(review));
    });

    list.appendChild(fragment);

    setReviewsStatus('', false);
  }


  /* =====================================================
     LOAD REVIEWS USING JSONP
  ===================================================== */

  function loadReviews() {
    if (!list || !reviewsStatus) return;

    setReviewsStatus('Loading client reviews...');

    const callbackName =
      'skynthReviews_' +
      Date.now() +
      '_' +
      Math.floor(Math.random() * 1000000);

    const script = document.createElement('script');

    let completed = false;

    function cleanup() {
      clearTimeout(timeout);

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

      if (
        !data ||
        data.error ||
        !Array.isArray(data.reviews)
      ) {
        setReviewsStatus(
          'Reviews are temporarily unavailable. Please try again later.'
        );
        return;
      }

      renderReviews(data.reviews);
    }

    window[callbackName] = finish;

    script.async = true;

    script.src =
      API_URL +
      '?action=reviews&callback=' +
      encodeURIComponent(callbackName) +
      '&_=' +
      Date.now();

    script.onerror = () => {
      if (completed) return;

      completed = true;
      cleanup();

      setReviewsStatus(
        'Unable to load reviews right now. Please refresh the page to try again.'
      );
    };

    const timeout = setTimeout(() => {
      if (completed) return;

      completed = true;
      cleanup();

      setReviewsStatus(
        'Review loading timed out. Please refresh the page to try again.'
      );
    }, 15000);

    document.head.appendChild(script);
  }


  /* =====================================================
     SUBMIT CUSTOMER REVIEW
     Sends form-encoded data to Apps Script.
  ===================================================== */

  if (form && submitButton && formStatus) {
    form.addEventListener('submit', async event => {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      // Prevent accidental multiple submissions.
      if (submitButton.disabled) {
        return;
      }

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

  loadReviews();

})();
