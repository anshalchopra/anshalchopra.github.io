/**
 * github-api.js — GitHub Contents API client for the Admin CMS
 *
 * Authenticates with a Personal Access Token (PAT).
 * Reads and writes JSON data files directly in the repo.
 */

const GitHubAPI = (function () {
    'use strict';

    const STORAGE_KEY = 'portfolio_gh_auth';

    /* ── helpers ────────────────────────────────────── */

    function _getAuth() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch { return null; }
    }

    function _headers(auth) {
        return {
            'Authorization': 'token ' + auth.pat,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }

    /* ── public API ─────────────────────────────────── */

    /**
     * Log in by validating a PAT against the GitHub API.
     * Stores owner, repo, and PAT in localStorage on success.
     */
    async function login(pat, owner, repo) {
        const resp = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': 'token ' + pat,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!resp.ok) throw new Error('Invalid token — GitHub returned ' + resp.status);
        const user = await resp.json();
        const auth = { pat, owner, repo, login: user.login };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
        return auth;
    }

    function logout() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function isLoggedIn() {
        return !!_getAuth();
    }

    function getAuth() {
        return _getAuth();
    }

    /**
     * Read a file from the repo.
     * Returns { content: <parsed JSON>, sha: <string> }.
     */
    async function getFile(path) {
        const auth = _getAuth();
        if (!auth) throw new Error('Not logged in');
        const url = `https://api.github.com/repos/${auth.owner}/${auth.repo}/contents/${path}`;
        const resp = await fetch(url, { headers: _headers(auth) });
        if (!resp.ok) throw new Error('Failed to read ' + path + ' — ' + resp.status);
        const data = await resp.json();
        const decoded = decodeURIComponent(escape(atob(data.content)));
        return { content: JSON.parse(decoded), sha: data.sha, raw: decoded };
    }

    /**
     * Update a file in the repo (creates a new commit).
     * @param {string} path    – e.g. "data/config.json"
     * @param {*}      content – object/array that will be JSON.stringified
     * @param {string} sha     – the current SHA of the file (from getFile)
     * @param {string} message – commit message
     */
    async function updateFile(path, content, sha, message) {
        const auth = _getAuth();
        if (!auth) throw new Error('Not logged in');
        const url = `https://api.github.com/repos/${auth.owner}/${auth.repo}/contents/${path}`;
        const encoded = btoa(unescape(encodeURIComponent(
            JSON.stringify(content, null, 4) + '\n'
        )));
        const resp = await fetch(url, {
            method: 'PUT',
            headers: _headers(auth),
            body: JSON.stringify({
                message: message || 'Update ' + path,
                content: encoded,
                sha: sha
            })
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error('Failed to update ' + path + ': ' + (err.message || resp.status));
        }
        return resp.json();
    }

    return { login, logout, isLoggedIn, getAuth, getFile, updateFile };
})();
