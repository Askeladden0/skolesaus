/**
 * nav.js
 * ─────────────────────────────────────────────────────────────────
 * Injects the shared Skolesaus navigation header into any page.
 *
 * Usage: Add as the FIRST script inside <body> on every page:
 *   <script src="nav.js"></script>
 *
 * The current page's nav link will be highlighted automatically.
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    // ── Nav items — add new pages here ───────────────────────────────────
    var NAV_ITEMS = [
        { label: '<i class="fa-solid fa-house"></i>',        href: 'index.html',      match: ['/', '/index.html'] },
        
      
    ];

    // ── Inject CSS ────────────────────────────────────────────────────────
    var css = [
        '#ss-nav-wrapper {',
        '    position: fixed;',
        '    top: 0;',
        '    left: 0;',
        '    width: 100%;',
        '    z-index: 1000;',
        '}',
        '#ss-nav {',
        '    padding: 0 5%;',
        '    height: 56px;',
        '    display: flex;',
        '    justify-content: space-between;',
        '    align-items: center;',
        '    border-bottom: 1px solid #2a2a2a;',
        '    background: rgba(23, 25, 37, 0.92);',
        '    backdrop-filter: blur(8px);',
        '    -webkit-backdrop-filter: blur(8px);',
        '    font-family: Lato, Arial, sans-serif;',
        '    box-sizing: border-box;',
        '    width: 100%;',
        '}',
        'body { padding-top: 56px !important; }',
        '#ss-nav a { text-decoration: none; color: inherit; }',
        '#ss-nav .ss-nav-logo {',
        '    font-weight: 700;',
        '    font-size: 1.6rem;',
        '    color: #43d4b2;',
        '    letter-spacing: -0.5px;',
        '    line-height: 1;',
        '    display: flex;',
        '    align-items: center;',
        '}',
        '#ss-nav .ss-nav-logo span { color: #d4d4d4; }',
        '#ss-nav .ss-nav-right { display: flex; align-items: center; gap: 0.4rem; }',
        '#ss-nav .ss-nav-links {',
        '    display: flex; align-items: center; gap: 0.2rem;',
        '    list-style: none; margin: 0; padding: 0;',
        '}',
        '#ss-nav .ss-nav-links li a {',
        '    font-size: 0.82rem; font-weight: 700; color: #d6d5d5;',
        '    padding: 0.4rem 0.85rem; border-radius: 4px;',
        '    border: 1px solid transparent;',
        '    transition: color 0.15s, border-color 0.15s, background 0.15s;',
        '    display: block; white-space: nowrap;',
        '}',
        '#ss-nav .ss-nav-links li a:hover { color: #d4d4d4; background: #1e2130; }',
        '#ss-nav .ss-nav-links li a.ss-nav-active {',
        '    color: #43d4b2;',
        '    border-color: rgba(67,212,178,0.25);',
        '    background: rgba(67,212,178,0.06);',
        '}',
        '#ss-nav .ss-nav-made-by {',
        '    font-size: 0.75rem; color: #43d4b2;',
        '    padding-left: 1.2rem; border-left: 1px solid #2a2a2a;',
        '    margin-left: 0.8rem; white-space: nowrap;',
        '}',
        '}',
        '#ss-nav .ss-nav-made-by:hover {',
        '    color: #afafaf;',
        '}',
        '#ss-nav .ss-nav-made-by strong { color: #fcf9f9; }',
        '@media (max-width: 768px) {',
        '    #ss-nav .ss-nav-made-by { display: none; }',
        '    #ss-nav .ss-nav-logo { font-size: 1.4rem; }',
        '}',
        '@media (max-width: 400px) { #ss-nav { padding: 0 4%; } }'
    ].join('\n');

    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // ── Build nav HTML ────────────────────────────────────────────────────
    var currentPath = window.location.pathname;

    var linksHTML = NAV_ITEMS.map(function (item) {
        var isActive = item.match.some(function (m) {
            return currentPath === m || currentPath.endsWith(m);
        });
        return '<li><a href="' + item.href + '"' +
            (isActive ? ' class="ss-nav-active" aria-current="page"' : '') +
            '>' + item.label + '</a></li>';
    }).join('');

    var navHTML = '<nav id="ss-nav" role="navigation" aria-label="Hovednavigasjon">' +
        '<a href="index.html" class="ss-nav-logo" aria-label="Skolesaus">SKOLE<span>SAUS</span></a>' +
        '<div class="ss-nav-right">' +
            '<ul class="ss-nav-links">' + linksHTML + '</ul>' +
            '<span class="ss-nav-made-by">Laget av <a href="https://www.tiktok.com/@snorre.saus" style="color: #43d4b2; text-decoration: underline;"><strong>Snorre Saus</strong></a></span><i class="fa-brands fa-tiktok"></i>' +
        '</div>' +
        '</nav>';

    // ── Inject nav ────────────────────────────────────────────────────────
    // Uses position:fixed on the wrapper so it escapes any body flex/grid
    // layout that game pages use (e.g. body { display:flex; align-items:center }).
    var wrapper = document.createElement('div');
    wrapper.id = 'ss-nav-wrapper';
    wrapper.innerHTML = navHTML;

    var existingHeader = document.querySelector('header');
    if (existingHeader) {
        existingHeader.parentNode.replaceChild(wrapper, existingHeader);
    } else {
        document.body.insertBefore(wrapper, document.body.firstChild);
    }

})();