// Etan Berkowitz: "Arcade Floor". Plain JS, no dependencies.

// ---------- config ----------
const INK = '#0D1B1E',
    PINK = '#F486D0',
    YEL = '#F9ED84',
    BLUE = '#2DC7FF',
    PAPER = '#FFFDF7';
const FLOATERS = 6; // floating tiles on screen
const EVERY = 5; // every N coins, a speech bubble pops up
const JACKPOT = 25; // every N coins, jackpot
const COST = 10; // coins it takes to send a message
const SWITCH_AT = 20; // catch this many and the unlock tab folds down; feed it this many to unlock the old-site switch

// [word, payline icon, cursor, background pattern]
const WORDS = [
    ['community', 'hand', 'heart', 'plain'],
    ['chilling', 'cassette', 'bolt', 'stripes'],
    ['psych rock', 'cassette', 'star', 'grid'],
    ['film photos', 'camera', 'film', 'dots'],
    ['video juegos', 'camera', 'film', 'dots'],
    ['nerdy shit', 'skull', 'die', 'grid'],
    ['video games', 'skull', 'die', 'checker'],
    ['being a dad', 'hand', 'star', 'dots'],
    ['IBS', 'skull', 'heart', 'lines'],
    ['comedy', 'skull', 'heart', 'grid'],
    ['improv', 'hand', 'star', 'stripes'],
].map(([w, icon, cur, bg]) => ({ w, icon, cur, bg }));

// Shuffle on every page load, so each visit gets a fresh order and sees every word once before any repeat.
for (let a = WORDS.length - 1; a > 0; a--) {
    const b = Math.floor(Math.random() * (a + 1));
    [WORDS[a], WORDS[b]] = [WORDS[b], WORDS[a]];
}

// The 3rd word every visitor sees, every visit. Not part of the regular rotation.
const MOM = { w: 'your mom', icon: 'hand', cur: 'heart', bg: 'checker' };
const ALL = [...WORDS, MOM];

const SAYS = [
    'rad!',
    '*fart sound*',
    'ok!!',
    '<3',
    'heck yes',
    'wow',
    'lol',
    'yes, and…',
    'get it gurlie',
    'nice!!',
    'omg',
    'tickle tickle',
    'woah',
];

const BGS = {
    plain: 'none',
    dots: 'radial-gradient(#E8B6D5 2px,transparent 2.6px)',
    stripes:
        'repeating-linear-gradient(45deg,#ECBFDB 0 10px,transparent 10px 22px)',
    grid: 'linear-gradient(#E8BAD7 2px,transparent 2px),linear-gradient(90deg,#E8BAD7 2px,transparent 2px)',
    checker:
        'conic-gradient(#ECC0DC 25%,transparent 0 50%,#ECC0DC 0 75%,transparent 0)',
    lines: 'repeating-linear-gradient(#F2CEE6 0 30px,#E3B1D0 30px 32px)',
};
const BGSIZE = {
    dots: '24px 24px',
    grid: '28px 28px',
    checker: '40px 40px',
    stripes: 'auto',
    lines: 'auto',
    plain: 'auto',
};
const SHADOWS = [PINK, BLUE, YEL];
const TINTS = ['#F2CEE6', '#F6D9EC', '#EEC4E0', '#F4D2E2', '#EFCDEB'];
const ICONS = ['skull', 'cassette', 'camera', 'hand'];
const TILE_SCHEMES = [
    { fg: YEL, bg: INK, shadow: PINK },
    { fg: INK, bg: YEL, shadow: INK },
    { fg: INK, bg: PINK, shadow: BLUE },
    { fg: BLUE, bg: INK, shadow: YEL },
];
const CUR = {
    hand: 'url(assets/cursors/pointer.png) 7 1, pointer',
    star: 'url(assets/cursors/star.png) 11 11, auto',
    heart: 'url(assets/cursors/heart.png) 9 8, auto',
    bolt: 'url(assets/cursors/bolt.png) 1 22, auto',
    die: 'url(assets/cursors/die.png) 10 10, auto',
    film: 'url(assets/cursors/film.png) 10 10, auto',
};

// ---------- tiny helpers ----------
const $ = (id) => document.getElementById(id);
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const calm = () => motion.matches; // calm mode: no bursts, shakes, ticker; floaters freeze
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const div = (css) => {
    const d = document.createElement('div');
    d.setAttribute('aria-hidden', 'true');
    if (css) d.style.cssText = css;
    return d;
};

