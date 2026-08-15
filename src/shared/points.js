/**
 * points.js
 * ─────────────────────────────────────────────────────────────────
 * Delt poeng-klient (se INNLOGGING_PLAN.md punkt 6). Hvert spill
 * kaller `reportRound(gameId, points)` når en runde er ferdig, i
 * tillegg til (ikke istedenfor) sin egen `localStorage`-highscore —
 * som fortsatt gjelder uendret for ikke-innloggede spillere.
 *
 * VIKTIG: denne filen regner ALDRI ut highscore/totalpoeng selv og
 * sender det til databasen. Den poster kun den enkelte runden til
 * `game_rounds` — aggregeringen skjer server-side av en database-
 * trigger (se supabase/migrations/0001_init.sql), slik at poeng ikke
 * kan forfalskes fra nettleserens dev-verktøy.
 * ─────────────────────────────────────────────────────────────────
 */
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

export const GAME_IDS = ['fruktspleis', 'kloss-spreng', 'tallkombo'];

/**
 * Rapporterer en fullført runde for innlogget bruker. Gjør ingenting
 * (stille) hvis brukeren ikke er innlogget eller Supabase ikke er
 * konfigurert ennå — spillet skal fungere helt uavhengig av dette.
 */
export async function reportRound(gameId, points) {
  if (!isSupabaseConfigured) return;
  if (!Number.isFinite(points) || points < 0) return;

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  const { error } = await supabase
    .from('game_rounds')
    .insert({ user_id: user.id, game_id: gameId, points: Math.round(points) });

  if (error) console.error('Kunne ikke rapportere poeng:', error.message);
}

/** Henter alle spill + brukerens aggregerte score for hvert av dem. */
export async function getMyScores(userId) {
  if (!isSupabaseConfigured) return [];

  const [{ data: games, error: gamesError }, { data: scores, error: scoresError }] =
    await Promise.all([
      supabase.from('games').select('id, display_name'),
      supabase.from('game_scores').select('game_id, highscore, total_points, rounds_played').eq('user_id', userId),
    ]);

  if (gamesError) throw gamesError;
  if (scoresError) throw scoresError;

  const byGameId = new Map((scores ?? []).map((s) => [s.game_id, s]));

  return (games ?? []).map((game) => {
    const score = byGameId.get(game.id);
    return {
      gameId: game.id,
      displayName: game.display_name,
      highscore: score?.highscore ?? 0,
      totalPoints: score?.total_points ?? 0,
      roundsPlayed: score?.rounds_played ?? 0,
    };
  });
}

/** Summen av totalpoeng for alle spill — det som senere byttes mot premier. */
export function sumTotalPoints(scores) {
  return scores.reduce((sum, s) => sum + s.totalPoints, 0);
}
