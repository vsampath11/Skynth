/* =========================================================
   SKYNTH — PROFESSIONAL WEBSITE JAVASCRIPT
========================================================= */


/* =========================================================
   CONFIGURATION
   CHANGE THESE TO YOUR REAL DETAILS
========================================================= */

const SKYNTH_CONFIG = {

    whatsapp:
        "94751581782",

    email:
        "skynth83@gmail.com"

};


/* =========================================================
   NAVIGATION
========================================================= */

const navbar =
    document.getElementById("navbar");

const menuToggle =
    document.getElementById("menuToggle");

const mobileMenu =
    document.getElementById("mobileMenu");

const mobileClose =
    document.getElementById("mobileClose");


function updateNavbarState() {

    if (window.scrollY > 40) {

        navbar.classList.add("scrolled");

    } else {

        navbar.classList.remove("scrolled");

    }

}

window.addEventListener("scroll", updateNavbarState, { passive: true });

/* Run once immediately in case the page loads already scrolled
   (e.g. a shared link to #services) */
updateNavbarState();


function openMobileMenu() {

    mobileMenu.classList.add("active");

    document.body.classList.add("menu-open");

    if (menuToggle) {

        menuToggle.classList.add("active");

        menuToggle.setAttribute("aria-expanded", "true");

    }

}


function closeMobileMenu() {

    mobileMenu.classList.remove("active");

    document.body.classList.remove("menu-open");

    if (menuToggle) {

        menuToggle.classList.remove("active");

        menuToggle.setAttribute("aria-expanded", "false");

    }

}


if (menuToggle) {

    menuToggle.addEventListener(
        "click",
        openMobileMenu
    );

}


if (mobileClose) {

    mobileClose.addEventListener(
        "click",
        closeMobileMenu
    );

}


document
    .querySelectorAll(".mobile-menu a")
    .forEach(function (link) {

        link.addEventListener(
            "click",
            closeMobileMenu
        );

    });


/* =========================================================
   GALLERY
========================================================= */

const galleryCards =
    document.querySelectorAll(".card");

const lightbox =
    document.getElementById("lightbox");

const lightboxImage =
    document.getElementById("lightboxImage");

const closeButton =
    document.getElementById("closeLightbox");

const prevButton =
    document.getElementById("prevButton");

const nextButton =
    document.getElementById("nextButton");

const lightboxCounter =
    document.getElementById("lightboxCounter");

const lightboxTitle =
    document.getElementById("lightboxTitle");


let galleryItems = [];

let currentIndex = 0;


/* Build gallery array */

function updateGalleryItems() {

    galleryItems =
        Array.from(
            document.querySelectorAll(
                ".card:not(.hidden)"
            )
        );

}


/* Initial gallery */

updateGalleryItems();


/* =========================================================
   OPEN IMAGE
========================================================= */

galleryCards.forEach(function (card) {

    card.addEventListener(
        "click",
        function () {

            updateGalleryItems();

            currentIndex =
                galleryItems.indexOf(card);

            if (currentIndex < 0) {

                currentIndex = 0;

            }

            showImage();

            lightbox.classList.add("active");

            lightbox.setAttribute(
                "aria-hidden",
                "false"
            );

            document.body.classList.add(
                "lightbox-open"
            );

        }
    );

});


/* =========================================================
   SHOW IMAGE
========================================================= */

function showImage() {

    if (
        !galleryItems.length ||
        !lightboxImage
    ) {

        return;

    }


    const currentCard =
        galleryItems[currentIndex];


    const imagePath =
        currentCard.getAttribute(
            "data-image"
        );


    const title =
        currentCard.getAttribute(
            "data-title"
        ) || "SKYNTH";


    lightboxImage.style.display = "";


    lightboxImage.src =
        imagePath;


    lightboxImage.alt =
        title;


    if (lightboxTitle) {

        lightboxTitle.textContent =
            title;

    }


    if (lightboxCounter) {

        const number =
            String(
                currentIndex + 1
            ).padStart(2, "0");


        const total =
            String(
                galleryItems.length
            ).padStart(2, "0");


        lightboxCounter.textContent =
            `${number} / ${total}`;

    }

}


/* =========================================================
   CLOSE LIGHTBOX
========================================================= */

function closeLightbox() {

    if (!lightbox) {
        return;
    }

    lightbox.classList.remove(
        "active"
    );

    lightbox.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "lightbox-open"
    );

}


