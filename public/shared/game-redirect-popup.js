/**
 * game-redirect-popup.js
 * ─────────────────────────────────────────────────────────────────
 * Drop this on a game page that has moved to studilla.no:
 *   <script src="/shared/game-redirect-popup.js" data-redirect="https://studilla.no/player.html?id=xxx"><\/script>
 *
 * Sends the visitor straight on to the new URL. The "dette har flyttet"
 * popup itself is shown on the studilla.no side once the visitor lands
 * there (see js/new-site-welcome-modal.js in the studilla codebase) —
 * this script just appends a marker so that page knows to show it.
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    var thisScript = document.currentScript;
    var redirectUrl = thisScript && thisScript.getAttribute('data-redirect');
    if (!redirectUrl) return;

    var separator = redirectUrl.indexOf('?') === -1 ? '?' : '&';
    window.location.replace(redirectUrl + separator + 'ny-side=1');

})();
