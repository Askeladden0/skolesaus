/**
 * authNav.js
 * ─────────────────────────────────────────────────────────────────
 * Fyller ekspansjonspunktet `#ss-nav-account-slot` (satt opp av
 * public/shared/nav.js) med enten en "Logg inn"-lenke eller
 * avatar + navn som lenker til profilsiden — avhengig av
 * innloggingsstatus. Importeres som <script type="module"> på alle
 * sider slik at nav.js selv ikke trenger å vite noe om Supabase.
 * ─────────────────────────────────────────────────────────────────
 */
import { onAuthChange, getProfile } from './auth.js';
import { avatarMarkup } from './avatar.js';

function render(slot, user, profile) {
  if (!user) {
    slot.innerHTML = '<a href="/logg-inn.html">Logg inn</a>';
    return;
  }
  const name = profile?.display_name ?? user.email ?? 'Min profil';
  const avatar = profile
    ? avatarMarkup(profile.avatar_base, profile.avatar_color, 28)
    : '';
  slot.innerHTML = `<a href="/profil.html" class="ss-nav-avatar-link">${avatar}<span>${escapeHtml(name)}</span></a>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function init() {
  const slot = document.getElementById('ss-nav-account-slot');
  if (!slot) return;

  onAuthChange(async (user) => {
    if (!user) {
      render(slot, null, null);
      return;
    }
    try {
      const profile = await getProfile(user.id);
      render(slot, user, profile);
    } catch {
      render(slot, user, null);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
