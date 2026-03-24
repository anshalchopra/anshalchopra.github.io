document.addEventListener("DOMContentLoaded", function () {
    const navbarHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark custom-navbar">
        <div class="container-fluid px-4">
            <div class="widget-container flex-grow-1">
                <div class="widget-details">
                    <div class="widget-location">Burnaby, BC</div>
                    <div class="widget-weather">
                        <span id="weather-icon"></span>
                        <span id="temperature">Loading...</span>
                    </div>
                </div>
            </div>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto" id="nav-links">
                </ul>
            </div>
        </div>
    </nav>
    <div class="ticker-wrapper">
        <div class="ticker-content">
            <span>OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span>
            <span>OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OPEN TO WORK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span>
        </div>
    </div>
    `;

    // Inject Navbar
    const header = document.getElementById('navbar-container');
    if (header) {
        header.innerHTML = navbarHTML;
    }

    // Determine path depth by looking at the current URL
    const pathname = window.location.pathname;
    const isSubPage = pathname.includes('/blogs/') ||
        pathname.includes('/projects/') ||
        pathname.includes('/case-studies/') ||
        pathname.includes('/contact/') ||
        pathname.includes('/admin/');

    const prefix = isSubPage ? '../' : '';

    const navItems = [
        { name: 'Home', link: prefix + 'index.html' },
        { name: 'Blogs', link: prefix + 'blogs/index.html' },
        { name: 'Projects', link: prefix + 'projects/index.html' },
        { name: 'Case Studies', link: prefix + 'case-studies/index.html' },
        { name: 'Contact', link: prefix + 'contact/index.html' }
    ];

    const navLinksContainer = document.getElementById('nav-links');
    if (navLinksContainer) {
        navItems.forEach(item => {
            const itemPathEnding = item.link.replace('../', '');
            const isActive = pathname.endsWith(itemPathEnding) ||
                (item.name === 'Home' && (pathname.endsWith('/') || pathname.endsWith('index.html') && !isSubPage));

            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `<a class="nav-link ${isActive ? 'active' : ''}" href="${item.link}">${item.name}</a>`;
            navLinksContainer.appendChild(li);
        });
    }

    // --- Weather Logic (Integrated with caching and H/L) ---
    async function fetchWeather() {
        const tempElement = document.getElementById('temperature');
        const iconElement = document.getElementById('weather-icon');
        if (!tempElement) return;

        // Check cache first
        const cache = localStorage.getItem('cachedWeather');
        if (cache) {
            const data = JSON.parse(cache);
            const now = new Date().getTime();
            if (now - data.timestamp < 600000) { // 10 mins cache
                tempElement.innerHTML = data.html;
                if (iconElement) iconElement.innerText = data.icon;
                return;
            }
        }

        try {
            const url = 'https://api.open-meteo.com/v1/forecast?latitude=49.2488&longitude=-122.9805&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto';
            const response = await fetch(url);
            const data = await response.json();

            const temp = Math.round(data.current_weather.temperature);
            const high = Math.round(data.daily.temperature_2m_max[0]);
            const low = Math.round(data.daily.temperature_2m_min[0]);
            const code = data.current_weather.weathercode;

            let icon = "☁️";
            if (code === 0) icon = "☀️";
            else if (code >= 1 && code <= 3) icon = "⛅";
            else if (code >= 45 && code <= 48) icon = "🌫️";
            else if (code >= 51 && code <= 67) icon = "🌧️";
            else if (code >= 71 && code <= 77) icon = "❄️";
            else if (code >= 95) icon = "⛈️";

            const weatherHtml = `${temp}°C <span style="font-size: 0.7rem; opacity: 0.8; margin-left: 8px;">H: ${high}° L: ${low}°</span>`;

            tempElement.innerHTML = weatherHtml;
            if (iconElement) iconElement.innerText = icon;

            // Cache it
            localStorage.setItem('cachedWeather', JSON.stringify({
                html: weatherHtml,
                icon: icon,
                timestamp: new Date().getTime()
            }));
        } catch (error) {
            console.error("Weather failed:", error);
        }
    }

    if (document.getElementById('temperature')) {
        fetchWeather();
        setInterval(fetchWeather, 600000);
    }

    // --- Scroll Reveal Logic ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.15
    });

    revealElements.forEach(el => revealObserver.observe(el));
});