// Icon tinted via CSS mask, so the black line-art SVGs can take any color.
function icon(name, color, size) {
    const s = document.createElement('span');
    const m = `url("assets/icons/${name}.svg") center / contain no-repeat`;
    s.style.cssText = `display:block;width:${size}px;height:${size}px;background:${color}`;
    s.style.setProperty('-webkit-mask', m);
    s.style.setProperty('mask', m);
    return s;
}
function tile(name, { fg, bg, shadow, size }) {
    const t = div(
        `width:${size}px;height:${size}px;background:${bg};border:3px solid ${INK};box-shadow:${Math.round(size / 12)}px ${Math.round(size / 12)}px 0 ${shadow};display:grid;place-items:center`,
    );
    t.appendChild(icon(name, fg, Math.round(size * 0.74)));
    return t;
}
function bubble(text, { bg = PAPER, size = 18 } = {}) {
    const b = div(
        `position:relative;font:800 ${size}px/1.1 "Libre Franklin",sans-serif;color:${INK};background:${bg};border:3px solid ${INK};box-shadow:4px 4px 0 ${INK};padding:.45em .7em;white-space:nowrap;border-radius:14px`,
    );
    b.textContent = text;
    const tail = document.createElement('span');
    tail.style.cssText = `position:absolute;left:18px;bottom:-12px;width:16px;height:16px;background:${bg};border-right:3px solid ${INK};border-bottom:3px solid ${INK};transform:skewX(30deg) rotate(45deg)`;
    b.appendChild(tail);
    return b;
}
function coinNode() {
    const c = div(
        `width:40px;height:40px;border-radius:50%;background:${YEL};border:3px solid ${INK};box-shadow:3px 3px 0 ${INK};display:grid;place-items:center;font:900 14px 'Libre Franklin',sans-serif;color:${INK}`,
    );
    c.textContent = '+1';
    return c;
}

// Pop a node at (x, y) in a fixed layer, then fade it out.
function pop(
    layer,
    x,
    y,
    node,
    { life = 1800, rot = rnd(-15, 15), rise = 0 } = {},
) {
    const w = div(
        `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);pointer-events:none`,
    );
    w.appendChild(node);
    layer.appendChild(w);
    while (layer.children.length > 40) layer.firstChild.remove();
    const T = (s, dy = 0) =>
        `translate(-50%,calc(-50% - ${dy}px)) scale(${s}) rotate(${rot}deg)`;
    const a = calm()
        ? w.animate(
              [
                  { opacity: 0 },
                  { opacity: 1, offset: 0.15 },
                  { opacity: 1, offset: 0.8 },
                  { opacity: 0 },
              ],
              { duration: life, fill: 'forwards' },
          )
        : w.animate(
              [
                  { transform: T(0), opacity: 1 },
                  { transform: T(1.18), offset: 0.1 },
                  { transform: T(1), offset: 0.18, opacity: 1 },
                  { transform: T(1, rise), offset: 0.82, opacity: 1 },
                  { transform: T(0.6, rise), opacity: 0 },
              ],
              { duration: life, easing: 'ease-out', fill: 'forwards' },
          );
    a.onfinish = () => w.remove();
}

// Little radiating dashes.
function burst(
    layer,
    x,
    y,
    { n = 8, color = INK, len = 18, dist = 26, thick = 4, life = 320 } = {},
) {
    for (let i = 0; i < n; i++) {
        const ang = (i / n) * 360 + rnd(-8, 8);
        const s = div(
            `position:absolute;left:${x}px;top:${y}px;width:${len}px;height:${thick}px;background:${color};transform-origin:0 50%;pointer-events:none`,
        );
        layer.appendChild(s);
        s.animate(
            [
                {
                    transform: `rotate(${ang}deg) translateX(${dist}px) scaleX(.2)`,
                    opacity: 1,
                },
                {
                    transform: `rotate(${ang}deg) translateX(${dist + len * 1.6}px) scaleX(1)`,
                    opacity: 0,
                },
            ],
            { duration: life, easing: 'ease-out' },
        ).onfinish = () => s.remove();
    }
}

const shake = (el, px, ms) =>
    el.animate(
        [0, -1, 1, -1, 1, -0.5, 0].map((k) => ({
            transform: `translate(${k * px}px,${(k * px) / 3}px)`,
        })),
        { duration: ms, composite: 'add' },
    );

