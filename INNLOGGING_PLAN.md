# Innlogging, profil og poengsystem – implementeringsplan

> Bygger videre på `STRUCTURE_PLAN.md` punkt 6 og 7, som forberedte `src/shared/auth.js` og
> `src/shared/points.js` som plassholdere. Denne planen konkretiserer hvordan de fylles.
>
> **Valgt retning (avklart med deg):**
> - Backend/database: **Supabase** (hostet Postgres + innebygd auth + fillagring)
> - Hosting: frontend fortsetter på **GitHub Pages** som i dag; Supabase er en ekstern tjeneste
>   frontend snakker med over nettet (gratisnivå er nok til å starte)
> - Avatar: **forhåndslagde varianter** + **farge/bakgrunn-tilpasning**, ikke opplasting

## Innhold

1. [Hvorfor Supabase](#1-hvorfor-supabase)
2. [Datamodell](#2-datamodell)
3. [Autentisering](#3-autentisering)
4. [Avatar-system](#4-avatar-system)
5. [Profilside](#5-profilside)
6. [Poeng- og highscore-flyt](#6-poeng--og-highscore-flyt)
7. [Sikkerhet](#7-sikkerhet)
8. [Frontend-arkitektur](#8-frontend-arkitektur)
9. [Rekkefølge for gjennomføring](#9-rekkefølge-for-gjennomføring)
10. [Åpne spørsmål](#10-åpne-spørsmål)

---

## 1. Hvorfor Supabase

- Ferdig auth for **e-post** (magic link *eller* passord) og **Google OAuth** — begge dekkes av samme
  system, så "ta Google senere" er bare å slå på en ekstra provider i Supabase-dashbordet, ingen
  ny kode i frontend utover en "Logg inn med Google"-knapp.
- Postgres-database med **Row Level Security (RLS)** — helt nødvendig siden poeng aldri skal kunne
  forfalskes fra klienten (se pkt. 7).
- Gratisnivået dekker et skoleprosjekt i denne størrelsen (500MB database, 50k månedlige aktive
  brukere, ubegrenset API-kall innenfor rimelighet).
- `@supabase/supabase-js` er et lite frontend-bibliotek — passer godt inn i dagens rene
  HTML/JS/Vite-oppsett uten å tvinge frem et UI-rammeverk.
- Ingen egen server å drifte eller betale for ved siden av GitHub Pages.

## 2. Datamodell

```sql
-- Supabase oppretter auth.users automatisk (e-post, passord-hash, google-id, osv.)

-- Offentlig profil, én rad per bruker, opprettes automatisk ved registrering
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_base text not null default 'default',   -- hvilken forhåndslaget variant
  avatar_color text not null default '#6c5ce7',   -- valgt bakgrunns-/aksentfarge
  created_at timestamptz not null default now()
);

-- Ett spill = én rad, statisk oppsett (fruktspleis, kloss-spreng, tallkombo, ev. minesweeper)
create table games (
  id text primary key,        -- 'fruktspleis' | 'kloss-spreng' | 'tallkombo' | ...
  display_name text not null
);

-- Highscore + total poengsum PER spill PER bruker
create table game_scores (
  user_id uuid references profiles(id) on delete cascade,
  game_id text references games(id),
  highscore integer not null default 0,
  total_points integer not null default 0,   -- summen av alle runder noensinne
  rounds_played integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- Loggen hver runde skriver til — kilden til sannhet, aggregatene over regnes ut herfra
create table game_rounds (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  game_id text references games(id),
  points integer not null check (points >= 0),
  played_at timestamptz not null default now()
);
```

- `total_points` (totalt for alle spill, som senere byttes mot premier) regnes ut som
  `sum(game_scores.total_points)` — enten en `view` eller regnet live i frontend. Trenger ikke
  egen kolonne før premie-innløsning kommer (da bør det være en egen `points_ledger`-tabell med
  saldo minus innløsninger, tilsvarende resonnementet i `STRUCTURE_PLAN.md` pkt. 7).
- `game_rounds` er bevisst en logg, ikke bare et aggregat — nødvendig for å kunne (a) oppdage
  juks/anomalier i ettertid, (b) bygge statistikk/historikk senere, (c) rekonstruere aggregatene
  hvis noe går galt.

## 3. Autentisering

**Metode: e-post + passord** (ikke magic link) — enklere for elever å forstå ("logg inn med
passord" er en kjent modell), og unngår avhengighet av at skole-e-post faktisk leverer raskt.
Supabase Auth håndterer passord-hashing, verifisering på e-post og "glemt passord"-flyt
ferdig — vi bygger kun skjemaene.

**2FA:** ikke nødvendig, som avtalt — bruk Supabase sin standard passord-flyt uten noe ekstra steg.

**Google (fase 2):** Supabase OAuth-provider for Google slås på i dashbordet; frontend legger til
én knapp (`supabase.auth.signInWithOAuth({ provider: 'google' })`). Ingen endring i datamodell —
Supabase kobler Google-kontoen til samme `auth.users`/`profiles`-rad basert på e-post.

**Sesjon:** `supabase-js` håndterer token-lagring og refresh automatisk i `localStorage`. `auth.js`
eksponerer:

```js
// src/shared/auth.js (skisse)
export async function signUpWithEmail(email, password, displayName) { ... }
export async function signInWithEmail(email, password) { ... }
export async function signInWithGoogle() { ... }        // fase 2
export async function signOut() { ... }
export function onAuthChange(callback) { ... }           // abonner på innlogget/utlogget
export function getCurrentUser() { ... }
```

`nav.js` sitt ekspansjonspunkt (`#ss-nav-account-slot`, jf. `STRUCTURE_PLAN.md` pkt. 6) fylles av
`auth.js` med enten "Logg inn"-knapp eller avatar + navn + "Min profil"-lenke.

**Ny side:** `src/pages/logg-inn/index.html` — enkelt skjema med faner "Logg inn" / "Registrer
deg", pluss "Logg inn med Google"-knapp (fase 2, kan legges til som deaktivert/skjult knapp fra
start slik at UI-et ikke må endres senere).

## 4. Avatar-system

Ingen opplasting — brukeren **kombinerer forhåndslagde valg**:

1. **Base-figur**: 8–12 ferdige SVG-illustrasjoner (lages som statiske assets i
   `src/assets/avatars/`, f.eks. `fox.svg`, `owl.svg`, `robot.svg` …) — samme idé som dagens
   "default profilbilde", bare flere å velge mellom.
2. **Farge/bakgrunn**: en fast palett (8–10 farger som matcher `tokens.css`) brukeren velger
   bakgrunnssirkel/aksent fra. SVG-ene bør bruke `currentColor` eller en CSS-variabel internt slik
   at samme fil kan farges ulikt uten å lagre mange bilde-varianter.

Lagres kun som to felt i `profiles` (`avatar_base`, `avatar_color`) — aldri en bildefil per bruker.
Rendring skjer klient-side: `<AvatarSVG base="fox" color="#6c5ce7" />`-lignende liten hjelpefunksjon
i `src/shared/avatar.js` som setter riktig SVG + `style="--avatar-color: ..."`.

**Default ved registrering:** tilfeldig eller fast base (f.eks. alltid `fox` + Skolesaus sin
merkevarefarge) + `display_name` avledet fra e-post, redigerbart senere på profilsiden.

**Redigering:** en enkel "Rediger avatar"-modal på profilsiden — grid med baser, fargevelger under
— lagrer direkte til `profiles`-raden via Supabase-klienten (`update profiles set avatar_base=...`).

## 5. Profilside

Ny side: `src/pages/profil/index.html` (kun for innloggede — redirect til `logg-inn` hvis ikke).

Innhold:
- Avatar (stor) + "Rediger avatar"-knapp + redigerbart visningsnavn
- **Totalt poeng, alle spill** øverst, fremhevet (det som senere byttes mot premier)
- Én seksjon/kort per spill (fruktspleis, kloss-spreng, tallkombo, …), hver med:
  - Highscore
  - Totale poeng for det spillet
  - Antall runder spilt
- Etter hvert (fase 2/3): historikk-graf, premie-katalog-lenke

Data hentes med én spørring: `select * from game_scores where user_id = ...` join `games` for
visningsnavn — rendres i en enkel liste, ingen rammeverk nødvendig.

## 6. Poeng- og highscore-flyt

I dag skriver hvert spill direkte til sin egen `localStorage`-nøkkel
(`fruitBest`, `bb_hi`, `2048-best`) — dette **beholdes uendret for ikke-innloggede** (spillene skal
fungere uten innlogging), men når en bruker er innlogget rapporterer spillet i tillegg til
`points.js`:

```js
// src/shared/points.js (skisse)
export async function reportRound(gameId, points) {
  const user = getCurrentUser();
  if (!user) return; // ikke innlogget → kun lokal highscore som i dag
  await supabase.from('game_rounds').insert({ user_id: user.id, game_id: gameId, points });
  // highscore/total_points i game_scores oppdateres av en Postgres-trigger (se pkt. 7),
  // IKKE regnet ut og sendt inn ferdig fra klienten.
}
```

Hvert spill trenger **ett** nytt kall ved spillslutt (`reportRound('fruktspleis', score)`) i tillegg
til eksisterende `localStorage`-skriving — minimal endring i eksisterende spillogikk, i tråd med
prinsippet fra `STRUCTURE_PLAN.md` pkt. 7 om at spillene ikke skal måtte bygges om.

## 7. Sikkerhet

- **RLS på**: `profiles` og `game_scores` er kun lesbare av alle (offentlig highscore-liste er en
  naturlig fremtidig funksjon), men kun *skrivbare* av eieren (`auth.uid() = user_id`) — og selv
  det bare for `profiles`/avatar-felt.
- **`game_scores` skal aldri kunne skrives direkte fra klienten.** Klienten får kun lov til å
  `insert` i `game_rounds` (med `check (points >= 0)` og en fornuftig øvre grense per spill for å
  hindre åpenbart absurde verdier). En **Postgres-trigger** (`after insert on game_rounds`)
  oppdaterer `game_scores` (highscore = `greatest(highscore, ny_poengsum)`, `total_points += ny`,
  `rounds_played += 1`) — dette skjer server-side, ikke i frontend, nettopp for å hindre at noen
  åpner dev-verktøy og poster en falsk highscore rett til databasen.
- Vurder på sikt en enkel **rate limit / sanity check** i triggeren (f.eks. avvis en runde med
  urealistisk høy poengsum for det spesifikke spillet) — ikke kritisk for lansering, men billig å
  legge inn samtidig som triggeren skrives.
- Supabase **anon key** er trygg å ha i frontend-kildekoden (den er designet for det) — det er RLS
  som gjør at nøkkelen ikke gir skrivetilgang utover det som er eksplisitt tillatt.

## 8. Frontend-arkitektur

- Nytt npm-avhengighet: `@supabase/supabase-js`.
- Nye miljøvariabler i `.env` (ikke committes) / GitHub Actions secrets:
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — bygges inn i `dist/` av Vite ved deploy (anon key
  er trygg å eksponere, se pkt. 7).
- `src/shared/supabaseClient.js` — én delt, initialisert klient, importert av `auth.js`/`points.js`.
- `src/shared/auth.js` og `points.js` fylles ut som skissert over — fortsatt de eneste stedene
  resten av koden trenger å importere fra.
- `nav.js` utvides til å kalle `auth.js` sitt `onAuthChange` og fylle
  `#ss-nav-account-slot` — påvirker ikke spillenes egen markup/CSS.
- GitHub Actions-workflowen (`deploy.yml`) må få de to `VITE_*`-secretene tilgjengelig i build-steget.

## 9. Rekkefølge for gjennomføring

1. Opprett Supabase-prosjekt, sett opp tabellene og RLS-policyene fra pkt. 2/7 (SQL-migrasjon i
   repoet, f.eks. `supabase/migrations/`).
2. Legg til `@supabase/supabase-js`, `supabaseClient.js`, miljøvariabler, GitHub Actions-secrets.
3. Bygg `logg-inn`-siden + fyll `auth.js` (kun e-post/passord i denne omgang).
4. Utvid `nav.js` med kontoslot; bygg `profil`-siden (avatar-visning, navn, tomme poeng-seksjoner).
5. Bygg avatar-system: SVG-assets, `avatar.js`, rediger-avatar-modal.
6. Fyll `points.js`; koble `reportRound(...)` inn i de tre eksisterende spillene ved spillslutt.
7. Test hele flyten ende-til-ende (registrering → spill → highscore vises på profil).
8. Fase 2: slå på Google-provider i Supabase, aktiver "Logg inn med Google"-knappen.
9. Senere, egen oppgave: premie-innløsning (krever `points_ledger`/saldo-modell, jf. pkt. 2).

## 10. Åpne spørsmål

1. **Visningsnavn**: skal det være fritekst valgt av bruker, eller f.eks. fornavn + klasse hentet
   fra en Feide/skole-innlogging senere? (Påvirker ikke arkitekturen nå, men fint å vite retning.)
2. **Offentlig highscore-liste** ("beste spillere") — ønsket for lansering, eller kun privat
   profilside i første omgang? Endrer ikke datamodellen (RLS tillater begge deler), men påvirker
   om vi bygger UI for det nå.
3. **`minesweeper.html`** — fortsatt uavklart fra `STRUCTURE_PLAN.md` pkt. 9; bør avklares før den
   evt. kobles på poengsystemet.
4. Bekreft at **e-post/passord** (ikke magic link) er ønsket flyt for fase 1.

---

Når du har sett gjennom planen og evt. svart på pkt. 10, kan gjennomføringen (pkt. 9) startes som
en egen implementeringsoppgave.
