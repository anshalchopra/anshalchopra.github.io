/**
 * card-manager.js  ·  v3 — JSON-file backend
 *
 * All card data lives in /data/{blogs,projects,casestudies}.json
 * committed to the GitHub repo. Every visitor fetches the SAME files
 * so your content is visible to everyone.
 *
 * To add/edit/delete cards:
 *  1. Click ⚙ Edit → enter password
 *  2. Add / edit / delete cards in the admin panel (uses localStorage as a
 *     live preview so you can see your changes immediately)
 *  3. Click  "⬇ Export JSON"  — download the updated file
 *  4. Replace the matching file in /data/ and push to GitHub
 *  5. All visitors now see the updated content
 */

(function () {
    'use strict';

    /* ================================================================== */
    /* DATA SOURCE MAP                                                      */
    /* ================================================================== */

    /**
     * Read cards from the page-specific global set by the <script> data file.
     * Each page loads one of:
     *   <script src="../data/blogs.js">        → window.BLOGS_DATA
     *   <script src="../data/projects.js">     → window.PROJECTS_DATA
     *   <script src="../data/casestudies.js"> → window.CASESTUDIES_DATA
     * This works on file://, http://, and GitHub Pages — no fetch() needed.
     */
    function getPageData() {
        const path = window.location.pathname;
        if (path.includes('/blogs')) return window.BLOGS_DATA || [];
        if (path.includes('/projects')) return window.PROJECTS_DATA || [];
        if (path.includes('/case-studies')) return window.CASESTUDIES_DATA || [];
        return [];
    }

    function getExportName() {
        const path = window.location.pathname;
        if (path.includes('/blogs')) return 'blogs.js';
        if (path.includes('/projects')) return 'projects.js';
        if (path.includes('/case-studies')) return 'casestudies.js';
        return 'cards.js';
    }

    function getExportVarName() {
        const path = window.location.pathname;
        if (path.includes('/blogs')) return 'BLOGS_DATA';
        if (path.includes('/projects')) return 'PROJECTS_DATA';
        if (path.includes('/case-studies')) return 'CASESTUDIES_DATA';
        return 'CARD_DATA';
    }

    /* ================================================================== */
    /* STATE                                                                */
    /* ================================================================== */

    /** Master list fetched from the JSON file */
    let publishedCards = [];
    /** Working copy used while admin mode is on */
    let draftCards = null;  // null means "not in draft mode"
    let adminMode = false;
    const ADMIN_SESSION = 'cma_admin';

    /* ================================================================== */
    /* LOAD                                                                 */
    /* ================================================================== */

    function fetchPublished() {
        return getPageData();
    }

    function getCards() {
        return draftCards !== null ? draftCards : publishedCards;
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
            </div>
            <div class="card-admin-actions" style="display:none">
                <button class="cma-edit"   title="Edit card">✏️</button>
                <button class="cma-delete" title="Delete card">🗑</button>
            </div>`;

        el.addEventListener('click', e => {
            if (e.target.closest('.card-admin-actions')) return;
            openModal(card);
        });
        el.querySelector('.cma-edit').addEventListener('click', e => {
            e.stopPropagation(); openEditor(card.id);
        });
        el.querySelector('.cma-delete').addEventListener('click', e => {
            e.stopPropagation();
            if (confirm(`Delete "${card.title}"?`)) { deleteCard(card.id); }
        });

        return el;
    }

    function renderAll() {
        const grid = document.getElementById('card-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const cards = getCards();

        if (cards.length === 0) {
            grid.innerHTML = `<div class="cma-empty">
                <p>No cards yet.</p>
                <p>Click <strong>+ New Card</strong> to add your first entry.</p>
            </div>`;
        } else {
            cards.forEach((card, i) => {
                const el = renderCard(card);
                el.style.animationDelay = `${(i * 0.07).toFixed(2)}s`;
                grid.appendChild(el);
            });
        }

        if (adminMode) showAdminControls(true);
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
    /* ADMIN STATE                                                          */
    /* ================================================================== */

    function setAdminMode(on) {
        adminMode = on;
        sessionStorage.setItem(ADMIN_SESSION, on ? '1' : '');

        const fab = document.getElementById('cma-fab');
        if (fab) fab.textContent = on ? '✓ Admin On' : '⚙ Edit';

        if (on && draftCards === null) {
            // Clone published cards into draft so edits don't mutate the
            // source-of-truth array until explicitly exported
            draftCards = JSON.parse(JSON.stringify(publishedCards));
        }
        if (!on) {
            // Discard draft; revert to published view
            draftCards = null;
        }

        updateExportBanner();
        renderAll();
    }

    function showAdminControls(show) {
        document.querySelectorAll('.card-admin-actions').forEach(el => {
            el.style.display = show ? 'flex' : 'none';
        });
        const addBtn = document.getElementById('cma-add-btn');
        if (addBtn) addBtn.style.display = show ? 'flex' : 'none';
    }

    /* ================================================================== */
    /* DRAFT CRUD                                                           */
    /* ================================================================== */

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    function deleteCard(id) {
        if (draftCards === null) draftCards = JSON.parse(JSON.stringify(publishedCards));
        draftCards = draftCards.filter(c => c.id !== id);
        renderAll();
        updateExportBanner();
    }

    function saveCard(card) {
        if (draftCards === null) draftCards = JSON.parse(JSON.stringify(publishedCards));
        const idx = draftCards.findIndex(c => c.id === card.id);
        if (idx >= 0) draftCards[idx] = card; else draftCards.push(card);
        renderAll();
        updateExportBanner();
    }

    /* ================================================================== */
    /* EXPORT                                                               */
    /* ================================================================== */

    function exportJSON() {
        const data = draftCards !== null ? draftCards : publishedCards;
        const varName = getExportVarName();
        const content = `window.${varName} = ${JSON.stringify(data, null, 2)};
`;
        const blob = new Blob([content], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getExportName();
        a.click();
        URL.revokeObjectURL(url);
    }

    /** Banner that reminds you to export & commit after making changes */
    function updateExportBanner() {
        let banner = document.getElementById('cma-export-banner');

        if (!adminMode || draftCards === null) {
            banner?.remove();
            return;
        }

        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'cma-export-banner';
            banner.innerHTML = `
                <span>✏️ You have unsaved changes. Click Export, then replace <code>/data/${getExportName()}</code> in your repo and push to GitHub.</span>
                <button id="cma-export-btn">⬇ Export JS</button>
                <button id="cma-discard-btn">✕ Discard</button>`;
            document.body.appendChild(banner);
            document.getElementById('cma-export-btn').addEventListener('click', exportJSON);
            document.getElementById('cma-discard-btn').addEventListener('click', () => {
                draftCards = null;
                updateExportBanner();
                renderAll();
            });
        }
    }

    /* ================================================================== */
    /* IMAGE UPLOAD HELPER                                                  */
    /* ================================================================== */

    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    }

    /* ================================================================== */
    /* EDITOR MODAL                                                         */
    /* ================================================================== */

    function openEditor(id) {
        const cards = getCards();
        const card = id ? cards.find(c => c.id === id) : null;
        document.getElementById('cma-editor-overlay')?.remove();

        const isNew = !card;
        const overlay = document.createElement('div');
        overlay.id = 'cma-editor-overlay';
        overlay.innerHTML = `
        <div id="cma-editor" role="dialog" aria-modal="true">
            <button id="cma-editor-close" class="modal-close" aria-label="Close">✕</button>
            <h2 class="cma-editor-title">${isNew ? 'New Card' : 'Edit Card'}</h2>

            <div class="cma-field">
                <label for="cma-f-tag">Category / Tag</label>
                <input id="cma-f-tag" type="text" placeholder="e.g. Machine Learning" maxlength="30" value="${esc(card?.tag || '')}">
            </div>
            <div class="cma-field">
                <label for="cma-f-title">Title <span class="cma-required">*</span></label>
                <input id="cma-f-title" type="text" placeholder="Card title" maxlength="80" value="${esc(card?.title || '')}">
            </div>
            <div class="cma-field">
                <label for="cma-f-sub">Subtitle / Meta</label>
                <input id="cma-f-sub" type="text" placeholder="e.g. Python · 8 min read" value="${esc(card?.sub || '')}">
            </div>
            <div class="cma-field">
                <label for="cma-f-desc">Short Description <span class="cma-hint-inline">(shown on card)</span></label>
                <textarea id="cma-f-desc" rows="2" placeholder="2–3 sentence summary…">${esc(card?.description || '')}</textarea>
            </div>
            <div class="cma-field">
                <label for="cma-f-body">Full Content <span class="cma-hint-inline">(expanded view — basic HTML allowed)</span></label>
                <textarea id="cma-f-body" rows="6" placeholder="Full details — you can use &lt;b&gt;bold&lt;/b&gt;, &lt;br&gt; etc.">${esc(card?.body || '')}</textarea>
            </div>
            <div class="cma-field">
                <label>Cover Image</label>
                <div class="cma-img-row">
                    <div class="cma-img-preview-wrap">
                        <img id="cma-img-preview" src="${esc(card?.img || '../assets/images/banner.png')}" alt="Preview">
                    </div>
                    <div class="cma-img-controls">
                        <label class="card-read-btn cma-upload-label" for="cma-f-img">📁 Upload Image</label>
                        <input id="cma-f-img" type="file" accept="image/*" style="display:none">
                        <p class="cma-hint">JPG, PNG, WebP · max 5 MB<br>To make the image visible to all visitors, also add it to <code>/assets/images/</code> and reference it as a relative path instead of uploading here.</p>
                    </div>
                </div>
            </div>
            <div class="cma-actions">
                <button id="cma-cancel" class="card-read-btn">Cancel</button>
                <button id="cma-save"   class="cma-save-btn">Save to Draft</button>
            </div>
            <p id="cma-error" class="cma-error" style="display:none"></p>
        </div>`;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('open'));

        let pendingImg = card?.img || null;

        overlay.querySelector('#cma-f-img').addEventListener('change', async function () {
            const file = this.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { showErr('Image must be under 5 MB'); return; }
            pendingImg = await toBase64(file);
            overlay.querySelector('#cma-img-preview').src = pendingImg;
        });

        const closeEditor = () => {
            overlay.classList.remove('open');
            setTimeout(() => overlay.remove(), 350);
        };

        overlay.querySelector('#cma-editor-close').addEventListener('click', closeEditor);
        overlay.querySelector('#cma-cancel').addEventListener('click', closeEditor);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeEditor(); });

        overlay.querySelector('#cma-save').addEventListener('click', () => {
            const title = overlay.querySelector('#cma-f-title').value.trim();
            if (!title) { showErr('Title is required.'); return; }
            saveCard({
                id: card?.id || generateId(),
                tag: overlay.querySelector('#cma-f-tag').value.trim(),
                title,
                sub: overlay.querySelector('#cma-f-sub').value.trim(),
                description: overlay.querySelector('#cma-f-desc').value.trim(),
                body: overlay.querySelector('#cma-f-body').value.trim(),
                img: pendingImg || card?.img || '',
            });
            closeEditor();
        });

        function showErr(msg) {
            const el = overlay.querySelector('#cma-error');
            el.textContent = msg; el.style.display = 'block';
        }
    }

    /* ================================================================== */
    /* INJECT ADMIN FAB                                                     */
    /* ================================================================== */

    function injectAdminUI() {
        const fab = document.createElement('button');
        fab.id = 'cma-fab';
        fab.textContent = '⚙ Edit';
        fab.title = 'Toggle admin mode';
        document.body.appendChild(fab);

        fab.addEventListener('click', () => {
            if (!adminMode) {
                const pw = prompt('Enter admin password:');
                if (pw !== (window.ADMIN_PASSWORD || 'admin123')) {
                    alert('Incorrect password.');
                    return;
                }
            }
            setAdminMode(!adminMode);
        });

        const addBtn = document.createElement('button');
        addBtn.id = 'cma-add-btn';
        addBtn.textContent = '+ New Card';
        addBtn.style.display = 'none';
        document.querySelector('.page-header')?.appendChild(addBtn);
        addBtn.addEventListener('click', () => openEditor(null));

        if (sessionStorage.getItem(ADMIN_SESSION) === '1') setAdminMode(true);
    }

    /* ================================================================== */
    /* INIT                                                                 */
    /* ================================================================== */

    document.addEventListener('DOMContentLoaded', () => {
        publishedCards = fetchPublished();
        renderAll();
        injectAdminUI();

        document.getElementById('modal-close')?.addEventListener('click', closeModal);
        document.getElementById('card-overlay')?.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                closeModal();
                document.getElementById('cma-editor-overlay')?.remove();
            }
        });
    });

})();
