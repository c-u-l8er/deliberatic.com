/* ==========================================================================
   Deliberatic — the identifying animation. SHELL.md §8.

   IT PERFORMS THE h1's QUESTION rather than illustrating it, in four acts:

     1. ARGUE      Nodes are positions, solid edges support, dashed attack,
                   and a node's size is an acceptability computed the way
                   §2.2 computes one — own weight, plus supports, minus
                   attacks. A spread of sizes IS the disagreement.
     2. AVERAGE    Every position slides into the centroid and one colourless
                   dot is left at the size of the mean: a value nobody argued
                   for, standing where the argument was.
     3. REFUSE     The dot opens, each position returns to exactly where it
                   stood, the leader is marked, and every loser comes back
                   inside a ring — because losing is not deletion.
     4. VINDICATE  A ringed loser rises and takes the lead. It can only do
                   that because it was still there.

   AND THE POINTER IS THE AVERAGING FORCE: move toward the drawing and the
   distinctions collapse under your own hand; move away and they spring back,
   ringed. The collapse cannot be made to stick.

   WHAT IT IS NOT: an instrument. σ here is a drawing, not a measurement, and
   no line of Deliberatic runs to produce it. It takes no input from the
   document and writes nothing back — delete the <script> that loads this file
   and every figure, chip, status row and word on the page is still there.

   §8.2 is written in blood: gpscoord.com published `for (let i = 0; i < 12;
   i++)` as "12 Active Pathfinders" for months. So every number steering this
   drawing is declared in one marked block and launch-gate.mjs refuses the
   build if one is also printed on the page. THE COUNTS ARE DELIBERATELY NOT
   ANYTHING THE SPEC COUNTS.
   ========================================================================== */
