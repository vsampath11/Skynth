/* =========================================================
   SKYNTH — CINEMATIC INTRO + PAGE TRANSITIONS
   Uses the actual images/logo.png file.
   ========================================================= */

(() => {
    "use strict";

    const TRANSITION_DURATION = 1200;
    const INTRO_DURATION = 2400;
    const LOGO_PATH = "images/logo.png";

    const PAGES = [
        "index.html",
        "about.html",
        "portfolio.html",
        "services.html",
        "contact.html"
    ];

    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    // Avoid duplicate initialization
    if (window.__SKYNTH_TRANSITIONS_INITIALIZED__) return;
    window.__SKYNTH_TRANSITIONS_INITIALIZED__ = true;

    // Create transition overlay
    const overlay = document.createElement("div");
    overlay.id = "skynth-transition";
    overlay.innerHTML = `
        <div class="skynth-transition__content">
            <img
                class="skynth-transition__logo"
                src="${LOGO_PATH}"
                alt="SKYNTH"
            >
            <div class="skynth-transition__brand">SKYNTH</div>
            <div class="skynth-transition__tagline">
                AERIAL CINEMATOGRAPHY
            </div>
            <div class="skynth-transition__rule"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Prevent interaction while transition is active
    const activateOverlay = () => {
        overlay.classList.add("is-active");
        document.body.classList.add("skynth-transition-active");
    };

    const deactivateOverlay = () => {
        overlay.classList.remove("is-active");
        document.body.classList.remove("skynth-transition-active");
    };

    // First-entry intro — once per browser tab session
    const introShown = sessionStorage.getItem("skynthIntroShown");

    if (!introShown) {
        sessionStorage.setItem("skynthIntroShown", "true");

        activateOverlay();
        overlay.classList.add("is-intro");

        window.addEventListener("load", () => {
            setTimeout(() => {
                overlay.classList.add("is-leaving");

                setTimeout(() => {
                    deactivateOverlay();
                    overlay.classList.remove("is-intro", "is-leaving");
                }, 800);

            }, INTRO_DURATION);
        }, { once: true });

    } else {
        deactivateOverlay();
    }

    // Handle internal page navigation
    document.addEventListener("click", (event) => {
        const link = event.target.closest("a");

        if (!link) return;

        // Ignore special clicks
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            link.target === "_blank" ||
            link.hasAttribute("download")
        ) return;

        const href = link.getAttribute("href");

        if (!href) return;

        // Ignore external links, email, phone and other actions
        if (
            href.startsWith("#") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:") ||
            href.startsWith("javascript:") ||
            href.startsWith("https://") ||
            href.startsWith("http://") ||
            href.startsWith("whatsapp:")
        ) return;

        let destination;

        try {
            destination = new URL(href, window.location.href);
        } catch {
            return;
        }

        // Only animate the five SKYNTH pages
        const destinationPage = destination.pathname.split("/").pop();

        if (!PAGES.includes(destinationPage)) return;

        // Ignore same-page navigation
        if (
            destination.pathname === window.location.pathname &&
            destination.search === window.location.search
        ) return;

        event.preventDefault();

        // Close mobile navigation if it is open
        document.body.classList.remove("menu-open");

        const menu = document.querySelector(".nav-links");
        if (menu) menu.classList.remove("is-open");

        activateOverlay();
        overlay.classList.remove("is-intro");
        overlay.classList.add("is-leaving");

        // Allow enough time for the animation to be visible
        setTimeout(() => {
            window.location.href = destination.href;
        }, TRANSITION_DURATION);
    });

    // Restore page correctly when browser Back/Forward is used
    window.addEventListener("pageshow", () => {
        deactivateOverlay();
        overlay.classList.remove("is-intro", "is-leaving");
    });

})();