// ---------- name: two staggered lines, pink + offset blue outline, drawn in, letters wiggle ----------
async function mountName(host) {
    const o = {
        lines: ['Etan', 'Berkowitz'],
        indent: 0.62,
        size: 140,
        weight: 700,
        sw: 4.5,
        off: 5,
        lead: 1.02,
        dash: 1600,
    };
    try {
        await document.fonts.load(`${o.weight} ${o.size}px "Libre Franklin"`);
    } catch (e) {}
    const NS = 'http://www.w3.org/2000/svg';
    const el = (t) => document.createElementNS(NS, t);
    const svg = el('svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.cssText = 'display:block;width:100%;height:100%;overflow:visible';
    host.innerHTML = '';
    host.appendChild(svg);
    const font = `font-family:'Libre Franklin',sans-serif;font-weight:${o.weight};font-size:${o.size}px`;

    // Measure each glyph so letters can animate individually.
    let letters = [],
        maxX = 0,
        lastY = 0;
    const measure = () => {
        letters = [];
        maxX = 0;
        lastY = 0;
        let ok = true;
        o.lines.forEach((line, li) => {
            const y = o.size * (0.76 + li * o.lead);
            lastY = y;
            const m = el('text');
            m.setAttribute('x', li * o.indent * o.size);
            m.setAttribute('y', y);
            m.setAttribute('style', font);
            m.textContent = line;
            svg.appendChild(m);
            try {
                if (!(m.getComputedTextLength() > 0)) throw 0;
                for (let i = 0; i < line.length; i++) {
                    const sx = m.getStartPositionOfChar(i).x,
                        ex = m.getExtentOfChar(i);
                    if (!(ex.width > 0)) throw 0;
                    letters.push({ ch: line[i], x: sx, y, w: ex.width });
                    maxX = Math.max(maxX, ex.x + ex.width);
                }
            } catch (e) {
                ok = false;
            } finally {
                m.remove();
            }
        });
        return ok;
    };
    for (let tries = 0; !measure(); tries++) {
        if (tries > 120) {
            // fallback: approximate glyph metrics so the name still renders
            letters = [];
            maxX = 0;
            o.lines.forEach((line, li) => {
                const y = o.size * (0.76 + li * o.lead);
                lastY = y;
                let x = li * o.indent * o.size;
                for (const ch of line) {
                    const w = o.size * 0.6;
                    letters.push({ ch, x, y, w });
                    x += w;
                    maxX = Math.max(maxX, x);
                }
            });
            break;
        }
        await new Promise((r) =>
            document.hidden
                ? setTimeout(r, 120)
                : requestAnimationFrame(() => setTimeout(r, 30)),
        );
    }

    const pad = o.sw + 2;
    svg.setAttribute(
        'viewBox',
        `${-pad} ${-pad} ${maxX + o.off + pad * 2} ${lastY + o.off + pad * 2 + 2}`,
    );
    svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
    const groups = letters.map((L) => {
        const g = el('g');
        g.style.transformBox = 'fill-box';
        g.style.transformOrigin = '50% 100%';
        const mk = (dx, dy, stroke, fill) => {
            const t = el('text');
            t.setAttribute('x', L.x + dx);
            t.setAttribute('y', L.y + dy);
            t.setAttribute('style', font);
            t.textContent = L.ch;
            t.setAttribute('fill', fill || 'none');
            if (stroke) {
                t.setAttribute('stroke', stroke);
                t.setAttribute('stroke-width', o.sw);
                t.setAttribute('stroke-linejoin', 'round');
                t.setAttribute('stroke-dasharray', o.dash);
            }
            g.appendChild(t);
            return t;
        };
        const b = mk(o.off, o.off, BLUE);
        const f = mk(0, 0, null, INK);
        const a = mk(0, 0, PINK);
        const hit = el('rect');
        hit.setAttribute('x', L.x);
        hit.setAttribute('y', L.y - o.size * 0.74);
        hit.setAttribute('width', L.w);
        hit.setAttribute('height', o.size * 0.78);
        hit.setAttribute('fill', '#000');
        hit.setAttribute('fill-opacity', '0');
        g.appendChild(hit);
        svg.appendChild(g);
        const wiggle = () => {
            if (calm() || g._busy) return;
            g._busy = true;
            g.animate(
                [
                    { transform: 'rotate(0)' },
                    { transform: 'rotate(-14deg)' },
                    { transform: 'rotate(10deg)' },
                    { transform: 'rotate(-5deg)' },
                    { transform: 'rotate(0)' },
                ],
                { duration: 520, easing: 'ease-out' },
            ).onfinish = () => (g._busy = false);
        };
        g.addEventListener('pointerenter', wiggle);
        g.addEventListener('pointerdown', wiggle);
        return { a, b, f };
    });

    function draw() {
        groups.forEach(({ a, b, f }, i) => {
            [a, b, f].forEach((t) =>
                t.getAnimations().forEach((x) => x.cancel()),
            );
            if (calm()) return;
            const d = i * 85,
                E = {
                    duration: 1100,
                    easing: 'cubic-bezier(.6,0,.3,1)',
                    fill: 'both',
                };
            a.animate([{ strokeDashoffset: o.dash }, { strokeDashoffset: 0 }], {
                ...E,
                delay: d,
            });
            b.animate([{ strokeDashoffset: o.dash }, { strokeDashoffset: 0 }], {
                ...E,
                delay: d + 160,
            });
            f.animate([{ opacity: 0 }, { opacity: 1 }], {
                duration: 420,
                delay: d + 650,
                fill: 'both',
            });
        });
    }
    draw();
    return { draw };
}

// ---------- slot reel ----------
// Picks a font size (and maybe a 2-line split) so the word fills the window.
function split2(w) {
    const sp = [...w].map((c, i) => (c === ' ' ? i : -1)).filter((i) => i > 0);
    if (!sp.length) return null;
    const mid = w.length / 2,
        at = sp.reduce((a, b) =>
            Math.abs(b - mid) < Math.abs(a - mid) ? b : a,
        );
    return [w.slice(0, at), w.slice(at + 1)];
}
function fitSize(w, W, H, pad) {
    const cw = 0.58,
        avail = Math.max(80, W - pad * 2);
    const one = Math.min(H * 0.62, avail / (w.length * cw));
    const s = split2(w);
    if (s) {
        const two = Math.min(
            H * 0.38,
            avail / (Math.max(s[0].length, s[1].length) * cw),
        );
        if (two > one * 1.15) return { fs: Math.floor(two), lines: s };
    }
    return { fs: Math.floor(one), lines: [w] };
}

// spin(to) rolls to words[to]; the blurry filler only uses the first `fill` words.
function reel(win, words, fill = words.length) {
    const pad = 24;
    const col = div('display:block;will-change:transform');
    win.innerHTML = '';
    win.appendChild(col);
    let cur = 0,
        busy = false;
    const mk = (i) => {
        const W = win.clientWidth,
            H = win.clientHeight,
            d = document.createElement('div');
        d.style.cssText = `height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.06em;text-align:center;line-height:1;padding:0 ${pad}px;box-sizing:border-box;white-space:nowrap`;
        const f = fitSize(words[i], W, H, pad);
        d.style.fontSize = f.fs + 'px';
        f.lines.forEach((l) => {
            const s = document.createElement('span');
            s.textContent = l;
            d.appendChild(s);
        });
        return d;
    };
    const show = (i) => {
        col.innerHTML = '';
        col.appendChild(mk(i));
        cur = i;
    };
    show(cur);
    new ResizeObserver(() => {
        if (!busy) show(cur);
    }).observe(win);

    function spin(to) {
        if (busy) return null;
        if (calm()) {
            show(to);
            return Promise.resolve(to);
        }
        busy = true;
        const strip = [cur];
        for (let j = 0; j < 9; j++) {
            let r;
            do {
                r = Math.floor(Math.random() * fill);
            } while (r === strip[strip.length - 1] || r === to);
            strip.push(r);
        }
        strip.push(to);
        col.innerHTML = '';
        strip.forEach((j) => col.appendChild(mk(j)));
        const H = win.clientHeight,
            D = (strip.length - 1) * H;
        const a = col.animate(
            [
                { transform: 'translateY(0)', filter: 'blur(0px)' },
                { filter: 'blur(3px)', offset: 0.25 },
                {
                    transform: `translateY(${-D - H * 0.16}px)`,
                    filter: 'blur(0px)',
                    offset: 0.85,
                },
                { transform: `translateY(${-D}px)` },
            ],
            {
                duration: 1500,
                easing: 'cubic-bezier(.25,.6,.3,1)',
                fill: 'forwards',
            },
        );
        return new Promise((res) => {
            let done = false;
            const fin = () => {
                if (done) return;
                done = true;
                a.cancel();
                busy = false;
                show(to);
                res(to);
            };
            a.onfinish = fin;
            setTimeout(fin, 1600);
        });
    }
    const tease = () => {
        if (busy || calm()) return;
        col.animate(
            [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-10px)' },
                { transform: 'translateY(4px)' },
                { transform: 'translateY(0)' },
            ],
            { duration: 380, easing: 'ease-out' },
        );
    };
    return {
        spin,
        tease,
        get busy() {
            return busy;
        },
    };
}

