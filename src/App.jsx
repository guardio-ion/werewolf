import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Home, Lock, Unlock, Crosshair, Moon, Sun, Eye, FlaskConical,
  Heart, Skull, Users, History, BookOpen, X,
  Crown, Play, Pause, HelpCircle, Sparkles, ArrowRight, CornerUpLeft,
  Check, RefreshCw, User, PawPrint, Swords, Star, 
  MessageSquare, CheckSquare, Ghost
} from 'lucide-react';

import { ROLES, ROLE_KEYS } from './constants/roles';
import { GAME_PRESETS, PARTICIPANT_LIST } from './constants/presets';
import { 
  LOCAL_STORAGE_KEY, GAME_STATE_VERSION, 
  isWolfAligned, getEffectiveTeam, normalizePlayer, loadSavedGame, 
  shuffle, createInitialGameState, addLog, pushUndoState 
} from './utils/gameLogic';

const ROLE_ICONS = {
  WARGA: User, WEREWOLF: PawPrint, LYCAN: Moon, SEER: Eye, GUARDIAN: Shield,
  CUPID: Heart, MAYOR: Crown, SHERIFF: Star, HUNTER: Crosshair, TRAITOR: Swords,
  WOLF_CUB: PawPrint, WITCH: FlaskConical, JESTER: Sparkles, DOPPELGANGER: Ghost
};

const DEATH_REASON_LABELS = {
  WEREWOLF: 'Diserang Werewolf', WITCH: 'Racun Witch', SHERIFF: 'Ditembak Sheriff',
  SHERIFF_MISS: 'Sheriff salah tembak', LOVER: 'Ikut pasangan', HUNTER: 'Dibalas Hunter', VOTE: 'Hasil voting'
};


