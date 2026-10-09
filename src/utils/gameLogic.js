export const LOCAL_STORAGE_KEY =
  'WEREWOLF_MODERATOR_ASSISTANT_STATE_V4';

export const GAME_STATE_VERSION = 4;

export function isWolfAligned(player) {
  return Boolean(
    player &&
      (
        player.role === 'WEREWOLF' ||
        player.role === 'WOLF_CUB' ||
        (
          player.role === 'TRAITOR' &&
          player.convertedToWerewolf
        )
      )
  );
}

export function getEffectiveTeam(player) {
  if (!player) return null;

  if (player.convertedToWerewolf) return 'Evil';

  if (
    player.role === 'WEREWOLF' ||
    player.role === 'WOLF_CUB'
  ) {
    return 'Evil';
  }

  if (player.role === 'JESTER') return 'Neutral';

  return 'Warga';
}

export function normalizePlayer(player) {
  const role = player?.role || 'WARGA';

  return {
    ...player,
    id: String(
      player?.id ||
        `player_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`
    ),
    name: String(player?.name || 'Pemain'),
    role,
    team:
      player?.team ||
      getEffectiveTeam({ ...player, role }),
    alive: player?.alive !== false,
    loverId: player?.loverId || null,
    convertedToWerewolf: Boolean(
      player?.convertedToWerewolf
    ),
    doppelgangerCopied: Boolean(
      player?.doppelgangerCopied
    ),
    protectedLastNight: Boolean(
      player?.protectedLastNight
    ),
    protectedThisNight: Boolean(
      player?.protectedThisNight
    ),
    hunterRevengeUsed: Boolean(
      player?.hunterRevengeUsed
    ),
    deathReason: player?.deathReason || null,
    deathNight: player?.deathNight ?? null,
    deathDay: player?.deathDay ?? null
  };
}

export function loadSavedGame() {
  try {
    const saved = localStorage.getItem(
      LOCAL_STORAGE_KEY
    );

    if (!saved) return null;

    const parsed = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.players) ||
      typeof parsed.currentPhase !== 'string'
    ) {
      return null;
    }

    if (
      parsed.stateVersion &&
      parsed.stateVersion !== GAME_STATE_VERSION
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Menghasilkan bilangan bulat acak dalam rentang:
 * 0 sampai maxExclusive - 1.
 *
 * Menggunakan Web Crypto dan rejection sampling
 * untuk menghindari bias akibat operasi modulo.
 */
function secureRandomInt(maxExclusive) {
  if (
    !Number.isSafeInteger(maxExclusive) ||
    maxExclusive <= 0 ||
    maxExclusive > 0x100000000
  ) {
    throw new RangeError(
      'maxExclusive harus bilangan bulat antara 1 dan 2^32.'
    );
  }

  const cryptoApi = globalThis.crypto;

  if (
    cryptoApi &&
    typeof cryptoApi.getRandomValues === 'function'
  ) {
    const range = 0x100000000;
    const limit =
      Math.floor(range / maxExclusive) * maxExclusive;

    const buffer = new Uint32Array(1);
    let value;

    do {
      cryptoApi.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= limit);

    return value % maxExclusive;
  }

  // Jangan diam-diam menggunakan sumber acak yang
  // lebih lemah jika Web Crypto tidak tersedia.
  throw new Error(
    'Web Crypto tidak tersedia. Pengacakan aman tidak dapat dilakukan.'
  );
}

/**
 * Fisher–Yates Shuffle.
 *
 * Mengembalikan array baru sehingga array asli
 * tidak diubah.
 */
export function shuffle(array) {
  if (!Array.isArray(array)) {
    throw new TypeError(
      'shuffle() harus menerima array.'
    );
  }

  const result = [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {
    const j = secureRandomInt(i + 1);

    [result[i], result[j]] = [
      result[j],
      result[i]
    ];
  }

  return result;
}

/**
 * Membagikan daftar role kepada pemain secara acak.
 *
 * Jumlah role harus sama dengan jumlah pemain.
 * Urutan pemain tetap, sedangkan role diacak.
 *
 * Contoh:
 * assignRandomRoles(players, roles)
 */
export function assignRandomRoles(players, roles) {
  if (!Array.isArray(players) || !Array.isArray(roles)) {
    throw new TypeError(
      'players dan roles harus berupa array.'
    );
  }

  if (players.length !== roles.length) {
    throw new Error(
      'Jumlah role harus sama dengan jumlah pemain.'
    );
  }

  const randomizedRoles = shuffle(roles);

  return players.map((player, index) => ({
    ...player,
    role: randomizedRoles[index]
  }));
}

export function createInitialGameState() {
  return {
    stateVersion: GAME_STATE_VERSION,
    players: [],
    currentPhase: 'HOME',
    nightNumber: 1,
    dayNumber: 1,
    discussionEndTimestamp: null,
    discussionDurationSeconds: 300,
    isTimerPaused: false,
    pausedRemainingSeconds: null,
    werewolfTargetId: null,
    werewolfTargetIds: [],
    wolfCubRagePending: false,
    guardianTargetId: null,
    sheriffTargetId: null,
    sheriffUsed: false,
    sheriffSkippedNights: [],
    sheriffResolved: false,
    doppelgangerTargetId: null,
    doppelgangerCopied: false,
    doppelgangerRoleChangeNotice: null,
    doppelgangerRevealNextPhase: null,
    doppelgangerRevealWinner: null,
    mayorRevealed: false,
    seerTargetId: null,
    seerResult: null,
    witchHealUsedThisNight: false,
    witchHealTargetId: null,
    witchKillTargetId: null,
    hunterTargetId: null,
    hunterPending: false,
    cupidLover1Id: null,
    cupidLover2Id: null,
    witchHealUsed: false,
    witchKillUsed: false,
    cupidUsed: false,
    nightSkips: {},
    currentVoterIndex: 0,
    votes: {},
    revealPlayerIndex: 0,
    isRoleCardOpen: false,
    gameLog: [],
    lastNightDeaths: [],
    lastDayDeaths: [],
    loverDeathNotice: [],
    roleCounts: {},
    winner: null,
    undoStack: []
  };
}

export function addLog(
  logs,
  nightNumber,
  dayNumber,
  type,
  message
) {
  const timeStr = new Date().toLocaleTimeString(
    'id-ID',
    {
      hour: '2-digit',
      minute: '2-digit'
    }
  );

  return [
    {
      id:
        'log_' +
        Date.now() +
        '_' +
        Math.random().toString(36).substr(2, 4),
      timestamp: timeStr,
      nightNumber,
      dayNumber,
      type,
      message
    },
    ...logs
  ];
}

export function pushUndoState(state) {
  const { undoStack, ...rest } = state;

  return [
    rest,
    ...(undoStack || []).slice(0, 4)
  ];
}
