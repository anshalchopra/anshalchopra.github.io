/**
 * admin.js — CMS Dashboard Controller
 *
 * Handles login/logout, tab switching, loading data from the repo,
 * rendering edit forms, and saving changes via the GitHub API.
 */

const Admin = (function () {
    'use strict';

    /* ── State ─────────────────────────────────────── */
    let configData = null, configSha = null;
    let toolsData = null, toolsSha = null;
    let timelineData = null, timelineSha = null;
    let blogsData = null, blogsSha = null;
    let projectsData = null, projectsSha = null;
    let casestudiesData = null, casestudiesSha = null;

    /* ── Utility ───────────────────────────────────── */
    function $(id) { return document.getElementById(id); }
    function toast(msg, type) {
        const t = $('admin-toast');
        t.textContent = msg;
        t.className = 'admin-toast ' + type + ' show';
        setTimeout(() => t.classList.remove('show'), 3500);
    }
    function esc(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ══════════════════════════════════════════════════
       LOGIN / LOGOUT
       ══════════════════════════════════════════════════ */

    async function login() {
        const btn = $('login-btn');
        const errEl = $('login-error');
        btn.disabled = true;
        errEl.style.display = 'none';

        const pat = $('pat-input').value.trim();
        const owner = $('owner-input').value.trim();
        const repo = $('repo-input').value.trim();

        if (!pat || !owner || !repo) {
            errEl.textContent = 'All fields are required.';
            errEl.style.display = 'block';
            btn.disabled = false;
            return;
        }

        try {
            const auth = await GitHubAPI.login(pat, owner, repo);
            $('user-label').textContent = auth.login + ' / ' + owner + '/' + repo;
            $('login-screen').style.display = 'none';
            $('dashboard').classList.add('active');
            await loadAll();
            toast('Connected to GitHub!', 'success');
        } catch (e) {
            errEl.textContent = e.message;
            errEl.style.display = 'block';
        }
        btn.disabled = false;
    }

    function logout() {
        GitHubAPI.logout();
        location.reload();
    }

    function checkSession() {
        if (GitHubAPI.isLoggedIn()) {
            const auth = GitHubAPI.getAuth();
            $('user-label').textContent = auth.login + ' / ' + auth.owner + '/' + auth.repo;
            $('login-screen').style.display = 'none';
            $('dashboard').classList.add('active');
            loadAll();
        }
    }

    /* ══════════════════════════════════════════════════
       LOAD ALL DATA
       ══════════════════════════════════════════════════ */

    async function loadAll() {
        try {
            const [cfg, tools, tl, blogs, projects, cs] = await Promise.all([
                GitHubAPI.getFile('data/config.json'),
                GitHubAPI.getFile('data/tools.json'),
                GitHubAPI.getFile('data/timeline.json'),
                GitHubAPI.getFile('data/blogs.json'),
                GitHubAPI.getFile('data/projects.json'),
                GitHubAPI.getFile('data/casestudies.json')
            ]);
            configData = cfg.content; configSha = cfg.sha;
            toolsData = tools.content; toolsSha = tools.sha;
            timelineData = tl.content; timelineSha = tl.sha;
            blogsData = blogs.content; blogsSha = blogs.sha;
            projectsData = projects.content; projectsSha = projects.sha;
            casestudiesData = cs.content; casestudiesSha = cs.sha;

            renderAbout();
            renderStack();
            renderTimeline();
            renderCardList('blogs', blogsData);
            renderCardList('projects', projectsData);
            renderCardList('casestudies', casestudiesData);
            renderContact();
            renderSocials();
            renderSettings();
        } catch (e) {
            toast('Failed to load data: ' + e.message, 'error');
        }
    }

    /* ══════════════════════════════════════════════════
       TAB SWITCHING
       ══════════════════════════════════════════════════ */

    function initTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                $('panel-' + btn.dataset.tab).classList.add('active');
            });
        });
    }

    /* ══════════════════════════════════════════════════
       ABOUT
       ══════════════════════════════════════════════════ */

    function renderAbout() {
        $('about-html').value = configData.about.html;
    }

    async function saveAbout() {
        configData.about.html = $('about-html').value;
        try {
            const res = await GitHubAPI.updateFile('data/config.json', configData, configSha, 'Update about section');
            configSha = res.content.sha;
            toast('About section saved!', 'success');
        } catch (e) { toast(e.message, 'error'); }
    }

    /* ══════════════════════════════════════════════════
       STACK
       ══════════════════════════════════════════════════ */

    function renderStack() {
        const el = $('stack-editor');
        el.innerHTML = toolsData.map((cat, ci) => `
            <div class="edit-form">
                <h3>${esc(cat.label)}</h3>
                <div class="form-row">
                    <div class="field">
                        <label>Category Label</label>
                        <input type="text" value="${esc(cat.label)}" onchange="Admin._updateStack(${ci},'label',this.value)">
                    </div>
                    <div class="field">
                        <label>Subtitle</label>
                        <input type="text" value="${esc(cat.sub)}" onchange="Admin._updateStack(${ci},'sub',this.value)">
                    </div>
                </div>
                <div class="field">
                    <label>Tools (name:icon.svg, one per line)</label>
                    <textarea rows="6" onchange="Admin._updateStackTools(${ci},this.value)">${cat.tools.map(t => t.name + ':' + t.icon).join('\n')}</textarea>
                </div>
            </div>
        `).join('');
    }

    function _updateStack(ci, key, val) { toolsData[ci][key] = val; }
    function _updateStackTools(ci, val) {
        toolsData[ci].tools = val.split('\n').filter(l => l.trim()).map(l => {
            const [name, icon] = l.split(':').map(s => s.trim());
            return { name, icon: icon || name.toLowerCase() + '.svg', title: name };
        });
    }

    async function saveStack() {
        try {
            const res = await GitHubAPI.updateFile('data/tools.json', toolsData, toolsSha, 'Update tech stack');
            toolsSha = res.content.sha;
            toast('Stack saved!', 'success');
        } catch (e) { toast(e.message, 'error'); }
    }

    /* ══════════════════════════════════════════════════
       TIMELINE
       ══════════════════════════════════════════════════ */

    function renderTimeline() {
        const el = $('timeline-editor');
        el.innerHTML = timelineData.map((section, si) => `
            <div class="tl-category-block edit-form">
                <div class="field">
                    <label>Category Name</label>
                    <input type="text" value="${esc(section.category)}" onchange="Admin._updateTLCat(${si},this.value)">
                </div>
                ${section.items.map((item, ii) => `
                    <div style="border-top:1px solid var(--admin-border);padding-top:14px;margin-top:14px;">
                        <div class="form-row">
                            <div class="field">
                                <label>Title</label>
                                <input type="text" value="${esc(item.title)}" onchange="Admin._updateTLItem(${si},${ii},'title',this.value)">
                            </div>
                            <div class="field">
                                <label>Organization</label>
                                <input type="text" value="${esc(item.org)}" onchange="Admin._updateTLItem(${si},${ii},'org',this.value)">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="field">
                                <label>Year / Date Range</label>
                                <input type="text" value="${esc(item.year)}" onchange="Admin._updateTLItem(${si},${ii},'year',this.value)">
                            </div>
                            <div class="field">
                                <label>Logo Path</label>
                                <input type="text" value="${esc(item.logo)}" onchange="Admin._updateTLItem(${si},${ii},'logo',this.value)">
                            </div>
                        </div>
                        <div class="field">
                            <label>Body (HTML)</label>
                            <textarea rows="4" onchange="Admin._updateTLItem(${si},${ii},'body',this.value)">${esc(item.body)}</textarea>
                        </div>
                        <button class="btn-sm danger" onclick="Admin._removeTLItem(${si},${ii})">Delete Entry</button>
                    </div>
                `).join('')}
                <button class="btn-add" onclick="Admin._addTLItem(${si})" style="margin-top:12px">+ Add Entry</button>
            </div>
        `).join('');
    }

    function _updateTLCat(si, val) { timelineData[si].category = val; }
    function _updateTLItem(si, ii, key, val) { timelineData[si].items[ii][key] = val; }
    function _removeTLItem(si, ii) { timelineData[si].items.splice(ii, 1); renderTimeline(); }
    function _addTLItem(si) {
        timelineData[si].items.push({ year: '', title: '', org: '', logo: '', body: '' });
        renderTimeline();
    }

    async function saveTimeline() {
        try {
            const res = await GitHubAPI.updateFile('data/timeline.json', timelineData, timelineSha, 'Update timeline');
            timelineSha = res.content.sha;
            toast('Timeline saved!', 'success');
        } catch (e) { toast(e.message, 'error'); }
    }

    /* ══════════════════════════════════════════════════
       CARDS (Blogs / Projects / Case Studies)
       ══════════════════════════════════════════════════ */

    const cardState = { blogs: null, projects: null, casestudies: null };
    const cardShas = { blogs: null, projects: null, casestudies: null };
    const cardFiles = { blogs: 'data/blogs.json', projects: 'data/projects.json', casestudies: 'data/casestudies.json' };

    function _getCards(type) {
        if (type === 'blogs') return blogsData;
        if (type === 'projects') return projectsData;
        return casestudiesData;
    }
    function _setCards(type, data) {
        if (type === 'blogs') blogsData = data;
        else if (type === 'projects') projectsData = data;
        else casestudiesData = data;
    }
    function _getSha(type) {
        if (type === 'blogs') return blogsSha;
        if (type === 'projects') return projectsSha;
        return casestudiesSha;
    }
    function _setSha(type, sha) {
        if (type === 'blogs') blogsSha = sha;
        else if (type === 'projects') projectsSha = sha;
        else casestudiesSha = sha;
    }

    function renderCardList(type, data) {
        const list = $(type + '-list');
        list.innerHTML = data.map((card, i) => `
            <div class="item-row" onclick="Admin.editCard('${type}',${i})">
                <span class="item-tag">${esc(card.tag)}</span>
                <span class="item-title">${esc(card.title)}</span>
                <div class="item-actions">
                    <button class="btn-sm danger" onclick="event.stopPropagation();Admin.deleteCard('${type}',${i})">Delete</button>
                </div>
            </div>
        `).join('');
        $(type + '-save-row').style.display = data.length ? 'flex' : 'none';
    }

    function editCard(type, idx) {
        const data = _getCards(type);
        const card = data[idx];
        const el = $(type + '-edit');
        el.innerHTML = `
            <div class="edit-form">
                <h3>Editing: ${esc(card.title || 'New Entry')}</h3>
                <div class="form-row">
                    <div class="field">
                        <label>Tag</label>
                        <input type="text" id="${type}-e-tag" value="${esc(card.tag)}">
                    </div>
                    <div class="field">
                        <label>Title</label>
                        <input type="text" id="${type}-e-title" value="${esc(card.title)}">
                    </div>
                </div>
                <div class="field">
                    <label>Subtitle</label>
                    <input type="text" id="${type}-e-sub" value="${esc(card.sub)}">
                </div>
                <div class="field">
                    <label>Description</label>
                    <textarea id="${type}-e-desc" rows="3">${esc(card.description)}</textarea>
                </div>
                <div class="field">
                    <label>Body (HTML, shown in modal)</label>
                    <textarea id="${type}-e-body" rows="4">${esc(card.body)}</textarea>
                </div>
                <div class="field">
                    <label>Image Path</label>
                    <input type="text" id="${type}-e-img" value="${esc(card.img)}">
                </div>
                <div class="form-actions">
                    <button class="btn-save" onclick="Admin._applyCard('${type}',${idx})">Apply</button>
                    <button class="btn-cancel" onclick="document.getElementById('${type}-edit').innerHTML=''">Cancel</button>
                </div>
            </div>
        `;
    }

    function _applyCard(type, idx) {
        const data = _getCards(type);
        data[idx].tag = $(type + '-e-tag').value;
        data[idx].title = $(type + '-e-title').value;
        data[idx].sub = $(type + '-e-sub').value;
        data[idx].description = $(type + '-e-desc').value;
        data[idx].body = $(type + '-e-body').value;
        data[idx].img = $(type + '-e-img').value;
        $(type + '-edit').innerHTML = '';
        renderCardList(type, data);
        toast('Changes applied locally. Click "Save All Changes" to push to GitHub.', 'success');
    }

    function addCard(type) {
        const data = _getCards(type);
        const id = type.slice(0, -1) + '_' + String(data.length + 1).padStart(2, '0');
        data.push({ id, tag: '', title: '', sub: '', description: '', body: '', img: '' });
        renderCardList(type, data);
        editCard(type, data.length - 1);
    }

    function deleteCard(type, idx) {
        const data = _getCards(type);
        if (!confirm('Delete "' + (data[idx].title || 'this entry') + '"?')) return;
        data.splice(idx, 1);
        renderCardList(type, data);
        $(type + '-edit').innerHTML = '';
    }

    async function saveCards(type) {
        const data = _getCards(type);
        const sha = _getSha(type);
        try {
            const res = await GitHubAPI.updateFile(cardFiles[type], data, sha, 'Update ' + type);
            _setSha(type, res.content.sha);
            toast(type.charAt(0).toUpperCase() + type.slice(1) + ' saved!', 'success');
        } catch (e) { toast(e.message, 'error'); }
    }

    /* ══════════════════════════════════════════════════
       CONTACT
       ══════════════════════════════════════════════════ */

    function renderContact() {
        $('contact-email').value = configData.contact.email;
        $('contact-phone').value = configData.contact.phone;
        $('contact-desc').value = configData.contact.description;
    }

    async function saveContact() {
        configData.contact.email = $('contact-email').value;
        configData.contact.phone = $('contact-phone').value;
        configData.contact.description = $('contact-desc').value;
        try {
            const res = await GitHubAPI.updateFile('data/config.json', configData, configSha, 'Update contact info');
            configSha = res.content.sha;
            toast('Contact info saved!', 'success');
        } catch (e) { toast(e.message, 'error'); }
    }

    /* ══════════════════════════════════════════════════
       SOCIALS
       ══════════════════════════════════════════════════ */

    function renderSocials() {
        const el = $('socials-editor');
        el.innerHTML = configData.socials.map((s, i) => `
            <div class="social-row">
                <input type="text" value="${esc(s.name)}" placeholder="Name" onchange="Admin._updateSocial(${i},'name',this.value)">
                <input type="url" value="${esc(s.url)}" placeholder="URL" onchange="Admin._updateSocial(${i},'url',this.value)">
                <select onchange="Admin._updateSocial(${i},'icon',this.value)">
                    ${['linkedin', 'github', 'medium', 'instagram', 'threads'].map(ico =>
            `<option value="${ico}" ${ico === s.icon ? 'selected' : ''}>${ico}</option>`
        ).join('')}
                </select>
                <button class="btn-sm danger" onclick="Admin._removeSocial(${i})">✕</button>
            </div>
        `).join('');
    }

    function _updateSocial(i, key, val) { configData.socials[i][key] = val; }
    function _removeSocial(i) { configData.socials.splice(i, 1); renderSocials(); }
    function addSocial() {
        configData.socials.push({ name: '', url: '', icon: 'linkedin' });
        renderSocials();
    }

    async function saveSocials() {
        try {
            const res = await GitHubAPI.updateFile('data/config.json', configData, configSha, 'Update social links');
            configSha = res.content.sha;
            toast('Social links saved!', 'success');
        } catch (e) { toast(e.message, 'error'); }
    }

    /* ══════════════════════════════════════════════════
       SITE SETTINGS
       ══════════════════════════════════════════════════ */

    function renderSettings() {
        $('site-name').value = configData.site.name;
        $('site-tagline').value = configData.site.tagline;
        $('site-location').value = configData.site.location;
        $('site-builtin').value = configData.site.builtIn;
    }

    async function saveSettings() {
        configData.site.name = $('site-name').value;
        configData.site.tagline = $('site-tagline').value;
        configData.site.location = $('site-location').value;
        configData.site.builtIn = $('site-builtin').value;
        try {
            const res = await GitHubAPI.updateFile('data/config.json', configData, configSha, 'Update site settings');
            configSha = res.content.sha;
            toast('Site settings saved!', 'success');
        } catch (e) { toast(e.message, 'error'); }
    }

    /* ══════════════════════════════════════════════════
       INIT
       ══════════════════════════════════════════════════ */

    document.addEventListener('DOMContentLoaded', () => {
        initTabs();
        $('login-btn').addEventListener('click', login);
        $('pat-input').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
        $('logout-btn').addEventListener('click', logout);

        // Pre-fill owner/repo from config.json if available
        fetch('../data/config.json')
            .then(r => r.json())
            .then(cfg => {
                if (cfg.github) {
                    $('owner-input').value = cfg.github.owner || '';
                    $('repo-input').value = cfg.github.repo || '';
                }
            })
            .catch(() => { });

        checkSession();
    });

    /* ── Public API for onclick handlers ─────────── */
    return {
        saveAbout, saveStack, saveTimeline,
        saveCards, addCard, editCard, deleteCard, _applyCard,
        saveContact, saveSocials, addSocial, saveSettings,
        _updateStack, _updateStackTools,
        _updateTLCat, _updateTLItem, _removeTLItem, _addTLItem,
        _updateSocial, _removeSocial
    };

})();
