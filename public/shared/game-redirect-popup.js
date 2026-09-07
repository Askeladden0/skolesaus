/**
 * game-redirect-popup.js
 * ─────────────────────────────────────────────────────────────────
 * Drop this on a page that has moved to studilla.no – a game:
 *   <script src="/shared/game-redirect-popup.js" data-redirect="https://studilla.no/player.html?id=xxx"><\/script>
 * or a guide/resource (add data-type="guide" so the popup text on the
 * other side says "guiden", not "spillet"):
 *   <script src="/shared/game-redirect-popup.js" data-redirect="https://studilla.no/guide.html?id=xxx" data-type="guide"><\/script>
 *
 * Sends the visitor straight on to the new URL. The "dette har flyttet"
 * popup itself is shown on the studilla.no side once the visitor lands
 * there (see js/new-site-welcome-modal.js in the studilla codebase) —
 * this script just appends a marker so that page knows to show it, and
 * which variant of the text to use.
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    var thisScript = document.currentScript;
    var redirectUrl = thisScript && thisScript.getAttribute('data-redirect');
    if (!redirectUrl) return;

    var type = thisScript.getAttribute('data-type');
    var marker = type === 'guide' ? 'guide' : '1';

    var separator = redirectUrl.indexOf('?') === -1 ? '?' : '&';
    window.location.replace(redirectUrl + separator + 'ny-side=' + marker);

})();
