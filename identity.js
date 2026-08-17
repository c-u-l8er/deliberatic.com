/* ==========================================================================
   Deliberatic — the identifying animation. SHELL.md §8.

   WHAT IT DEPICTS: an argument graph settling. Nodes are positions; the dashed
   edges are attacks, the solid ones supports; each node's size eases toward an
   acceptability that is re-perturbed every few seconds, so the graph visibly
   converges, holds, and is disturbed again. That is the subject of this site.

   WHAT IT IS NOT: an instrument. It renders no data and asserts nothing. It
   takes no input from the document and writes nothing back into it — delete
   the <script> that loads this file and every figure, chip, status row and
   word on the page is still there.

   §8.2 is written in blood: gpscoord.com published `for (let i = 0; i < 12;
   i++)` as "12 Active Pathfinders" for months. So the numbers that steer this
   drawing are declared in one marked block, and launch-gate.mjs refuses the
   build if any of them also appears as a number in the page's text. THE
   COUNTS BELOW ARE DELIBERATELY NOT ANYTHING THE SPEC COUNTS — the DAF has no
   fixed number of arguments, and if it did, this would not be it.
   ========================================================================== */
(function identity() {
    // The one document-level query in this file. Everything else is scoped to
    // the host, so the animation cannot reach any other part of the page.
    const host = document.querySelector("[data-identity-animation]");
    if (!host) return;
    const NS = "http://www.w3.org/2000/svg";
    const gAtt = host.querySelector(".id-att");
    const gSup = host.querySelector(".id-sup");
    const gArg = host.querySelector(".id-arg");
    if (!gAtt || !gSup || !gArg) return;

    /* IDENTITY-CONSTANTS-START */
    const ID_ARGS = 11;
    const ID_ATTACKS = 13;
    /* Was 17 until the r9 contact form put a dated sentence on the page whose
       day-of-month is 17, and the gate found the collision. SHELL.md §8.5
       is unambiguous about which side moves: THE ANIMATION CHANGES, never the
       page. The page's figures have witnesses; a decoration may pick any
       number that is not also printed as a fact. 23 is not on the page. */
    const ID_SUPPORTS = 23;
    const ID_SETTLE = 46;
    const ID_SEED = 60413;
    /* IDENTITY-CONSTANTS-END */

    const SIZE = 320;
    const C = SIZE / 2;
    let s = ID_SEED;
    const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

    const A = [];
    for (let i = 0; i < ID_ARGS; i++) {
        const ang = (i / ID_ARGS) * Math.PI * 2 + rnd() * 0.5;
        const rad = 132 * (0.42 + rnd() * 0.58);
        const el = document.createElementNS(NS, "circle");
        gArg.appendChild(el);
        A.push({
            bx: C + Math.cos(ang) * rad,
            by: C + Math.sin(ang) * rad,
            dx: 4 + rnd() * 11,
            dy: 4 + rnd() * 11,
            wx: 0.11 + rnd() * 0.17,
            wy: 0.1 + rnd() * 0.16,
            px: rnd() * 6.283,
            py: rnd() * 6.283,
            x: 0, y: 0,
            sigma: 0.5,          // acceptability, eased — never printed anywhere
            target: rnd(),
            el: el,
        });
    }

    // Edges. Attacks and supports are drawn into separate groups so the
    // stylesheet decides what each looks like; this file decides nothing about
    // colour.
    function wire(group, count, cls) {
        const out = [];
        const seen = new Set();
        for (let guard = 0; out.length < count && guard < 500; guard++) {
            const a = Math.floor(rnd() * ID_ARGS);
            const b = Math.floor(rnd() * ID_ARGS);
            if (a === b) continue;
            const key = cls + Math.min(a, b) + ":" + Math.max(a, b);
            if (seen.has(key)) continue;
            seen.add(key);
            const el = document.createElementNS(NS, "line");
            group.appendChild(el);
            out.push({ a: a, b: b, el: el });
        }
        return out;
    }
    const ATT = wire(gAtt, ID_ATTACKS, "a");
    const SUP = wire(gSup, ID_SUPPORTS, "s");

    let lastRound = -1e9;
    function draw(T) {
        // A new round every ID_SETTLE tenths of a second: fresh targets, and
        // the graph eases toward them. Convergence you can watch is the whole
        // idea; a number describing it would be a claim, so there isn't one.
        if (T - lastRound > ID_SETTLE / 10) {
            lastRound = T;
            for (const n of A) n.target = 0.18 + rnd() * 0.82;
        }
        for (const n of A) {
            n.sigma += (n.target - n.sigma) * 0.045;
            n.x = n.bx + Math.sin(T * n.wx + n.px) * n.dx;
            n.y = n.by + Math.cos(T * n.wy + n.py) * n.dy;
            n.el.setAttribute("cx", n.x.toFixed(1));
            n.el.setAttribute("cy", n.y.toFixed(1));
            n.el.setAttribute("r", (2.2 + n.sigma * 6.4).toFixed(2));
            n.el.setAttribute("opacity", (0.32 + n.sigma * 0.6).toFixed(3));
        }
        for (const e of SUP) {
            const p = A[e.a], q = A[e.b];
            e.el.setAttribute("x1", p.x.toFixed(1));
            e.el.setAttribute("y1", p.y.toFixed(1));
            e.el.setAttribute("x2", q.x.toFixed(1));
            e.el.setAttribute("y2", q.y.toFixed(1));
            e.el.setAttribute("opacity", (0.06 + Math.min(p.sigma, q.sigma) * 0.44).toFixed(3));
        }
        for (const e of ATT) {
            const p = A[e.a], q = A[e.b];
            e.el.setAttribute("x1", p.x.toFixed(1));
            e.el.setAttribute("y1", p.y.toFixed(1));
            e.el.setAttribute("x2", q.x.toFixed(1));
            e.el.setAttribute("y2", q.y.toFixed(1));
            // An attack shows while the attacker is strong and its target is
            // not yet settled. Decoration, not a semantics.
            e.el.setAttribute("opacity", (0.08 + p.sigma * (1 - q.sigma) * 0.72).toFixed(3));
            e.el.setAttribute("stroke-dashoffset", (-T * 9).toFixed(1));
        }
    }

    /* The first frame is always painted, so the box is never empty — including
       under prefers-reduced-motion, where that frame is all there is. Nothing
       here waits on an IntersectionObserver: it does not fire in a
       non-compositing renderer, and an animation that never starts reads as a
       broken page. */
    draw(0);

    const mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0, last = 0;
    function frame(ts) {
        raf = requestAnimationFrame(frame);
        if (ts - last < 33) return; // ~30fps is plenty, and it runs on a phone
        last = ts;
        draw(ts / 1000);
    }
    function onScreen() {
        const r = host.getBoundingClientRect();
        return r.bottom > -40 && r.top < (window.innerHeight || 0) + 40;
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    function tick() {
        const want = !(mq && mq.matches) && !document.hidden && onScreen();
        if (want && !raf) raf = requestAnimationFrame(frame);
        else if (!want) stop();
    }
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick, { passive: true });
    document.addEventListener("visibilitychange", tick);
    if (mq && mq.addEventListener) mq.addEventListener("change", tick);
    tick();
})();
