# Skolesaus – strukturplan

> **Status: Implementert.** Strukturen beskrevet under (punkt 4) er gjennomført i denne
> branchen. Punkt 6 og 7 (innlogging, poeng/rabatt) er fortsatt kun forberedt konseptuelt —
> selve funksjonaliteten er ikke bygget. Se commit-historikken for detaljer om utførelsen,
> inkludert et par funn underveis (blockerino/subak-game var git-submodule-pekere, ikke tomme
> mapper; tre av "de duplike dokumentene" var faktisk lenket som nedlastinger og ble beholdt).

## Innhold

1. [Sammendrag og anbefaling](#1-sammendrag-og-anbefaling)
2. [Nåsituasjon](#2-nåsituasjon)
3. [Rammeverk / byggesystem – vurdering](#3-rammeverk--byggesystem--vurdering)
4. [Foreslått filstruktur](#4-foreslått-filstruktur)
5. [Konkret oppryddingsliste](#5-konkret-oppryddingsliste)
6. [Forberedelse for innlogging (konseptuelt)](#6-forberedelse-for-innlogging-konseptuelt)
7. [Forberedelse for poeng- og rabattsystem (konseptuelt)](#7-forberedelse-for-poeng--og-rabattsystem-konseptuelt)
8. [Foreslått rekkefølge for gjennomføring (senere)](#8-foreslått-rekkefølge-for-gjennomføring-senere)
9. [Åpne spørsmål til deg](#9-åpne-spørsmål-til-deg)

---

## 1. Sammendrag og anbefaling

- **Behold statisk HTML/JS/CSS som fundament** – ikke gå til React/Angular/Vue. Spillene er selvstendige, hvert med sin egne visuelle identitet (fonter, farger, layout), og en fullverdig SPA-rewrite ville vært en stor risiko for liten gevinst.
- **Innfør Vite som byggeverktøy** (ikke rammeverk) i **multi-page-modus**. Det gir modulær deling av `nav.js`, `cookie-modal.js`, tracking, fremtidig `auth.js`/`points.js`, minifisering, cache-busting og miljøvariabler (dev/prod API-URL) – uten å tvinge spillene inn i en komponentmodell de ikke trenger.
- **Innlogging og poeng/rabatt krever en backend uansett** (database for persistente poeng, brukerkontoer, rabattkoder). Det er ikke et frontend-rammeverk-spørsmål. Denne planen forbereder *plassering* i repoet for en fremtidig API-klient og databaseskjema, men bygger ikke backend nå.
- **Ny mappestruktur**: `src/pages/<spill>/`, `src/shared/`, `src/assets/`, `public/`, og en egen `docs/`-mappe for ikke-nettside-dokumenter som i dag ligger løst i rot.
- **Rydd opp**: en nøstet duplikat-mappe (`skolesaus-main/`), to tomme mapper (`blockerino/`, `subak-game/`), et ubrukt/tomt `package-lock.json`, seks PDF/DOCX/XLSX-dokumenter i rot som ikke er en del av nettsiden men som i dag *deployes* til produksjon, og en helt foreldreløs spillside (`minesweeper.html`) som ikke er lenket fra `index.html` og ikke bruker delt nav/cookie/tracking.

---

## 2. Nåsituasjon

### 2.1 Filoversikt (repo-rot i dag)

```
skolesaus/
├── index.html                     # forside
├── kloss_spreng.html              # spill
├── fruktspleis.html                # spill
├── tallkombo.html                  # spill (2048-variant)
├── minesweeper.html                 # spill – ORPHAN, se 5.4
├── nynorsk.html                     # verktøy (oversetter)
├── norsk_mal.html                   # ressursside (mal-dokument)
├── p_matte_snarveier.html           # ressursside (mal-dokument)
├── personvern.html                  # personvern/cookies
├── nav.js                           # delt nav-injeksjon
├── cookie-modal.js                  # delt cookie-samtykke
├── skolesaus-tracking.js            # delt lokal statistikk
├── logo.png, logo3.png,
│   kloss.png, kloss_banner.png      # bilder, brukt direkte i rot
├── README.md
├── package-lock.json                # tom, ingen package.json finnes
├── SnorresHjelpehefte.pdf
├── Snorres_hjelpehefte.pdf          # ← annen fil enn over (ulik størrelse/hash)
├── Snorres_hjelpehefte.docx
├── Snorres_hjelpehefte2.docx        # ← tre ulike hjelpehefte-versjoner
├── SnorresMatteskjema.xlsx
├── Snorres_Matteskjema.xlsx         # ← to ulike matteskjema-versjoner
├── blockerino/                      # TOM mappe
├── subak-game/                      # TOM mappe
├── skolesaus-main/                  # duplikat-mappe (se 2.3)
│   ├── README.md
│   ├── Tallkombo.jpg                # ← FAKTISK brukt fra index.html
│   └── images/
│       ├── melon.jpg                # ← FAKTISK brukt fra index.html
│       └── devious.jpeg             # ← ubrukt
└── .github/workflows/static.yml     # GitHub Pages deploy
```

### 2.2 Hvordan siden driftes i dag

`.github/workflows/static.yml` laster opp **hele repoet** (`path: '.'`) direkte til GitHub Pages – det finnes ingen build-steg. Det betyr at *alt* som ligger i repo-roten i dag er offentlig tilgjengelig på skolesaus.no, inkludert PDF-ene, Excel-arkene og den tomme `package-lock.json`. Dette er ikke bare "rot i git-historikken" – filene ligger faktisk ute i produksjon i dag.

### 2.3 `skolesaus-main/` – hva er det?

Mappen inneholder en egen `README.md` (identisk tekst som rot-READMEn) og en tom `package-lock.json`-aktig struktur – dette ser ut som resultatet av at et gammelt zip/klon av repoet ved et uhell ble lastet opp som undermappe, ikke en bevisst "assets"-mappe. Problemet er at **to av bildene i den (`Tallkombo.jpg`, `melon.jpg`) faktisk er i aktiv bruk** fra `index.html`, mens det tredje (`devious.jpeg`) er ubrukt. Mappen kan altså ikke bare slettes – bildene som brukes må først flyttes til et ordentlig assets-sted.

### 2.4 Delte script – inkonsekvent inkludering

Jeg sjekket hvilke sider som faktisk inkluderer `nav.js`, `cookie-modal.js` og `skolesaus-tracking.js`:

| Side | nav.js | cookie-modal.js | tracking.js |
|---|---|---|---|
| index.html | ✅ | ❌ | ✅ |
| kloss_spreng.html | ✅ | ✅ | ✅ |
| fruktspleis.html | ✅ | ✅ | ✅ |
| tallkombo.html | ✅ | ✅ | ✅ |
| nynorsk.html | ✅ | ✅ | ✅ |
| norsk_mal.html | ✅ | ✅ | ✅ |
| p_matte_snarveier.html | ✅ | ✅ | ✅ |
| personvern.html | ❌ | ❌ | ✅ |
| minesweeper.html | ❌ | ❌ | ❌ |

**Funn:** `index.html` mangler `cookie-modal.js`. Samtidig sier kommentaren øverst i `cookie-modal.js` at den på forsiden skal *"show modal when a `.game-link` is clicked"* – men klassen `.game-link` finnes ikke i noe HTML-dokument i repoet (forsiden bruker `.activity-link`). Cookie-samtykke-flyten som er beskrevet i koden er altså **død kode på forsiden** i praksis; samtykke blir først faktisk håndhevet når brukeren lander på en undersides (der modalen popper opp automatisk). Dette er ikke noe jeg retter nå, men bør inn i backloggen – spesielt siden cookie-samtykke er personvernrelevant.

### 2.5 Punkt-/poengsystem finnes ikke i dag – kun lokale highscores

Jeg søkte gjennom hele repoet etter eksisterende poeng-/score-logikk. Konklusjon: det finnes **intet delt poengsystem**. Hvert spill lagrer sin egen highscore isolert i `localStorage`, med egne, usammenhengende nøkler:

- `fruktspleis.html` → `localStorage['fruitBest']`
- `kloss_spreng.html` → `localStorage['bb_hi']`
- `tallkombo.html` → `localStorage['2048-best']`

Disse er alle **per enhet/nettleser**, ikke per bruker, og har ingen forbindelse til hverandre. Dette bekrefter at "poeng → rabatt"-systemet er en helt ny funksjon som må bygges fra bunnen (se pkt. 7), og at et fremtidig felles poengsystem bør erstatte – eller leve ved siden av – disse lokale highscorene.

### 2.6 Andre kvalitetsfunn (ikke kritiske, men verdt å vite om)

- `norsk_mal.html` og `p_matte_snarveier.html` er **ugyldige HTML-dokumenter**: de mangler `<!DOCTYPE html>`, `<html>` og `<head>`, og `<body>`-taggen ligger feilplassert helt nederst i filen (etter innholdet, ikke rundt det). Nettlesere retter dette opp automatisk, men det er teknisk feil markup og tyder på at sidene er sydd sammen fra utklipp.
- `minesweeper.html` bruker en helt egen, hardkodet navigasjonsmeny og mangler favicon (`logo3.png`) og Umami-sporing som resten av sidene har. Tittel-taggen er også `"Minesweeper Classic"` istedenfor det gjennomgående mønsteret `"<Navn> – Skolesaus"`.
- CSS-variablene (`--bg`, `--accent`, `--text`, osv.) for det "nøytrale" Skolesaus-fargetemaet er kopiert inn på nytt i `<style>` i **hver** av `index.html`, `nynorsk.html`, `norsk_mal.html`, `p_matte_snarveier.html` og `personvern.html`, med identiske verdier. Spillsidene (`kloss_spreng.html`, `fruktspleis.html`, `tallkombo.html`) har egne, bevisst forskjellige temaer – det er riktig og bør bevares – men *merkevare*-sidene bør dele én kilde for designtokens.
- Umami-sporingsscriptet (`data-website-id="d2502540-..."`) er hardkodet inn i flere filer for hånd.

---

## 3. Rammeverk / byggesystem – vurdering

### 3.1 Hvorfor jeg *ikke* anbefaler React/Vue/Astro-rewrite av spillene

Spillene (`kloss_spreng.html`, `fruktspleis.html`, `tallkombo.html`, evt. `minesweeper.html`) er selvstendige canvas/DOM-baserte spill-løkker med egen, bevisst forskjellig visuell identitet per spill. Å konvertere disse til React/Vue-komponenter ville krevd en fullstendig omskriving av spillogikken uten reell funksjonell gevinst – nettopp den typen unødvendig kompleksitet oppgaven ber meg unngå. Astro er interessant for innholdstunge sider, men gir lite ekstra her siden det ikke er snakk om CMS-drevet innhold eller mange like malbaserte sider.

### 3.2 Hvorfor jeg *anbefaler* Vite (byggeverktøy, ikke rammeverk)

Vite støtter **multi-page-apper** ut av boksen (flere `index.html`-innganger, én per side/spill), uten å kreve noe UI-rammeverk. Det gir:

- **Ekte deling av kode** via ES-modules (`import { initNav } from '../shared/nav.js'`) istedenfor at hver side limer inn identisk `<script src="nav.js">` og håper alle filer holdes i sync manuelt.
- **Delte designtokens** (`shared/tokens.css`) som merkevaresidene kan importere, mens spillene fortsatt kan ha egne temaer.
- **Miljøvariabler** (`import.meta.env.VITE_API_URL`) – helt nødvendig når innlogging/poeng-API kommer, slik at samme kildekode kan peke mot en lokal dev-backend og mot prod uten hardkodede URL-er.
- **Cache-busting og minifisering automatisk**, og et ekte build-steg som gjør at GitHub Pages-workflowen kan bygge til `dist/` og bare deploye *det* – dermed forsvinner problemet i 2.2 der PDF-er/Excel-filer havner i produksjon ved et uhell, fordi build-steget bevisst velger ut hva som skal med.
- **Lav innføringskostnad**: eksisterende HTML/CSS/JS i hver spillfil kan i stor grad flyttes rett inn, og man trenger ikke lære et komponent-rammeverk for å vedlikeholde spillene videre.

### 3.3 Når et lite UI-rammeverk *kan* være aktuelt (senere, ikke nå)

Når innlogging og poeng/rabatt-butikk bygges, vil man trenge stateful UI-elementer som er *nye* av natur (innloggingsstatus i navbar, poengsaldo-badge, en rabatt-katalog med filtrering/søk, en kjøpsflyt). Det er en helt annen type UI enn spillene, og *der* kan et lett rammeverk (f.eks. Preact eller Alpine.js) vurderes – **avgrenset til de nye sidene/komponentene**, uten å tvinge de eksisterende spillene til å endre arkitektur. Denne vurderingen tas når man faktisk står ved den oppgaven, ikke nå.

### 3.4 Backend hører ikke hjemme i denne statiske build-en

Innlogging og persistente poeng krever en database og et API (autentisering, poengsaldo, transaksjonslogg for innløsninger, rabattkatalog administrert av bedrifter). Dette er en egen tjeneste – enten en liten Node/Express-backend, eller serverless-funksjoner (Cloudflare Workers/Pages Functions, Vercel Functions, Supabase, e.l.) – og bygges *ikke* som en del av det statiske Vite-repoet. Planen under forbereder likevel en tydelig plass i frontend-strukturen for hvor en fremtidig API-klient skal bo, slik at koblingen blir ryddig når den tid kommer.

---

## 4. Foreslått filstruktur

```
skolesaus/
├── src/
│   ├── pages/
│   │   ├── home/
│   │   │   └── index.html
│   │   ├── kloss-spreng/
│   │   │   └── index.html
│   │   ├── fruktspleis/
│   │   │   └── index.html
│   │   ├── tallkombo/
│   │   │   └── index.html
│   │   ├── minesweeper/                # se 5.4 – avklares før flytting
│   │   │   └── index.html
│   │   ├── nynorsk/
│   │   │   └── index.html
│   │   ├── norsk-mal/
│   │   │   └── index.html
│   │   ├── p-matte-snarveier/
│   │   │   └── index.html
│   │   └── personvern/
│   │       └── index.html
│   │
│   ├── shared/
│   │   ├── nav.js
│   │   ├── cookie-modal.js
│   │   ├── tracking.js
│   │   ├── tokens.css              # felles fargevariabler for "merkevare"-sidene
│   │   ├── auth.js                 # PLASSHOLDER for fremtidig innlogging (bygges ikke nå)
│   │   └── points.js               # PLASSHOLDER for fremtidig poeng-klient (bygges ikke nå)
│   │
│   └── assets/
│       ├── images/
│       │   ├── logo.png
│       │   ├── logo3.png
│       │   ├── kloss.png
│       │   ├── kloss_banner.png
│       │   ├── tallkombo-cover.jpg     # (dagens skolesaus-main/Tallkombo.jpg)
│       │   └── fruktspleis-cover.jpg   # (dagens skolesaus-main/images/melon.jpg)
│       └── fonts/                       # reservert, brukes kun ved evt. selv-hosting av fonter
│
├── public/                              # filer Vite kopierer 1:1 til dist/ (favicon o.l.)
│
├── docs/                                # IKKE en del av nettsiden – interne dokumenter
│   ├── SnorresHjelpehefte.pdf           # (etter opprydding, se 5.3)
│   ├── SnorresMatteskjema.xlsx
│   └── ...
│
├── .github/workflows/deploy.yml         # bygger med Vite, deployer kun dist/
├── vite.config.js
├── package.json
├── README.md
└── STRUCTURE_PLAN.md                    # dette dokumentet
```

**Prinsipp:** Hvert spill/side beholder sin egen `index.html` med egen `<style>` og egen spilllogikk akkurat som i dag – strukturendringen handler om *hvor filene bor* og *hva som deles*, ikke om å endre hvordan spillene er bygget internt.

---

## 5. Konkret oppryddingsliste

| # | Funn | Anbefalt tiltak |
|---|---|---|
| 5.1 | `blockerino/` og `subak-game/` er **tomme mapper** uten innhold | Avklar med deg om dette er planlagte, ikke-startede spill. Hvis ja: behold som tomme placeholder-mapper i `src/pages/` når de faktisk startes. Hvis nei: slett. |
| 5.2 | `skolesaus-main/` er en nøstet duplikat-mappe med egen `README.md` og tom `package-lock.json` | To bilder (`Tallkombo.jpg`, `images/melon.jpg`) flyttes til `src/assets/images/`, resten (inkl. ubrukte `devious.jpeg` og den doble READMEen) slettes. |
| 5.3 | Seks dokumentfiler i rot (`SnorresHjelpehefte.pdf`, `Snorres_hjelpehefte.pdf`, `Snorres_hjelpehefte.docx`, `Snorres_hjelpehefte2.docx`, `SnorresMatteskjema.xlsx`, `Snorres_Matteskjema.xlsx`) – **ingen av dem er lenket fra noen HTML-side**, men alle deployes i dag til produksjon via "hele repoet"-workflowen | Flytt til `docs/` (utenfor build-output) eller ut av repoet helt. Filene med og uten understrek er **ikke identiske** (ulik filstørrelse/hash) – du bør avklare hvilken versjon som er den "riktige" før noe slettes, se spørsmål i pkt. 9. |
| 5.4 | `minesweeper.html` er **foreldreløs**: ikke lenket fra `index.html`, mangler delt nav/cookie/tracking, har egen hardkodet meny og avvikende tittel-mønster | Avklar: er dette et spill i utvikling som skal lanseres, eller en rest fra tidlig testing som kan fjernes? Se spørsmål i pkt. 9. |
| 5.5 | `package-lock.json` i rot er tom (`packages: {}`) og det finnes ingen `package.json` | Fjernes ved innføring av Vite (en ny, reell `package.json`/lockfile opprettes da). |
| 5.6 | `index.html` mangler `cookie-modal.js`, og `.game-link`-klassen cookie-modal.js leter etter finnes ikke noe sted (forsiden bruker `.activity-link`) | Legg dette i backlogg som en separat feilrettingsoppgave – cookie-samtykke bør håndheves konsekvent på alle sider, inkl. forsiden, før spill startes. |
| 5.7 | `norsk_mal.html` og `p_matte_snarveier.html` er strukturelt ugyldig HTML (mangler `<!DOCTYPE>/<html>/<head>`, `<body>` feilplassert) | Rettes naturlig som del av migreringen til `src/pages/.../index.html`, siden hver side uansett får ny fil med korrekt skjelett. |
| 5.8 | Felles designtokens (`--bg`, `--accent`, `--text` osv.) er kopiert inn separat i 5 ulike filer med identiske verdier | Samles i `src/shared/tokens.css`, importeres av "merkevare"-sidene. Spillenes egne, bevisst avvikende temaer beholdes uendret. |
| 5.9 | Umami-sporings-ID er hardkodet i flere filer for hånd | Flyttes til én konstant/miljøvariabel når Vite innføres, så den kun vedlikeholdes ett sted. |

---

## 6. Forberedelse for innlogging (konseptuelt)

Dette bygges **ikke nå** – kun hvordan strukturen over legger til rette for det:

- **`src/shared/auth.js`** blir det naturlige stedet for en delt "auth-klient": innloggingsstatus, token-håndtering, og en liten funksjon `renderAuthState()` som `nav.js` kan kalle for å vise "Logg inn" vs. brukernavn/avatar i navigasjonen – uten at hver spillside må vite noe om hvordan innlogging fungerer.
- **`nav.js` bør på sikt eksponere et lite "utvidelsespunkt"** (f.eks. et tomt `<div id="ss-nav-account-slot">` i markeringen den already genererer) som `auth.js` kan fylle, istedenfor at innloggingslogikk limes rett inn i nav-koden.
- Siden hver spillside i dag er sin egen `index.html` med egen `<style>`, kan innlogging rulles ut **inkrementelt side for side** (f.eks. først på forsiden, så per spill) uten at det krever noen ombygging av spill-motorene.
- Selve autentiseringen (passord/OAuth/skole-SSO, sesjoner, sikker lagring) er et **backend-spørsmål** som avklares i den senere promten du nevner – denne planen sikrer bare at frontend har ett sted å koble seg til (`src/shared/auth.js` + `import.meta.env.VITE_API_URL`), ikke hvordan selve innloggingen implementeres.

## 7. Forberedelse for poeng- og rabattsystem (konseptuelt)

- **`src/shared/points.js`** blir stedet for en delt "poeng-klient": funksjoner som `awardPoints(gameId, amount)` og `getBalance()` som hvert spill kaller ved spillslutt, istedenfor at hvert spill (som i dag) skriver rett til sin egen, isolerte `localStorage`-nøkkel. Dette er det viktigste strukturelle grepet for punkt 7 i oppgaven – *hvor* spillene rapporterer poeng må gå gjennom ett felles punkt, ikke tre parallelle highscore-implementasjoner slik det er i dag (se 2.5).
- Overgangen bør være **bakoverkompatibel med dagens highscore-følelse**: `points.js` kan i en første fase fortsatt lagre lokalt (samme mønster som i dag, men samlet ett sted) og senere, når backend finnes, sende samme kall videre til et ekte API – spillenes egen kode trenger ikke endres på nytt da.
- **En fremtidig "butikk"/rabatt-katalog** er naturlig en egen side, f.eks. `src/pages/butikk/`, som *ikke* er et spill men en innholdsside i samme mønster som `nynorsk.html`/`norsk_mal.html` i dag – den kan gjenbruke `tokens.css` og navigasjonen uendret.
- Rabatt-katalogen (hvilke bedrifter, hvilke koder, hvor mange poeng de koster) er **data som må ligge server-side** (i databasen bak API-et), ikke som en statisk JSON i frontend-repoet – ellers kan rabattkoder leses ut og "poeng" forfalskes av hvem som helst med nettleserens utviklerverktøy. Frontend-strukturen over forbereder kun *hvor* denne siden henter dataene sine fra (`VITE_API_URL`), ikke selve datamodellen.
- Fordi poeng skal kunne løses inn mot reelle rabatter fra bedrifter, bør poengsaldoen **aldri regnes ut på klienten alene** – `points.js` bør fra dag én designes til å sende "spillet er ferdig, dette skjedde"-hendelser til et bakenforliggende API som beregner og lagrer poengsummen, fremfor at frontend selv regner ut og "sender inn" et ferdig poengtall (som er lett å manipulere). Dette er en anbefaling å ta med når selve poengsystemet designes i detalj – ikke noe som bygges nå.

---

## 8. Foreslått rekkefølge for gjennomføring (senere)

Ren informasjon om anbefalt rekkefølge – **ingenting av dette gjøres i denne oppgaven**:

1. Avklar åpne spørsmål i pkt. 9 (spesielt om `minesweeper.html`, `blockerino/`, `subak-game/` og de duplike dokumentene).
2. Sett opp Vite + `package.json`, flytt hver eksisterende `.html`-fil inn i `src/pages/<navn>/index.html` **uten funksjonelle endringer** – ren flytting/opprydding av markup (inkl. å rette opp 5.7).
3. Trekk ut delt kode til `src/shared/` (nav, cookie-modal, tracking, tokens.css) og oppdater `import`-er.
4. Flytt bilder til `src/assets/images/`, dokumenter til `docs/`, slett `skolesaus-main/` og tom `package-lock.json`.
5. Oppdater `.github/workflows/` til å bygge med Vite og kun deploye `dist/`.
6. Verifiser at alle sider fungerer identisk i produksjon (manuell gjennomgang av alle spill/sider).
7. *Deretter*, i senere oppgaver: bygg innlogging (fyll `src/shared/auth.js`), så poeng/rabatt-system (fyll `src/shared/points.js` + `src/pages/butikk/` + backend).

---

## 9. Åpne spørsmål til deg

1. **`minesweeper.html`** – er dette et spill under utvikling som skal lanseres på forsiden, eller en rest som kan fjernes/arkiveres?
2. **`blockerino/` og `subak-game/`** – tomme mapper for planlagte spill, eller rester som kan slettes?
3. **De duplike dokumentene i rot** (`SnorresHjelpehefte.pdf` vs `Snorres_hjelpehefte.pdf`, `Snorres_hjelpehefte.docx` vs `Snorres_hjelpehefte2.docx`, `SnorresMatteskjema.xlsx` vs `Snorres_Matteskjema.xlsx`) – vet du hvilken versjon som er "riktig", eller skal jeg legge dem alle i `docs/` inntil videre og la deg rydde innholdsmessig senere?
4. Skal disse dokumentene i det hele tatt være en del av dette repoet, eller hører de hjemme et annet sted (de brukes ikke av noen nettside-funksjonalitet i dag)?

Når du har tatt stilling til punktene over og eventuelt bekreftet retningen i denne planen, kan migreringen (pkt. 8) gjennomføres i en egen, separat oppgave.
