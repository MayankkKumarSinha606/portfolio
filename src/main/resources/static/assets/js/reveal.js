/*
 * Gentle entrance for headings, cards and forms as they scroll into view.
 * Progressive: nothing is hidden unless this script runs, each element animates
 * once, and it does nothing when the visitor has asked for reduced motion.
 * Skips the home hero (it has its own motion) and anything inside a modal.
 * Styles live in theme.css (.js-reveal / .is-in).
 */
(function () {
    "use strict";

    if (!("IntersectionObserver" in window)) { return; }
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    var targets = document.querySelectorAll(
        "main h1, main h2, main .card, main .project-card, main form, main .home-intro .lead"
    );
    if (!targets.length) { return; }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-in");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });

    targets.forEach(function (el) {
        if (el.closest(".modal") || el.closest(".split-hero") || el.classList.contains("visually-hidden")) {
            return;
        }
        el.classList.add("js-reveal");
        observer.observe(el);
    });
})();