export default function App() {
  const [gameState, setGameState] = useState(() => {
    try {
      const parsed = loadSavedGame();
      if (parsed) return { ...createInitialGameState(), ...parsed, stateVersion: GAME_STATE_VERSION, players: parsed.players.map(normalizePlayer) };
    } catch (e) { console.error("Gagal memuat state:", e); }
    return createInitialGameState();
  });

  const [showGameLogDrawer, setShowGameLogDrawer] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showRoleCheckModal, setShowRoleCheckModal] = useState(false); 
  const [inputPlayerNames, setInputPlayerNames] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [participantSearch, setParticipantSearch] = useState('');
  const [roleCountsDraft, setRoleCountsDraft] = useState({});
  const discussionTransitionLock = useRef(false);
  const [remainingSeconds, setRemainingSeconds] = useState(300);
  const [voteError, setVoteError] = useState('');

  // Saat jumlah pemain berubah: isi/seimbangkan jumlah WARGA agar total role = jumlah pemain
  useEffect(() => {
    if (playerCount <= 0) return;
    setRoleCountsDraft(prev => {
      if (Object.keys(prev).length === 0) return { WARGA: Math.max(0, playerCount - 4), WEREWOLF: 1, GUARDIAN: 1, SEER: 1, WITCH: 1 };
      const others = Object.entries(prev).filter(([k]) => k !== 'WARGA').reduce((s, [, v]) => s + (Number(v) || 0), 0);
      return { ...prev, WARGA: Math.max(0, playerCount - others) };
    });
  }, [playerCount]);

  useEffect(() => {
    try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...gameState, stateVersion: GAME_STATE_VERSION })); } catch (e) {}
  }, [gameState]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [gameState.currentPhase]);

  useEffect(() => {
    if (gameState.currentPhase === 'DISCUSSION') discussionTransitionLock.current = false;
  }, [gameState.currentPhase]);

  useEffect(() => {
    if (gameState.currentPhase !== 'DISCUSSION') return;
    const duration = gameState.discussionDurationSeconds || 300;
    if (gameState.isTimerPaused && gameState.pausedRemainingSeconds !== null && gameState.pausedRemainingSeconds !== undefined) { setRemainingSeconds(gameState.pausedRemainingSeconds); return; }
    if (!gameState.discussionEndTimestamp) { setRemainingSeconds(duration); return; }
    const tick = () => {
      const diff = Math.max(0, Math.ceil((gameState.discussionEndTimestamp - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff <= 0) { clearInterval(interval); triggerAutoTransitionToVoting(); }
    };
    const interval = setInterval(tick, 500);
    tick();
    return () => clearInterval(interval);
  }, [gameState.currentPhase, gameState.discussionEndTimestamp, gameState.isTimerPaused, gameState.pausedRemainingSeconds, gameState.discussionDurationSeconds]);

  function triggerAutoTransitionToVoting() {
    if (discussionTransitionLock.current) return;
    discussionTransitionLock.current = true;
    setGameState(prev => {
      if (prev.currentPhase !== 'DISCUSSION') return prev;
      return { ...prev, currentPhase: 'VOTING', currentVoterIndex: 0, voteTally: {}, voteRecorded: false, mayorVotes: {}, isTimerPaused: false, pausedRemainingSeconds: null, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', 'Waktu diskusi berakhir. Memulai sesi voting.') };
    });
  }

  // ---------- helper aksi malam per-aktor (mendukung role ganda) ----------
  const aliveOf = (state, role) => (state.players || []).filter(p => p.alive && p.role === role);
  const getActs = (state, role) => (state.nightActs || {})[role] || {};
  const isUsed = (state, actorId, key) => !!((state.abilityUsed || {})[actorId] || {})[key];
  const markUsed = (state, actorId, key) => ({ ...(state.abilityUsed || {}), [actorId]: { ...((state.abilityUsed || {})[actorId] || {}), [key]: true } });
  const withAct = (state, role, actorId, payload) => ({ ...(state.nightActs || {}), [role]: { ...getActs(state, role), [actorId]: payload } });
  const getActor = (state) => (state.players || []).find(p => p.id === state.nightActorId);

  const getLivingTargets = (state, kind, actorId) => {
    const players = state.players || [];
    switch (kind) {
      case 'WEREWOLF': return players.filter(p => p.alive && !isWolfAligned(p));
      case 'GUARDIAN': return players.filter(p => p.alive && (state.guardianLast || {})[actorId] !== p.id);
      case 'CUPID': return players.filter(p => p.alive && !p.loverId);
      case 'SHERIFF':
      case 'DOPPELGANGER':
      case 'SEER': return players.filter(p => p.alive && p.id !== actorId);
      case 'HUNTER':
      case 'WITCH':
      default: return players.filter(p => p.alive);
    }
  };

  const validateTarget = (state, kind, targetId, actorId) => {
    if (!targetId) return { valid: false };
    const target = state.players.find(p => p.id === targetId);
    if (!target || !target.alive) return { valid: false };
    if (!getLivingTargets(state, kind, actorId).some(p => p.id === targetId)) return { valid: false };
    return { valid: true };
  };

  const advanceNightPhase = (overrides = {}, options = {}) => {
    setGameState(prev => {
      if (prev.currentPhase === 'GAME_OVER') return prev;
      const state = { ...prev, ...overrides };
      const commit = options.recordUndo ? { ...state, undoStack: pushUndoState(prev) } : state;
      const route = (phase, actor) => ({ ...commit, currentPhase: phase, nightActorId: actor ? actor.id : null });

      // Cupid: malam 1, atau Doppelganger yang sudah menyalin Cupid (sekali per aktor)
      const cupid = aliveOf(state, 'CUPID').find(p => !getActs(state, 'CUPID')[p.id] && !isUsed(state, p.id, 'CUPID') && (state.nightNumber === 1 || p.doppelgangerCopied) && getLivingTargets(state, 'CUPID', p.id).length >= 2);
      if (cupid) return route('NIGHT_CUPID', cupid);

      const doppel = aliveOf(state, 'DOPPELGANGER').find(p => !p.doppelgangerCopied && state.nightNumber === 1 && !(p.id in (state.doppelgangerTargets || {})) && getLivingTargets(state, 'DOPPELGANGER', p.id).length > 0);
      if (doppel) return route('NIGHT_DOPPELGANGER', doppel);

      const livingWerewolves = state.players.filter(p => isWolfAligned(p) && p.alive);
      const wolfTargets = getLivingTargets(state, 'WEREWOLF');
      const requiredWolfTargets = Math.min(state.wolfCubRagePending ? 2 : 1, wolfTargets.length);
      const currentWolfCount = (state.werewolfTargetIds || []).length || (state.werewolfTargetId ? 1 : 0);
      if (livingWerewolves.length > 0 && wolfTargets.length > 0 && currentWolfCount < requiredWolfTargets && !state.nightSkips?.WEREWOLF) {
        return route('NIGHT_WEREWOLF', null);
      }

      const guardian = aliveOf(state, 'GUARDIAN').find(p => !getActs(state, 'GUARDIAN')[p.id] && getLivingTargets(state, 'GUARDIAN', p.id).length > 0);
      if (guardian) return route('NIGHT_GUARDIAN', guardian);

      const sheriff = aliveOf(state, 'SHERIFF').find(p => !getActs(state, 'SHERIFF')[p.id] && state.nightNumber > 1 && !isUsed(state, p.id, 'SHERIFF') && getLivingTargets(state, 'SHERIFF', p.id).length > 0);
      if (sheriff) return route('NIGHT_SHERIFF', sheriff);

      const seer = aliveOf(state, 'SEER').find(p => !getActs(state, 'SEER')[p.id] && getLivingTargets(state, 'SEER', p.id).length > 0);
      if (seer) return route('NIGHT_SEER', seer);

      const witch = aliveOf(state, 'WITCH').find(p => !getActs(state, 'WITCH')[p.id] && (!isUsed(state, p.id, 'WITCH_HEAL') || (!isUsed(state, p.id, 'WITCH_KILL') && state.nightNumber > 1)));
      if (witch) return route('NIGHT_WITCH', witch);

      return resolveNightActions(commit);
    });
  };

  function resolveNightActions(state) {
    let updatedPlayers = state.players.map(p => ({ ...p }));
    let log = [...state.gameLog];
    const night = state.nightNumber, day = state.dayNumber;
    const directDeaths = [];
    const guardianActs = getActs(state, 'GUARDIAN');
    const witchActs = getActs(state, 'WITCH');
    const protectedByTown = new Set(Object.values(guardianActs).map(a => a.targetId).filter(Boolean));
    const healedSet = new Set(Object.values(witchActs).map(a => a.healTargetId).filter(Boolean));

    const wolfTargets = Array.from(new Set([...(state.werewolfTargetIds || []), state.werewolfTargetId].filter(Boolean)));
    wolfTargets.forEach(targetId => {
      const victimName = updatedPlayers.find(p => p.id === targetId)?.name;
      if (!victimName) return;
      if (protectedByTown.has(targetId)) { log = addLog(log, night, day, 'INFO', `Serangan Werewolf pada ${victimName} berhasil dicegah Guardian.`); }
      else if (healedSet.has(targetId)) { log = addLog(log, night, day, 'INFO', `Heal Potion Witch berhasil menyelamatkan korban Werewolf.`); }
      else { directDeaths.push({ id: targetId, reason: 'WEREWOLF' }); }
    });

    Object.entries(getActs(state, 'SHERIFF')).forEach(([actorId, act]) => {
      if (!act || !act.targetId) return;
      const sheriff = updatedPlayers.find(p => p.id === actorId && p.alive);
      const target = updatedPlayers.find(p => p.id === act.targetId && p.alive);
      if (!sheriff || !target) return;
      if (isWolfAligned(target)) { directDeaths.push({ id: target.id, reason: 'SHERIFF' }); log = addLog(log, night, day, 'ACTION', `Sheriff ${sheriff.name} berhasil menemukan Werewolf: ${target.name}.`); }
      else { directDeaths.push({ id: sheriff.id, reason: 'SHERIFF_MISS' }); log = addLog(log, night, day, 'ACTION', `Sheriff ${sheriff.name} salah memilih target dan tereliminasi.`); }
    });

    Object.entries(witchActs).forEach(([actorId, act]) => {
      if (!act || !act.killTargetId) return;
      directDeaths.push({ id: act.killTargetId, reason: 'WITCH' });
      log = addLog(log, night, day, 'ACTION', `Witch menggunakan Kill Potion.`);
    });

    const newDeathsMap = new Map();
    directDeaths.forEach(d => { if (!newDeathsMap.has(d.id)) newDeathsMap.set(d.id, d.reason); });
    const loverDeathNotice = [];

    let changed = true;
    while (changed) {
      changed = false;
      const currentDeadIds = Array.from(newDeathsMap.keys());
      for (const deadId of currentDeadIds) {
        const deadPlayer = updatedPlayers.find(p => p.id === deadId);
        if (!deadPlayer) continue;
        const partnerId = deadPlayer.loverId;
        const partner = partnerId ? updatedPlayers.find(p => p.id === partnerId) : null;
        if (partner && partner.alive && !newDeathsMap.has(partnerId)) {
          newDeathsMap.set(partnerId, 'LOVER');
          loverDeathNotice.push({ id: `lover_${partner.id}_${night}_${day}`, name: partner.name, partnerName: deadPlayer.name });
          log = addLog(log, night, day, 'DEATH', `💔 PENGUMUMAN LOVERS: ${partner.name} ikut tereliminasi serentak karena pasangan ${deadPlayer.name} tereliminasi.`);
          changed = true;
        }
      }
    }

    const nightDeathsList = [];
    newDeathsMap.forEach((reason, deadId) => {
      const idx = updatedPlayers.findIndex(p => p.id === deadId);
      if (idx === -1 || !updatedPlayers[idx].alive) return;
      updatedPlayers[idx].alive = false; updatedPlayers[idx].deathReason = reason; updatedPlayers[idx].deathNight = night;
      nightDeathsList.push({ player: updatedPlayers[idx], reason });
      log = addLog(log, night, day, 'DEATH', `${updatedPlayers[idx].name} tereliminasi.`);
    });

    // Guardian tidak boleh melindungi target yang sama dua malam berturut-turut (per Guardian)
    const guardianLast = {};
    Object.entries(guardianActs).forEach(([actorId, act]) => { guardianLast[actorId] = (act && act.targetId) || null; });
    updatedPlayers = updatedPlayers.map(p => ({ ...p, protectedLastNight: false, protectedThisNight: false }));

    const dop = applyDoppelgangerCopies(state, updatedPlayers, log, night, day);
    updatedPlayers = dop.players; log = dop.log;

    let tempState = {
      ...state, ...dop.patch, players: updatedPlayers, gameLog: log, lastNightDeaths: nightDeathsList,
      wolfCubRagePending: nightDeathsList.some(d => d.player.role === 'WOLF_CUB'),
      loverDeathNotice, doppelgangerNotices: dop.notices,
      werewolfTargetId: null, werewolfTargetIds: [], nightActs: {}, draft: {}, nightActorId: null, guardianLast, seerResult: null, nightSkips: {},
    };

    tempState = activateTraitorIfNeeded(tempState);
    log = tempState.gameLog;
    return finalizeResolution({ ...tempState, gameLog: log }, 'NIGHT');
  }

  function activateTraitorIfNeeded(state) {
    const livingWolves = state.players.filter(p => p.alive && isWolfAligned(p));
    const traitors = state.players.filter(p => p.alive && p.role === 'TRAITOR');
    if (livingWolves.length > 0 || traitors.length === 0) return state;
    
    const players = state.players.map(p => p.alive && p.role === 'TRAITOR' ? { ...p, convertedToWerewolf: true } : p);
    const traitorNames = traitors.map(t => t.name).join(', ');
    const reminderMsg = `⚠️ PENGINGAT MODERATOR: Seluruh Werewolf asli telah mati! Traitor (${traitorNames}) resmi berubah menjadi Werewolf dan masuk ke tim Evil!`;
    
    return { 
      ...state, 
      players, 
      gameLog: addLog(state.gameLog, state.nightNumber, state.dayNumber, 'ROLE', reminderMsg) 
    };
  }

  function checkWinConditions(state) {
    const living = state.players.filter(p => p.alive);
    // Lovers beda tim menang bersama jika hanya mereka berdua yang tersisa
    if (living.length === 2 && living[0].loverId === living[1].id && living[1].loverId === living[0].id && isWolfAligned(living[0]) !== isWolfAligned(living[1])) return 'LOVERS';
    const livingEvil = living.filter(isWolfAligned);
    const livingGood = living.filter(p => !isWolfAligned(p) && p.role !== 'JESTER');
    if (livingEvil.length === 0) return 'WARGA';
    if (livingEvil.length >= livingGood.length) return 'WEREWOLF';
    return null;
  }

  // Hitung perolehan suara dari tally input moderator (+1 ekstra untuk pilihan Mayor yang sudah terungkap)
  function computeVoteCounts(state) {
    const counts = {};
    let total = 0;
    Object.entries(state.voteTally || {}).forEach(([id, raw]) => {
      const n = Math.max(0, parseInt(raw, 10) || 0);
      const target = (state.players || []).find(p => p.id === id && p.alive);
      if (!target || n === 0) return;
      counts[id] = n;
      total += n;
    });
    const revealed = state.mayorRevealedIds || [];
    (state.players || []).filter(p => p.role === 'MAYOR' && p.alive && revealed.includes(p.id)).forEach(m => {
      const t = (state.mayorVotes || {})[m.id];
      if (t && counts[t]) counts[t] += 1;
    });
    return { counts, total };
  }

  // Matikan pemain + rantai kematian Lovers (dipakai voting & Hunter)
  function applyDeathsWithLovers(playersIn, logIn, initialDeaths, night, day, stamp) {
    const players = playersIn.map(p => ({ ...p }));
    let log = logIn;
    const deathsMap = new Map();
    initialDeaths.forEach(d => deathsMap.set(d.id, d.reason));
    const loverNotices = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const deadId of Array.from(deathsMap.keys())) {
        const dead = players.find(p => p.id === deadId);
        const partner = dead?.loverId ? players.find(p => p.id === dead.loverId) : null;
        if (partner && partner.alive && !deathsMap.has(partner.id)) {
          deathsMap.set(partner.id, 'LOVER');
          loverNotices.push({ id: `lover_${partner.id}_${night}_${day}`, name: partner.name, partnerName: dead.name });
          log = addLog(log, night, day, 'DEATH', `💔 PENGUMUMAN LOVERS: ${partner.name} ikut tereliminasi serentak karena pasangan ${dead.name} tereliminasi.`);
          changed = true;
        }
      }
    }
    const deaths = [];
    deathsMap.forEach((reason, id) => {
      const idx = players.findIndex(p => p.id === id);
      if (idx === -1 || !players[idx].alive) return;
      players[idx] = { ...players[idx], alive: false, deathReason: reason, ...stamp };
      deaths.push({ player: players[idx], reason });
    });
    return { players, log, deaths, loverNotices };
  }

  // Titik keputusan tunggal setelah kematian diproses (malam / voting / hunter):
  // Hunter menembak dulu -> cek menang -> (Doppelganger reveal) -> fase berikutnya
  function finalizeResolution(state, source) {
    const night = state.nightNumber, day = state.dayNumber;
    const winResult = checkWinConditions(state);
    const hunterPending = state.players.some(p => p.role === 'HUNTER' && !p.alive && !p.hunterRevengeUsed);
    if (hunterPending && winResult !== 'WARGA') {
      return { ...state, hunterPending: true, hunterSource: source, currentPhase: 'HUNTER_REVENGE' };
    }
    let log = state.gameLog;
    if (winResult) log = addLog(log, night, day, 'WIN', winResult === 'WARGA' ? 'Kemenangan Tim WARGA!' : winResult === 'LOVERS' ? 'Kemenangan LOVERS (beda tim)!' : 'Kemenangan Tim WEREWOLF!');
    let next = { ...state, hunterPending: false, hunterSource: null, gameLog: log };
    let nextPhase;
    if (winResult) { next.winner = winResult; nextPhase = 'GAME_OVER'; }
    else if (source === 'NIGHT') { nextPhase = 'MORNING'; }
    else {
      nextPhase = 'NIGHT_INTRO';
      next = {
        ...next, nightNumber: night + 1, dayNumber: day + 1,
        voteTally: {}, voteRecorded: false, mayorVotes: {}, currentVoterIndex: 0,
        discussionEndTimestamp: null, isTimerPaused: false, pausedRemainingSeconds: null,
        gameLog: addLog(log, night + 1, day + 1, 'INFO', `Memulai Malam ${night + 1}.`)
      };
    }
    if ((next.doppelgangerNotices || []).length > 0) return { ...next, currentPhase: 'DOPPELGANGER_REVEAL', doppelgangerRevealNextPhase: nextPhase };
    return { ...next, currentPhase: nextPhase };
  }


  const handleSeerInspect = (targetId) => {
    const actor = getActor(gameState);
    if (!actor || !validateTarget(gameState, 'SEER', targetId, actor.id).valid) return;
    const target = gameState.players.find(p => p.id === targetId);
    if (!target) return;
    let displayedRole = target.role, isLycanNote = false;
    if (target.role === 'LYCAN') { displayedRole = 'WEREWOLF'; isLycanNote = true; }
    else if (target.role === 'JESTER') { displayedRole = 'WARGA'; }
    else if (target.role === 'TRAITOR') { displayedRole = target.convertedToWerewolf ? 'WEREWOLF' : 'WARGA'; }
    setGameState(prev => ({ ...prev, nightActs: withAct(prev, 'SEER', actor.id, { targetId }), seerResult: { targetName: target.name, displayedRole, isLycanNote }, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Seer ${actor.name} meramal ${target.name}.`) }));
  };

  const handleConfirmCupid = () => {
    const actor = getActor(gameState);
    const { l1, l2 } = gameState.draft || {};
    if (!actor || !l1 || !l2 || l1 === l2) return;
    const p1 = gameState.players.find(p => p.id === l1), p2 = gameState.players.find(p => p.id === l2);
    if (!p1?.alive || !p2?.alive || p1.loverId || p2.loverId) return;
    const updatedPlayers = gameState.players.map(p => p.id === l1 ? { ...p, loverId: l2 } : p.id === l2 ? { ...p, loverId: l1 } : p);
    advanceNightPhase({ players: updatedPlayers, nightActs: withAct(gameState, 'CUPID', actor.id, { l1, l2 }), abilityUsed: markUsed(gameState, actor.id, 'CUPID'), draft: {}, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', `Cupid ${actor.name} memilih ${p1.name} & ${p2.name}.`) }, { recordUndo: true });
  };

  const handleConfirmDoppelganger = () => {
    const actor = getActor(gameState);
    const targetId = (gameState.draft || {}).targetId;
    if (!actor || !validateTarget(gameState, 'DOPPELGANGER', targetId, actor.id).valid) return;
    const target = gameState.players.find(p => p.id === targetId);
    advanceNightPhase({ doppelgangerTargets: { ...(gameState.doppelgangerTargets || {}), [actor.id]: targetId }, draft: {}, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', `Doppelganger ${actor.name} memilih ${target.name}.`) }, { recordUndo: true });
  };

  const handleConfirmSheriff = () => {
    const actor = getActor(gameState);
    const targetId = (gameState.draft || {}).targetId;
    if (!actor || !validateTarget(gameState, 'SHERIFF', targetId, actor.id).valid) return;
    advanceNightPhase({ nightActs: withAct(gameState, 'SHERIFF', actor.id, { targetId }), abilityUsed: markUsed(gameState, actor.id, 'SHERIFF'), draft: {}, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', `Sheriff ${actor.name} menggunakan kemampuan.`) }, { recordUndo: true });
  };

  const handleConfirmWerewolf = (selectedIds) => {
    const required = Math.min(gameState.wolfCubRagePending ? 2 : 1, getLivingTargets(gameState, 'WEREWOLF').length);
    if (!selectedIds || selectedIds.length !== required || new Set(selectedIds).size !== required) return;
    if (!selectedIds.every(id => validateTarget(gameState, 'WEREWOLF', id).valid)) return;
    advanceNightPhase({ werewolfTargetIds: [...selectedIds], werewolfTargetId: selectedIds[0] || null, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', `Werewolf mengunci target.`) }, { recordUndo: true });
  };

  const handleConfirmGuardian = () => {
    const actor = getActor(gameState);
    const targetId = (gameState.draft || {}).targetId;
    if (!actor || !validateTarget(gameState, 'GUARDIAN', targetId, actor.id).valid) return;
    advanceNightPhase({ nightActs: withAct(gameState, 'GUARDIAN', actor.id, { targetId }), draft: {}, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', `Guardian ${actor.name} mengunci target.`) }, { recordUndo: true });
  };

  const handleFinishWitch = () => {
    const actor = getActor(gameState);
    if (!actor) return;
    const d = gameState.draft || {};
    const healOk = !isUsed(gameState, actor.id, 'WITCH_HEAL');
    const killOk = !isUsed(gameState, actor.id, 'WITCH_KILL') && gameState.nightNumber > 1;
    const alive = (id) => !!id && gameState.players.some(p => p.id === id && p.alive);
    const healTargetId = healOk && alive(d.healTargetId) ? d.healTargetId : null;
    const killTargetId = killOk && alive(d.killTargetId) ? d.killTargetId : null;
    let abilityUsed = gameState.abilityUsed || {};
    if (healTargetId) abilityUsed = markUsed({ abilityUsed }, actor.id, 'WITCH_HEAL');
    if (killTargetId) abilityUsed = markUsed({ abilityUsed }, actor.id, 'WITCH_KILL');
    advanceNightPhase({ nightActs: withAct(gameState, 'WITCH', actor.id, { healTargetId, killTargetId }), abilityUsed, draft: {}, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', `Witch ${actor.name} selesai beraksi.`) }, { recordUndo: true });
  };

  const handleSkipNightAction = (roleKey, message) => {
    const actor = getActor(gameState);
    const cleared = { draft: {}, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'INFO', message) };
    switch (roleKey) {
      case 'WEREWOLF': cleared.nightSkips = { ...(gameState.nightSkips || {}), WEREWOLF: true }; cleared.werewolfTargetId = null; cleared.werewolfTargetIds = []; break;
      case 'DOPPELGANGER': if (actor) cleared.doppelgangerTargets = { ...(gameState.doppelgangerTargets || {}), [actor.id]: null }; break;
      case 'CUPID': if (actor) { cleared.nightActs = withAct(gameState, 'CUPID', actor.id, { skipped: true }); cleared.abilityUsed = markUsed(gameState, actor.id, 'CUPID'); } break;
      default: if (actor) cleared.nightActs = withAct(gameState, roleKey, actor.id, { skipped: true });
    }
    advanceNightPhase(cleared, { recordUndo: true });
  };

  const handleHunterRevenge = (targetId) => {
    setGameState(prev => {
      const hunter = prev.players.find(p => p.role === 'HUNTER' && !p.alive && !p.hunterRevengeUsed);
      const target = prev.players.find(p => p.id === targetId && p.alive);
      if (!hunter || !target) return prev;
      const night = prev.nightNumber, day = prev.dayNumber;
      const source = prev.hunterSource === 'DAY' ? 'DAY' : 'NIGHT';
      const startLog = addLog(prev.gameLog, night, day, 'DEATH', `Hunter ${hunter.name} membalas dengan mengeliminasi ${target.name}.`);
      const marked = prev.players.map(p => p.id === hunter.id ? { ...p, hunterRevengeUsed: true } : p);
      const res = applyDeathsWithLovers(marked, startLog, [{ id: target.id, reason: 'HUNTER' }], night, day, { deathDay: day, deathNight: night });
      const dop = applyDoppelgangerCopies(prev, res.players, res.log, night, day);
      const deathsField = source === 'DAY' ? 'lastDayDeaths' : 'lastNightDeaths';
      let tempState = {
        ...prev, ...dop.patch, undoStack: pushUndoState(prev), players: dop.players, gameLog: dop.log, hunterTargetId: null,
        [deathsField]: [...(prev[deathsField] || []), ...res.deaths],
        loverDeathNotice: [...(prev.loverDeathNotice || []), ...res.loverNotices],
        doppelgangerNotices: [...(prev.doppelgangerNotices || []), ...dop.notices],
        wolfCubRagePending: prev.wolfCubRagePending || res.deaths.some(d => d.player.role === 'WOLF_CUB')
      };
      tempState = activateTraitorIfNeeded(tempState);
      return finalizeResolution(tempState, source);
    });
  };

  const handleMayorReveal = (mayorId) => {
    const mayor = gameState.players.find(p => p.id === mayorId && p.role === 'MAYOR' && p.alive);
    if (!mayor || (gameState.mayorRevealedIds || []).includes(mayorId)) return;
    setGameState(prev => ({ ...prev, mayorRevealedIds: [...(prev.mayorRevealedIds || []), mayorId], gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Mayor ${mayor.name} mengungkap identitas. Suaranya bernilai 2.`) }));
  };

  // Setiap Doppelganger yang targetnya sudah mati menyalin role target. Kemampuan sekali-pakai
  // dicatat per id pemain, jadi hasil salinan otomatis mendapat kemampuan "segar".
  function applyDoppelgangerCopies(state, playersIn, logIn, night, day) {
    const targets = state.doppelgangerTargets || {};
    const players = [...playersIn];
    let log = logIn;
    const notices = [];
    const abilityUsed = { ...(state.abilityUsed || {}) };
    let mayorRevealedIds = [...(state.mayorRevealedIds || [])];
    playersIn.filter(p => p.role === 'DOPPELGANGER' && p.alive && !p.doppelgangerCopied).forEach(doppel => {
      const targetId = targets[doppel.id];
      const target = targetId ? players.find(p => p.id === targetId) : null;
      if (!target || target.alive || target.role === 'DOPPELGANGER') return;
      const copiedRole = target.role;
      const idx = players.findIndex(p => p.id === doppel.id);
      players[idx] = {
        ...players[idx], role: copiedRole,
        team: getEffectiveTeam({ role: copiedRole, convertedToWerewolf: copiedRole === 'WEREWOLF' || copiedRole === 'WOLF_CUB' }),
        doppelgangerCopied: true
      };
      delete abilityUsed[doppel.id];
      mayorRevealedIds = mayorRevealedIds.filter(id => id !== doppel.id);
      log = addLog(log, night, day, 'ACTION', `⚠️ PENGINGAT MODERATOR: Target Doppelganger (${target.name}) telah mati. Doppelganger (${doppel.name}) resmi mewarisi role ${ROLES[copiedRole]?.name}!`);
      notices.push({ playerId: doppel.id, playerName: doppel.name, targetName: target.name, oldRole: doppel.role, newRole: copiedRole });
    });
    return { players, log, notices, patch: { abilityUsed, mayorRevealedIds } };
  }

  const resolveVotingResults = () => {
    let log = [...gameState.gameLog];
    const { players, nightNumber, dayNumber } = gameState;
    const { counts: voteCounts, total: validVoteCount } = computeVoteCounts(gameState);

    const maxVotes = Math.max(0, ...Object.values(voteCounts));
    const topCandidates = maxVotes > 0 ? Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes) : [];
    const allVotesSkipped = validVoteCount === 0;

    let updatedPlayers = players.map(p => ({ ...p }));
    let dayDeaths = [], loverDeathNotice = [], dopNotices = [], dopPatch = {};

    if (topCandidates.length === 1) {
      const eliminatedPlayer = updatedPlayers.find(p => p.id === topCandidates[0]);
      log = addLog(log, nightNumber, dayNumber, 'ACTION', `${eliminatedPlayer.name} tereliminasi (${maxVotes} suara).`);
      const res = applyDeathsWithLovers(updatedPlayers, log, [{ id: eliminatedPlayer.id, reason: 'VOTE' }], nightNumber, dayNumber, { deathDay: dayNumber });
      updatedPlayers = res.players; log = res.log; dayDeaths = res.deaths; loverDeathNotice = res.loverNotices;
      const dop = applyDoppelgangerCopies(gameState, updatedPlayers, log, nightNumber, dayNumber);
      updatedPlayers = dop.players; log = dop.log; dopNotices = dop.notices; dopPatch = dop.patch;

      if (eliminatedPlayer.role === 'JESTER') {
        log = addLog(log, nightNumber, dayNumber, 'WIN', `Jester ${eliminatedPlayer.name} menang!`);
        setGameState({ ...gameState, undoStack: pushUndoState(gameState), players: updatedPlayers, gameLog: log, lastDayDeaths: dayDeaths, loverDeathNotice, doppelgangerNotices: [], currentPhase: 'GAME_OVER', winner: 'JESTER' });
        return;
      }
    } else if (allVotesSkipped) log = addLog(log, nightNumber, dayNumber, 'INFO', `Semua pemain SKIP VOTE.`);
    else log = addLog(log, nightNumber, dayNumber, 'INFO', `Hasil voting seri!`);

    let tempState = {
      ...gameState, ...dopPatch, undoStack: pushUndoState(gameState), players: updatedPlayers, gameLog: log, lastDayDeaths: dayDeaths, loverDeathNotice, doppelgangerNotices: dopNotices,
      wolfCubRagePending: gameState.wolfCubRagePending || dayDeaths.some(d => d.player.role === 'WOLF_CUB')
    };
    tempState = activateTraitorIfNeeded(tempState);
    setGameState(finalizeResolution(tempState, 'DAY'));
  };

  const startDiscussionTimer = () => setGameState(prev => ({ ...prev, undoStack: pushUndoState(prev), discussionEndTimestamp: Date.now() + prev.discussionDurationSeconds * 1000, isTimerPaused: false, pausedRemainingSeconds: null, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', 'Diskusi dimulai.') }));
  const pauseDiscussionTimer = () => setGameState(prev => ({ ...prev, isTimerPaused: true, pausedRemainingSeconds: remainingSeconds }));
  const resumeDiscussionTimer = () => setGameState(prev => ({ ...prev, isTimerPaused: false, discussionEndTimestamp: Date.now() + remainingSeconds * 1000, pausedRemainingSeconds: null }));

  const handleUndo = () => {
    if (!gameState.undoStack || gameState.undoStack.length === 0) return;
    setGameState(prev => { const stack = [...prev.undoStack]; const previousState = stack.shift(); return { ...previousState, undoStack: stack }; });
  };

  const handleRestartSamePlayers = () => {
    const playerNames = gameState.players.map(p => p.name);
    const roleCounts = gameState.roleCounts || {};
    const roleList = Object.entries(roleCounts).flatMap(([role, count]) => Array(Number(count) || 0).fill(role));
    if (roleList.length !== playerNames.length) { handleNewGame(); return; }
    const shuffledRoles = shuffle(roleList);
    const stamp = Date.now();
    const newPlayers = playerNames.map((name, idx) => ({ id: 'player_' + (idx + 1) + '_' + stamp, name, role: shuffledRoles[idx], alive: true, loverId: null, protectedLastNight: false, protectedThisNight: false, deathReason: null, deathNight: null, deathDay: null, hunterRevengeUsed: false, convertedToWerewolf: false }));
    setGameState({ ...createInitialGameState(), players: newPlayers, roleCounts: { ...roleCounts }, currentPhase: 'ROLE_SUMMARY', gameLog: addLog([], 1, 1, 'INFO', `Game diulang.`) });
  };

  const handleBackToHome = () => {
    const inGame = gameState.players.length > 0 && !['HOME', 'SETUP', 'GAME_OVER'].includes(gameState.currentPhase);
    if (inGame) {
      // Game dijeda (tidak dihapus) dan bisa dilanjutkan dari tombol "LANJUTKAN GAME"
      setGameState(prev => ({ ...prev, resumePhase: prev.currentPhase, currentPhase: 'HOME', isRoleCardOpen: false }));
      return;
    }
    try { localStorage.removeItem(LOCAL_STORAGE_KEY); } catch (e) {}
    setGameState(createInitialGameState());
  };
  const handleNewGame = () => { try { localStorage.removeItem(LOCAL_STORAGE_KEY); } catch (e) {} setGameState(createInitialGameState()); };
  const handleContinueGame = () => setGameState(prev => ({ ...prev, currentPhase: prev.resumePhase || 'NIGHT_INTRO', resumePhase: null }));
  const handleContinueAfterDoppelReveal = () => setGameState(prev => ({ ...prev, currentPhase: prev.doppelgangerRevealNextPhase || 'MORNING', doppelgangerNotices: [], doppelgangerRevealNextPhase: null }));

  const formatTime = (totalSec) => `${Math.floor(totalSec / 60).toString().padStart(2, '0')}:${(totalSec % 60).toString().padStart(2, '0')}`;

  const renderSmartAssistant = () => {
    if (gameState.currentPhase === 'HOME' || gameState.currentPhase === 'SETUP') return null;
    const living = gameState.players.filter(p => p.alive);
    const configs = {
      ROLE_SUMMARY: ['ROLE SETUP', 'Komposisi role siap.', 'NEXT: Bagikan role.'],
      ROLE_REVEAL: ['ROLE REVEAL', `Membuka role ${Math.min(gameState.revealPlayerIndex + 1, gameState.players.length)}/${gameState.players.length}.`, 'NEXT: Sembunyikan & lanjut.'],
      NIGHT_INTRO: [`MALAM ${gameState.nightNumber}`, 'Semua pemain tutup mata.', 'NEXT: Mulai aksi malam.'],
      MORNING: [`PAGI ${gameState.dayNumber}`, `${(gameState.lastNightDeaths || []).length} pemain tereliminasi.`, 'NEXT: Masuk diskusi.'],
      DISCUSSION: ['DISKUSI', gameState.discussionEndTimestamp ? `Timer ${formatTime(remainingSeconds)} tersisa.` : 'Timer belum dimulai.', 'NEXT: Selesaikan untuk voting.'],
      VOTING: ['VOTING', `${computeVoteCounts({ ...gameState, mayorRevealedIds: [] }).total}/${living.length} suara tercatat.`, 'NEXT: Proses hasil voting.'],
      HUNTER_REVENGE: ['HUNTER REVENGE', 'Hunter membalas dendam.', 'NEXT: Pilih target hidup.'],
      GAME_OVER: ['GAME OVER', 'Permainan selesai.', 'NEXT: Mulai game baru.']
    };
    const cfg = configs[gameState.currentPhase];
    if (!cfg) return null;
    return (
      <section className="w-full border-b border-amber-700/50 bg-slate-900/95 px-4 py-3 shadow-inner">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase">{cfg[0]}</div>
            <div className="text-sm font-black text-white truncate">{cfg[1]}</div>
          </div>
          <div className="shrink-0 text-[10px] font-black text-slate-200 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2">{cfg[2]}</div>
        </div>
      </section>
    );
  };

  const renderHome = () => (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-tr from-red-950 via-slate-900 to-indigo-950 border border-red-500/30 shadow-2xl">
            <Moon className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-200 to-purple-400 uppercase">WEREWOLF</h1>
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Moderator Game Assistant</p>
          <p className="text-xs sm:text-sm text-slate-300 px-4">Panduan lengkap untuk menjalankan permainan Werewolf secara otomatis dan terstruktur.</p>
        </div>
        <div className="space-y-3 pt-4">
          {gameState.players.length > 0 && gameState.resumePhase && (
            <button onClick={handleContinueGame} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition">
              <Play className="w-5 h-5 fill-current" /><span>LANJUTKAN GAME (Malam {gameState.nightNumber})</span>
            </button>
          )}
          <button onClick={() => { if (gameState.resumePhase && !window.confirm('Game yang tersimpan akan dihapus. Lanjutkan?')) return; localStorage.removeItem(LOCAL_STORAGE_KEY); setGameState({ ...createInitialGameState(), currentPhase: 'SETUP' }); }} className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-amber-700 hover:opacity-95 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition">
            <Sparkles className="w-5 h-5" /><span>MULAI GAME BARU</span>
          </button>
          <button onClick={() => setShowRulesModal(true)} className="w-full py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition">
            <BookOpen className="w-4 h-4 text-amber-400" /><span>ATURAN PERMAINAN</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSetup = () => {
    const trimmedNames = inputPlayerNames.map(n => n.trim()).filter(Boolean);
    const totalRoles = Object.values(roleCountsDraft).reduce((s, n) => s + (Number(n) || 0), 0);
    const wolfCount = ['WEREWOLF', 'WOLF_CUB'].reduce((s, k) => s + (Number(roleCountsDraft[k]) || 0), 0);
    const setupIssues = [];
    if (trimmedNames.length < 5 || trimmedNames.length > 25) setupIssues.push('Jumlah pemain harus 5–25.');
    if (totalRoles !== playerCount) setupIssues.push(`Total role (${totalRoles}) harus sama dengan jumlah pemain (${playerCount}).`);
    if (wolfCount === 0) setupIssues.push('Minimal harus ada 1 Werewolf atau Wolf Cub.');
    const setupWarnings = [];
    if (wolfCount > 0 && wolfCount * 2 >= playerCount) setupWarnings.push('Jumlah Werewolf sudah ≥ separuh pemain, game bisa langsung berakhir.');
    const canStart = setupIssues.length === 0;
    return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2"><Users className="w-6 h-6 text-amber-400" /><span>SETUP PEMAIN</span></h2>
        <p className="text-xs text-slate-400">Pilih preset cepat atau atur peserta manual (maks 25 orang).</p>
      </div>
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex justify-between items-center"><h3 className="text-xs font-bold text-slate-300 uppercase">Game Presets</h3><span className="text-[10px] text-slate-500">Atur otomatis</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {GAME_PRESETS.map(preset => (
            <button key={preset.id} onClick={() => { setInputPlayerNames(PARTICIPANT_LIST.slice(0, preset.count)); setPlayerCount(preset.count); setRoleCountsDraft(preset.roles); }} className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800/80 hover:border-amber-500/50 text-left transition space-y-1 shadow-sm">
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-amber-400">{preset.name}</span><span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{preset.count} Pemain</span></div>
              <p className="text-[11px] text-slate-400">{preset.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <div><label className="text-xs font-bold text-slate-300 uppercase block">Daftar Peserta</label><p className="text-xs text-slate-500 mt-1">Pilih 5–25 nama.</p></div>
          <div className="text-right"><div className={`text-2xl font-black ${playerCount >= 5 && playerCount <= 25 ? 'text-amber-400' : 'text-red-400'}`}>{playerCount}</div><div className="text-[10px] text-slate-500 uppercase">dipilih / 25 maks.</div></div>
        </div>
        <div className="flex gap-2">
          <input type="text" value={participantSearch} onChange={e => setParticipantSearch(e.target.value)} placeholder="Cari nama..." className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500" />
          <button onClick={() => { const all = PARTICIPANT_LIST.slice(0, 25); setInputPlayerNames(all); setPlayerCount(all.length); setRoleCountsDraft({ WARGA: Math.max(0, all.length - 4), WEREWOLF: 1, GUARDIAN: 1, SEER: 1, WITCH: 1 }); }} className="px-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black whitespace-nowrap">PILIH SEMUA</button>
          <button onClick={() => { setInputPlayerNames([]); setPlayerCount(0); setRoleCountsDraft({}); }} className="px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold">RESET</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-1">
          {PARTICIPANT_LIST.filter(name => name.toLowerCase().includes(participantSearch.toLowerCase())).map((name, index) => {
            const selected = inputPlayerNames.includes(name);
            return (
              <button key={name} onClick={() => { if (!selected && inputPlayerNames.length >= 25) return; const next = selected ? inputPlayerNames.filter(n => n !== name) : [...inputPlayerNames, name]; setInputPlayerNames(next); setPlayerCount(next.length); }} className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition ${selected ? 'bg-amber-950/60 border-amber-500/80 text-amber-100' : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'}`}>
                <span className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 text-xs font-black ${selected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700 text-slate-600'}`}>{selected ? <Check className="w-4 h-4" /> : index + 1}</span>
                <span className="text-sm font-semibold truncate">{name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex justify-between items-center"><h3 className="text-xs font-bold text-slate-300 uppercase">Jumlah Role</h3><span className="text-xs font-bold text-amber-400">{Object.values(roleCountsDraft).reduce((a, b) => a + (Number(b) || 0), 0)} / {playerCount}</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto pr-1">
          {ROLE_KEYS.map(roleKey => {
            const meta = ROLES[roleKey]; const value = Number(roleCountsDraft[roleKey] || 0);
            const Icon = ROLE_ICONS[roleKey] || User;
            return (
              <div key={roleKey} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-2.5 shadow-sm">
                <div className="flex items-center gap-2 mb-2"><Icon className={`w-4 h-4 ${meta.color}`} /><span className={`text-xs font-bold ${meta.color}`}>{meta.name}</span></div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setRoleCountsDraft(prev => ({ ...prev, [roleKey]: Math.max(0, value - 1) }))} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold">−</button>
                  <div className="flex-1 text-center font-black text-white text-xs">{value}</div>
                  <button onClick={() => setRoleCountsDraft(prev => ({ ...prev, [roleKey]: Math.min(playerCount, value + 1) }))} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold">+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {setupIssues.length > 0 && (
        <div className="rounded-2xl border border-red-800/60 bg-red-950/40 p-3 space-y-1">
          {setupIssues.map((m, i) => <p key={i} className="text-xs text-red-300">⛔ {m}</p>)}
        </div>
      )}
      {setupWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-700/60 bg-amber-950/40 p-3 space-y-1">
          {setupWarnings.map((m, i) => <p key={i} className="text-xs text-amber-300">⚠️ {m}</p>)}
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button onClick={handleBackToHome} className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-sm transition">Batal</button>
        <button onClick={() => {
          const trimmed = inputPlayerNames.map(n => n.trim()).filter(Boolean);
          if (trimmed.length < 5 || trimmed.length > 25) return;
          const totalRoles = Object.values(roleCountsDraft).reduce((sum, n) => sum + (Number(n) || 0), 0);
          if (totalRoles !== playerCount) return;
          const roleList = Object.entries(roleCountsDraft).flatMap(([role, count]) => Array(Number(count)).fill(role));
          const shuffledRoles = shuffle(roleList);
          const players = trimmed.map((name, idx) => ({ id: 'player_' + (idx + 1) + '_' + Date.now(), name, role: shuffledRoles[idx], alive: true, loverId: null, protectedLastNight: false, protectedThisNight: false, deathReason: null, deathNight: null, deathDay: null, hunterRevengeUsed: false, convertedToWerewolf: false }));
          setGameState({ ...createInitialGameState(), players, currentPhase: 'ROLE_SUMMARY', roleCounts: { ...roleCountsDraft }, gameLog: addLog([], 1, 1, 'INFO', `Permainan dibuat dengan ${playerCount} pemain.`) });
        }} disabled={!canStart} className="w-2/3 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition">
          <Sparkles className="w-5 h-5" /><span>ACAK ROLE</span>
        </button>
      </div>
    </div>
  );
  };

  const renderRoleSummary = () => {
    const rolesInGame = gameState.players.reduce((acc, p) => { acc[p.role] = (acc[p.role] || 0) + 1; return acc; }, {});
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2"><h2 className="text-2xl font-black text-white">KOMPOSISI ROLE</h2><p className="text-xs text-slate-400">Peran yang akan dibagikan kepada {gameState.players.length} pemain.</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(rolesInGame).map(([roleKey, count]) => {
            const meta = ROLES[roleKey]; const Icon = ROLE_ICONS[roleKey] || User;
            return (
              <div key={roleKey} className={`p-4 rounded-3xl border ${meta?.border} ${meta?.bg} flex items-center justify-between shadow-xl`}>
                <div className="flex items-center gap-3"><Icon className={`w-8 h-8 ${meta?.color}`} /><div><h4 className={`font-black ${meta?.color}`}>{meta?.name}</h4><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{meta?.team}</span></div></div>
                <div className="px-3.5 py-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-white font-black text-sm">x{count}</div>
              </div>
            );
          })}
        </div>
        <button onClick={() => setGameState(prev => ({ ...prev, currentPhase: 'ROLE_REVEAL', revealPlayerIndex: 0, isRoleCardOpen: false }))} className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>BAGIKAN ROLE</span><ArrowRight className="w-5 h-5" /></button>
      </div>
    );
  };

  const renderRoleReveal = () => {
    const { revealPlayerIndex, isRoleCardOpen, players } = gameState;
    const currentPlayer = players[revealPlayerIndex];
    if (!currentPlayer) return null;
    const roleMeta = ROLES[currentPlayer.role] || ROLES.WARGA;
    const Icon = ROLE_ICONS[currentPlayer.role] || User;
    return (
      <div className="max-w-md mx-auto p-4 sm:p-6 min-h-[80vh] flex flex-col justify-between space-y-6 animate-fadeIn">
        <div className="text-center space-y-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PEMBAGIAN ROLE ({revealPlayerIndex + 1} / {players.length})</span><h2 className="text-3xl font-black text-white">{currentPlayer.name}</h2><p className="text-xs text-amber-300">Serahkan perangkat hanya kepada {currentPlayer.name}.</p></div>
        <div className="flex-1 flex items-center justify-center my-4">
          {!isRoleCardOpen ? (
            <div onClick={() => setGameState(prev => ({ ...prev, isRoleCardOpen: true }))} className="w-full aspect-[3/4] max-w-xs rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-2 border-dashed border-amber-500/40 flex flex-col items-center justify-center p-6 text-center cursor-pointer shadow-2xl hover:border-amber-400 transition">
              <div className="w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 mb-4"><Lock className="w-10 h-10 text-amber-400" /></div>
              <h3 className="text-base font-bold text-white mb-1">ROLE RAHASIA</h3><p className="text-xs text-slate-400">Ketuk untuk membuka kartu role.</p>
            </div>
          ) : (
            <div className={`w-full max-w-xs rounded-3xl bg-gradient-to-br ${roleMeta.accent} border-2 ${roleMeta.border} p-6 flex flex-col items-center justify-between text-center shadow-2xl space-y-6 animate-fadeIn`}>
              <div className="space-y-3"><Icon className={`w-16 h-16 mx-auto ${roleMeta.color}`} /><h3 className={`text-2xl font-black uppercase tracking-wider ${roleMeta.color}`}>{roleMeta.name}</h3><span className="inline-block px-3 py-1 rounded-full bg-black/40 text-[10px] font-black uppercase tracking-widest text-slate-200">Tim {roleMeta.team}</span></div>
              <p className="text-xs text-slate-200 leading-relaxed bg-black/40 p-3.5 rounded-2xl border border-white/10">{roleMeta.desc}</p>
              <button onClick={() => setGameState(prev => ({ ...prev, isRoleCardOpen: false }))} className="px-4 py-2 rounded-xl bg-black/50 hover:bg-black/70 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"><Unlock className="w-3.5 h-3.5" /><span>Sembunyikan Role</span></button>
            </div>
          )}
        </div>
        <div>
          {isRoleCardOpen ? (
            <button onClick={() => setGameState(prev => { const nextIndex = prev.revealPlayerIndex + 1; if (nextIndex >= prev.players.length) return { ...prev, currentPhase: 'NIGHT_INTRO', nightNumber: 1, gameLog: addLog(prev.gameLog, 1, 1, 'INFO', 'Pembagian role selesai. Memulai Malam 1.') }; return { ...prev, revealPlayerIndex: nextIndex, isRoleCardOpen: false }; })} className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>LANJUT PEMAIN NEXT</span><ArrowRight className="w-5 h-5" /></button>
          ) : (
            <button onClick={() => setGameState(prev => ({ ...prev, isRoleCardOpen: true }))} className="w-full py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 shadow-xl transition">LIHAT ROLE</button>
          )}
        </div>
      </div>
    );
  };

  const renderNightIntro = () => (
    <div className="max-w-md mx-auto p-6 min-h-[75vh] flex flex-col justify-between text-center space-y-6 animate-fadeIn">
      <div className="space-y-4 pt-8"><div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-950/90 border border-indigo-700/60 text-indigo-400 shadow-2xl"><Moon className="w-10 h-10 animate-pulse" /></div><h2 className="text-3xl font-black text-white tracking-wide">MALAM {gameState.nightNumber}</h2><p className="text-base sm:text-lg italic text-amber-200 font-serif">"Semua pemain, silakan tutup mata. Malam telah tiba."</p>{gameState.nightNumber > 1 && (gameState.lastDayDeaths || []).length > 0 && (<div className="bg-slate-900/90 border border-red-900/60 rounded-2xl p-4 text-left space-y-1"><p className="text-[10px] font-black text-red-300 uppercase tracking-widest">Tereliminasi saat voting</p>{gameState.lastDayDeaths.map(({ player, reason }) => <p key={player.id} className="text-sm font-bold text-white">{player.name} <span className="text-[10px] text-red-300 font-normal">({DEATH_REASON_LABELS[reason] || reason})</span></p>)}</div>)}</div>
      <button onClick={() => advanceNightPhase()} className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>MULAI AKSI MALAM</span><ArrowRight className="w-5 h-5" /></button>
    </div>
  );

  const actorBanner = (actor) => actor ? (<div className="text-center"><span className="inline-block px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] font-black text-amber-300">Giliran: {actor.name}</span></div>) : null;
  const setDraft = (patch) => setGameState(prev => ({ ...prev, draft: { ...(prev.draft || {}), ...patch } }));

  const renderNightCupid = () => {
    const actor = getActor(gameState);
    const draft = gameState.draft || {};
    const options = getLivingTargets(gameState, 'CUPID', actor?.id);
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-pink-950/90 border border-pink-700/60 text-pink-400 shadow-lg"><Heart className="w-8 h-8 fill-current" /></div><h2 className="text-2xl font-black text-pink-400">CUPID</h2><p className="text-xs sm:text-sm text-slate-300">Pilih dua pemain hidup untuk terikat menjadi Lovers.</p></div>
        {actorBanner(actor)}
        <div className="bg-slate-900/90 border border-pink-900/50 rounded-3xl p-4 text-center space-y-2 shadow-xl"><span className="text-[10px] font-black text-pink-300 uppercase tracking-widest">Pasangan Terpilih:</span><div className="flex items-center justify-center gap-3 text-lg font-black text-white"><span className={draft.l1 ? 'text-pink-400' : 'text-slate-600'}>{gameState.players.find(p => p.id === draft.l1)?.name || '[ Pemain 1 ]'}</span><Heart className="w-5 h-5 text-pink-500 fill-current" /><span className={draft.l2 ? 'text-pink-400' : 'text-slate-600'}>{gameState.players.find(p => p.id === draft.l2)?.name || '[ Pemain 2 ]'}</span></div></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
          {options.map(player => {
            const isSelected = draft.l1 === player.id || draft.l2 === player.id;
            return <button key={player.id} onClick={() => setGameState(prev => { const d = prev.draft || {}; if (d.l1 === player.id) return { ...prev, draft: { ...d, l1: null } }; if (d.l2 === player.id) return { ...prev, draft: { ...d, l2: null } }; if (!d.l1) return { ...prev, draft: { ...d, l1: player.id } }; if (!d.l2) return { ...prev, draft: { ...d, l2: player.id } }; return { ...prev, draft: { ...d, l2: player.id } }; })} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition flex items-center justify-between ${isSelected ? 'bg-pink-950/80 border-pink-500 text-pink-200' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}><span className="truncate">{player.name}</span>{isSelected && <Heart className="w-4 h-4 text-pink-400 fill-current shrink-0" />}</button>;
          })}
        </div>
        <button onClick={() => handleSkipNightAction('CUPID', 'Cupid memilih SKIP.')} className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-black text-xs transition">SKIP CUPID</button>
        <div className="flex gap-3 pt-2"><button onClick={() => setDraft({ l1: null, l2: null })} className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-sm transition">Reset</button><button onClick={handleConfirmCupid} disabled={!draft.l1 || !draft.l2} className="w-2/3 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-black text-sm shadow-xl transition">KONFIRMASI PASANGAN</button></div>
      </div>
    );
  };

  const renderNightWerewolf = () => {
    const livingCandidates = gameState.players.filter(p => p.alive && !isWolfAligned(p));
    const rage = gameState.wolfCubRagePending; const required = Math.min(rage ? 2 : 1, livingCandidates.length);
    const selectedIds = gameState.werewolfTargetIds || (gameState.werewolfTargetId ? [gameState.werewolfTargetId] : []);
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950/90 border border-red-700/60 text-red-400 shadow-lg"><PawPrint className="w-8 h-8" /></div>
          <h2 className="text-2xl font-black text-red-400">WEREWOLF PHASE</h2>
          {rage && (
            <div className="inline-block px-3 py-1 bg-red-600 text-white font-black text-xs rounded-full animate-bounce shadow-md my-1">
              🐺 WOLF CUB RAGE! (PILIH 2 KORBAN)
            </div>
          )}
          <p className="text-xs sm:text-sm text-slate-300">Pilih {required} pemain untuk dieliminasi.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
          {livingCandidates.map(player => { 
            const isSelected = selectedIds.includes(player.id); 
            return (
              <button key={player.id} onClick={() => setGameState(prev => { 
                const current = prev.werewolfTargetIds || []; 
                if (required > 1) { 
                  const next = current.includes(player.id) ? current.filter(x => x !== player.id) : current.length < 2 ? [...current, player.id] : [current[1], player.id]; 
                  return { ...prev, werewolfTargetIds: next, werewolfTargetId: next[0] || null }; 
                } 
                return { ...prev, werewolfTargetIds: [player.id], werewolfTargetId: player.id }; 
              })} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition flex items-center justify-between ${isSelected ? 'bg-red-950/80 border-red-500 text-red-200' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>
                <span className="truncate">{player.name}</span>
                {isSelected && <Crosshair className="w-4 h-4 text-red-400 shrink-0" />}
              </button>
            ); 
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleSkipNightAction('WEREWOLF', 'Werewolf SKIP.')} className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black text-xs transition">SKIP</button>
          <button onClick={() => handleConfirmWerewolf(selectedIds)} disabled={selectedIds.length !== required} className="w-2/3 disabled:opacity-40 py-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>KONFIRMASI TARGET</span><ArrowRight className="w-5 h-5" /></button>
        </div>
      </div>
    );
  };

  const renderNightGuardian = () => {
    const actor = getActor(gameState);
    const draft = gameState.draft || {};
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-950/90 border border-blue-700/60 text-blue-400 shadow-lg"><Shield className="w-8 h-8" /></div><h2 className="text-2xl font-black text-blue-400">GUARDIAN PHASE</h2><p className="text-xs sm:text-sm text-slate-300">Pilih 1 pemain untuk dilindungi malam ini.</p></div>
        {actorBanner(actor)}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
          {gameState.players.filter(p => p.alive).map(player => { const isSelected = draft.targetId === player.id; const isDisabled = (gameState.guardianLast || {})[actor?.id] === player.id; return <button key={player.id} disabled={isDisabled} onClick={() => setDraft({ targetId: player.id })} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition flex items-center justify-between ${isDisabled ? 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed' : isSelected ? 'bg-blue-950/80 border-blue-500 text-blue-200' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}><span className="truncate">{player.name}</span>{isSelected && <Shield className="w-4 h-4 text-blue-400 shrink-0" />}</button>; })}
        </div>
        <div className="flex gap-3"><button onClick={() => handleSkipNightAction('GUARDIAN', 'Guardian SKIP.')} className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black text-xs transition">SKIP</button><button onClick={handleConfirmGuardian} disabled={!draft.targetId} className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>KONFIRMASI GUARDIAN</span><ArrowRight className="w-5 h-5" /></button></div>
      </div>
    );
  };

  const renderNightSheriff = () => {
    const actor = getActor(gameState);
    const draft = gameState.draft || {};
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-yellow-950/90 border border-yellow-700/60 text-yellow-300 shadow-lg"><Star className="w-8 h-8" /></div><h2 className="text-2xl font-black text-yellow-300">SHERIFF PHASE</h2><p className="text-xs sm:text-sm text-slate-300">Pilih 1 pemain untuk diuji. SKIP tidak menghabiskan kemampuan.</p></div>
        {actorBanner(actor)}
        <button onClick={() => handleSkipNightAction('SHERIFF', 'Sheriff SKIP malam ini.')} className="w-full py-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white font-black rounded-2xl text-xs transition">SKIP SHERIFF</button>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
          {getLivingTargets(gameState, 'SHERIFF', actor?.id).map(p => <button key={p.id} onClick={() => setDraft({ targetId: p.id })} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition ${draft.targetId === p.id ? 'bg-yellow-950/80 border-yellow-500 text-yellow-200' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>{p.name}</button>)}
        </div>
        <button onClick={handleConfirmSheriff} disabled={!draft.targetId} className={`w-full py-4 rounded-2xl font-black text-xs sm:text-sm transition ${draft.targetId ? 'bg-yellow-600 text-slate-950 hover:bg-yellow-500 shadow-xl' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>KONFIRMASI SHERIFF</button>
      </div>
    );
  };

  const renderNightDoppelganger = () => {
    const actor = getActor(gameState);
    const draft = gameState.draft || {};
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-950/90 border border-indigo-700/60 text-indigo-300 shadow-lg"><Ghost className="w-8 h-8" /></div><h2 className="text-2xl font-black text-indigo-300">DOPPELGANGER PHASE</h2><p className="text-xs sm:text-sm text-slate-300">Malam 1: Pilih 1 target hidup.</p></div>
        {actorBanner(actor)}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
          {getLivingTargets(gameState, 'DOPPELGANGER', actor?.id).map(p => <button key={p.id} onClick={() => setDraft({ targetId: p.id })} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left ${draft.targetId === p.id ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>{p.name}</button>)}
        </div>
        <div className="flex gap-3"><button onClick={() => handleSkipNightAction('DOPPELGANGER', 'Doppelganger SKIP.')} className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black text-xs transition">SKIP</button><button onClick={handleConfirmDoppelganger} disabled={!draft.targetId} className="w-2/3 py-4 rounded-2xl bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition"><span>KONFIRMASI DOPPELGANGER</span><ArrowRight className="w-5 h-5" /></button></div>
      </div>
    );
  };

  const renderNightSeer = () => {
    const actor = getActor(gameState);
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-950/90 border border-cyan-700/60 text-cyan-400 shadow-lg"><Eye className="w-8 h-8" /></div><h2 className="text-2xl font-black text-cyan-400">SEER PHASE</h2><p className="text-xs sm:text-sm text-slate-300">Pilih 1 pemain untuk diramal perannya.</p></div>
        {actorBanner(actor)}
        {!gameState.seerResult && <button onClick={() => handleSkipNightAction('SEER', 'Seer SKIP.')} className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-black text-xs transition mb-3">SKIP SEER</button>}
        {gameState.seerResult ? (
          <div className="bg-gradient-to-br from-cyan-950 via-slate-900 to-cyan-950 border-2 border-cyan-500/80 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-fadeIn">
            <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">HASIL RAMALAN SEER</span>
            <div className="space-y-1"><h3 className="text-2xl font-black text-white">{gameState.seerResult.targetName}</h3><div className="inline-block px-4 py-1.5 rounded-full bg-cyan-950 border border-cyan-600/80 text-cyan-300 font-bold text-sm">ROLE: {ROLES[gameState.seerResult.displayedRole]?.name || gameState.seerResult.displayedRole}</div></div>
            <button onClick={() => advanceNightPhase({ seerResult: null })} className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-sm shadow-xl transition">TUTUP HASIL & SELESAI SEER</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
            {getLivingTargets(gameState, 'SEER', actor?.id).map(player => <button key={player.id} onClick={() => handleSeerInspect(player.id)} className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-cyan-950/80 text-xs sm:text-sm font-bold text-left transition flex items-center justify-between"><span className="truncate">{player.name}</span><Eye className="w-4 h-4 text-cyan-400 shrink-0" /></button>)}
          </div>
        )}
      </div>
    );
  };

  const renderNightWitch = () => {
    const actor = getActor(gameState);
    const draft = gameState.draft || {};
    const healUsed = isUsed(gameState, actor?.id, 'WITCH_HEAL');
    const killUsed = isUsed(gameState, actor?.id, 'WITCH_KILL');
    const livingList = gameState.players.filter(p => p.alive);
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-950/90 border border-purple-700/60 text-purple-400 shadow-lg"><FlaskConical className="w-8 h-8" /></div><h2 className="text-2xl font-black text-purple-400">WITCH PHASE</h2><p className="text-xs sm:text-sm text-slate-300">{gameState.nightNumber === 1 ? 'Malam 1: Witch hanya bisa menggunakan Heal Potion.' : 'Pilih penggunaan Heal atau Kill Potion secara blind.'}</p></div>
        {actorBanner(actor)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-md"><div className="flex items-center justify-between"><span className="font-bold text-emerald-400 text-sm">Heal Potion</span>{healUsed && <span className="text-[10px] text-slate-500 font-bold">TERPAKAI</span>}</div><select disabled={healUsed} value={draft.healTargetId || ''} onChange={e => setDraft({ healTargetId: e.target.value || null })} className="w-full py-2.5 px-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none disabled:opacity-40"><option value="">-- Tebak Target Heal --</option>{livingList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-md"><div className="flex items-center justify-between"><span className="font-bold text-purple-400 text-sm">Kill Potion</span>{killUsed && <span className="text-[10px] text-slate-500 font-bold">TERPAKAI</span>}</div><select disabled={killUsed || gameState.nightNumber === 1} value={draft.killTargetId || ''} onChange={e => setDraft({ killTargetId: e.target.value || null })} className="w-full py-2.5 px-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none disabled:opacity-40"><option value="">-- Pilih Target Kill --</option>{livingList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        </div>
        <button onClick={() => handleSkipNightAction('WITCH', 'Witch SKIP.')} className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-black text-xs transition mb-3">SKIP WITCH</button>
        <button onClick={handleFinishWitch} className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>SELESAIKAN WITCH</span><ArrowRight className="w-5 h-5" /></button>
      </div>
    );
  };

  const renderHunterRevenge = () => (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-950/90 border border-orange-700/60 text-orange-300 shadow-lg"><Crosshair className="w-8 h-8" /></div><h2 className="text-2xl font-black text-orange-300">HUNTER REVENGE</h2><p className="text-xs sm:text-sm text-slate-300"><strong>{gameState.players.find(p => p.role === 'HUNTER' && !p.alive && !p.hunterRevengeUsed)?.name}</strong> tereliminasi. Pilih 1 pemain untuk dibalas dendam.</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto">
        {gameState.players.filter(p => p.alive).map(p => <button key={p.id} onClick={() => setGameState(prev => ({ ...prev, hunterTargetId: p.id }))} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition ${gameState.hunterTargetId === p.id ? 'bg-orange-950/80 border-orange-500 text-orange-200' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>{p.name}</button>)}
      </div>
      <button disabled={!gameState.hunterTargetId} onClick={() => handleHunterRevenge(gameState.hunterTargetId)} className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-black text-sm shadow-xl transition">KONFIRMASI BALAS DENDAM</button>
    </div>
  );

  const renderMorning = () => (
    <div className="max-w-lg mx-auto p-4 sm:p-6 text-center space-y-6 animate-fadeIn">
      <div className="space-y-3 pt-4"><div className="inline-flex items-center justify-center p-4 rounded-3xl bg-amber-950/80 border border-amber-600/50 text-amber-400 shadow-2xl"><Sun className="w-12 h-12" /></div><h2 className="text-3xl font-black text-white">PAGI HARI {gameState.dayNumber}</h2><p className="text-xs sm:text-sm text-slate-300">Matahari telah terbit di desa.</p></div>
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
        {(gameState.lastNightDeaths || []).length === 0 ? (
          <div className="space-y-2"><Sun className="w-10 h-10 text-emerald-400 mx-auto" /><h3 className="text-xl font-black text-emerald-400">Semua Pemain Selamat!</h3><p className="text-xs text-slate-300">Semalam tidak ada pemain yang tereliminasi.</p></div>
        ) : (
          <div className="space-y-3"><Skull className="w-10 h-10 text-red-400 mx-auto" /><h3 className="text-base font-bold text-red-400">Pemain Tereliminasi Semalam:</h3><div className="space-y-2">{(gameState.lastNightDeaths || []).map(({ player, reason }) => <div key={player.id} className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center justify-between"><span className="font-black text-white text-sm">{player.name}</span><span className="text-[10px] px-2.5 py-1 rounded-full bg-red-900/80 text-red-200 font-bold border border-red-700/60">{DEATH_REASON_LABELS[reason] || reason}</span></div>)}</div></div>
        )}
      </div>
      <button onClick={() => setGameState(prev => ({ ...prev, currentPhase: 'DISCUSSION', discussionEndTimestamp: null, isTimerPaused: false, pausedRemainingSeconds: null, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', `Memulai diskusi Hari ${prev.dayNumber}.`) }))} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>LANJUT KE WAKTU DISKUSI</span><ArrowRight className="w-5 h-5" /></button>
    </div>
  );

  const renderDiscussion = () => (
    <div className="max-w-lg mx-auto p-4 sm:p-6 text-center space-y-6 animate-fadeIn">
      <div className="space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-950/90 border border-orange-700/60 text-orange-400 shadow-lg"><MessageSquare className="w-8 h-8" /></div><h2 className="text-2xl font-black text-white">WAKTU DISKUSI</h2></div>
      <div className="bg-slate-900/90 border-2 border-slate-800/80 rounded-3xl p-8 space-y-4 shadow-2xl"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SISA WAKTU DISKUSI</span><div className="text-5xl sm:text-6xl font-black font-mono text-amber-400 tracking-wider">{formatTime(remainingSeconds)}</div><div className="flex items-center justify-center gap-3 pt-2">{!gameState.discussionEndTimestamp ? <button onClick={startDiscussionTimer} className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg transition"><Play className="w-4 h-4 fill-current" /><span>MULAI TIMER</span></button> : !gameState.isTimerPaused ? <button onClick={pauseDiscussionTimer} className="px-6 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center gap-2 border border-slate-700 transition"><Pause className="w-4 h-4" /><span>PAUSE</span></button> : <button onClick={resumeDiscussionTimer} className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg transition"><Play className="w-4 h-4 fill-current" /><span>RESUME</span></button>}</div></div>
      <button onClick={triggerAutoTransitionToVoting} className="w-full py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition"><span>SELESAIKAN DISKUSI DAN MULAI VOTING</span><ArrowRight className="w-4 h-4" /></button>
    </div>
  );

  const handleSaveVotes = () => {
    const livingCount = gameState.players.filter(p => p.alive).length;
    const { total } = computeVoteCounts({ ...gameState, mayorRevealedIds: [] });
    if (total > livingCount) { setVoteError(`Total suara (${total}) melebihi jumlah pemain hidup (${livingCount}).`); return; }
    setVoteError('');
    setGameState(prev => ({ ...prev, undoStack: pushUndoState(prev), voteRecorded: true, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', 'Moderator memasukkan rekapitulasi hasil voting.') }));
  };

  const renderVoting = () => {
    const livingPlayers = gameState.players.filter(p => p.alive);
    const hasVotesRecorded = !!gameState.voteRecorded;
    const { counts: voteTally } = computeVoteCounts(gameState);
    const rawTotal = computeVoteCounts({ ...gameState, mayorRevealedIds: [] }).total;
    const aliveMayors = gameState.players.filter(p => p.role === 'MAYOR' && p.alive);
    const revealedMayorIds = gameState.mayorRevealedIds || [];
    const unrevealedMayors = aliveMayors.filter(m => !revealedMayorIds.includes(m.id));
    const revealedMayors = aliveMayors.filter(m => revealedMayorIds.includes(m.id));

    const sortedCandidates = Object.entries(voteTally)
      .map(([targetId, count]) => ({ player: gameState.players.find(p => p.id === targetId), count }))
      .filter(item => item.player)
      .sort((a, b) => b.count - a.count);
    const maxVotes = sortedCandidates.length > 0 ? sortedCandidates[0].count : 0;

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950/90 border border-red-700/60 text-red-400 shadow-lg">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">SESI REKAP VOTING</h2>
          <p className="text-xs text-slate-400">Masukkan jumlah perolehan suara secara langsung untuk masing-masing pemain.</p>
        </div>

        {unrevealedMayors.map(m => (
          <button key={m.id} onClick={() => handleMayorReveal(m.id)} className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-sm shadow-md transition flex items-center justify-center gap-2">
            <Crown className="w-4 h-4" /> UNGKAP IDENTITAS MAYOR ({m.name})
          </button>
        ))}

        {!hasVotesRecorded && revealedMayors.map(m => (
          <div key={m.id} className="bg-slate-900/90 border border-amber-800/60 rounded-2xl p-4 space-y-2">
            <label className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">Mayor {m.name} memilih siapa? (bobot 2 suara)</label>
            <select value={(gameState.mayorVotes || {})[m.id] || ''} onChange={e => setGameState(prev => ({ ...prev, mayorVotes: { ...(prev.mayorVotes || {}), [m.id]: e.target.value || null } }))} className="w-full py-2.5 px-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none">
              <option value="">-- Mayor skip / tidak memilih --</option>
              {livingPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <p className="text-[10px] text-slate-400">Suara biasa Mayor tetap dihitung di input di bawah; sistem otomatis menambah +1 untuk pilihannya.</p>
          </div>
        ))}

        {!hasVotesRecorded ? (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Input Perolehan Suara Kandidat:</div>
              <div className={`text-xs font-black ${rawTotal > livingPlayers.length ? 'text-red-400' : 'text-amber-400'}`}>{rawTotal} / {livingPlayers.length}</div>
            </div>
            <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
              {livingPlayers.map(target => (
                <div key={target.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-sm font-bold text-white truncate">{target.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase">Suara:</span>
                    <input
                      type="number"
                      min="0"
                      max={livingPlayers.length}
                      value={(gameState.voteTally || {})[target.id] ?? ''}
                      onChange={e => { const val = e.target.value; setVoteError(''); setGameState(prev => ({ ...prev, voteTally: { ...(prev.voteTally || {}), [target.id]: val } })); }}
                      placeholder="0"
                      className="w-16 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              ))}
            </div>
            {voteError && <p className="text-xs text-red-400 font-bold">{voteError}</p>}
            <button
              onClick={handleSaveVotes}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 text-white font-black text-sm shadow-xl transition mt-4"
            >
              SIMPAN & REKAP SUARA
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">HASIL REKAP VOTING</h3>
              <button
                onClick={() => setGameState(prev => ({ ...prev, voteRecorded: false }))}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Ubah Suara
              </button>
            </div>
            <div className="space-y-3">
              {sortedCandidates.length === 0 ? (
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">Tidak ada suara tercatat. Semua pemain skip.</div>
              ) : (
                sortedCandidates.map(({ player, count }) => {
                  const isTop = count === maxVotes && maxVotes > 0;
                  const percentage = Math.min(100, (count / Math.max(1, livingPlayers.length)) * 100);
                  return (
                    <div key={player.id} className={`p-3.5 rounded-2xl border space-y-2 transition ${isTop ? 'bg-red-950/40 border-red-500/80' : 'bg-slate-950/80 border-slate-800/80'}`}>
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className={isTop ? 'text-red-400' : 'text-white'}>{player.name}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${isTop ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{count} Suara</span>
                      </div>
                      <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isTop ? 'bg-gradient-to-r from-red-600 to-amber-500' : 'bg-slate-600'}`} style={{ width: `${Math.max(8, percentage)}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button onClick={resolveVotingResults} className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition">
              <span>PROSES HASIL VOTING</span><ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderDoppelgangerReveal = () => {
    const notices = gameState.doppelgangerNotices || [];
    return (
      <div className="max-w-md mx-auto p-6 min-h-[70vh] flex flex-col justify-between text-center space-y-6 animate-fadeIn">
        <div className="space-y-4 pt-6">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-indigo-950/90 border border-indigo-700/60 text-indigo-300 shadow-2xl"><Ghost className="w-12 h-12" /></div>
          <h2 className="text-2xl font-black text-indigo-300 uppercase tracking-wide">DOPPELGANGER BERUBAH</h2>
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Info khusus moderator</p>
          {notices.map(notice => {
            const newMeta = ROLES[notice.newRole] || ROLES.WARGA;
            const NewIcon = ROLE_ICONS[notice.newRole] || Ghost;
            return (
              <div key={notice.playerId} className={`rounded-3xl border-2 ${newMeta.border} ${newMeta.bg} p-5 space-y-3`}>
                <p className="text-sm text-slate-200"><strong>{notice.playerName}</strong> menyalin role dari <strong>{notice.targetName}</strong> yang telah mati.</p>
                <NewIcon className={`w-12 h-12 mx-auto ${newMeta.color}`} />
                <p className={`text-xl font-black uppercase ${newMeta.color}`}>{newMeta.name}</p>
              </div>
            );
          })}
        </div>
        <button onClick={handleContinueAfterDoppelReveal} className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>LANJUTKAN</span><ArrowRight className="w-5 h-5" /></button>
      </div>
    );
  };

  const renderGameOver = () => (
    <div className="max-w-xl mx-auto p-4 sm:p-6 text-center space-y-6 animate-fadeIn">
      <div className="space-y-4 pt-4"><div className={`inline-flex items-center justify-center p-5 rounded-3xl border shadow-2xl ${gameState.winner === 'WARGA' ? 'bg-emerald-950/90 border-emerald-600/60 text-emerald-400' : (gameState.winner === 'JESTER' || gameState.winner === 'LOVERS') ? 'bg-pink-950/90 border-pink-600/60 text-pink-400' : 'bg-red-950/90 border-red-600/60 text-red-400'}`}><Crown className="w-16 h-16 animate-bounce" /></div><h2 className={`text-3xl font-black uppercase tracking-wider ${gameState.winner === 'WARGA' ? 'text-emerald-400' : (gameState.winner === 'JESTER' || gameState.winner === 'LOVERS') ? 'text-pink-400' : 'text-red-400'}`}>{gameState.winner === 'WARGA' ? 'TIM WARGA MENANG' : gameState.winner === 'JESTER' ? 'JESTER MENANG' : gameState.winner === 'LOVERS' ? 'LOVERS MENANG' : 'TIM WEREWOLF MENANG'}</h2></div>
      
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-8 shadow-2xl text-left">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Ringkasan Peran Akhir</h3>
        <div className="grid grid-cols-2 gap-3">
          {gameState.players.map(p => {
            const meta = ROLES[p.role]; const Icon = ROLE_ICONS[p.role] || User;
            return (
              <div key={p.id} className={`p-3 rounded-2xl border ${p.alive ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-950/40 border-slate-900/80 opacity-60'} flex flex-col items-center text-center space-y-1`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meta?.bg} border ${meta?.border}`}><Icon className={`w-5 h-5 ${meta?.color}`} /></div>
                <span className="font-bold text-white text-xs sm:text-sm block">{p.name}</span>
                <span className={`font-bold text-[10px] ${meta?.color}`}>{meta?.name}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${p.alive ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80' : 'bg-red-950/80 text-red-400 border-red-900/80'}`}>
                  {p.alive ? 'Hidup' : 'Mati'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <button onClick={handleRestartSamePlayers} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"><RefreshCw className="w-5 h-5" /><span>MAIN LAGI (PEMAIN SAMA)</span></button>
        <button onClick={handleNewGame} className="w-full py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700/80 transition">GAME BARU</button>
      </div>
    </div>
  );

  const renderCurrentPhase = () => {
    switch (gameState.currentPhase) {
      case 'HOME': return renderHome();
      case 'SETUP': return renderSetup();
      case 'ROLE_SUMMARY': return renderRoleSummary();
      case 'ROLE_REVEAL': return renderRoleReveal();
      case 'NIGHT_INTRO': return renderNightIntro();
      case 'NIGHT_CUPID': return renderNightCupid();
      case 'NIGHT_WEREWOLF': return renderNightWerewolf();
      case 'NIGHT_GUARDIAN': return renderNightGuardian();
      case 'NIGHT_SHERIFF': return renderNightSheriff();
      case 'NIGHT_DOPPELGANGER': return renderNightDoppelganger();
      case 'NIGHT_SEER': return renderNightSeer();
      case 'NIGHT_WITCH': return renderNightWitch();
      case 'HUNTER_REVENGE': return renderHunterRevenge();
      case 'DOPPELGANGER_REVEAL': return renderDoppelgangerReveal();
      case 'MORNING': return renderMorning();
      case 'DISCUSSION': return renderDiscussion();
      case 'VOTING': return renderVoting();
      case 'GAME_OVER': return renderGameOver();
      default: return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col relative overflow-x-hidden selection:bg-amber-500 selection:text-slate-950">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-900/15 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-950/15 blur-[120px] pointer-events-none -z-10 rounded-full" />

      {gameState.loverDeathNotice && gameState.loverDeathNotice.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-pink-600/80 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-2"><Heart className="w-10 h-10 text-pink-400 fill-current mx-auto" /><h3 className="text-2xl font-black text-pink-400">COUPLE TERPUTUS</h3></div>
            <div className="space-y-2">{gameState.loverDeathNotice.map(notice => <div key={notice.id} className="p-4 rounded-2xl bg-pink-950/60 border border-pink-800/80 text-center"><p className="text-base font-black text-white">{notice.name}</p><p className="text-xs text-pink-300 mt-1">ikut meninggal serentak karena <strong>{notice.partnerName}</strong> mati.</p></div>)}</div>
            <button onClick={() => setGameState(prev => ({ ...prev, loverDeathNotice: [] }))} className="w-full py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-black transition shadow-lg">MENGERTI</button>
          </div>
        </div>
      )}

      {gameState.currentPhase !== 'HOME' && gameState.currentPhase !== 'SETUP' && (
        <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-bold text-white shadow-sm">
                <Moon className="w-4 h-4 text-indigo-400" /><span>MALAM {gameState.nightNumber}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowRoleCheckModal(true)} className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-amber-400 transition" title="Cek Role Pemain">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={handleBackToHome} className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 transition" title="Menu Utama (game tersimpan)"><Home className="w-4 h-4" /></button>
              {gameState.undoStack && gameState.undoStack.length > 0 && <button onClick={handleUndo} className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-amber-400 transition" title="Undo"><CornerUpLeft className="w-4 h-4" /></button>}
              <button onClick={() => setShowGameLogDrawer(true)} className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 transition" title="Game Log"><History className="w-4 h-4" /></button>
              <button onClick={() => setShowRulesModal(true)} className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 transition" title="Aturan"><HelpCircle className="w-4 h-4" /></button>
            </div>
          </div>
        </header>
      )}

      {renderSmartAssistant()}
      
      <main key={`${gameState.currentPhase}-${gameState.nightNumber}-${gameState.dayNumber}`} className="flex-1 pb-8">
        {renderCurrentPhase()}
      </main>

      {showRoleCheckModal && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg max-h-[80vh] rounded-3xl flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base"><Eye className="w-5 h-5" /><span>Daftar Role Pemain (Moderator View)</span></div>
              <button onClick={() => setShowRoleCheckModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
              {gameState.players.map(p => {
                const meta = ROLES[p.role] || ROLES.WARGA;
                const Icon = ROLE_ICONS[p.role] || User;
                return (
                  <div key={p.id} className={`p-3 rounded-2xl border ${p.alive ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-950/30 border-slate-900 opacity-60'} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} border ${meta.border}`}><Icon className={`w-4 h-4 ${meta.color}`} /></div>
                      <div><h4 className="font-bold text-white text-sm">{p.name}</h4><span className={`text-[10px] font-black ${meta.color}`}>{meta.name}</span></div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${p.alive ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-red-950/80 text-red-400 border-red-900'}`}>{p.alive ? 'Hidup' : 'Mati'}</span>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-800 text-center">
              <button onClick={() => setShowRoleCheckModal(false)} className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg">TUTUP</button>
            </div>
          </div>
        </div>
      )}

      {showGameLogDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fadeIn">
          <div className="bg-slate-900/95 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800"><h3 className="text-lg font-black text-white flex items-center gap-2"><History className="w-5 h-5 text-blue-400" /><span>Catatan Permainan</span></h3><button onClick={() => setShowGameLogDrawer(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {gameState.gameLog.length === 0 ? <p className="text-center text-slate-500 text-xs py-8">Belum ada riwayat.</p> : gameState.gameLog.map(entry => <div key={entry.id} className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1 shadow-sm"><div className="flex items-center justify-between text-[10px] text-slate-400"><span className="font-bold text-amber-400">Malam {entry.nightNumber} / Hari {entry.dayNumber}</span><span>{entry.timestamp}</span></div><p className="text-xs text-slate-200 leading-relaxed">{entry.message}</p></div>)}
            </div>
          </div>
        </div>
      )}

      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl max-h-[85vh] rounded-3xl flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between"><div className="flex items-center gap-2 text-amber-400 font-bold text-base"><BookOpen className="w-5 h-5" /><span>Panduan Aturan Werewolf</span></div><button onClick={() => setShowRulesModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"><X className="w-5 h-5" /></button></div>
            <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-300">
              <section className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2"><h4 className="font-bold text-amber-300 text-sm flex items-center gap-2"><Crown className="w-4 h-4" /> Tujuan Permainan</h4><p>• <strong>Tim Warga:</strong> Eliminasi seluruh role Evil.</p><p>• <strong>Tim Werewolf:</strong> Menang jika jumlah Werewolf lebih banyak atau sama dengan dari jumlah pemain non-Evil.</p><p>• <strong>Lovers beda tim:</strong> Jika pasangan Lovers terdiri dari Werewolf dan non-Werewolf, mereka menang bersama bila hanya mereka berdua yang tersisa.</p></section>
              <section className="space-y-2.5"><h4 className="font-bold text-white text-sm">Aturan Peran</h4>{Object.entries(ROLES).map(([key, role]) => { const Icon = ROLE_ICONS[key] || User; return <div key={key} className={`p-3 rounded-2xl border ${role.border} ${role.bg} flex items-start gap-3 shadow-md`}><Icon className={`w-6 h-6 ${role.color} mt-1`} /><div><span className={`font-black ${role.color}`}>{role.name} ({role.team})</span><p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{role.desc}</p></div></div>; })}</section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
