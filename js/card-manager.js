/**
 * card-manager.js  ·  v5 — Fetches card data from JSON files
 *
 * Card data lives in /data/{blogs,projects,casestudies}.json
 * committed to the GitHub repo. Every visitor fetches the SAME files.
 */

(function () {
    'use strict';

    /* ================================================================== */
    /* DATA SOURCE MAP                                                      */
    /* ================================================================== */

    function getDataUrl() {
        const path = window.location.pathname;
        const base = path.includes('/blogs') || path.includes('/projects') || path.includes('/case-studies')
            ? '../data/' : 'data/';
        if (path.includes('/blogs')) return base + 'blogs.json';
        if (path.includes('/projects')) return base + 'projects.json';
        if (path.includes('/case-studies')) return base + 'casestudies.json';
        return null;
    }

    /* ================================================================== */
    /* RENDER                                                               */
    /* ================================================================== */

    function esc(s) {
        return String(s || '')
            .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function renderCard(card) {
        const el = document.createElement('article');
        el.className = 'card-item';
        el.dataset.id = card.id;
        const img = card.img || '../assets/images/banner.png';

        el.innerHTML = `
            <span class="card-tag">${esc(card.tag)}</span>
            <img class="card-thumb" src="${esc(img)}" alt="${esc(card.title)}" loading="lazy">
            <div class="card-body-inner">
                <h2 class="card-title">${esc(card.title)}</h2>
                <p class="card-sub">${esc(card.sub)}</p>
                <p class="card-description">${esc(card.description)}</p>
                <button class="card-read-btn">Read ›</button>
            </div>`;

        el.addEventListener('click', () => openModal(card));

        return el;
    }

    async function renderAll() {
        const grid = document.getElementById('card-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const url = getDataUrl();
        if (!url) return;

        let cards = [];
        try {
            const resp = await fetch(url);
            if (resp.ok) cards = await resp.json();
        } catch (e) {
            console.warn('card-manager: failed to fetch data', e);
        }

        if (cards.length === 0) {
            grid.innerHTML = `<div class="cma-empty">
                <p>No cards yet.</p>
            </div>`;
        } else {
            cards.forEach((card, i) => {
                const el = renderCard(card);
                el.style.animationDelay = `${(i * 0.07).toFixed(2)}s`;
                grid.appendChild(el);
            });
        }
    }

    /* ================================================================== */
    /* READ MODAL                                                           */
    /* ================================================================== */

    function openModal(card) {
        const overlay = document.getElementById('card-overlay');
        const modal = document.getElementById('card-modal');
        if (!overlay || !modal) return;
        document.getElementById('modal-tag-text').textContent = card.tag || '';
        document.getElementById('modal-img-el').src = card.img || '../assets/images/banner.png';
        document.getElementById('modal-img-el').alt = card.title || '';
        document.getElementById('modal-title-el').textContent = card.title || '';
        document.getElementById('modal-sub-el').textContent = card.sub || '';
        document.getElementById('modal-text-el').innerHTML = card.body || card.description || '';
        overlay.classList.add('active');
        requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('open')));
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const overlay = document.getElementById('card-overlay');
        const modal = document.getElementById('card-modal');
        if (!modal || !overlay) return;
        modal.classList.remove('open');
        setTimeout(() => { overlay.classList.remove('active'); document.body.style.overflow = ''; }, 350);
    }

    /* ================================================================== */
    /* INIT                                                                 */
    /* ================================================================== */

    document.addEventListener('DOMContentLoaded', () => {
        renderAll();

        document.getElementById('modal-close')?.addEventListener('click', closeModal);
        document.getElementById('card-overlay')?.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeModal();
        });
    });

})();
