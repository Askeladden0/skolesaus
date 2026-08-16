# Supabase-oppsett – innlogging og poengsystem

Koden for innlogging/profil/poeng er ferdig implementert (se `INNLOGGING_PLAN.md`), men den
trenger et faktisk Supabase-prosjekt for å fungere. Dette må gjøres av deg (krever en konto) — jeg
kan ikke opprette den for deg. Slik gjør du det:

## 1. Opprett prosjektet

1. Gå til [supabase.com](https://supabase.com) → opprett konto/logg inn → **New project**.
2. Velg navn (f.eks. `skolesaus`), passord til databasen (lagre det trygt), og en region nær Norge
   (f.eks. Frankfurt/`eu-central-1`).
3. Vent til prosjektet er ferdig provisjonert (~2 min).

## 2. Kjør databasemigrasjonen

1. Åpne **SQL Editor** i Supabase-dashbordet.
2. Lim inn hele innholdet fra [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   i dette repoet, og kjør den (**Run**).
3. Dette oppretter tabellene `profiles`, `games`, `game_scores`, `game_rounds`, setter opp Row
   Level Security-policyene, og legger inn de tre spillene (`fruktspleis`, `kloss-spreng`,
   `tallkombo`).

## 3. Slå på e-post-autentisering

Er som regel på som standard. Sjekk under **Authentication → Providers → Email** at den er
aktivert. Under **Authentication → Settings** kan du velge om ny bruker må bekrefte e-posten før
innlogging (anbefalt: på).

## 4. Hent API-nøklene

Under **Project Settings → API** finner du:
- **Project URL** → dette er `VITE_SUPABASE_URL`
- **anon public** key → dette er `VITE_SUPABASE_ANON_KEY`

(Ikke `service_role`-nøkkelen — den skal aldri havne i frontend-kode.)

## 5. Koble nøklene til prosjektet

**Lokal utvikling:**
```
cp .env.example .env
# fyll inn VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY i .env
npm install
npm run dev
```

**Produksjon (GitHub Pages via Actions):**
1. Gå til repoet på GitHub → **Settings → Secrets and variables → Actions**.
2. Legg til to **Repository secrets**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. `.github/workflows/static.yml` er allerede satt opp til å lese disse secretene inn i
   build-steget — ingen ytterligere endring nødvendig. Neste push til `main` bygger med
   innlogging aktivert.

Inntil disse secretene er satt kjører nettsiden fint som i dag — `isSupabaseConfigured` er `false`,
og innloggings-/profilsidene viser en forklarende melding istedenfor å krasje.

## 6. (Fase 2) Slå på Google-innlogging

"Logg inn med Google"-knappen på `logg-inn.html` er koblet til `signInWithGoogle()` og klikkbar —
den venter kun på at Google-provideren aktiveres i Supabase-prosjektet:

1. **Authentication → Providers → Google** i Supabase → aktiver, og følg Supabase sin veiledning
   for å opprette OAuth-klient i Google Cloud Console (klient-ID + hemmelighet limes inn i
   Supabase).
2. Under **Authentication → URL Configuration** i Supabase, sjekk at `https://skolesaus.no` (og
   `http://localhost:5173` for lokal testing) står under **Redirect URLs**, ellers avviser Supabase
   redirecten tilbake fra Google.
3. Ingen kodeendring nødvendig — inntil provideren er aktivert viser knappen bare en feilmelding
   fra Supabase (f.eks. "Unsupported provider") hvis noen klikker på den.

## 7. Verifiser at alt fungerer

1. `npm run dev`, gå til `/logg-inn.html`, registrer en testbruker.
2. Sjekk i Supabase **Table Editor → profiles** at en rad ble opprettet automatisk.
3. Gå til `/profil.html`, bytt avatar-figur/farge, endre visningsnavn.
4. Spill en runde i et av spillene (f.eks. Fruktspleis) mens innlogget, og sjekk at
   `game_rounds` fikk en ny rad og `game_scores` ble oppdatert — deretter at profilsiden viser
   riktig highscore/totalpoeng.

## Sikkerhetsnotat

`game_scores` (highscore/totalpoeng) kan **ikke** skrives direkte fra klienten — det finnes
bevisst ingen insert/update-policy for den tabellen. Klienten kan kun `insert` i `game_rounds`
(én runde om gangen), og en database-trigger (`handle_new_round` i migrasjonen) regner ut
aggregatene server-side. Dette hindrer at noen forfalsker poeng via nettleserens dev-verktøy.