// ---------- lever: click = yank + pull; drag past 55% = pull ----------
function lever(track, knob, onPull) {
    const max = () => Math.max(0, track.clientHeight - knob.offsetHeight);
    const yank = () => {
        if (calm()) return;
        const m = max();
        knob.animate(
            [
                { transform: 'translateY(0)' },
                { transform: `translateY(${m}px)`, offset: 0.35 },
                { transform: 'translateY(-6px)', offset: 0.8 },
                { transform: 'translateY(0)' },
            ],
            { duration: 700, easing: 'ease-out' },
        );
    };
    knob.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const y0 = e.clientY,
            m = max();
        let dy = 0;
        knob.setPointerCapture(e.pointerId);
        const mv = (ev) => {
            dy = clamp(ev.clientY - y0, 0, m);
            knob.style.transform = `translateY(${dy}px)`;
        };
        const up = () => {
            knob.removeEventListener('pointermove', mv);
            knob.removeEventListener('pointerup', up);
            knob.removeEventListener('pointercancel', up);
            knob.style.transform = '';
            if (dy < 6) {
                yank();
                onPull();
                return;
            }
            if (dy > m * 0.55) onPull();
            if (!calm())
                knob.animate(
                    [
                        { transform: `translateY(${dy}px)` },
                        { transform: 'translateY(-8px)', offset: 0.6 },
                        { transform: 'translateY(0)' },
                    ],
                    { duration: 420, easing: 'ease-out' },
                );
        };
        knob.addEventListener('pointermove', mv);
        knob.addEventListener('pointerup', up);
        knob.addEventListener('pointercancel', up);
    });
    return { yank };
}