if (closeButton) {

    closeButton.addEventListener(
        "click",
        closeLightbox
    );

}


/* =========================================================
   NEXT IMAGE
========================================================= */

function nextImage() {

    if (!galleryItems.length) {
        return;
    }

    currentIndex++;

    if (
        currentIndex >=
        galleryItems.length
    ) {

        currentIndex = 0;

    }

    showImage();

}


if (nextButton) {

    nextButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            nextImage();

        }
    );

}


/* =========================================================
   PREVIOUS IMAGE
========================================================= */

function previousImage() {

    if (!galleryItems.length) {
        return;
    }

    currentIndex--;

    if (currentIndex < 0) {

        currentIndex =
            galleryItems.length - 1;

    }

    showImage();

}


if (prevButton) {

    prevButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            previousImage();

        }
    );

}


/* =========================================================
   CLOSE BY BACKGROUND
========================================================= */

if (lightbox) {

    lightbox.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                lightbox
            ) {

                closeLightbox();

            }

        }
    );

}


/* =========================================================
   KEYBOARD CONTROLS
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            !lightbox.classList.contains(
                "active"
            )
        ) {

            return;

        }


        if (
            event.key === "Escape"
        ) {

            closeLightbox();

        }


        if (
            event.key === "ArrowRight"
        ) {

            nextImage();

        }


        if (
            event.key === "ArrowLeft"
        ) {

            previousImage();

        }

    }
);


/* =========================================================
   GALLERY FILTER
========================================================= */

const filterButtons =
    document.querySelectorAll(
        ".filter-button"
    );


filterButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const filter =
                    button.getAttribute(
                        "data-filter"
                    );


                filterButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                galleryCards.forEach(
                    function (card) {

                        const category =
                            card.getAttribute(
                                "data-category"
                            );


                        if (
                            filter === "all" ||
                            category === filter
                        ) {

                            card.classList.remove(
                                "hidden"
                            );

                        } else {

                            card.classList.add(
                                "hidden"
                            );

                        }

                    }
                );


                updateGalleryItems();

            }
        );

    }
);


/* =========================================================
   SERVICE → HIRE FORM
========================================================= */

const serviceLinks =
    document.querySelectorAll(
        ".service-link"
    );

const projectService =
    document.getElementById(
        "projectService"
    );


serviceLinks.forEach(
    function (link) {

        link.addEventListener(
            "click",
            function () {

                const service =
                    link.getAttribute(
                        "data-service"
                    );


                if (
                    projectService &&
                    service
                ) {

                    projectService.value =
                        service;

                }

            }
        );

    }
);


/* =========================================================
   REVIEW SYSTEM
   LOCAL BROWSER STORAGE
========================================================= */

const reviewForm =
    document.getElementById(
        "reviewForm"
    );

const reviewsList =
    document.getElementById(
        "reviewsList"
    );

const ratingButtons =
    document.querySelectorAll(
        "#ratingInput button"
    );


let selectedRating = 0;


/* =========================================================
   RATING SELECTION
========================================================= */

ratingButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                selectedRating =
                    Number(
                        button.getAttribute(
                            "data-rating"
                        )
                    );


                ratingButtons.forEach(
                    function (item) {

                        const value =
                            Number(
                                item.getAttribute(
                                    "data-rating"
                                )
                            );


                        if (
                            value <=
                            selectedRating
                        ) {

                            item.classList.add(
                                "active"
                            );

                        } else {

                            item.classList.remove(
                                "active"
                            );

                        }

                    }
                );

            }
        );

    }
);


/* =========================================================
   LOAD REVIEWS
========================================================= */

function getReviews() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "skynthReviews"
            )
        ) || [];

    } catch (error) {

        return [];

    }

}


/* =========================================================
   SAVE REVIEWS
========================================================= */

function saveReviews(
    reviews
) {

    localStorage.setItem(
        "skynthReviews",
        JSON.stringify(reviews)
    );

}


/* =========================================================
   DISPLAY REVIEWS
========================================================= */

