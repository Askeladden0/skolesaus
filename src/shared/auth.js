/**
 * auth.js
 * ─────────────────────────────────────────────────────────────────
 * Delt innloggingsklient. Bygger på Supabase Auth (e-post/passord i
 * fase 1, Google i fase 2 — se INNLOGGING_PLAN.md punkt 3).
 *
 * Profilraden i `profiles` opprettes automatisk av en database-trigger
 * ved registrering (se supabase/migrations/0001_init.sql) — denne
 * filen oppretter aldri en profil selv.
 * ─────────────────────────────────────────────────────────────────
 */
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

/** Kastes når auth-funksjoner kalles før Supabase er konfigurert. */
export class AuthNotConfiguredError extends Error {
  constructor() {
    super('Innlogging er ikke satt opp ennå (mangler VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY).');
    this.name = 'AuthNotConfiguredError';
  }
}

function requireSupabase() {
  if (!isSupabaseConfigured) throw new AuthNotConfiguredError();
  return supabase;
}

export async function signUpWithEmail(email, password, displayName) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Fase 2: krever at Google er slått på som provider i Supabase-dashbordet
 * (Authentication → Providers → Google). Frontend-koden trenger ingen
 * endring utover dette kallet når den dagen kommer.
 */
export async function signInWithGoogle() {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/profil.html` },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * Abonnerer på innlogget/utlogget. Kaller `callback(user | null)` med
 * gjeldende status først, og deretter på hver endring.
 * Returnerer en `unsubscribe()`-funksjon.
 */
export function onAuthChange(callback) {
  if (!isSupabaseConfigured) {
    callback(null);
    return () => {};
  }
  supabase.auth.getUser().then(({ data }) => callback(data.user ?? null));
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => sub.subscription.unsubscribe();
}

export async function getProfile(userId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select('id, display_name, avatar_base, avatar_color, created_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, changes) {
  const client = requireSupabase();
  const { error } = await client.from('profiles').update(changes).eq('id', userId);
  if (error) throw error;
}