// ---------- chase lights (each bulb stays well under 3 Hz) ----------
function chase(bulbs) {
    let t = 0;
    const ctl = { ms: 360 };
    const tick = () => {
        const c = calm();
        bulbs.forEach((el, j) => {
            el.style.opacity = (c ? j % 2 === 0 : (j + t) % 3 === 0) ? 1 : 0.25;
        });
        t++;
        setTimeout(tick, Math.max(180, ctl.ms));
    };
    tick();
    return ctl;
}

// ---------- collectible floaters: bounce like a screensaver; tap one and it flies into the coin box ----------
function floaters(layer, { count, size, make, target, onHit, onCollect }) {
    const items = [];
    let last = performance.now();
    const place = (f) => {
        f.w.style.transform = `translate(${f.x}px,${f.y}px) rotate(${f.rot}deg)`;
    };
    const spawn = (initial) => {
        const s = size(),
            w = div(`width:${s}px;height:${s}px`);
        w.className = 'floater';
        const node = make(items.length, s);
        w.appendChild(node);
        layer.appendChild(w);
        const a = rnd(0, 6.28),
            v = rnd(0.6, 1);
        const f = {
            w,
            s,
            x: rnd(0, Math.max(1, layer.clientWidth - s)),
            y: rnd(0, Math.max(1, layer.clientHeight - s)),
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            rot: rnd(-18, 18),
            vr: rnd(-0.25, 0.25),
            dead: false,
        };
        w.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            grab(f);
        });
        items.push(f);
        place(f);
        if (!initial && !calm())
            node.animate(
                [
                    { transform: 'scale(0)' },
                    { transform: 'scale(1.15)', offset: 0.7 },
                    { transform: 'scale(1)' },
                ],
                { duration: 380, easing: 'ease-out' },
            );
    };
    const grab = (f) => {
        if (f.dead) return;
        f.dead = true;
        const r = f.w.getBoundingClientRect(),
            lr = layer.getBoundingClientRect();
        const pt = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        onHit(pt);
        const done = () => {
            f.w.remove();
            onCollect(pt);
        };
        if (calm())
            f.w.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: 200,
                fill: 'forwards',
            }).onfinish = done;
        else {
            const tr = target.getBoundingClientRect();
            const tx = tr.left + tr.width / 2 - lr.left - f.s / 2,
                ty = tr.top + tr.height / 2 - lr.top - f.s / 2,
                from = f.w.style.transform;
            f.w.style.zIndex = 5;
            f.w.animate(
                [
                    { transform: from },
                    { transform: `${from} scale(1.25)`, offset: 0.18 },
                    {
                        transform: `translate(${tx}px,${ty}px) rotate(0deg) scale(.25)`,
                        opacity: 0.9,
                    },
                ],
                {
                    duration: 620,
                    easing: 'cubic-bezier(.5,0,.75,0)',
                    fill: 'forwards',
                },
            ).onfinish = done;
        }
        items.splice(items.indexOf(f), 1);
        setTimeout(() => spawn(false), 1400 + Math.random() * 1400);
    };
    const tick = (now) => {
        const dt = Math.min(50, now - last) / 16.7;
        last = now;
        if (!calm()) {
            const ww = layer.clientWidth,
                hh = layer.clientHeight;
            items.forEach((f) => {
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                f.rot += f.vr * dt;
                if (f.x < 0 || f.x > ww - f.s) {
                    f.vx = -f.vx;
                    f.x = clamp(f.x, 0, Math.max(0, ww - f.s));
                }
                if (f.y < 0 || f.y > hh - f.s) {
                    f.vy = -f.vy;
                    f.y = clamp(f.y, 0, Math.max(0, hh - f.s));
                }
                place(f);
            });
        }
        requestAnimationFrame(tick);
    };
    for (let n = 0; n < count; n++) spawn(true);
    requestAnimationFrame(tick);
}