function displayReviews() {

    if (!reviewsList) {
        return;
    }


    const reviews =
        getReviews();


    if (!reviews.length) {

        reviewsList.innerHTML = `

            <article class="review-card">

                <div class="review-stars">
                    ★★★★★
                </div>

                <p>
                    Your feedback will appear here after
                    reviews are added.
                </p>

                <div class="review-author">

                    <strong>
                        SKYNTH
                    </strong>

                    <span>
                        CLIENT FEEDBACK
                    </span>

                </div>

            </article>

        `;

        return;

    }


    reviewsList.innerHTML =
        reviews
            .map(function (review) {

                const stars =
                    "★".repeat(
                        review.rating
                    ) +
                    "☆".repeat(
                        5 - review.rating
                    );


                return `

                    <article class="review-card">

                        <div class="review-stars">
                            ${stars}
                        </div>

                        <p>
                            ${escapeHTML(
                                review.text
                            )}
                        </p>

                        <div class="review-author">

                            <strong>
                                ${escapeHTML(
                                    review.name
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    review.service
                                )}
                            </span>

                        </div>

                    </article>

                `;

            })
            .join("");

}


/* =========================================================
   ESCAPE HTML
   Protects review display from HTML injection
========================================================= */

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   REVIEW SUBMISSION
========================================================= */

if (reviewForm) {

    reviewForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "reviewName"
                ).value.trim();


            const service =
                document.getElementById(
                    "reviewService"
                ).value;


            const text =
                document.getElementById(
                    "reviewText"
                ).value.trim();


            if (
                !name ||
                !text ||
                selectedRating === 0
            ) {

                alert(
                    "Please enter your name, review and rating."
                );

                return;

            }


            const reviews =
                getReviews();


            reviews.unshift({

                name: name,

                service: service,

                rating: selectedRating,

                text: text,

                date:
                    new Date()
                        .toISOString()

            });


            saveReviews(
                reviews
            );


            displayReviews();


            reviewForm.reset();


            selectedRating = 0;


            ratingButtons.forEach(
                function (button) {

                    button.classList.remove(
                        "active"
                    );

                }
            );


            alert(
                "Thank you for your review!"
            );

        }
    );

}


/* =========================================================
   PROJECT REQUEST FORM
========================================================= */

const projectForm =
    document.getElementById(
        "projectForm"
    );


if (projectForm) {

    projectForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name = document.getElementById("projectName").value.trim();
            const email = document.getElementById("projectEmail").value.trim();
            
            const phoneEl = document.getElementById("projectPhone");
            const phone = phoneEl ? phoneEl.value.trim() : "";
            
            const service = document.getElementById("projectService").value;
            const details = document.getElementById("projectDetails").value.trim();

            if (!name || !email || !service || !details) {
                alert("Please complete all required fields.");
                return;
            }

            const submitBtn = projectForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = "SENDING... ⏳";
            submitBtn.disabled = true;

            try {
                const response = await fetch("https://formspree.io/f/mjybnlpn", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        phone: phone || "Not provided",
                        service: service,
                        details: details,
                        _subject: `New SKYNTH Project Request — ${service}`
                    })
                });

                if (response.ok) {
                    alert("Thank you! Your request has been sent successfully.");
                    projectForm.reset();
                } else {
                    const errRes = await response.json();
                    console.error("Formspree Error:", errRes);
                    let errMsg = "Unknown error";
                    if (errRes.errors && errRes.errors.length > 0) {
                        errMsg = errRes.errors.map(e => e.message).join(', ');
                    }
                    alert("Failed to send message: " + errMsg);
                }
            } catch (error) {
                console.error("Fetch error:", error);
                alert("Failed to send message: " + error.message);
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        }
    );
}


/* =========================================================
   WHATSAPP LINKS
========================================================= */

function setupWhatsAppLinks() {

    const links =
        document.querySelectorAll(
            'a[href*="YOUR_WHATSAPP_NUMBER"]'
        );


    links.forEach(
        function (link) {

            link.href =
                `https://wa.me/${SKYNTH_CONFIG.whatsapp}`;

        }
    );

}


setupWhatsAppLinks();


/* =========================================================
   EMAIL LINKS
========================================================= */

function setupEmailLinks() {

    const links =
        document.querySelectorAll(
            'a[href*="YOUR_EMAIL"]'
        );


    links.forEach(
        function (link) {

            link.href =
                `mailto:${SKYNTH_CONFIG.email}`;

        }
    );

}


setupEmailLinks();


/* =========================================================
   COUNTER ANIMATION
========================================================= */

const counters =
    document.querySelectorAll(
        ".counter"
    );


let countersStarted = false;


