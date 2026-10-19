/*
 * Home page name: 3D lettering, intro animation and its sound.
 *
 * What happens (about five seconds, every time the home page loads):
 *   1. A dice with the letters M A Y A N K on its faces is placed on the screen.
 *   2. "Kumar" and "Sinha" charge in from the right and strike it together.
 *   3. The dice is knocked up into the air and tumbles, with a rolling sound.
 *   4. It falls, breaks, and its letters (plus the second K from inside) fly
 *      out, hover, then arrange themselves one by one into "Mayankk".
 *   5. The whole name rests; the subtitle and buttons rise in. Afterwards the
 *      name leans toward the mouse (or the finger on a phone).
 *
 * The page works without any of this: the three words are real text in the HTML.
 * The intro is skipped when the device asks for reduced motion. "Skip intro"
 * (or Escape) jumps to the finished name; "Replay intro" plays it again.
 *
 * Sound is generated here with the Web Audio API (no audio files). Browsers
 * keep sound locked until the visitor has interacted with the page, so on a
 * fresh load it can stay silent until the first tap, click or key press; the
 * "Sound" button shows when that is the case. Styles live in theme.css.
 */
(function () {
    "use strict";

    var root = document.querySelector("[data-name3d]");
    if (!root) { return; }
    var stage = root.querySelector(".name3d__stage");
    if (!stage) { return; }
    var words = [].slice.call(stage.querySelectorAll(".word"));
    if (words.length !== 3) { return; }          // Mayankk, Kumar, Sinha

    var html = document.documentElement;
    var hero = root.closest(".home-hero") || document.body;
    var after = [].slice.call(document.querySelectorAll(".intro-after"));
    var controls = document.querySelector(".intro-controls");
    var replayBtn = document.querySelector(".intro-replay");
    var soundBtn = document.querySelector(".intro-sound");

    var reduce = !!(window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var canAnimate = !reduce && typeof Element.prototype.animate === "function";

    var LAYERS = 6;                               // depth layers per letter
    var FACES = [["front", "M"], ["right", "A"], ["top", "Y"], ["back", "A"], ["left", "N"], ["bottom", "K"]];
    var SHARD_COLOURS = ["#4B3024", "#5E3B2A", "#805638", "#9A6B45", "#D8B994", "#EAD6B4"];

    /* Timeline, milliseconds from the start */
    var T_PLACE = 0, D_PLACE = 420;               // dice is set down
    var T_CHARGE = 450, D_CHARGE = 720;           // the words run in
    var T_HIT = T_CHARGE + D_CHARGE;              // they strike the dice
    var D_REBOUND = 640;                          // ...and spring back into place
    var D_FLIGHT = 1750;                          // dice up, tumbling, down
    var T_BREAK = T_HIT + D_FLIGHT;               // it hits the floor and breaks
    var SCATTER = 520, HOLD = 240, GAP = 95, SETTLE = 650;   // letters

    var timers = [];
    var anims = [];
    var extras = [];
    var playing = false;

    /* ====================================================================
       SOUND  (Web Audio, synthesised; nothing to download)
       ==================================================================== */
    var sfx = (function () {
        var AC = window.AudioContext || window.webkitAudioContext;
        var ctx = null, master = null, bus = null, noise = null;
        var available = !!AC;
        var muted = false;
        var listeners = [];
        try { muted = window.localStorage.getItem("nameIntroMuted") === "1"; } catch (e) { }

        function changed() { listeners.forEach(function (f) { f(); }); }

        function init() {
            if (!available || ctx) { return; }
            try {
                ctx = new AC();
            } catch (e) { available = false; return; }
            master = ctx.createGain();
            master.gain.value = 0.7;
            var comp = ctx.createDynamicsCompressor();
            master.connect(comp);
            comp.connect(ctx.destination);
            var len = Math.floor(ctx.sampleRate * 1.5);
            noise = ctx.createBuffer(1, len, ctx.sampleRate);
            var data = noise.getChannelData(0);
            for (var i = 0; i < len; i++) { data[i] = Math.random() * 2 - 1; }
            ctx.onstatechange = changed;
        }
        function unlock() {
            init();
            if (ctx && ctx.state === "suspended") {
                try { var p = ctx.resume(); if (p && p.then) { p.then(changed, changed); } } catch (e) { }
            }
        }
        function state() {
            if (!available) { return "na"; }
            if (muted) { return "muted"; }
            if (!ctx || ctx.state !== "running") { return "locked"; }
            return "on";
        }
        function live() { return state() === "on" && bus; }

        /* a fresh bus for each play, so skipping can silence it instantly */
        function begin() {
            init();
            if (!ctx) { return; }
            unlock();
            bus = ctx.createGain();
            bus.gain.value = 1;
            bus.connect(master);
        }
        function stop() {
            if (!ctx || !bus) { return; }
            var old = bus;
            bus = null;
            var now = ctx.currentTime;
            try {
                old.gain.cancelScheduledValues(now);
                old.gain.setTargetAtTime(0, now, 0.03);
            } catch (e) { }
            window.setTimeout(function () { try { old.disconnect(); } catch (e) { } }, 400);
        }
        function setMuted(m) {
            muted = !!m;
            try { window.localStorage.setItem("nameIntroMuted", muted ? "1" : "0"); } catch (e) { }
            if (muted) { stop(); }
            changed();
        }

        /* ---- building blocks ---- */
        function when(at) { return ctx.currentTime + (at || 0) + 0.004; }
        function envelope(g, t, attack, peak, decay) {
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
            g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
        }
        function noiseHit(at, dur, type, freq, q, peak, rate) {
            var t = when(at);
            var s = ctx.createBufferSource();
            s.buffer = noise;
            s.playbackRate.value = rate || 1;
            var f = ctx.createBiquadFilter();
            f.type = type;
            f.frequency.value = freq;
            f.Q.value = q || 1;
            var g = ctx.createGain();
            envelope(g, t, 0.003, peak, dur);
            s.connect(f); f.connect(g); g.connect(bus);
            s.start(t, Math.random() * 0.6);
            s.stop(t + dur + 0.06);
        }
        function tone(at, f0, f1, dur, peak, type) {
            var t = when(at);
            var o = ctx.createOscillator();
            o.type = type || "sine";
            o.frequency.setValueAtTime(f0, t);
            o.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
            var g = ctx.createGain();
            envelope(g, t, 0.004, peak, dur);
            o.connect(g); g.connect(bus);
            o.start(t);
            o.stop(t + dur + 0.06);
        }
        function sweep(at, dur, from, to, peak) {
            var t = when(at);
            var s = ctx.createBufferSource();
            s.buffer = noise;
            var f = ctx.createBiquadFilter();
            f.type = "bandpass";
            f.Q.value = 1.4;
            f.frequency.setValueAtTime(from, t);
            f.frequency.exponentialRampToValueAtTime(to, t + dur);
            var g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.45);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            s.connect(f); f.connect(g); g.connect(bus);
            s.start(t, Math.random() * 0.4);
            s.stop(t + dur + 0.05);
        }
        function thud(at, power) {
            tone(at, 150, 42, 0.2, 0.7 * power, "sine");
            noiseHit(at, 0.07, "lowpass", 420, 0.7, 0.45 * power);
        }
        function clack(at, power) {
            noiseHit(at, 0.05, "bandpass", 2600, 1.2, 0.5 * power);
            tone(at, 950, 520, 0.05, 0.22 * power, "triangle");
        }

        /* ---- the cues ---- */
        var NOTES = [523, 587, 659, 784, 880, 988, 1047];   // letters click into place, rising
        var cues = {
            place: function () { thud(0, 0.45); clack(0.01, 0.35); },
            charge: function () { sweep(0, 0.8, 500, 2400, 0.32); sweep(0.1, 0.7, 380, 1800, 0.22); },
            strike: function () {
                thud(0, 1); clack(0, 1);
                noiseHit(0, 0.12, "highpass", 1500, 0.8, 0.55);
                thud(0.09, 0.7); clack(0.1, 0.6);
            },
            launch: function () { sweep(0, 0.45, 300, 1600, 0.3); },
            roll: function () {
                // a rumbling bed...
                var t = when(0);
                var s = ctx.createBufferSource();
                s.buffer = noise;
                s.loop = true;
                var f = ctx.createBiquadFilter();
                f.type = "lowpass";
                f.frequency.value = 650;
                f.Q.value = 0.7;
                var g = ctx.createGain();
                var dur = 1.35;
                g.gain.setValueAtTime(0.0001, t);
                g.gain.exponentialRampToValueAtTime(0.22, t + 0.12);
                g.gain.setValueAtTime(0.22, t + dur - 0.25);
                g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                s.connect(f); f.connect(g); g.connect(bus);
                s.start(t);
                s.stop(t + dur + 0.05);
                // ...with the rattle of plastic edges knocking together
                for (var i = 0; i < 24; i++) {
                    var at = dur * Math.pow(i / 24, 0.9) + Math.random() * 0.03;
                    noiseHit(at, 0.04, "bandpass", 1800 + Math.random() * 2600, 3, 0.14 + Math.random() * 0.26, 0.8 + Math.random() * 0.6);
                    if (i % 5 === 0) { tone(at, 260 + Math.random() * 120, 140, 0.05, 0.12, "triangle"); }
                }
            },
            crack: function () {
                noiseHit(0, 0.1, "highpass", 1800, 0.7, 0.8);
                thud(0, 1);
                clack(0.02, 0.9);
            },
            shatter: function () {
                for (var i = 0; i < 20; i++) {
                    var at = Math.random() * 0.55;
                    var f = 2200 + Math.random() * 4200;
                    tone(at, f, f * 0.82, 0.06 + Math.random() * 0.1, 0.05 + Math.random() * 0.09, "triangle");
                    if (i % 3 === 0) { noiseHit(at, 0.03, "highpass", 3500, 1, 0.15); }
                }
            },
            swirl: function () { sweep(0, 0.9, 400, 2200, 0.2); },
            tok: function (i) {
                var n = NOTES[Math.min(i, NOTES.length - 1)];
                tone(0, n, n * 0.97, 0.14, 0.2, "sine");
                noiseHit(0, 0.03, "bandpass", 1500, 2, 0.18);
            },
            chime: function () {
                tone(0, 880, 880, 0.9, 0.1, "sine");
                tone(0.02, 1320, 1320, 0.7, 0.06, "sine");
            }
        };
        function play(name, arg) {
            if (!live()) { return; }
            try { cues[name](arg); } catch (e) { }
        }

        return {
            begin: begin, stop: stop, play: play, unlock: unlock, init: init, state: state,
            setMuted: setMuted, onChange: function (f) { listeners.push(f); }
        };
    })();

    /* ====================================================================
       small helpers
       ==================================================================== */
    function later(fn, ms) {
        var id = window.setTimeout(fn, ms);
        timers.push(id);
        return id;
    }
    function run(el, frames, options) {
        var a = el.animate(frames, options);
        anims.push(a);
        return a;
    }
    function make(tag, className, parent) {
        var el = document.createElement(tag);
        el.className = className;
        (parent || stage).appendChild(el);
        return el;
    }
    function rand(min, max) { return min + Math.random() * (max - min); }

    function clearAll() {
        timers.forEach(function (id) { window.clearTimeout(id); });
        timers = [];
        anims.forEach(function (a) { try { a.cancel(); } catch (e) { } });
        anims = [];
        extras.forEach(function (n) { if (n.parentNode) { n.parentNode.removeChild(n); } });
        extras = [];
    }

    /* ====================================================================
       3D lettering
       ==================================================================== */
    function buildLetters() {
        words.forEach(function (word) {
            var text = word.getAttribute("data-text") || word.textContent;
            word.textContent = "";
            for (var i = 0; i < text.length; i++) {
                var letter = make("span", "ltr", word);
                for (var j = 0; j < LAYERS; j++) {
                    var layer = make("span", "ltr__l", letter);
                    layer.textContent = text.charAt(i);
                    layer.style.setProperty("--i", j);
                }
            }
        });
        root.classList.add("is-3d");
    }

    /* ====================================================================
       the dice: one letter of the name on each face
       ==================================================================== */
    function buildDice(size) {
        var dice = make("div", "dice");
        dice.setAttribute("aria-hidden", "true");
        dice.style.setProperty("--dice", size + "px");
        FACES.forEach(function (face) {
            var f = make("div", "dice__f dice__f--" + face[0], dice);
            var letter = make("span", "dice__letter", f);
            letter.textContent = face[1];
        });
        extras.push(dice);
        return dice;
    }
    function dframe(x, y, rx, ry, rz, sx, sy) {
        return "translate3d(" + x + "px," + y + "px,0) rotateX(" + rx + "deg) rotateY(" + ry +
            "deg) rotateZ(" + rz + "deg) scale(" + sx + "," + sy + ")";
    }

    /* pieces of the broken dice */
    function burst(cx, cy, size) {
        var count = 18;
        for (var i = 0; i < count; i++) {
            var s = Math.round(size * rand(0.12, 0.3));
            var shard = make("div", "shard");
            shard.style.left = (cx - s / 2) + "px";
            shard.style.top = (cy - s / 2) + "px";
            shard.style.width = s + "px";
            shard.style.height = Math.round(s * rand(0.6, 1.1)) + "px";
            shard.style.background = SHARD_COLOURS[i % SHARD_COLOURS.length];
            shard.style.clipPath = "polygon(" +
                Math.round(rand(0, 30)) + "% " + Math.round(rand(0, 30)) + "%, " +
                Math.round(rand(70, 100)) + "% " + Math.round(rand(0, 40)) + "%, " +
                Math.round(rand(60, 100)) + "% " + Math.round(rand(70, 100)) + "%, " +
                Math.round(rand(0, 40)) + "% " + Math.round(rand(60, 100)) + "%)";
            extras.push(shard);

            var tx = rand(-1, 1) * size * 3.2;
            var peak = -size * rand(0.6, 1.7);
            var fall = size * rand(1.4, 3.2);
            var tz = rand(-0.6, 1) * size * 3;
            var ax = rand(-1, 1), ay = rand(-1, 1), az = rand(-1, 1);
            var turn = rand(240, 900);
            run(shard, [
                { transform: "translate3d(0,0,0) rotate3d(" + ax + "," + ay + "," + az + ",0deg)", opacity: 1, easing: "cubic-bezier(0.2,0.7,0.4,1)" },
                { transform: "translate3d(" + tx * 0.55 + "px," + peak + "px," + tz * 0.5 + "px) rotate3d(" + ax + "," + ay + "," + az + "," + turn * 0.5 + "deg)", opacity: 1, offset: 0.36, easing: "cubic-bezier(0.5,0,0.9,0.6)" },
                { transform: "translate3d(" + tx + "px," + fall + "px," + tz + "px) rotate3d(" + ax + "," + ay + "," + az + "," + turn + "deg)", opacity: 0 }
            ], { duration: Math.round(rand(900, 1400)), fill: "forwards" });
        }
        var ring = make("div", "dice-ring");
        ring.style.left = (cx - size) + "px";
        ring.style.top = (cy - size) + "px";
        ring.style.width = (size * 2) + "px";
        ring.style.height = (size * 2) + "px";
        extras.push(ring);
        run(ring, [
            { transform: "scale(0.2)", opacity: 0.45 },
            { transform: "scale(1.35)", opacity: 0 }
        ], { duration: 620, easing: "cubic-bezier(0.2,0.7,0.2,1)", fill: "forwards" });
    }

    /* ====================================================================
       finishing, skipping, controls
       ==================================================================== */
    function showFinal() {
        words[0].classList.remove("word--pending");
        after.forEach(function (el) { el.classList.add("is-in"); });
        html.classList.add("intro-go");
        html.classList.remove("has-intro");
        html.classList.remove("intro-on");
    }

    function finish(skipped) {
        clearAll();
        if (skipped) { sfx.stop(); }
        showFinal();
        playing = false;
        refreshControls();
        enableTilt();
    }

    function refreshControls() {
        if (replayBtn) {
            var label = replayBtn.querySelector(".intro-replay__label");
            var icon = replayBtn.querySelector("i");
            if (label) { label.textContent = playing ? "Skip intro" : "Replay intro"; }
            if (icon) { icon.className = (playing ? "bi bi-skip-forward-fill" : "bi bi-arrow-repeat") + " me-1"; }
        }
        if (soundBtn) {
            var st = sfx.state();
            var l = soundBtn.querySelector(".intro-sound__label");
            var ic = soundBtn.querySelector("i");
            var text = "Sound on", cls = "bi bi-volume-up", pressed = "true";
            if (st === "muted") { text = "Sound off"; cls = "bi bi-volume-mute"; pressed = "false"; }
            else if (st === "locked") { text = "Tap for sound"; cls = "bi bi-volume-up"; pressed = "false"; }
            if (l) { l.textContent = text; }
            if (ic) { ic.className = cls + " me-1"; }
            soundBtn.setAttribute("aria-pressed", pressed);
        }
    }

    /* ====================================================================
       the intro
       ==================================================================== */
    function start() {
        clearAll();
        sfx.stop();
        sfx.begin();
        playing = true;
        refreshControls();
        after.forEach(function (el) { el.classList.remove("is-in"); });
        html.classList.add("intro-on");
        words[0].classList.add("word--pending");     // the first name stays hidden until the dice breaks
        stage.style.transform = "";

        /* --- measure while nothing is transformed --- */
        var vw = window.innerWidth;
        var stageRect = stage.getBoundingClientRect();
        var first = words[0].getBoundingClientRect();
        var fontPx = parseFloat(window.getComputedStyle(root).fontSize) || 80;
        var gapPx = fontPx * 0.28;
        var size = Math.round(fontPx * 1.1);
        var dcx = first.left + first.width / 2;               // dice centre, viewport coordinates
        var dcy = first.top + first.height / 2;
        var cx = dcx - stageRect.left;                        // ...and relative to the stage
        var cy = dcy - stageRect.top;
        var diceRight = dcx + size / 2;
        var kRect = words[1].getBoundingClientRect();
        var sRect = words[2].getBoundingClientRect();
        var letters = [].slice.call(words[0].querySelectorAll(".ltr"));
        var slots = letters.map(function (l) {
            var r = l.getBoundingClientRect();
            return { dx: dcx - (r.left + r.width / 2), dy: dcy - (r.top + r.height / 2) };
        });

        html.classList.add("intro-go");

        /* --- 1. the dice is placed on the screen --- */
        var dice = buildDice(size);
        dice.style.left = (cx - size / 2) + "px";
        dice.style.top = (cy - size / 2) + "px";
        var shadow = make("div", "dice-shadow");
        shadow.style.left = (cx - size * 0.62) + "px";
        shadow.style.top = (cy + size * 0.46) + "px";
        shadow.style.width = (size * 1.24) + "px";
        shadow.style.height = (size * 0.24) + "px";
        extras.push(shadow);

        run(dice, [
            { transform: dframe(0, -size * 0.55, -70, 70, 0, 1, 1), easing: "cubic-bezier(0.5,0,0.9,0.6)" },
            { transform: dframe(0, 0, -24, 32, 0, 1.12, 0.88), offset: 0.62, easing: "cubic-bezier(0.2,0.7,0.3,1)" },
            { transform: dframe(0, 0, -24, 32, 0, 1, 1) }
        ], { delay: T_PLACE, duration: D_PLACE, fill: "backwards" });
        shadow.style.opacity = "0.32";
        later(function () { sfx.play("place"); }, T_PLACE + Math.round(D_PLACE * 0.62));

        /* --- 2. Kumar and Sinha charge in and strike it --- */
        // Kumar's left edge stops against the dice; Sinha rides behind him, as in the final layout
        var kLeft = diceRight + 6;
        var sLeft = kLeft + kRect.width + gapPx;
        function charge(word, rect, targetLeft, delay) {
            var dxFar = Math.round((vw - rect.left) * 1.25 + 160);
            var sx = Math.round(targetLeft - rect.left);
            var sy = Math.round(dcy - (rect.top + rect.height / 2));
            var total = D_CHARGE + D_REBOUND;
            var hit = D_CHARGE / total;
            run(word, [
                { transform: "translate3d(" + dxFar + "px," + sy + "px,-260px) rotateY(-70deg) rotateZ(-4deg) scale(1.2,0.86)", easing: "cubic-bezier(0.55,0,0.9,0.5)" },
                { transform: "translate3d(" + sx + "px," + sy + "px,0px) rotateY(10deg) rotateZ(0deg) scale(0.9,1.08)", offset: hit, easing: "cubic-bezier(0.15,0.85,0.3,1)" },
                { transform: "translate3d(16px,0px,40px) rotateY(-6deg) rotateZ(0.5deg) scale(1.03,0.98)", offset: hit + (1 - hit) * 0.7, easing: "ease-in-out" },
                { transform: "translate3d(0px,0px,0px) rotateY(0deg) rotateZ(0deg) scale(1,1)" }
            ], { delay: delay, duration: total, fill: "backwards" });
        }
        charge(words[1], kRect, kLeft, T_CHARGE);                 // Kumar leads
        charge(words[2], sRect, sLeft, T_CHARGE + 70);            // Sinha follows a beat behind
        later(function () { sfx.play("charge"); }, T_CHARGE - 60);
        later(function () { sfx.play("strike"); }, T_HIT);

        /* --- 3. the dice is knocked up and tumbles; rolling sound --- */
        var s = size;
        run(dice, [
            { transform: dframe(0, 0, -24, 32, 0, 1, 1), easing: "ease-out" },
            { transform: dframe(-s * 0.1, 0, -24, 28, 4, 0.8, 1.12), offset: 0.04, easing: "ease-out" },
            { transform: dframe(-s * 0.16, -s * 0.12, 20, -10, 24, 1.06, 0.96), offset: 0.09, easing: "cubic-bezier(0.2,0.7,0.3,1)" },
            { transform: dframe(-s * 0.42, -s * 2.8, 520, -360, 160, 0.97, 1.05), offset: 0.42, easing: "cubic-bezier(0.5,0,0.9,0.6)" },
            { transform: dframe(0, -s * 0.05, 1000, -720, 330, 0.96, 1.06), offset: 0.96, easing: "ease-in" },
            { transform: dframe(0, 0, 1060, -740, 340, 1.22, 0.78) }
        ], { delay: T_HIT, duration: D_FLIGHT, fill: "forwards" });
        run(shadow, [
            { opacity: 0.32, transform: "scale(1)", easing: "ease-out" },
            { opacity: 0.32, transform: "scale(1)", offset: 0.09, easing: "ease-in-out" },
            { opacity: 0.1, transform: "scale(0.45)", offset: 0.42, easing: "ease-in" },
            { opacity: 0.3, transform: "scale(0.98)", offset: 0.96 },
            { opacity: 0.34, transform: "scale(1.08)" }
        ], { delay: T_HIT, duration: D_FLIGHT, fill: "forwards" });
        later(function () { sfx.play("launch"); }, T_HIT + 50);
        later(function () { sfx.play("roll"); }, T_HIT + 220);

        // the ram jolts the stage; the stuck words jiggle
        later(function () {
            run(stage, [
                { transform: "translate3d(0,0,0)" },
                { transform: "translate3d(-6px,3px,0)", offset: 0.2 },
                { transform: "translate3d(4px,-2px,0)", offset: 0.5 },
                { transform: "translate3d(-2px,1px,0)", offset: 0.75 },
                { transform: "translate3d(0,0,0)" }
            ], { duration: 380, easing: "ease-out" });
        }, T_HIT);

        /* --- 4. it falls and breaks; the letters arrange themselves --- */
        later(function () {
            dice.style.visibility = "hidden";
            shadow.style.visibility = "hidden";
            sfx.play("crack");
            sfx.play("shatter");
            sfx.play("swirl");
            burst(cx, cy, size);
            run(stage, [
                { transform: "translate3d(0,0,0)" },
                { transform: "translate3d(0,8px,0)", offset: 0.2 },
                { transform: "translate3d(0,-4px,0)", offset: 0.5 },
                { transform: "translate3d(0,2px,0)", offset: 0.75 },
                { transform: "translate3d(0,0,0)" }
            ], { duration: 440, easing: "ease-out" });

            words[0].classList.remove("word--pending");
            letters.forEach(function (letter, i) {
                var d = slots[i];
                var total = SCATTER + HOLD + i * GAP + SETTLE;
                var sx = d.dx + rand(-1, 1) * size * 1.5;
                var sy = d.dy - size * rand(0.5, 1.7);
                var sz = Math.round(rand(30, 170));
                var rz = rand(-70, 70), ry = rand(-120, 120);
                function pose(x, y, z, a, b, sc) {
                    return "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px," + z + "px) rotateZ(" +
                        Math.round(a) + "deg) rotateY(" + Math.round(b) + "deg) scale(" + sc + ")";
                }
                run(letter, [
                    { transform: pose(d.dx, d.dy, 0, rand(-200, 200), rand(-300, 300), 0.35), easing: "cubic-bezier(0.15,0.85,0.3,1)" },
                    { transform: pose(sx, sy, sz, rz, ry, 1), offset: SCATTER / total, easing: "ease-in-out" },
                    { transform: pose(sx + rand(-14, 14), sy + rand(-14, 14), sz, rz + rand(-12, 12), ry + rand(-20, 20), 1), offset: (SCATTER + HOLD + i * GAP) / total, easing: "cubic-bezier(0.3,1.35,0.5,1)" },
                    { transform: pose(0, 0, 0, 0, 0, 1) }
                ], { duration: total });
                later(function () { sfx.play("tok", i); }, SCATTER + HOLD + i * GAP + Math.round(SETTLE * 0.82));
            });

            // 5. the whole name is there; the rest of the hero rises in
            var written = SCATTER + HOLD + (letters.length - 1) * GAP + SETTLE;
            later(function () { sfx.play("chime"); }, written - 80);
            later(function () {
                after.forEach(function (el) { el.classList.add("is-in"); });
            }, written - 150);
            later(function () { finish(false); }, written + 650);
        }, D_FLIGHT + T_HIT);
    }

    /* ====================================================================
       lean toward the pointer once it is finished
       ==================================================================== */
    var tiltBound = false;
    function enableTilt() {
        if (tiltBound || !canAnimate) { return; }
        tiltBound = true;

        var MAX_Y = 7, MAX_X = 4, EASE = 0.09;
        var cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
        var frame = 0, held = false;

        function apply() {
            stage.style.transform = "rotateX(" + cur.x.toFixed(2) + "deg) rotateY(" + cur.y.toFixed(2) + "deg)";
        }
        function tick() {
            cur.x += (tgt.x - cur.x) * EASE;
            cur.y += (tgt.y - cur.y) * EASE;
            apply();
            var settled = Math.abs(tgt.x - cur.x) < 0.01 && Math.abs(tgt.y - cur.y) < 0.01;
            if (settled && tgt.x === 0 && tgt.y === 0) {
                cur.x = 0; cur.y = 0;
                stage.style.transform = "";
                frame = 0;
                return;
            }
            frame = window.requestAnimationFrame(tick);
        }
        function kick() { if (!frame) { frame = window.requestAnimationFrame(tick); } }
        function aim(e) {
            var r = hero.getBoundingClientRect();
            var nx = ((e.clientX - r.left) / r.width) * 2 - 1;
            var ny = ((e.clientY - r.top) / r.height) * 2 - 1;
            tgt.y = Math.max(-1, Math.min(1, nx)) * MAX_Y;
            tgt.x = -Math.max(-1, Math.min(1, ny)) * MAX_X;
            kick();
        }
        function rest() { held = false; tgt.x = 0; tgt.y = 0; kick(); }

        hero.addEventListener("pointermove", function (e) {
            if (playing) { return; }
            if (e.pointerType === "mouse" || held) { aim(e); }
        }, { passive: true });
        hero.addEventListener("pointerdown", function (e) {
            if (playing || e.pointerType === "mouse") { return; }
            held = true;
            aim(e);
        }, { passive: true });
        hero.addEventListener("pointerup", function (e) {
            if (e.pointerType !== "mouse") { rest(); }
        }, { passive: true });
        hero.addEventListener("pointercancel", rest, { passive: true });
        hero.addEventListener("pointerleave", rest, { passive: true });
    }

    /* ====================================================================
       go: it plays every time the page loads
       ==================================================================== */
    buildLetters();
    sfx.onChange(refreshControls);

    if (controls) {
        if (canAnimate) {
            controls.hidden = false;
            if (sfx.state() === "na" && soundBtn) { soundBtn.hidden = true; }
        } else {
            controls.hidden = true;
        }
    }

    if (canAnimate) {
        sfx.init();
        start();
        // The browser keeps sound locked until the visitor does something: the first
        // tap, click or key press unlocks it, and the cues that follow are heard.
        var unlockOnce = function () {
            sfx.unlock();
            ["pointerdown", "keydown", "touchstart"].forEach(function (t) {
                document.removeEventListener(t, unlockOnce, true);
            });
        };
        ["pointerdown", "keydown", "touchstart"].forEach(function (t) {
            document.addEventListener(t, unlockOnce, true);
        });
    } else {
        showFinal();
    }

    document.addEventListener("keydown", function (e) { if (playing && e.key === "Escape") { finish(true); } });

    if (replayBtn && canAnimate) {
        replayBtn.addEventListener("click", function () {
            if (playing) {
                finish(true);
            } else {
                try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }
                catch (err) { window.scrollTo(0, 0); }
                start();
            }
        });
    }
    if (soundBtn) {
        soundBtn.addEventListener("click", function () {
            var st = sfx.state();
            if (st === "locked") {
                sfx.unlock();
            } else if (st === "muted") {
                sfx.setMuted(false);
                sfx.unlock();
            } else {
                sfx.setMuted(true);
            }
            refreshControls();
        });
    }
    refreshControls();
})();
