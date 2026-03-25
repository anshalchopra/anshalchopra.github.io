/* ─── WEATHER FETCHING ────────────────────────────────── */
const fetchWeather = (async () => {
    try {
        // Vancouver: 49.2827, -123.1207
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
    async function updateWeatherUI() {
        const weatherIconEl = document.getElementById('weather-icon');
        const weatherTempEl = document.getElementById('weather-temp');
        const weatherHighEl = document.getElementById('weather-high');
        const weatherLowEl  = document.getElementById('weather-low');

        if (!weatherIconEl) return;

        const data = await fetchWeather;
        
        if (data) {
            const temp = Math.round(data.current.temperature_2m);
            const high = Math.round(data.daily.temperature_2m_max[0]);
            const low  = Math.round(data.daily.temperature_2m_min[0]);
            const code = data.current.weather_code;

            // WMO Weather interpretation codes (WW)
            const weatherMap = {
                0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
                45: '🌫️', 48: '🌫️',
                51: '🌦️', 53: '🌦️', 55: '🌦️',
                61: '🌧️', 63: '🌧️', 65: '🌧️',
                71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️',
                80: '🌦️', 81: '🌧️', 82: '🌧️',
                85: '❄️', 86: '❄️',
                95: '⛈️', 96: '⛈️', 99: '⛈️'
            };

            weatherIconEl.textContent = weatherMap[code] || '⛅';
            weatherTempEl.textContent = `${temp}°C`;
            weatherHighEl.textContent = high;
            weatherLowEl.textContent  = low;
        } else {
            // Fallback
            weatherIconEl.textContent = '🌥️';
            weatherTempEl.textContent = '8°C';
            weatherHighEl.textContent = '10';
            weatherLowEl.textContent  = '4';
        }
    }
    updateWeatherUI();


    /* ─── TYPEWRITER ─────────────────────────────────────── */
    const titleEl    = document.getElementById('typewriter-title');
    const headlineEl = document.getElementById('typewriter-headline');
    const titleText    = "Hi, I'm <span class='neon-span'>Anshal Chopra</span>";
    const headlineText = "<span class='accent-lime'>Analytics Engineer</span> | <span class='accent-lime'>Business Intelligence Specialist</span>";

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
