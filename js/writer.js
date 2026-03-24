document.addEventListener('DOMContentLoaded', () => {

    /* ─── TYPEWRITER ─────────────────────────────────────── */
    const titleEl    = document.getElementById('typewriter-title');
    const headlineEl = document.getElementById('typewriter-headline');
    const titleText    = "Hi, I'm <span class='neon-span'>Anshal Chopra</span>";
    const headlineText = "Analytics Engineer | Business Intelligence Specialist";

    function typeWriter(el, html, speed, callback) {
        // Strip tags to get visible text length, then type char by char
        // We type raw HTML but skip tag brackets as invisible
        let i = 0;
        el.classList.add('typing');

        function tick() {
            if (i < html.length) {
                if (html[i] === '<') {
                    // find closing >
                    const close = html.indexOf('>', i);
                    i = close + 1;
                    el.innerHTML = html.slice(0, i);
                    tick();
                } else {
                    el.innerHTML = html.slice(0, ++i);
                    setTimeout(tick, Math.random() * speed.jitter + speed.base);
                }
            } else {
                el.classList.remove('typing');
                if (callback) callback();
            }
        }
        tick();
    }

    setTimeout(() => {
        typeWriter(titleEl, titleText, { base: 38, jitter: 22 }, () => {
            setTimeout(() => {
                typeWriter(headlineEl, headlineText, { base: 30, jitter: 18 }, () => {
                    headlineEl.classList.add('typing'); // leave cursor blinking
                });
            }, 500);
        });
    }, 800);

    /* ─── SCROLL REVEAL ──────────────────────────────────── */
    const revealObs = new IntersectionObserver(
        (entries) => entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                revealObs.unobserve(e.target);
            }
        }),
        { threshold: 0.10 }
    );

    // Stagger tech groups
    document.querySelectorAll('.tech-group').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.10}s`;
    });

    // Stagger timeline cards
    document.querySelectorAll('.tl-card').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.08}s`;
    });

    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    /* ─── SCROLL SPY ─────────────────────────────────────── */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const spyObs = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    const link = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
                    if (link) link.classList.add('active');
                }
            });
        },
        {
            rootMargin: `-${Math.floor(window.innerHeight * 0.42)}px 0px -${Math.floor(window.innerHeight * 0.42)}px 0px`,
            threshold: 0
        }
    );

    sections.forEach(s => spyObs.observe(s));
});
