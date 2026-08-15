/**
 * supabaseClient.js
 * ─────────────────────────────────────────────────────────────────
 * Én delt Supabase-klient for hele nettsiden. Leser prosjekt-URL og
 * anon key fra miljøvariabler (satt i .env lokalt, eller som GitHub
 * Actions-secrets ved deploy — se SUPABASE_SETUP.md).
 *
 * `anon key` er trygt å ha i frontend-kildekoden: det er Row Level
 * Security-policyene i databasen (se supabase/migrations/) som avgjør
 * hva nøkkelen faktisk får lov til å gjøre, ikke hemmeligholdet av
 * selve nøkkelen.
 *
 * Før Supabase-prosjektet er opprettet (VITE_SUPABASE_URL/ANON_KEY
 * ikke satt) er `supabase` null og `isSupabaseConfigured` false, slik
 * at resten av siden fortsatt kan bygges og kjøres uten å krasje.
 * ─────────────────────────────────────────────────────────────────
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;
