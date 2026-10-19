/*
 * Tilt for the home-page name. The word is built from stacked layers (see theme.css,
 * ".wordmark"); turning it a few degrees makes the depth show.
 *  - Mouse: the word leans toward the pointer while it is over the hero, and settles
 *    back when the pointer leaves.
 *  - Touch / pen: the word leans toward the finger while it is down, then settles.
 * Only the two .wordmark elements are transformed. There is no idle animation: the
 * loop runs only while the word is moving and stops once it has settled.
 * Does nothing when the visitor asks for reduced motion, or on pages without the hero.
 */
(function () {
    "use strict";

    var hero = document.querySelector(".split-hero");
    if (!hero) { return; }
    var marks = hero.querySelectorAll(".wordmark");
    if (!marks.length) { return; }
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    var MAX_Y = 8;      // degrees, left/right
    var MAX_X = 5;      // degrees, up/down
    var EASE = 0.09;    // how quickly the word follows (0..1 per frame)

    var cur = { x: 0, y: 0 };
    var tgt = { x: 0, y: 0 };
    var frame = 0;
    var ready = false;   // wait for the entrance animation to finish
    var held = false;    // finger or pen is down

    function apply() {
        var t = "rotateX(" + cur.x.toFixed(2) + "deg) rotateY(" + cur.y.toFixed(2) + "deg)";
        for (var i = 0; i < marks.length; i++) {
            marks[i].style.transform = t;
        }
    }

    function tick() {
        cur.x += (tgt.x - cur.x) * EASE;
        cur.y += (tgt.y - cur.y) * EASE;
        apply();
        var settled = Math.abs(tgt.x - cur.x) < 0.01 && Math.abs(tgt.y - cur.y) < 0.01;
        if (settled && tgt.x === 0 && tgt.y === 0) {
            cur.x = 0; cur.y = 0;
            for (var i = 0; i < marks.length; i++) {
                marks[i].style.transform = "";
                marks[i].style.willChange = "";
            }
            frame = 0;
            return;
        }
        frame = window.requestAnimationFrame(tick);
    }

    function kick() {
        if (frame) { return; }
        for (var i = 0; i < marks.length; i++) {
            marks[i].style.willChange = "transform";
        }
        frame = window.requestAnimationFrame(tick);
    }

    function aim(event) {
        var r = hero.getBoundingClientRect();
        var nx = ((event.clientX - r.left) / r.width) * 2 - 1;
        var ny = ((event.clientY - r.top) / r.height) * 2 - 1;
        tgt.y = Math.max(-1, Math.min(1, nx)) * MAX_Y;
        tgt.x = -Math.max(-1, Math.min(1, ny)) * MAX_X;
        kick();
    }

    function rest() {
        held = false;
        tgt.x = 0;
        tgt.y = 0;
        kick();
    }

    hero.addEventListener("pointermove", function (event) {
        if (!ready) { return; }
        if (event.pointerType === "mouse" || held) { aim(event); }
    }, { passive: true });

    hero.addEventListener("pointerdown", function (event) {
        if (!ready || event.pointerType === "mouse") { return; }
        held = true;
        aim(event);
    }, { passive: true });

    hero.addEventListener("pointerup", function (event) {
        if (event.pointerType !== "mouse") { rest(); }
    }, { passive: true });
    hero.addEventListener("pointercancel", rest, { passive: true });
    hero.addEventListener("pointerleave", rest, { passive: true });

    // Start following the pointer only after the entrance animation has played
    var first = marks[0];
    var started = false;
    function begin() {
        if (started) { return; }
        started = true;
        ready = true;
    }
    first.addEventListener("animationend", begin, { once: true });
    window.setTimeout(begin, 1300);   // fallback if the animation never fires
})();