/**
 * footer.js — Dynamic footer that reads social links from config.json
 */

(function () {
    const isRoot = !window.location.pathname
        .split('/')
        .filter(Boolean)
        .some(seg => ['blogs', 'projects', 'case-studies', 'contact', 'socials', 'admin'].includes(seg));

    const base = isRoot ? '' : '../';
    const year = new Date().getFullYear();

    /* ── SVG icon map ────────────────────────────── */
    const ICONS = {
        linkedin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
        github: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>',
        medium: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>',
        instagram: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
        threads: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.632 5.642-2.047 1.298-1.426 1.674-3.18 1.674-4.287 0-.292-.023-.56-.069-.806H12.19v-2.294h9.083c.104.563.176 1.13.176 1.8 0 1.716-.55 3.817-2.063 5.478C17.741 23.241 15.406 24 12.186 24z"/></svg>'
    };

    async function buildFooter() {
        let siteName = 'Anshal Chopra';
        let tagline = 'Data Scientist &nbsp;·&nbsp; Data Engineer &nbsp;·&nbsp; Analytics Engineer';
        let builtIn = 'Vancouver';
        let socials = [];

        try {
            const resp = await fetch(base + 'data/config.json');
            const cfg = await resp.json();
            siteName = cfg.site.name;
            tagline = cfg.site.tagline.replace(/·/g, '&nbsp;·&nbsp;');
            builtIn = cfg.site.builtIn;
            socials = cfg.socials || [];
        } catch (e) {
            console.warn('footer: config.json load failed, using defaults', e);
        }

        const socialsHTML = socials.map(s => `
            <a href="${s.url}" target="_blank" rel="noopener" class="footer-social__icon" aria-label="${s.name}">
                ${ICONS[s.icon] || ''}
            </a>
        `).join('');

        const footerHTML = `
<footer class="site-footer">
    <div class="site-footer__inner">
        <div class="site-footer__brand">
            <span class="footer-name">${siteName}</span>
            <span class="footer-tagline">${tagline}</span>
        </div>
        <nav class="footer-nav" aria-label="Footer navigation">
            <a href="${base}index.html" class="footer-nav__link">Home</a>
            <a href="${base}blogs/index.html" class="footer-nav__link">Blogs</a>
            <a href="${base}projects/index.html" class="footer-nav__link">Projects</a>
            <a href="${base}case-studies/index.html" class="footer-nav__link">Case Studies</a>
            <a href="${base}contact/index.html" class="footer-nav__link">Contact</a>
        </nav>
        <div class="footer-socials">${socialsHTML}</div>
        <div class="footer-divider"></div>
        <div class="footer-bottom">
            <span class="footer-copy">&copy; ${year} ${siteName}. All rights reserved.</span>
            <span class="footer-built">Built with &nbsp;<span class="footer-heart">&#10084;</span>&nbsp; in ${builtIn}</span>
        </div>
    </div>
</footer>`;

        const container = document.getElementById('footer-container');
        if (container) container.innerHTML = footerHTML;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildFooter);
    } else {
        buildFooter();
    }
})();
