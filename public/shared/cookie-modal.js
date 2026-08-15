/**
 * cookie-modal.js
 * ─────────────────────────────────────────────────────────────────
 * Drop this on every page with:
 *   <script src="cookie-modal.js"><\/script>
 *
 * It will:
 *   - Inject the cookie modal HTML into the page
 *   - On the homepage: show modal when a .game-link is clicked
 *   - On subpages: show modal automatically if no consent exists
 *   - Handle "Godta alle" and "Flere alternativer" buttons
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    // ── Inject modal HTML ─────────────────────────────────────────────────

    var modalHTML = '\
<style>\
  #ss-cookie-overlay {\
    display:none;\
    position:fixed;\
    inset:0;\
    z-index:99999;\
    justify-content:center;\
    align-items:center;\
    backdrop-filter:blur(0.5px);\
  }\
  #ss-cookie-overlay.active { display:flex; animation:ssCookieFadeIn 0.2s ease; }\
  #ss-cookie-modal {\
    background:#1a1d2e;\
    border:1px solid #2e3047;\
    border-radius:12px;\
    padding:2.2rem 2.4rem;\
    max-width:480px;\
    width:90%;\
    position:relative;\
    box-shadow:0 24px 64px rgba(0,0,0,0.6);\
    animation:ssCookieSlideUp 0.25s ease;\
    font-family:"Lato",Arial,sans-serif;\
  }\
  #ss-cookie-modal .ss-cookie-icon{font-size:2rem;margin-bottom:0.8rem;display:block;}\
  #ss-cookie-modal h2{\
    font-size:1.3rem;color:#d4d4d4;\
    margin-bottom:0.6rem;font-weight:700;\
  }\
  #ss-cookie-modal p{\
    font-size:0.83rem;color:#888;\
    line-height:1.7;margin-bottom:1.6rem;\
  }\
  #ss-cookie-modal p a{color:#43d4b2;text-decoration:underline;}\
  .ss-cookie-btns{display:flex;gap:0.75rem;flex-wrap:wrap;}\
  .ss-cookie-btn-accept{\
    flex:1;background:#43d4b2;color:#000;border:none;\
    padding:0.7rem 1.5rem;font-size:0.88rem;\
    font-family:"Lato",Arial,sans-serif;font-weight:700;\
    border-radius:4px;cursor:pointer;\
    transition:opacity 0.15s;white-space:nowrap;\
  }\
  .ss-cookie-btn-accept:hover{opacity:0.85;}\
  .ss-cookie-btn-more{\
    flex:1;background:transparent;color:#d4d4d4;\
    border:1.5px solid #2a2a2a;\
    padding:0.7rem 1.5rem;font-size:0.88rem;\
    font-family:"Lato",Arial,sans-serif;font-weight:700;\
    border-radius:4px;cursor:pointer;\
    transition:border-color 0.15s,color 0.15s;white-space:nowrap;\
  }\
  .ss-cookie-btn-more:hover{border-color:#43d4b2;color:#43d4b2;}\
  .ss-cookie-note{\
    font-size:0.72rem!important;color:#555!important;\
    margin-top:1rem!important;margin-bottom:0!important;\
    text-align:center;\
  }\
  @media(max-width:500px){\
    #ss-cookie-modal{padding:1.6rem 1.4rem;}\
    .ss-cookie-btns{flex-direction:column;}\
  }\
</style>\
<div id="ss-cookie-overlay">\
  <div id="ss-cookie-modal" role="dialog" aria-modal="true" aria-labelledby="ss-cookie-title">\
    <h2 id="ss-cookie-title">Vi bruker cookies🍪</h2>\
    <p>For å gi deg den beste opplevelsen bruker vi cookies til statistikk og forbedring av siden.\
       Du kan velge hvilke cookies du tillater.\
       <a href="personvern.html">Les mer om personvern</a>.\
    </p>\
    <div class="ss-cookie-btns">\
      <button class="ss-cookie-btn-more" id="ss-btn-more">Flere alternativer</button>\
      <button class="ss-cookie-btn-accept" id="ss-btn-accept">Godta alle</button>\
    </div>\
  </div>\
</div>';

    // Insert modal into page
    var container = document.createElement('div');
    container.innerHTML = modalHTML;
    document.body.appendChild(container);

    var overlay = document.getElementById('ss-cookie-overlay');
    var modal   = document.getElementById('ss-cookie-modal');

    // ── Consent helpers ───────────────────────────────────────────────────

    function getConsent() {
        try { return JSON.parse(localStorage.getItem('ss_cookie_consent')); }
        catch (e) { return null; }
    }

    function setConsent(obj) {
        obj.timestamp = Date.now();
        localStorage.setItem('ss_cookie_consent', JSON.stringify(obj));
    }

    function applyConsent() {
        var c = getConsent();
        if (!c) return;
        if (typeof gtag === 'function') {
            gtag('consent', 'update', {
                analytics_storage: c.analytics ? 'granted' : 'denied',
                ad_storage:        c.marketing ? 'granted' : 'denied'
            });
        }
    }

    function showModal() {
        overlay.classList.add('active');
        // Reset animation so it replays if shown again
        modal.style.animation = 'none';
        modal.offsetHeight;
        modal.style.animation = 'ssCookieSlideUp 0.25s ease';
    }

    function hideModal() {
        overlay.classList.remove('active');
    }

    // ── Button handlers ───────────────────────────────────────────────────

    document.getElementById('ss-btn-accept').addEventListener('click', function () {
        setConsent({ necessary: true, analytics: true, marketing: true });
        applyConsent();
        hideModal();

        // Navigate to pending destination if set
        var dest = sessionStorage.getItem('ss_pending_dest');
        if (dest) {
            sessionStorage.removeItem('ss_pending_dest');
            window.location.href = dest;
        }
    });

    document.getElementById('ss-btn-more').addEventListener('click', function () {
        // Remember where to return after saving preferences
        var dest = sessionStorage.getItem('ss_pending_dest') || window.location.href;
        sessionStorage.setItem('ss_prefs_return', dest);
        window.location.href = 'personvern.html';
    });

    // Shake on backdrop click — don't allow dismissal without a choice
    overlay.addEventListener('click', function (e) {
        if (e.target !== overlay) return;
        modal.style.animation = 'none';
        modal.offsetHeight;
        modal.style.animation = 'ssCookieShake 0.35s ease';
    });

    // ── Page logic ────────────────────────────────────────────────────────

    var isHomepage = (
        window.location.pathname === '/' ||
        window.location.pathname === '/index.html' ||
        window.location.pathname.endsWith('index.html')
    );

    // Apply consent on every page load if already given
    applyConsent();

    if (isHomepage) {
        // Homepage: intercept game link clicks only
        document.querySelectorAll('.game-link').forEach(function (link) {
            link.addEventListener('click', function (e) {
                if (getConsent()) return; // already answered, let through
                e.preventDefault();
                var dest = this.getAttribute('href');
                if (dest && dest !== '#') sessionStorage.setItem('ss_pending_dest', dest);
                showModal();
            });
        });
    } else {
        // Subpage: show modal immediately if no consent yet
        if (!getConsent()) {
            // Small delay so the page renders first
            setTimeout(showModal, 200);
        }
    }

})();