// ---------- page ----------
const root = $('root'),
    cab = $('cab'),
    coinBox = $('coin'),
    slot = $('slot'),
    reelBtn = $('reel-btn'),
    pay = $('pay'),
    fx = $('fx');
let i = 0,
    coins = 0;

const name = mountName($('name-host'));
$('name-btn').addEventListener('click', async () => (await name).draw());

const theReel = reel(
    $('reel-win'),
    ALL.map((x) => x.w),
    WORDS.length,
);
const theLever = lever($('track'), $('knob'), () => pull(1, true));
const lights = chase([...$('bulbs').children]);

let pos = 0,
    spins = 0; // pos: place in the regular rotation
async function pull(d = 1, fromLever = false) {
    if (theReel.busy) return;
    let to;
    if (++spins === 2)
        to = WORDS.length; // 3rd word shown: your mom
    else to = pos = (pos + d + WORDS.length) % WORDS.length;
    const p = theReel.spin(to);
    if (!fromLever) theLever.yank();
    i = await p;
    $('reel-sr').textContent = `${ALL[i].w}. Spin for another thing.`;
    $('live').textContent = ALL[i].w;
    scene(true);
}

// Per-word background tint, pattern, cursor, cabinet shadow and payline tiles.
function scene(animate) {
    const W = ALL[i];
    root.style.backgroundColor = TINTS[i % TINTS.length];
    root.style.backgroundImage = BGS[W.bg];
    root.style.backgroundSize = BGSIZE[W.bg];
    root.style.cursor = CUR[W.cur];
    cab.style.boxShadow = `12px 12px 0 ${SHADOWS[i % 3]}`;
    pay.innerHTML = '';
    const sc = [
        { fg: INK, bg: PINK, shadow: BLUE },
        { fg: INK, bg: YEL, shadow: PINK },
        { fg: INK, bg: BLUE, shadow: YEL },
    ][i % 3];
    for (let j = 0; j < 3; j++) {
        const t = tile(W.icon, { ...sc, size: 44 });
        t.style.border = '3px solid #F2CEE6';
        pay.appendChild(t);
        if (animate && !calm())
            t.animate(
                [
                    { transform: 'translateY(-30px) scale(.4)', opacity: 0 },
                    {
                        transform: 'translateY(4px) scale(1.1)',
                        opacity: 1,
                        offset: 0.7,
                    },
                    { transform: 'none' },
                ],
                {
                    duration: 360,
                    delay: j * 110,
                    easing: 'ease-out',
                    fill: 'backwards',
                },
            );
    }
    if (animate && !calm()) {
        const b = reelBtn.getBoundingClientRect();
        burst(fx, b.left + 10, b.top + b.height / 2, {
            n: 6,
            color: YEL,
            dist: 14,
        });
        burst(fx, b.right - 10, b.top + b.height / 2, {
            n: 6,
            color: YEL,
            dist: 14,
        });
    }
}

function setCoins(n) {
    coins = Math.max(0, n);
    $('coin-num').textContent = String(coins).padStart(3, '0');
    $('coin-sr').textContent = `${coins} coins`;
    slot.classList.toggle('lit', coins >= COST);
    unlockTab.classList.toggle('lit', coins >= SWITCH_AT);
}

let told = false; // "u can afford a message" only pops once
function collect(pt) {
    setCoins(coins + 1);
    if (!calm())
        coinBox.animate(
            [
                { transform: 'scale(1)' },
                { transform: 'scale(1.4) rotate(-6deg)' },
                { transform: 'scale(1)' },
            ],
            { duration: 300, easing: 'ease-out' },
        );
    if (coins % JACKPOT === 0) return jackpot();
    if (coins >= SWITCH_AT && unlockTab.hidden && siteSwitch.hidden)
        return showUnlockTab();
    if (coins >= COST && !told) {
        told = true;
        return popAt(slot, 'ooh, u can afford a message');
    }
    if (coins % EVERY === 0) {
        const x = clamp(pt.x + 40, 90, innerWidth - 90),
            y = Math.max(90, pt.y - 30);
        pop(
            fx,
            x,
            y,
            bubble(pick(SAYS), {
                bg: pick([PAPER, YEL, PINK, BLUE]),
                size: 22,
            }),
            { life: 1900 },
        );
    }
}

