/*
 * Touch bloom: a soft ripple wherever the page is touched or clicked.
 * Purely visual. It never intercepts the click or the touch, adds no
 * listeners per element, and does nothing when the visitor has asked their
 * device for reduced motion. Styles live in theme.css (.touch-bloom).
 * Over the footer and the coffee-coloured bands the bloom turns tan so it
 * stays visible.
 */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
        return;
    }

    var MAX_AT_ONCE = 6;     // never more than this many on screen
    var LIFETIME_MS = 800;   // a little longer than the longest animation

    document.addEventListener("pointerdown", function (event) {
        // Primary button / finger / pen only (ignore right and middle click)
        if (event.pointerType === "mouse" && event.button !== 0) {
            return;
        }

        var live = document.querySelectorAll(".touch-bloom");
        if (live.length >= MAX_AT_ONCE) {
            live[0].remove();
        }

        var bloom = document.createElement("span");
        bloom.className = "touch-bloom";
        var target = event.target;
        if (target && target.closest && target.closest("footer, .cta-band, .section-coffee")) {
            bloom.className += " touch-bloom--on-dark";
        }
        bloom.setAttribute("aria-hidden", "true");
        bloom.style.left = event.clientX + "px";
        bloom.style.top = event.clientY + "px";
        document.body.appendChild(bloom);

        window.setTimeout(function () {
            bloom.remove();
        }, LIFETIME_MS);
    }, { passive: true });
})();
