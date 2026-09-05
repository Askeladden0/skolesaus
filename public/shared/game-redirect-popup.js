/**
 * game-redirect-popup.js
 * ─────────────────────────────────────────────────────────────────
 * Drop this on a game page that has moved to studilla.no:
 *   <script src="/shared/game-redirect-popup.js" data-redirect="https://studilla.no/player.html?id=xxx"><\/script>
 *
 * Shows a temporary popup announcing the move, then sends the visitor
 * on to the new URL (via the button, or automatically after a short
 * countdown).
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    var thisScript = document.currentScript;
    var redirectUrl = thisScript && thisScript.getAttribute('data-redirect');
    if (!redirectUrl) return;

    var COUNTDOWN_SECONDS = 8;

    var modalHTML = '\
<style>\
  #ss-redirect-overlay {\
    display:none;\
    position:fixed;\
    inset:0;\
    z-index:100000;\
    justify-content:center;\
    align-items:center;\
    backdrop-filter:blur(0.5px);\
    background:rgba(0,0,0,0.55);\
  }\
  #ss-redirect-overlay.active { display:flex; animation:ssRedirectFadeIn 0.2s ease; }\
  #ss-redirect-modal {\
    background:#1a1d2e;\
    border:1px solid #2e3047;\
    border-radius:12px;\
    padding:2.2rem 2.4rem;\
    max-width:440px;\
    width:90%;\
    text-align:center;\
    box-shadow:0 24px 64px rgba(0,0,0,0.6);\
    animation:ssRedirectSlideUp 0.25s ease;\
    font-family:"Lato",Arial,sans-serif;\
  }\
  #ss-redirect-modal .ss-redirect-icon{font-size:2.2rem;margin-bottom:0.8rem;display:block;}\
  #ss-redirect-modal h2{\
    font-size:1.3rem;color:#d4d4d4;\
    margin-bottom:0.8rem;font-weight:700;\
  }\
  #ss-redirect-modal p{\
    font-size:0.9rem;color:#aaa;\
    line-height:1.7;margin-bottom:1.2rem;\
  }\
  #ss-redirect-modal .ss-redirect-sign{\
    font-style:italic;color:#43d4b2;font-weight:700;\
  }\
  .ss-redirect-btn{\
    background:#43d4b2;color:#000;border:none;\
    padding:0.75rem 1.6rem;font-size:0.9rem;\
    font-family:"Lato",Arial,sans-serif;font-weight:700;\
    border-radius:4px;cursor:pointer;\
    transition:opacity 0.15s;white-space:nowrap;\
  }\
  .ss-redirect-btn:hover{opacity:0.85;}\
  .ss-redirect-count{\
    font-size:0.78rem;color:#666;margin-top:1rem;\
  }\
  @keyframes ssRedirectFadeIn{from{opacity:0;}to{opacity:1;}}\
  @keyframes ssRedirectSlideUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}\
  @media(max-width:500px){\
    #ss-redirect-modal{padding:1.6rem 1.4rem;}\
  }\
</style>\
<div id="ss-redirect-overlay">\
  <div id="ss-redirect-modal" role="dialog" aria-modal="true" aria-labelledby="ss-redirect-title">\
    <span class="ss-redirect-icon">🎮</span>\
    <h2 id="ss-redirect-title">Dette spillet har flyttet!</h2>\
    <p>Dette er min nye spillnettside – med flere spill, poeng og rangeringer.<br><span class="ss-redirect-sign">- Snorre Saus</span></p>\
    <button class="ss-redirect-btn" id="ss-redirect-btn">Ta meg dit nå</button>\
    <div class="ss-redirect-count" id="ss-redirect-count"></div>\
  </div>\
</div>';

    var container = document.createElement('div');
    container.innerHTML = modalHTML;
    document.body.appendChild(container);

    var overlay = document.getElementById('ss-redirect-overlay');
    var countEl = document.getElementById('ss-redirect-count');

    function goNow() {
        window.location.href = redirectUrl;
    }

    document.getElementById('ss-redirect-btn').addEventListener('click', goNow);

    function showModal() {
        overlay.classList.add('active');

        var secondsLeft = COUNTDOWN_SECONDS;
        function tick() {
            countEl.textContent = 'Sender deg videre om ' + secondsLeft + ' sekunder …';
            if (secondsLeft <= 0) {
                goNow();
                return;
            }
            secondsLeft -= 1;
            setTimeout(tick, 1000);
        }
        tick();
    }

    // Small delay so the page renders first.
    setTimeout(showModal, 200);

})();
