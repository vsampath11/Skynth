/* =========================================================
   SKYNTH — GOOGLE CALENDAR BOOKING CALENDAR
   Timezone: Asia/Colombo

   The public website receives date statuses only:
   booked / holiday

   Private event titles, descriptions, guests and other
   calendar information are not displayed on the website.
   ========================================================= */

(() => {
    'use strict';

    /* Google Apps Script Web App URL */
    const CALENDAR_API_URL =
        'https://script.google.com/macros/s/AKfycbx0061SOqrY90ukE7YpBOghN2yRwM2iLPyzHO2EvpNQaCGPyNI28a4qyUF_HkrrNj7w/exec';

    const TIME_ZONE = 'Asia/Colombo';
    const REQUEST_TIMEOUT_MS = 15000;

    const root = document.getElementById('bookingCalendar');
    const dateInput = document.getElementById('projectDate');

    if (!root || !dateInput) return;

    const title = root.querySelector('[data-calendar-title]');
    const grid = root.querySelector('[data-calendar-grid]');
    const message = root.querySelector('[data-calendar-message]');
    const previousButton = root.querySelector('[data-calendar-prev]');
    const nextButton = root.querySelector('[data-calendar-next]');
    const retryButton = root.querySelector('[data-calendar-retry]');

    if (
        !title ||
        !grid ||
        !message ||
        !previousButton ||
        !nextButton ||
        !retryButton
    ) {
        return;
    }

    /* Date display settings */
    const monthFormatter = new Intl.DateTimeFormat('en', {
        timeZone: TIME_ZONE,
        month: 'long',
        year: 'numeric'
    });

    const dateFormatter = new Intl.DateTimeFormat('en', {
        timeZone: TIME_ZONE,
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    /* Get today's date in Sri Lanka */
    function colomboTodayKey() {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: TIME_ZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(new Date());

        const values = {};

        parts.forEach(part => {
            if (part.type !== 'literal') {
                values[part.type] = part.value;
            }
        });

        return `${values.year}-${values.month}-${values.day}`;
    }

    /* Build YYYY-MM-DD date key */
    function keyFromParts(year, monthIndex, day) {
        return (
            `${year}-` +
            `${String(monthIndex + 1).padStart(2, '0')}-` +
            `${String(day).padStart(2, '0')}`
        );
    }

    /* Parse YYYY-MM */
    function parseMonthKey(key) {
        const [year, month] = key.split('-').map(Number);

        return {
            year,
            monthIndex: month - 1
        };
    }

    /* Build YYYY-MM */
    function monthKey(year, monthIndex) {
        const normalized = new Date(
            Date.UTC(year, monthIndex, 1)
        );

        return (
            `${normalized.getUTCFullYear()}-` +
            `${String(normalized.getUTCMonth() + 1).padStart(2, '0')}`
        );
    }

    /* Move between months */
    function shiftMonth(year, monthIndex, amount) {
        const date = new Date(
            Date.UTC(year, monthIndex + amount, 1)
        );

        return {
            year: date.getUTCFullYear(),
            monthIndex: date.getUTCMonth()
        };
    }

    /* Display month name */
    function formatMonth(year, monthIndex) {
        return monthFormatter.format(
            new Date(Date.UTC(year, monthIndex, 15, 12))
        );
    }

    /* Display full date */
    function formatDateKey(key) {
        const [year, month, day] = key.split('-').map(Number);

        return dateFormatter.format(
            new Date(Date.UTC(year, month - 1, day, 12))
        );
    }

    /* Initial calendar state */
    const todayKey = colomboTodayKey();

    const todayParts = parseMonthKey(
        todayKey.slice(0, 7)
    );

    let view = {
        year: todayParts.year,
        monthIndex: todayParts.monthIndex
    };

    let currentStatuses = {};
    let monthLoaded = false;

    let selectedKey = dateInput.value || '';

    let requestVersion = 0;
    let activeScript = null;
    let activeCallbackName = null;
    let activeTimeout = null;

    /* Status message */
    function setMessage(text, isError = false) {
        message.textContent = text;
        message.classList.toggle('is-error', isError);
    }

    /* Clean up JSONP request */
    function cleanupRequest() {
        if (activeTimeout) {
            window.clearTimeout(activeTimeout);
            activeTimeout = null;
        }

        if (activeScript) {
            activeScript.remove();
            activeScript = null;
        }

        if (activeCallbackName) {
            try {
                delete window[activeCallbackName];
            } catch (_) {
                window[activeCallbackName] = undefined;
            }

            activeCallbackName = null;
        }
    }

    /* Load selected month from Google Calendar */
    function loadMonth() {
        const version = ++requestVersion;

        cleanupRequest();

        currentStatuses = {};
        monthLoaded = false;

        retryButton.hidden = true;

        title.textContent = formatMonth(
            view.year,
            view.monthIndex
        );

        setMessage('Checking availability…');

        /* While loading, future dates remain disabled */
        renderCalendar();

        const requestedMonth = monthKey(
            view.year,
            view.monthIndex
        );

        const callbackName =
            `skynthCalendarCallback_${Date.now()}_${version}`;

        const script = document.createElement('script');

        activeCallbackName = callbackName;
        activeScript = script;

        /* JSONP callback */
        window[callbackName] = payload => {
            if (version !== requestVersion) return;

            cleanupRequest();

            if (
                !payload ||
                payload.month !== requestedMonth ||
                !payload.statuses ||
                typeof payload.statuses !== 'object'
            ) {
                showLoadError();
                return;
            }

            /* Accept only safe date/status values */
            const safeStatuses = {};

            Object.entries(payload.statuses).forEach(
                ([date, status]) => {

                    if (
                        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
                        (
                            status === 'booked' ||
                            status === 'holiday'
                        )
                    ) {
                        safeStatuses[date] = status;
                    }
                }
            );

            currentStatuses = safeStatuses;
            monthLoaded = true;

            renderCalendar();

            /* Clear a previously selected date if it is now blocked */
            const selectedStatus = selectedKey
                ? currentStatuses[selectedKey]
                : '';

            if (
                selectedKey &&
                (
                    selectedStatus === 'booked' ||
                    selectedStatus === 'holiday'
                )
            ) {
                selectedKey = '';
                dateInput.value = '';

                setMessage(
                    'That date is no longer available. Please choose another green date.'
                );

            } else if (
                selectedKey &&
                selectedKey < todayKey
            ) {
                selectedKey = '';
                dateInput.value = '';

                setMessage(
                    'Please select a future available date.'
                );

            } else if (selectedKey) {

                setMessage(
                    `Selected date: ${formatDateKey(selectedKey)}.`
                );

            } else {

                setMessage(
                    'Green dates are available. Red dates are booked; grey dates are holidays or past dates.'
                );
            }

            renderCalendar();
        };

        /* If the script cannot load */
        script.onerror = () => {
            if (version !== requestVersion) return;

            cleanupRequest();
            showLoadError();
        };

        /* Request timeout */
        activeTimeout = window.setTimeout(() => {
            if (version !== requestVersion) return;

            cleanupRequest();
            showLoadError();

        }, REQUEST_TIMEOUT_MS);

        const separator = CALENDAR_API_URL.includes('?')
            ? '&'
            : '?';

        script.src =
            `${CALENDAR_API_URL}${separator}` +
            `month=${encodeURIComponent(requestedMonth)}` +
            `&callback=${encodeURIComponent(callbackName)}`;

        script.async = true;

        document.head.appendChild(script);

        previousButton.disabled =
            requestedMonth <= todayKey.slice(0, 7);
    }

    /* Handle loading errors */
    function showLoadError() {
        currentStatuses = {};
        monthLoaded = false;

        renderCalendar();

        setMessage(
            'Availability could not be loaded. Please check your connection and try again.',
            true
        );

        retryButton.hidden = false;
    }

    /* Render calendar dates */
    function renderCalendar() {
        const firstDay = new Date(
            Date.UTC(view.year, view.monthIndex, 1)
        ).getUTCDay();

        const daysInMonth = new Date(
            Date.UTC(view.year, view.monthIndex + 1, 0)
        ).getUTCDate();

        const fragment = document.createDocumentFragment();

        /* Empty spaces before the first day */
        for (let i = 0; i < firstDay; i += 1) {
            const empty = document.createElement('span');

            empty.className = 'booking-calendar-empty';
            empty.setAttribute('aria-hidden', 'true');

            fragment.appendChild(empty);
        }

        /* Create day buttons */
        for (let day = 1; day <= daysInMonth; day += 1) {

            const key = keyFromParts(
                view.year,
                view.monthIndex,
                day
            );

            const status = currentStatuses[key] || 'available';
            const isPast = key < todayKey;

            const button = document.createElement('button');

            button.type = 'button';
            button.className = 'booking-calendar-day';
            button.textContent = String(day);
            button.dataset.date = key;

            /* Past dates */
            if (isPast) {

                button.classList.add(
                    'booking-calendar-day--past'
                );

                button.disabled = true;

                button.setAttribute(
                    'aria-label',
                    `${formatDateKey(key)} — past date`
                );

            /* Wait for Google Calendar response */
            } else if (!monthLoaded) {

                button.classList.add(
                    'booking-calendar-day--loading'
                );

                button.disabled = true;

                button.setAttribute(
                    'aria-label',
                    `${formatDateKey(key)} — availability not loaded`
                );

            /* Booked dates */
            } else if (status === 'booked') {

                button.classList.add(
                    'booking-calendar-day--booked'
                );

                button.disabled = true;

                button.setAttribute(
                    'aria-label',
                    `${formatDateKey(key)} — booked`
                );

            /* Holidays */
            } else if (status === 'holiday') {

                button.classList.add(
                    'booking-calendar-day--holiday'
                );

                button.disabled = true;

                button.setAttribute(
                    'aria-label',
                    `${formatDateKey(key)} — holiday`
                );

            /* Available dates */
            } else {

                button.classList.add(
                    'booking-calendar-day--available'
                );

                button.disabled = false;

                button.setAttribute(
                    'aria-label',
                    `${formatDateKey(key)} — available`
                );

                button.addEventListener('click', () => {
                    selectDate(key);
                });
            }

            /* Selected date highlight */
            if (key === selectedKey) {

                button.classList.add(
                    'booking-calendar-day--selected'
                );

                button.setAttribute('aria-pressed', 'true');

            } else {

                button.setAttribute('aria-pressed', 'false');
            }

            fragment.appendChild(button);
        }

        grid.replaceChildren(fragment);

        const currentMonth = monthKey(
            todayParts.year,
            todayParts.monthIndex
        );

        const displayedMonth = monthKey(
            view.year,
            view.monthIndex
        );

        previousButton.disabled =
            displayedMonth <= currentMonth;
    }

    /* Select an available date */
    function selectDate(key) {

        if (
            !monthLoaded ||
            key < todayKey ||
            currentStatuses[key] === 'booked' ||
            currentStatuses[key] === 'holiday'
        ) {
            return;
        }

        selectedKey = key;

        /* Fill the existing enquiry form date field */
        dateInput.value = key;

        dateInput.dispatchEvent(
            new Event('input', { bubbles: true })
        );

        dateInput.dispatchEvent(
            new Event('change', { bubbles: true })
        );

        setMessage(
            `Selected date: ${formatDateKey(key)}. It has been added to your enquiry form.`
        );

        renderCalendar();

        dateInput.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    /* Previous month */
    previousButton.addEventListener('click', () => {

        const previous = shiftMonth(
            view.year,
            view.monthIndex,
            -1
        );

        const minMonth = monthKey(
            todayParts.year,
            todayParts.monthIndex
        );

        if (
            monthKey(previous.year, previous.monthIndex) <
            minMonth
        ) {
            return;
        }

        view = previous;

        loadMonth();
    });

    /* Next month */
    nextButton.addEventListener('click', () => {

        view = shiftMonth(
            view.year,
            view.monthIndex,
            1
        );

        loadMonth();
    });

    /* Retry button */
    retryButton.addEventListener('click', () => {
        loadMonth();
    });

    /* Start calendar */
    loadMonth();

})();
