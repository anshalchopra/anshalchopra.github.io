/* ─── WEATHER FETCHING ────────────────────────────────── */
const fetchWeather = (async () => {
    try {
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=49.2827&longitude=-123.1207&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=America/Los_Angeles';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API error');
        return await response.json();
    } catch (err) {
        console.error('Weather initial fetch failed:', err);
        return null;
    }
})();

document.addEventListener('DOMContentLoaded', async () => {
    /* ─── TYPEWRITER ─────────────────────────────────────── */
    const headlineEl = document.getElementById('typewriter-headline');

    if (headlineEl) {
        const headlineText = "Analytics Engineer & Data Architect";

        function typeWriter(el, text, speed, callback) {
            let i = 0;
            el.classList.add('typing');

            function tick() {
                if (i < text.length) {
                    el.textContent = text.slice(0, ++i);
                    setTimeout(tick, Math.random() * speed.jitter + speed.base);
                } else {
                    if (callback) callback();
                }
            }
            tick();
        }

        setTimeout(() => {
            typeWriter(headlineEl, headlineText, { base: 40, jitter: 25 }, () => {
                // keep the blinking cursor via CSS ::after
            });
        }, 600);
    }

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

    // ── Unified stagger rhythm for all card-based sections ──
    // Same base delay (0.1s) creates a consistent "waterfall" effect everywhere
    const staggerGroups = [
        { sel: '.tech-card.reveal', delay: 0.08 },
        { sel: '.roadmap-item.reveal', delay: 0.10 },
        { sel: '.proj-card.reveal', delay: 0.10 },
        { sel: '.blog-card.reveal', delay: 0.10 },
    ];

    staggerGroups.forEach(({ sel, delay }) => {
        document.querySelectorAll(sel).forEach((el, i) => {
            el.style.transitionDelay = `${i * delay}s`;
        });
    });

    // Also stagger the hero elements for a cinematic entry
    document.querySelectorAll('.hero-right .reveal').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.12}s`;
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
            rootMargin: "-20% 0px -70% 0px",
            threshold: 0
        }
    );

    sections.forEach(s => spyObs.observe(s));
});
