/**
 * skolesaus-tracking.js
 * ─────────────────────────────────────────────────────────────────
 * Include this script on EVERY page of your site with:
 *   <script src="skolesaus-tracking.js"><\/script>
 *
 * What it does:
 *   1. Records time spent on each page (keyed by pathname)
 *   2. Records a daily visit count (per device/browser)
 *   3. Respects cookie consent — only runs if analytics is granted
 *
 * NOTE: These stats are stored locally in each visitor's browser.
 * For real cross-user analytics, connect Umami (see README).
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    var PAGE_KEY    = 'ss_page_times';      // { '/kloss_spreng.html': totalMs, ... }
    var VISITS_KEY  = 'ss_daily_visits';    // { '2026-04-11': 3, ... }
    var SESSION_KEY = 'ss_session_visited'; // pages visited this session (sessionStorage)

    var pageStart   = Date.now();
    var currentPage = window.location.pathname || '/';

    // ── Helpers ──────────────────────────────────────────────────────────

    function getConsent() {
        try { return JSON.parse(localStorage.getItem('ss_cookie_consent')); }
        catch (e) { return null; }
    }

    function analyticsAllowed() {
        var c = getConsent();
        return c && c.analytics === true;
    }

    function todayStr() {
        return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    }

    function safeGet(key) {
        try { return JSON.parse(localStorage.getItem(key)) || {}; }
        catch (e) { return {}; }
    }

    function safeSet(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); }
        catch (e) { /* storage full or blocked */ }
    }

    // ── Record page visit (once per session per page) ────────────────────

    function recordVisit() {
        if (!analyticsAllowed()) return;

        var today    = todayStr();
        var visits   = safeGet(VISITS_KEY);
        var session  = {};
        try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {}; } catch(e) {}

        // Only count each unique page once per browser session
        if (!session[currentPage]) {
            session[currentPage] = true;
            try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch(e) {}

            // Increment today's visit count
            visits[today] = (visits[today] || 0) + 1;

            // Keep only last 90 days to avoid growing forever
            var keys = Object.keys(visits).sort();
            if (keys.length > 90) {
                keys.slice(0, keys.length - 90).forEach(function(k) { delete visits[k]; });
            }

            safeSet(VISITS_KEY, visits);
        }
    }

    // ── Record time on page (on unload) ──────────────────────────────────

    function recordTimeOnPage() {
        if (!analyticsAllowed()) return;

        var elapsed  = Date.now() - pageStart;
        // Ignore if page was open for less than 2 seconds (accidental clicks)
        if (elapsed < 2000) return;

        var pageTimes = safeGet(PAGE_KEY);
        pageTimes[currentPage] = (pageTimes[currentPage] || 0) + elapsed;
        safeSet(PAGE_KEY, pageTimes);
    }

    // ── Public API ────────────────────────────────────────────────────────
    // Access stats in the browser console with: SkolesausStats.report()

    window.SkolesausStats = {

        /** Returns raw page time data in seconds */
        pageTimes: function () {
            var raw = safeGet(PAGE_KEY);
            var out = {};
            Object.keys(raw).forEach(function (k) {
                out[k] = Math.round(raw[k] / 1000);
            });
            return out;
        },

        /** Returns daily visit counts */
        dailyVisits: function () {
            return safeGet(VISITS_KEY);
        },

        /** Pretty-prints a summary to the console */
        report: function () {
            var times  = this.pageTimes();
            var visits = this.dailyVisits();

            console.group('%c📊 Skolesaus lokale statistikk', 'font-weight:bold;color:#43d4b2;');

            console.group('⏱ Tid per side (sekunder, denne enheten)');
            var sortedPages = Object.keys(times).sort(function(a,b){ return times[b]-times[a]; });
            sortedPages.forEach(function(p) {
                var mins = Math.floor(times[p] / 60);
                var secs = times[p] % 60;
                console.log(p + ': ' + (mins > 0 ? mins + 'm ' : '') + secs + 's');
            });
            console.groupEnd();

            console.group('📅 Daglige besøk (denne enheten)');
            var sortedDays = Object.keys(visits).sort().reverse().slice(0, 14);
            sortedDays.forEach(function(d) { console.log(d + ': ' + visits[d] + ' besøk'); });
            console.groupEnd();

            console.log('%c⚠ Merk: Dette er kun data fra denne enheten/nettleseren.', 'color:#888;font-size:11px;');
            console.log('%c   For statistikk på tvers av brukere, sjekk Umami-dashbordet ditt.', 'color:#888;font-size:11px;');
            console.groupEnd();
        },

        /** Clears all local tracking data */
        clear: function () {
            localStorage.removeItem(PAGE_KEY);
            localStorage.removeItem(VISITS_KEY);
            console.log('Skolesaus statistikk slettet.');
        }
    };

    // ── Init ──────────────────────────────────────────────────────────────

    recordVisit();

    // Use both visibilitychange and beforeunload for best coverage
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') recordTimeOnPage();
    });

    window.addEventListener('beforeunload', recordTimeOnPage);

    window.addEventListener('pagehide', recordTimeOnPage);

})();