function jackpot() {
    const r = cab.getBoundingClientRect();
    pop(
        fx,
        r.left + r.width / 2,
        r.top + 10,
        bubble('JACKPOT!!', { bg: PINK, size: 34 }),
        { life: 2400, rot: -5 },
    );
    if (calm()) return;
    lights.ms = 180;
    setTimeout(() => (lights.ms = 360), 2600);
    shake(cab, 10, 600);
    for (let n = 0; n < 24; n++)
        setTimeout(
            () =>
                pop(
                    fx,
                    Math.random() * innerWidth,
                    60 + Math.random() * (innerHeight - 120),
                    coinNode(),
                    { life: 1100, rise: 60, rot: 0 },
                ),
            n * 40,
        );
}

floaters($('floats'), {
    count: FLOATERS,
    size: () => (innerWidth < 600 ? 50 : 60),
    make: (n, s) => tile(ICONS[n % 4], { ...TILE_SCHEMES[n % 4], size: s }),
    target: coinBox,
    onHit: (pt) =>
        pop(fx, pt.x, pt.y - 24, coinNode(), { life: 900, rise: 50, rot: 0 }),
    onCollect: collect,
});

// Ticker: scroll the doubled text by half its width, forever. Off in calm mode.
let tickAnim;
function ticker() {
    const el = $('tick');
    if (tickAnim) tickAnim.cancel();
    if (calm()) return;
    const w = el.scrollWidth / 2;
    tickAnim = el.animate(
        [{ transform: 'translateX(0)' }, { transform: `translateX(${-w}px)` }],
        { duration: w * 28, iterations: Infinity },
    );
}
document.fonts.ready.then(ticker);
motion.addEventListener('change', ticker);

reelBtn.addEventListener('click', () => pull(1));
reelBtn.addEventListener('pointerenter', theReel.tease);

// ← / → spin from anywhere (except while typing or with the message dialog open).
addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (dlg.open || e.target.closest('input,textarea,select,[contenteditable]'))
        return;
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        pull(1);
    }
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        pull(-1);
    }
});

// Click empty space for a little burst.
root.addEventListener('pointerdown', (e) => {
    if (calm() || e.target.closest('button,a,dialog')) return;
    burst(fx, e.clientX, e.clientY, { n: 6, len: 12, dist: 8, thick: 3 });
});

// ---------- contact: a tiny coin door. Messages cost 10 coins. ----------
// Posts to Web3Forms in-page, so visitors never leave.
const dlg = $('msg'),
    form = $('msg-form'),
    broke = $('msg-broke'),
    msgStatus = $('msg-status'),
    send = form.querySelector('[type=submit]');

function popAt(el, text, bg = YEL) {
    const r = el.getBoundingClientRect();
    pop(
        fx,
        clamp(r.left + r.width / 2, 110, innerWidth - 110),
        r.top - 28,
        bubble(text, { bg, size: 18 }),
        { life: 2400, rot: -3 },
    );
}

// Pay up: coins hop out of the counter one at a time, arc down and drop into a coin door (`tab`).
let spending = false;
function spendCoins(n, tab) {
    spending = true;
    if (calm()) {
        setCoins(coins - n);
        spending = false;
        return Promise.resolve();
    }
    const from = coinBox.getBoundingClientRect(),
        hole = tab.querySelector('.slot-hole').getBoundingClientRect();
    const x0 = from.left + from.width / 2,
        y0 = from.top + from.height / 2;
    const tx = hole.left + hole.width / 2,
        ty = hole.top + hole.height / 2;
    const S = 28,
        at = (x, y) => `translate(${x - S / 2}px,${y - S / 2}px)`;
    tab.classList.add('eating'); // stay lit while it eats
    return new Promise((res) => {
        for (let k = 0; k < n; k++)
            setTimeout(() => {
                setCoins(coins - 1);
                coinBox.animate(
                    [
                        { transform: 'scale(1)' },
                        { transform: 'scale(.85) rotate(4deg)' },
                        { transform: 'scale(1)' },
                    ],
                    { duration: 160 },
                );
                const c = div(
                    `position:absolute;left:0;top:0;width:${S}px;height:${S}px;border-radius:50%;background:${YEL};border:3px solid ${INK};box-shadow:2px 2px 0 ${INK};display:grid;place-items:center;font:900 12px 'Libre Franklin',sans-serif;color:${INK};pointer-events:none`,
                );
                c.textContent = '1';
                fx.appendChild(c);
                const mx = (x0 + tx) / 2 + rnd(-90, 90),
                    my = (y0 + ty) / 2 - rnd(0, 60);
                c.animate(
                    [
                        { transform: `${at(x0, y0)} scale(.6)` },
                        {
                            transform: `${at(mx, my)} scale(1.2) rotate(${rnd(-200, 200)}deg)`,
                            offset: 0.45,
                        },
                        {
                            transform: `${at(tx, ty - 26)} scale(1) rotate(0deg)`,
                            offset: 0.85,
                        },
                        {
                            transform: `${at(tx, ty)} scale(.15, 1)`,
                            opacity: 0.4,
                        }, // edge-on, into the slot
                    ],
                    { duration: 720, easing: 'ease-in-out', fill: 'forwards' },
                ).onfinish = () => {
                    c.remove();
                    tab.animate(
                        [
                            { transform: 'none' },
                            { transform: 'translateY(3px) scale(1.06)' },
                            { transform: 'none' },
                        ],
                        { duration: 150 },
                    );
                    burst(fx, tx, ty - 6, {
                        n: 5,
                        color: YEL,
                        len: 8,
                        dist: 6,
                        thick: 3,
                        life: 260,
                    });
                    if (k === n - 1) {
                        tab.classList.remove('eating');
                        spending = false;
                        res();
                    }
                };
            }, k * 110);
    });
}

