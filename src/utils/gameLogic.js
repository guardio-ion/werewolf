export const LOCAL_STORAGE_KEY = 'WEREWOLF_MODERATOR_ASSISTANT_STATE_V4';
export const GAME_STATE_VERSION = 4;

export function isWolfAligned(player) {
  return Boolean(player && (player.role === 'WEREWOLF' || player.role === 'WOLF_CUB' || (player.role === 'TRAITOR' && player.convertedToWerewolf)));
}

export function getEffectiveTeam(player) {
  if (!player) return null;
  if (player.convertedToWerewolf) return 'Evil';
  if (player.role === 'WEREWOLF' || player.role === 'WOLF_CUB') return 'Evil';
  if (player.role === 'JESTER') return 'Neutral';
  return 'Warga'; // Default fallback, akan dioverride oleh ROLES di App.jsx
}

export function normalizePlayer(player) {
  const role = player?.role || 'WARGA';
  return {
    ...player,
    id: String(player?.id || `player_${Date.now()}_${Math.random().toString(36).slice(2)}`),
    name: String(player?.name || 'Pemain'),
    role,
    team: player?.team || getEffectiveTeam({ ...player, role }),
    alive: player?.alive !== false,
    loverId: player?.loverId || null,
    convertedToWerewolf: Boolean(player?.convertedToWerewolf),
    doppelgangerCopied: Boolean(player?.doppelgangerCopied),
    protectedLastNight: Boolean(player?.protectedLastNight),
    protectedThisNight: Boolean(player?.protectedThisNight),
    hunterRevengeUsed: Boolean(player?.hunterRevengeUsed),
    deathReason: player?.deathReason || null,
    deathNight: player?.deathNight ?? null,
    deathDay: player?.deathDay ?? null
  };
}

export function loadSavedGame() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.players) || typeof parsed.currentPhase !== 'string') return null;
    if (parsed.stateVersion && parsed.stateVersion !== GAME_STATE_VERSION) return null;
    return parsed;
  } catch (error) { return null; }
}

export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createInitialGameState() {
  return {
    stateVersion: GAME_STATE_VERSION, players: [], currentPhase: 'HOME', nightNumber: 1, dayNumber: 1,
    discussionEndTimestamp: null, discussionDurationSeconds: 300, isTimerPaused: false, pausedRemainingSeconds: null,
    werewolfTargetId: null, werewolfTargetIds: [], wolfCubRagePending: false, guardianTargetId: null,
    sheriffTargetId: null, sheriffUsed: false, sheriffSkippedNights: [], sheriffResolved: false,
    doppelgangerTargetId: null, doppelgangerCopied: false, doppelgangerRoleChangeNotice: null,
    doppelgangerRevealNextPhase: null, doppelgangerRevealWinner: null, mayorRevealed: false, seerTargetId: null, seerResult: null,
    witchHealUsedThisNight: false, witchHealTargetId: null, witchKillTargetId: null, hunterTargetId: null, hunterPending: false,
    cupidLover1Id: null, cupidLover2Id: null, witchHealUsed: false, witchKillUsed: false, cupidUsed: false, nightSkips: {},
    currentVoterIndex: 0, votes: {}, revealPlayerIndex: 0, isRoleCardOpen: false, gameLog: [], lastNightDeaths: [],
    lastDayDeaths: [], loverDeathNotice: [], roleCounts: {}, winner: null, undoStack: []
  };
}

export function addLog(logs, nightNumber, dayNumber, type, message) {
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return [{ id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), timestamp: timeStr, nightNumber, dayNumber, type, message }, ...logs];
}

export function pushUndoState(state) {
  const { undoStack, ...rest } = state;
  return [rest, ...(undoStack || []).slice(0, 4)];
}
