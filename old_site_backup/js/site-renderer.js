/**
 * site-renderer.js — Dynamically renders About, Stack, and Timeline
 * sections on index.html from JSON data files.
 */

(function () {
    'use strict';

    const BASE = ''; // root-level page

    /* ================================================================== */
    /* ABOUT SECTION                                                        */
    /* ================================================================== */

    async function renderAbout() {
        const el = document.getElementById('about-text-dynamic');
        if (!el) return;
        try {
            const resp = await fetch(BASE + 'data/config.json');
            const cfg = await resp.json();
            el.innerHTML = cfg.about.html;
        } catch (e) {
            console.warn('site-renderer: about failed', e);
        }
    }

    /* ================================================================== */
    /* STACK SECTION                                                         */
    /* ================================================================== */

    async function renderStack() {
        const grid = document.getElementById('stack-grid-dynamic');
        if (!grid) return;
        try {
            const resp = await fetch(BASE + 'data/tools.json');
            const categories = await resp.json();
            grid.innerHTML = categories.map((cat, ci) => `
                <div class="stack-category" style="animation-delay:${(ci * 0.1 + 0.05).toFixed(2)}s">
                    <div class="stack-category-header">
                        <span class="stack-category-label">${esc(cat.label)}</span>
                        <span class="stack-category-sub">${esc(cat.sub)}</span>
                    </div>
                    <div class="stack-tools">
                        ${cat.tools.map(t => `
                            <div class="stack-tool" title="${esc(t.title || t.name)}">
                                <img src="assets/images/tools/${esc(t.icon)}" alt="${esc(t.name)}" class="stack-icon">
                                <span>${esc(t.name)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.warn('site-renderer: stack failed', e);
        }
    }

    /* ================================================================== */
    /* TIMELINE SECTION                                                     */
    /* ================================================================== */

    async function renderTimeline() {
        const container = document.getElementById('timeline-dynamic');
        if (!container) return;
        try {
            const resp = await fetch(BASE + 'data/timeline.json');
            const sections = await resp.json();
            container.innerHTML = sections.map(section => `
                <div class="tl-category-label"><span>${esc(section.category)}</span></div>
                ${section.items.map(item => `
                    <div class="tl-item" data-year="${esc(item.year)}">
                        <div class="tl-dot"></div>
                        <div class="tl-card">
                            <div class="tl-card-header">
                                <img src="${esc(item.logo)}" alt="${esc(item.org)}" class="tl-logo">
                                <div>
                                    <h3>${esc(item.title)}</h3>
                                    <div class="tl-org">${esc(item.org)}</div>
                                </div>
                            </div>
                            <div class="tl-card-body">${item.body}</div>
                        </div>
                    </div>
                `).join('')}
            `).join('');
        } catch (e) {
            console.warn('site-renderer: timeline failed', e);
        }
    }

    /* ── Utility ── */
    function esc(s) {
        return String(s || '')
            .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* ── Init ── */
    document.addEventListener('DOMContentLoaded', () => {
        renderAbout();
        renderStack();
        renderTimeline();
    });

})();