function showForm() {
    broke.hidden = true;
    form.hidden = false;
    $('msg-title').textContent = 'Leave a message';
    form.elements.name.focus();
}
function showBroke() {
    form.hidden = true;
    broke.hidden = false;
    $('msg-title').textContent = 'Insufficient funds';
    $('msg-have').textContent = coins;
    $('msg-later').focus();
}

slot.addEventListener('click', () => {
    if (spending) return;
    msgStatus.textContent = '';
    dlg.showModal();
    coins >= COST ? showForm() : showBroke();
});
$('msg-close').addEventListener('click', () => dlg.close());
$('msg-later').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
}); // click the backdrop to close

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(
        [...new FormData(form)].filter(([, v]) => v.trim() !== ''),
    );
    send.disabled = true;
    send.textContent = 'Sending…';
    msgStatus.textContent = '';
    try {
        const res = await fetch(form.action, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(data),
        });
        const out = await res.json();
        if (!out.success) throw new Error(out.message);
        form.reset();
        dlg.close();
        $('live').textContent = `Message sent. Thanks! That was ${COST} coins.`;
        spendCoins(COST, slot).then(() => popAt(slot, 'sent! ty!!'));
    } catch (err) {
        msgStatus.textContent =
            "Hmm, that didn't go through. Your coins are safe. Try again in a sec?";
    } finally {
        send.disabled = false;
        send.textContent = `Insert ${COST} coins & send`;
    }
});

// ---------- old/new site switch ----------
// Catch 20 coins and a mystery tab folds down. Feed it 20 coins and it turns into the switch.
// Nothing is remembered between page loads, so it has to be earned every time.
const unlockTab = $('unlock'),
    siteSwitch = $('site-switch');

function showUnlockTab() {
    unlockTab.hidden = false;
    if (!calm())
        unlockTab.animate(
            [
                { transform: 'perspective(300px) rotateX(-95deg)' },
                { transform: 'perspective(300px) rotateX(18deg)', offset: 0.6 },
                { transform: 'perspective(300px) rotateX(-6deg)', offset: 0.85 },
                { transform: 'perspective(300px) rotateX(0)' },
            ],
            { duration: 650, easing: 'ease-out' },
        );
    popAt(unlockTab, 'ooh what’s this', BLUE);
    $('live').textContent = 'Something new appeared under the cabinet.';
}

unlockTab.addEventListener('click', () => {
    if (spending) return;
    if (coins < SWITCH_AT) {
        if (!calm()) shake(unlockTab, 4, 300);
        popAt(unlockTab, `need ${SWITCH_AT - coins} more coins`, PINK);
        $('live').textContent = `It costs ${SWITCH_AT} coins. You have ${coins}.`;
        return;
    }
    spendCoins(SWITCH_AT, unlockTab).then(() => {
        unlockTab.hidden = true;
        siteSwitch.hidden = false;
        if (!calm())
            siteSwitch.animate(
                [
                    { transform: 'scale(0)' },
                    { transform: 'scale(1.2)', offset: 0.7 },
                    { transform: 'scale(1)' },
                ],
                { duration: 400, easing: 'ease-out' },
            );
        popAt(siteSwitch, 'unlocked: my old site', BLUE);
        $('live').textContent = 'Unlocked: a switch to my old site.';
        siteSwitch.focus();
    });
});
siteSwitch.addEventListener('click', e => {
    if (calm()) return;
    e.preventDefault();
    siteSwitch.classList.add('flipped');
    setTimeout(() => (location.href = siteSwitch.href), 220);
});

$('reel-sr').textContent = `${ALL[i].w}. Spin for another thing.`;
scene(false);