(function identity() {
    // The one document-level query here. Everything else is scoped to the
    // host, so the animation cannot reach any other part of the page.
    const host = document.querySelector("[data-identity-animation]");
    if (!host) return;
    const NS = "http://www.w3.org/2000/svg";
    const G = (c) => host.querySelector(c);
    const gAtt = G(".id-att"), gSup = G(".id-sup"), gArg = G(".id-arg"),
        gRing = G(".id-ring"), gMean = G(".id-mean");
    if (!gAtt || !gSup || !gArg || !gRing || !gMean) return;

    /* IDENTITY-CONSTANTS-START */
    const ID_ARGS = 11;
    const ID_ATTACKS = 13;
    /* Was 17 until the r9 contact form put a dated sentence on the page whose
       day-of-month is 17. §8.5 is unambiguous about which side moves: THE
       ANIMATION CHANGES, never the page. */
    const ID_SUPPORTS = 23;
    /* The four acts, in tenths of a second. */
    const ID_ARGUE = 54;
    const ID_MEAN = 29;
    const ID_KEEP = 38;
    const ID_RISE = 33;
    const ID_SEED = 60413;
    /* IDENTITY-CONSTANTS-END */

    const C = 160;
    let s = ID_SEED;
    const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const sm = (u) => u * u * (3 - 2 * u);
    const mk = (g, t) => { const e = document.createElementNS(NS, t); g.appendChild(e); return e; };
    const at = (e, k, v) => e.setAttribute(k, v.toFixed(2));
    const put = (e, x, y, r, o) => { at(e, "cx", x); at(e, "cy", y); at(e, "r", r); at(e, "opacity", o); };

    /* Best-candidate placement, not hubs-with-jitter: SHELL.md r13 measured
       that jittered placement clumps by construction and leaves dead field. */
    const A = [];
    for (let i = 0; i < ID_ARGS; i++) {
        let bx = 0, by = 0, bd = -1;
        for (let c = 0; c < 9; c++) {
            const g = rnd() * 6.283, d = 126 * Math.sqrt(rnd());
            const x = C + Math.cos(g) * d, y = C + Math.sin(g) * d;
            let m = 1e9;
            for (const n of A) m = Math.min(m, (n.bx - x) ** 2 + (n.by - y) ** 2);
            if (m > bd) { bd = m; bx = x; by = y; }
        }
        A.push({
            bx, by, X: bx, Y: by, cls: "", dx: 3 + rnd() * 6, dy: 3 + rnd() * 6,
            wx: 0.1 + rnd() * 0.14, wy: 0.09 + rnd() * 0.13,
            px: rnd() * 6.283, py: rnd() * 6.283,
            w: 0.1 + rnd() * 0.42,  // evidence weight, re-drawn every round
            sigma: 0.5,             // acceptability — never printed anywhere
            el: mk(gArg, "circle"), ring: mk(gRing, "circle"),
        });
    }
    const CX = A.reduce((t, n) => t + n.bx, 0) / ID_ARGS;
    const CY = A.reduce((t, n) => t + n.by, 0) / ID_ARGS;

    /* Edges join near neighbours (r13 again — long chords read as noise) and
       the two kinds interleave along that sorted list, so neither is uniformly
       the longer. The stylesheet decides what each looks like; this file
       decides nothing about colour. */
    const ATT = [], SUP = [], P = [];
    for (let i = 0; i < ID_ARGS; i++)
        for (let j = i + 1; j < ID_ARGS; j++)
            P.push([i, j, (A[i].bx - A[j].bx) ** 2 + (A[i].by - A[j].by) ** 2]);
    P.sort((p, q) => p[2] - q[2]);
    for (const p of P.slice(0, ID_ATTACKS + ID_SUPPORTS)) {
        const a = ATT.length * ID_SUPPORTS <= SUP.length * ID_ATTACKS;
        (a ? ATT : SUP).push({ a: p[0], b: p[1], el: mk(a ? gAtt : gSup, "line") });
    }
    const mEl = mk(gMean, "circle");
    const inS = A.map(() => []), inA = A.map(() => []);
    for (const e of SUP) { inS[e.a].push(e.b); inS[e.b].push(e.a); }
    for (const e of ATT) inA[e.b].push(e.a);

    /* σ(a) = w(a) + Σ σ(supporters)·γ⁺ − Σ σ(attackers)·γ⁻, one relaxation
       step per frame. γ⁺ + γ⁻ < 1 is the contraction condition the page
       quotes; the fixpoint is what the graph visibly eases toward. */
    function solve(steps) {
        for (let k = 0; k < steps; k++)
            for (let i = 0; i < ID_ARGS; i++) {
                let v = A[i].w;
                for (const j of inS[i]) v += A[j].sigma * 0.07;
                for (const j of inA[i]) v -= A[j].sigma * 0.19;
                A[i].sigma += (Math.max(0.06, Math.min(1, v)) - A[i].sigma) * 0.05;
            }
    }
    /* Part-solved, not solved: the opening frame has to be differentiated
       enough to read (it is the whole of it under reduced motion) while still
       having somewhere to go, or the first and most-watched act is static. */
    solve(24);
    const lead = () => A.reduce((b, n, i) => (n.sigma > A[b].sigma ? i : b), 0);

    const T1 = ID_ARGUE / 10, T2 = T1 + ID_MEAN / 10;
    const T3 = T2 + ID_KEEP / 10, T4 = T3 + ID_RISE / 10;

    /* The pointer never touches the page: it is read off window coordinates
       against this element's own box, so the layer keeps pointer-events:none
       and cannot swallow a click or a scroll anywhere in the hero. */
    let ptr = 0, want = 0, held = false;
    window.addEventListener("pointermove", (ev) => {
        // Hover only. A finger lifting over the drawing sends no further move
        // event, so a touch would collapse the picture and leave it collapsed.
        if (ev.pointerType === "touch") return;
        const r = host.getBoundingClientRect();
        if (!r.width) return;
        const x = (ev.clientX - r.left - r.width / 2) / r.width;
        const y = (ev.clientY - r.top - r.height / 2) / r.height;
        want = Math.max(0, 1 - Math.sqrt(x * x + y * y) * 2.6);
    }, { passive: true });

    function wires(list, op) {
        for (const e of list) {
            const p = A[e.a], q = A[e.b];
            at(e.el, "x1", p.X); at(e.el, "y1", p.Y);
            at(e.el, "x2", q.X); at(e.el, "y2", q.Y);
            at(e.el, "opacity", op(p, q));
        }
    }

    let cyc = 0, prev = 0, act = 0, win = -1, rise = -1;
    function draw(T) {
        cyc += Math.max(0, Math.min(0.2, T - prev));
        prev = T;
        if (cyc >= T4) cyc -= T4;
        ptr += (want - ptr) * 0.14;

        const a = cyc < T1 ? 0 : cyc < T2 ? 1 : cyc < T3 ? 2 : 3;
        if (a !== act) {
            act = a;
            // A round is over: fresh weights, no leader, nothing ringed.
            if (a === 0) { for (const n of A) n.w = 0.1 + rnd() * 0.42; win = -1; }
            // Averaging refused. Whoever leads is the verdict, and the weakest
            // survivor is the one who will be vindicated.
            if (a === 2) {
                win = lead();
                rise = A.reduce((b, n, i) => (i !== win && n.sigma < A[b].sigma ? i : b), win ? 0 : 1);
            }
            if (a === 3 && rise >= 0) A[rise].w = 0.95;
        }
        solve(1);
        // Acts 2 and 3 re-read the leader every frame, so the vindicated
        // dissenter takes the mark by overtaking rather than by decree.
        if (act >= 2) win = lead();

        /* k is how far the picture has been averaged. Whichever is further
           along wins — the cycle's own collapse, or the visitor's hand — and
           letting go of a collapse you caused drops the clock into act 3, so
           the refusal happens in front of whoever performed the averaging. */
        let k = 0;
        if (act === 1) k = sm(Math.min(1, (cyc - T1) / ((T2 - T1) * 0.62)));
        else if (act === 2) k = sm(Math.max(0, 1 - (cyc - T2) / ((T3 - T2) * 0.34)));
        // Release is detected on where the pointer IS, not on the eased ptr:
        // waiting for the ease means the picture springs open once on its own
        // and is then slammed shut again by act 2 starting at k = 1.
        if (want > 0.5) held = true;
        else if (held && want < 0.16) { held = false; if (cyc < T2) cyc = T2; }
        k = Math.max(k, sm(Math.min(1, ptr)));
        // A ring means kept-after-losing, so it cannot precede a verdict.
        const kept = win >= 0 ? Math.max(0, 1 - k) : 0;

        let sum = 0;
        for (let i = 0; i < ID_ARGS; i++) {
            const n = A[i], b = 1 - k;
            n.X = n.bx + Math.sin(T * n.wx + n.px) * n.dx * b + (CX - n.bx) * k;
            n.Y = n.by + Math.cos(T * n.wy + n.py) * n.dy * b + (CY - n.by) * k;
            const r = 2.2 + n.sigma * 11;
            sum += n.sigma;
            put(n.el, n.X, n.Y, r, (0.34 + n.sigma * 0.58) * Math.max(0, 1 - k * 1.2));
            const c = i === win ? "win" : "";
            if (c !== n.cls) n.el.setAttribute("class", n.cls = c);
            // The ring is the whole argument: a position that lost is still
            // drawn, still there, and still able to come back.
            put(n.ring, n.X, n.Y, r + 4.2, c ? 0 : kept * 0.42);
        }
        // The mean: one dot the size of the average, where nobody stood.
        put(mEl, CX, CY, 2.2 + (sum / ID_ARGS) * 11, k > 0.55 ? (k - 0.55) * 2 : 0);

        wires(SUP, (p, q) => (0.06 + Math.min(p.sigma, q.sigma) * 0.44) * (1 - k));
        // An attack shows while the attacker is strong and its target is not
        // yet settled. Decoration, not a semantics.
        wires(ATT, (p, q) => (0.08 + p.sigma * (1 - q.sigma) * 0.72) * (1 - k));
        for (const e of ATT) at(e.el, "stroke-dashoffset", -T * 9);
    }

    /* The first frame is always painted, so the box is never empty — including
       under prefers-reduced-motion, where that frame is all there is, and where
       it shows the argued graph rather than the collapse. Nothing waits on an
       IntersectionObserver: it does not fire in a non-compositing renderer, and
       an animation that never starts reads as a broken page. */
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
        const go = !(mq && mq.matches) && !document.hidden && onScreen();
        // prev is re-based on resume, or a backgrounded tab comes back with a
        // multi-minute delta and the cycle skips an act.
        if (go && !raf) { prev = performance.now() / 1000; raf = requestAnimationFrame(frame); }
        else if (!go) stop();
    }
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick, { passive: true });
    document.addEventListener("visibilitychange", tick);
    if (mq && mq.addEventListener) mq.addEventListener("change", tick);
    tick();
})();
