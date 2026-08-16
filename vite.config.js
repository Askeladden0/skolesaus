import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { existsSync, renameSync, rmSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Kildemappe (src/pages/<mappe>/index.html) -> filnavn i produksjon.
// Filnavnene til høyre MÅ forbli uendret — de er skolesaus.no sine
// eksisterende, offentlige URL-er (delt på TikTok, indeksert av Google, osv.).
const PAGES = {
  home: 'index.html',
  'kloss-spreng': 'kloss_spreng.html',
  fruktspleis: 'fruktspleis.html',
  tallkombo: 'tallkombo.html',
  minesweeper: 'minesweeper.html',
  nynorsk: 'nynorsk.html',
  'norsk-mal': 'norsk_mal.html',
  'p-matte-snarveier': 'p_matte_snarveier.html',
  personvern: 'personvern.html',
  'logg-inn': 'logg-inn.html',
  profil: 'profil.html',
};

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        Object.keys(PAGES).map((slug) => [
          slug,
          resolve(__dirname, `src/pages/${slug}/index.html`),
        ]),
      ),
    },
  },
  plugins: [
    {
      // Vite plasserer HTML-output på samme relative sti som kildefilen
      // (dist/src/pages/<slug>/index.html). Denne pluginen flytter hver
      // ferdige side til sitt flate, historiske filnavn i dist/-roten,
      // slik at de eksisterende URL-ene på skolesaus.no ikke endres.
      name: 'flatten-page-output',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        for (const [slug, outName] of Object.entries(PAGES)) {
          const from = resolve(distDir, `src/pages/${slug}/index.html`);
          const to = resolve(distDir, outName);
          if (existsSync(from)) {
            renameSync(from, to);
          }
        }
        const leftoverSrcDir = resolve(distDir, 'src');
        if (existsSync(leftoverSrcDir)) {
          rmSync(leftoverSrcDir, { recursive: true, force: true });
        }
      },
    },
  ],
});