function animateCounters() {

    if (countersStarted) {
        return;
    }


    countersStarted = true;


    counters.forEach(
        function (counter) {

            const target =
                Number(
                    counter.getAttribute(
                        "data-target"
                    )
                );


            let current = 0;

            const duration = 1500;

            const increment =
                target /
                (duration / 20);


            const timer =
                setInterval(
                    function () {

                        current += increment;


                        if (
                            current >= target
                        ) {

                            current =
                                target;

                            clearInterval(
                                timer
                            );

                        }


                        counter.textContent =
                            Math.floor(
                                current
                            );

                    },
                    20
                );

        }
    );

}


const statsSection =
    document.querySelector(
        ".stats-section"
    );


if (statsSection) {

    const statsObserver =
        new IntersectionObserver(
            function (
                entries,
                observer
            ) {

                entries.forEach(
                    function (entry) {

                        if (
                            entry.isIntersecting
                        ) {

                            animateCounters();

                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.3
            }
        );


    statsObserver.observe(
        statsSection
    );

}


/* =========================================================
   SCROLL REVEAL
========================================================= */

const revealElements =
    document.querySelectorAll(
        ".section-heading, " +
        ".service-card, " +
        ".video-card, " +
        ".review-card, " +
        ".about-image, " +
        ".about-content, " +
        ".project-form, " +
        ".direct-contact"
    );


revealElements.forEach(
    function (element) {

        element.classList.add(
            "reveal"
        );

    }
);


const revealObserver =
    new IntersectionObserver(
        function (
            entries,
            observer
        ) {

            entries.forEach(
                function (entry) {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );

                    }

                }
            );

        },
        {
            threshold: 0.12
        }
    );


revealElements.forEach(
    function (element) {

        revealObserver.observe(
            element
        );

    }
);


/* =========================================================
   TOUCH SWIPE FOR LIGHTBOX
========================================================= */

let touchStartX = 0;

let touchEndX = 0;


if (lightbox) {

    lightbox.addEventListener(
        "touchstart",
        function (event) {

            touchStartX =
                event.changedTouches[0]
                    .screenX;

        },
        {
            passive: true
        }
    );


    lightbox.addEventListener(
        "touchend",
        function (event) {

            touchEndX =
                event.changedTouches[0]
                    .screenX;


            handleSwipe();

        },
        {
            passive: true
        }
    );

}


function handleSwipe() {

    const distance =
        touchEndX -
        touchStartX;


    if (
        Math.abs(distance) < 50
    ) {

        return;

    }


    if (distance < 0) {

        nextImage();

    } else {

        previousImage();

    }

}


/* =========================================================
   ESCAPE MOBILE MENU
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            mobileMenu.classList.contains(
                "active"
            )
        ) {

            closeMobileMenu();

        }

    }
);


/* =========================================================
   IMAGE FALLBACKS
   Shows a clean placeholder instead of a broken-image icon
   whenever an image file (e.g. in /images) hasn't been
   added yet.
========================================================= */

function markImageMissing(img) {

    const wrapper =
        img.closest(
            ".card, .about-image, .video-thumbnail"
        );

    if (wrapper) {

        wrapper.classList.add("img-missing");

    }

    img.style.display = "none";

}


document
    .querySelectorAll(
        ".card img, .about-image img, .video-thumbnail img"
    )
    .forEach(function (img) {

        if (img.complete && img.naturalWidth === 0) {

            markImageMissing(img);

        } else {

            img.addEventListener(
                "error",
                function () {

                    markImageMissing(img);

                },
                { once: true }
            );

        }

    });


/* Hero background is a CSS background-image, so it is
   checked separately by preloading it. */

(function checkHeroImage() {

    const hero =
        document.querySelector(".hero");

    if (!hero) {
        return;
    }

    const probe = new Image();

    probe.onerror = function () {

        hero.classList.add("no-hero-image");

    };

    probe.src = "images/hero.jpg";

})();


/* =========================================================
   PROJECT DATE — disallow past dates
========================================================= */

const projectDateInput =
    document.getElementById("projectDate");

if (projectDateInput) {

    projectDateInput.min =
        new Date().toISOString().split("T")[0];

}


/* =========================================================
   LOAD REVIEWS
========================================================= */

displayReviews();


/* =========================================================
   WEBSITE READY
========================================================= */

console.log(
    "SKYNTH Professional Portfolio loaded successfully."
);