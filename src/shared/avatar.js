/**
 * avatar.js
 * ─────────────────────────────────────────────────────────────────
 * Avatar-system uten opplasting (se INNLOGGING_PLAN.md punkt 4).
 * Brukeren velger en forhåndslaget "base"-figur pluss en farge fra en
 * fast palett — begge lagres kun som to tekstfelt på profilen
 * (`avatar_base`, `avatar_color`), aldri som en bildefil per bruker.
 *
 * Figurene er tegnet med `currentColor` for strekene, slik at samme
 * SVG kan farges ulikt via CSS uten å lagre flere bilde-varianter.
 * ─────────────────────────────────────────────────────────────────
 */

export const AVATAR_COLORS = [
  '#43d4b2', // Skolesaus-grønn (default)
  '#6c5ce7',
  '#e17055',
  '#0984e3',
  '#fdcb6e',
  '#e84393',
  '#00b894',
  '#d63031',
];

const ICONS = {
  fox: '<path d="M12 44 L24 20 L36 44 Z" fill="currentColor" opacity=".18"/><circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="25" cy="30" r="2.4" fill="currentColor"/><circle cx="39" cy="30" r="2.4" fill="currentColor"/><path d="M27 38 Q32 42 37 38" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M20 18 L26 24 M44 18 L38 24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  owl: '<circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="29" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="40" cy="29" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="24" cy="29" r="1.8" fill="currentColor"/><circle cx="40" cy="29" r="1.8" fill="currentColor"/><path d="M32 33 L29 39 L35 39 Z" fill="currentColor"/>',
  cat: '<circle cx="32" cy="34" r="18" fill="none" stroke="currentColor" stroke-width="3"/><path d="M18 22 L23 12 L28 22 M36 22 L41 12 L46 22" stroke="currentColor" stroke-width="3" fill="none" stroke-linejoin="round"/><circle cx="25" cy="33" r="2.2" fill="currentColor"/><circle cx="39" cy="33" r="2.2" fill="currentColor"/><path d="M28 40 Q32 43 36 40" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  robot: '<rect x="14" y="18" width="36" height="28" rx="6" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="25" cy="32" r="3" fill="currentColor"/><circle cx="39" cy="32" r="3" fill="currentColor"/><path d="M24 40 h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M32 10 v8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="8" r="2.4" fill="currentColor"/>',
  panda: '<circle cx="32" cy="32" r="19" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="18" cy="16" r="6" fill="currentColor"/><circle cx="46" cy="16" r="6" fill="currentColor"/><ellipse cx="24" cy="30" rx="5" ry="6" fill="currentColor"/><ellipse cx="40" cy="30" rx="5" ry="6" fill="currentColor"/><circle cx="24" cy="30" r="1.8" fill="var(--avatar-bg,#fff)"/><circle cx="40" cy="30" r="1.8" fill="var(--avatar-bg,#fff)"/><ellipse cx="32" cy="38" rx="3" ry="2.2" fill="currentColor"/>',
  star: '<path d="M32 10 L38 26 L55 27 L41 37 L46 54 L32 44 L18 54 L23 37 L9 27 L26 26 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>',
  rocket: '<path d="M32 8 C42 16 44 30 40 42 L24 42 C20 30 22 16 32 8 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="24" r="4" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M24 40 L16 50 M40 40 L48 50" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M28 42 L26 56 M36 42 L38 56" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  ghost: '<path d="M14 46 V28 a18 18 0 0 1 36 0 V46 L42 40 L36 46 L30 40 L24 46 L18 40 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="25" cy="27" r="2.4" fill="currentColor"/><circle cx="39" cy="27" r="2.4" fill="currentColor"/>',
};

export const AVATAR_BASES = Object.keys(ICONS);

export function isValidAvatarBase(base) {
  return Object.prototype.hasOwnProperty.call(ICONS, base);
}

/** Returnerer et SVG-markup-utdrag (uten ytre <svg>) for en gitt base. */
export function avatarIconMarkup(base) {
  return ICONS[base] ?? ICONS.fox;
}

/**
 * Bygger en komplett, selvstendig avatar som HTML-string:
 * fargesirkel i bakgrunnen + figur-strek i hvitt over.
 */
export function avatarMarkup(base, color, size = 64) {
  const icon = avatarIconMarkup(base);
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="Profilbilde"
         style="--avatar-bg:${color}">
      <circle cx="32" cy="32" r="32" fill="${color}"></circle>
      <g color="#fff" style="color:#fff">${icon}</g>
    </svg>
  `;
}
