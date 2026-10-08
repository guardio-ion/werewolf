import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Home, Lock, Unlock, Crosshair, Moon, Sun, Eye, EyeOff, FlaskConical,
  Heart, Skull, Users, Flame, RotateCcw, History, BookOpen, X, AlertTriangle,
  Crown, Play, Pause, HelpCircle, UserCheck, Sparkles, ArrowRight, CornerUpLeft,
  Info, Check, RefreshCw, Award, StickyNote, User, PawPrint, Swords, Star, 
  MessageSquare, CheckSquare, Masks
} from 'lucide-react';

// IMPORT DARI FILE YANG SUDAH DIPECAH
import { ROLES, ROLE_KEYS } from './constants/roles';
import { GAME_PRESETS, PARTICIPANT_LIST } from './constants/presets';
import { 
  LOCAL_STORAGE_KEY, GAME_STATE_VERSION, 
  isWolfAligned, getEffectiveTeam, normalizePlayer, loadSavedGame, 
  shuffle, createInitialGameState, addLog, pushUndoState 
} from './utils/gameLogic';

// Mapping Ikon Profesional (Tanpa Emote)
const ROLE_ICONS = {
  WARGA: User, WEREWOLF: PawPrint, LYCAN: Moon, SEER: Eye, GUARDIAN: Shield,
  CUPID: Heart, MAYOR: Crown, SHERIFF: Star, HUNTER: Crosshair, TRAITOR: Swords,
  WOLF_CUB: PawPrint, WITCH: FlaskConical, JESTER: Sparkles, DOPPELGANGER: Masks
};

export default function App() {
  const [gameState, setGameState] = useState(() => {
    try {
      const parsed = loadSavedGame();
      if (parsed) return { ...createInitialGameState(), ...parsed, stateVersion: GAME_STATE_VERSION, players: parsed.players.map(normalizePlayer) };
    } catch (e) { console.error("Gagal memuat state:", e); }
    return createInitialGameState();
  });

  // UI States
  const [showGameLogDrawer, setShowGameLogDrawer] = useState(false);
  const [showDashboardDrawer, setShowDashboardDrawer] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [inputPlayerNames, setInputPlayerNames] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [participantSearch, setParticipantSearch] = useState('');
  const [roleCountsDraft, setRoleCountsDraft] = useState({});
  const [privacyMode, setPrivacyMode] = useState(false);
  const [modNotes, setModNotes] = useState(() => localStorage.getItem('werewolf_mod_notes') || '');
  const discussionTransitionLock = useRef(false);
  const [remainingSeconds, setRemainingSeconds] = useState(300);

  // EFFECTS
  useEffect(() => {
    if (Object.keys(roleCountsDraft).length === 0 && playerCount > 0) {
      setRoleCountsDraft({ WARGA: Math.max(0, playerCount - 4), WEREWOLF: 1, GUARDIAN: 1, SEER: 1, WITCH: 1 });
    }
  }, [playerCount]);

  useEffect(() => {
    try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...gameState, stateVersion: GAME_STATE_VERSION })); } catch (e) {}
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem('werewolf_mod_notes', modNotes);
  }, [modNotes]);

  useEffect(() => {
    if (gameState.currentPhase === 'DISCUSSION') discussionTransitionLock.current = false;
  }, [gameState.currentPhase]);

  useEffect(() => {
    if (gameState.currentPhase !== 'DISCUSSION') return;
    if (gameState.isTimerPaused && gameState.pausedRemainingSeconds !== null) { setRemainingSeconds(gameState.pausedRemainingSeconds); return; }
    if (!gameState.discussionEndTimestamp) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((gameState.discussionEndTimestamp - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff <= 0) { clearInterval(interval); triggerAutoTransitionToVoting(); }
    }, 500);
    return () => clearInterval(interval);
  }, [gameState.currentPhase, gameState.discussionEndTimestamp, gameState.isTimerPaused, gameState.pausedRemainingSeconds]);

  // HANDLERS
  function triggerAutoTransitionToVoting() {
    if (discussionTransitionLock.current) return;
    discussionTransitionLock.current = true;
    setGameState(prev => {
      if (prev.currentPhase !== 'DISCUSSION') return prev;
      return { ...prev, currentPhase: 'VOTING', currentVoterIndex: 0, votes: {}, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', 'Waktu diskusi berakhir. Memulai sesi voting.') };
    });
  }

  const getLivingTargets = (state, kind) => {
    const players = state.players || [];
    switch (kind) {
      case 'WEREWOLF': return players.filter(p => p.alive && !isWolfAligned(p));
      case 'GUARDIAN': return players.filter(p => p.alive && !p.protectedLastNight);
      case 'SHERIFF': { const sheriff = players.find(p => p.role === 'SHERIFF' && p.alive); return players.filter(p => p.alive && p.id !== sheriff?.id); }
      case 'DOPPELGANGER': { const dg = players.find(p => p.alive && p.role === 'DOPPELGANGER'); return players.filter(p => p.alive && p.id !== dg?.id); }
      case 'SEER': { const seer = players.find(p => p.role === 'SEER' && p.alive); return players.filter(p => p.alive && p.id !== seer?.id); }
      case 'HUNTER': return players.filter(p => p.alive);
      case 'WITCH':
      default: return players.filter(p => p.alive);
    }
  };

  const validateTarget = (state, kind, targetId) => {
    if (!targetId) return { valid: false };
    const target = state.players.find(p => p.id === targetId);
    if (!target || !target.alive) return { valid: false };
    if (!getLivingTargets(state, kind).some(p => p.id === targetId)) return { valid: false };
    return { valid: true };
  };

  const advanceNightPhase = (overrides = {}, options = {}) => {
    setGameState(prev => {
      if (prev.currentPhase === 'GAME_OVER') return prev;
      const state = { ...prev, ...overrides };
      const canContinueFrom = (...phases) => phases.includes(state.currentPhase);
      const commit = options.recordUndo ? { ...state, undoStack: pushUndoState(prev) } : state;

      if (state.nightNumber === 1 && state.players.some(p => p.role === 'CUPID' && p.alive) && !state.cupidUsed && !state.nightSkips?.CUPID && state.currentPhase === 'NIGHT_INTRO') {
        return { ...commit, currentPhase: 'NIGHT_CUPID' };
      }
      const doppel = state.players.find(p => p.role === 'DOPPELGANGER' && p.alive && !p.doppelgangerCopied);
      const doppelTargets = getLivingTargets(state, 'DOPPELGANGER');
      if (doppel && state.nightNumber === 1 && !state.doppelgangerTargetId && !state.nightSkips?.DOPPELGANGER && doppelTargets.length > 0 && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_SHERIFF')) {
        return { ...commit, currentPhase: 'NIGHT_DOPPELGANGER' };
      }
      const livingWerewolves = state.players.filter(p => isWolfAligned(p) && p.alive);
      const wolfTargets = getLivingTargets(state, 'WEREWOLF');
      if (livingWerewolves.length > 0 && wolfTargets.length > 0 && !state.werewolfTargetIds?.length && !state.nightSkips?.WEREWOLF && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF')) {
        return { ...commit, currentPhase: 'NIGHT_WEREWOLF' };
      }
      const guardian = state.players.find(p => p.role === 'GUARDIAN' && p.alive);
      const guardianTargets = getLivingTargets(state, 'GUARDIAN');
      if (guardian && guardianTargets.length > 0 && !state.guardianTargetId && !state.nightSkips?.GUARDIAN && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN')) {
        return { ...commit, currentPhase: 'NIGHT_GUARDIAN' };
      }
      const sheriff = state.players.find(p => p.role === 'SHERIFF' && p.alive);
      const sheriffTargets = getLivingTargets(state, 'SHERIFF');
      if (sheriff && state.nightNumber > 1 && !state.sheriffResolved && !state.nightSkips?.SHERIFF && sheriffTargets.length > 0 && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN')) {
        return { ...commit, currentPhase: 'NIGHT_SHERIFF' };
      }
      const seer = state.players.find(p => p.role === 'SEER' && p.alive);
      const seerTargets = getLivingTargets(state, 'SEER');
      if (seer && seerTargets.length > 0 && !state.seerTargetId && !state.nightSkips?.SEER && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_SHERIFF', 'NIGHT_DOPPELGANGER', 'NIGHT_SEER')) {
        return { ...commit, currentPhase: 'NIGHT_SEER' };
      }
      const witch = state.players.find(p => p.role === 'WITCH' && p.alive);
      const witchTargets = getLivingTargets(state, 'WITCH');
      const witchCanKill = state.nightNumber > 1; 
      if (witch && witchTargets.length > 0 && !state.nightSkips?.WITCH && (!state.witchHealUsed || (!state.witchKillUsed && witchCanKill)) && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_SHERIFF', 'NIGHT_DOPPELGANGER', 'NIGHT_SEER')) {
        return { ...commit, currentPhase: 'NIGHT_WITCH' };
      }
      return resolveNightActions(commit);
    });
  };

  function resolveNightActions(state) {
    let updatedPlayers = state.players.map(p => ({ ...p }));
    let log = [...state.gameLog];
    const night = state.nightNumber, day = state.dayNumber;
    const directDeaths = [];
    const protectedByTown = new Set([state.guardianTargetId].filter(Boolean));

    const wolfTargets = Array.from(new Set([...(state.werewolfTargetIds || []), state.werewolfTargetId].filter(Boolean)));
    wolfTargets.forEach(targetId => {
      const victimName = updatedPlayers.find(p => p.id === targetId)?.name;
      if (!victimName) return;
      if (protectedByTown.has(targetId)) { log = addLog(log, night, day, 'INFO', `Serangan Werewolf pada ${victimName} berhasil dicegah Guardian.`); } 
      else if (state.witchHealUsedThisNight && state.witchHealTargetId === targetId) { log = addLog(log, night, day, 'INFO', `Heal Potion Witch berhasil menyelamatkan korban Werewolf.`); } 
      else { directDeaths.push({ id: targetId, reason: 'WEREWOLF' }); }
    });

    if (state.sheriffTargetId) {
      const sheriff = updatedPlayers.find(p => p.role === 'SHERIFF' && p.alive);
      const target = updatedPlayers.find(p => p.id === state.sheriffTargetId && p.alive);
      if (sheriff && target) {
        if (isWolfAligned(target)) { directDeaths.push({ id: target.id, reason: 'SHERIFF' }); log = addLog(log, night, day, 'ACTION', `Sheriff berhasil menemukan Werewolf: ${target.name}.`); } 
        else { directDeaths.push({ id: sheriff.id, reason: 'SHERIFF_MISS' }); log = addLog(log, night, day, 'ACTION', `Sheriff salah memilih target dan tereliminasi.`); }
      }
    }

    if (state.witchKillTargetId) {
      directDeaths.push({ id: state.witchKillTargetId, reason: 'WITCH' });
      log = addLog(log, night, day, 'ACTION', `Witch menggunakan Kill Potion.`);
    }

    const newDeathsMap = new Map();
    directDeaths.forEach(d => newDeathsMap.set(d.id, d.reason));
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
          log = addLog(log, night, day, 'DEATH', `${partner.name} ikut tereliminasi karena pasangan ${deadPlayer.name} tereliminasi.`);
          changed = true;
        }
      }
    }

    const nightDeathsList = [];
    newDeathsMap.forEach((reason, deadId) => {
      const idx = updatedPlayers.findIndex(p => p.id === deadId);
      if (idx === -1) return;
      updatedPlayers[idx].alive = false; updatedPlayers[idx].deathReason = reason; updatedPlayers[idx].deathNight = night;
      nightDeathsList.push({ player: updatedPlayers[idx], reason });
      log = addLog(log, night, day, 'DEATH', `${updatedPlayers[idx].name} tereliminasi.`);
    });

    updatedPlayers = updatedPlayers.map(p => ({ ...p, protectedLastNight: p.id === state.guardianTargetId, protectedThisNight: false }));
    let doppelgangerRoleChangeNotice = null;
    ({ players: updatedPlayers, log, notice: doppelgangerRoleChangeNotice } = applyDoppelgangerRoleIfTargetDead(updatedPlayers, log, night, day, state.doppelgangerTargetId));

    let tempState = {
      ...state, players: updatedPlayers, gameLog: log, lastNightDeaths: nightDeathsList,
      wolfCubRagePending: state.wolfCubRagePending || nightDeathsList.some(d => d.player.role === 'WOLF_CUB'),
      hunterPending: nightDeathsList.some(d => d.player.role === 'HUNTER' && !d.player.hunterRevengeUsed), loverDeathNotice, doppelgangerRoleChangeNotice,
      werewolfTargetId: null, werewolfTargetIds: [], guardianTargetId: null, sheriffTargetId: null, seerTargetId: null, seerResult: null,
      witchHealUsedThisNight: false, witchHealTargetId: null, witchKillTargetId: null, hunterTargetId: null, nightSkips: {},
    };

    if (doppelgangerRoleChangeNotice) tempState = resetDoppelgangerAbilityState(tempState, doppelgangerRoleChangeNotice.newRole);
    tempState = activateTraitorIfNeeded(tempState);
    log = tempState.gameLog;
    const winResult = checkWinConditions(tempState);

    if (!winResult && tempState.hunterPending) return { ...tempState, currentPhase: 'HUNTER_REVENGE', gameLog: log };
    if (winResult) log = addLog(log, night, day, 'WIN', winResult === 'WARGA' ? 'Kemenangan Tim WARGA!' : winResult === 'WEREWOLF' ? 'Kemenangan Tim WEREWOLF!' : 'JESTER memenangkan permainan!');

    if (doppelgangerRoleChangeNotice) {
      return { ...tempState, currentPhase: 'DOPPELGANGER_REVEAL', doppelgangerRevealNextPhase: winResult ? 'GAME_OVER' : 'MORNING', doppelgangerRevealWinner: winResult || null, winner: winResult || null, gameLog: log };
    }
    if (winResult) return { ...tempState, currentPhase: 'GAME_OVER', winner: winResult, gameLog: log };
    return { ...tempState, currentPhase: 'MORNING', gameLog: log };
  }

  function activateTraitorIfNeeded(state) {
    const livingWolves = state.players.filter(p => p.alive && isWolfAligned(p));
    const traitors = state.players.filter(p => p.alive && p.role === 'TRAITOR');
    if (livingWolves.length > 0 || traitors.length === 0) return state;
    const players = state.players.map(p => p.alive && p.role === 'TRAITOR' ? { ...p, convertedToWerewolf: true } : p);
    return { ...state, players, gameLog: addLog(state.gameLog, state.nightNumber, state.dayNumber, 'ROLE', `Traitor bangkit! ${traitors.map(t => t.name).join(', ')} berubah menjadi Werewolf.`) };
  }

  function checkWinConditions(state) {
    const living = state.players.filter(p => p.alive);
    const livingEvil = living.filter(isWolfAligned);
    const livingGood = living.filter(p => !isWolfAligned(p) && p.role !== 'JESTER');
    if (livingEvil.length === 0) return 'WARGA';
    if (livingEvil.length >= livingGood.length) return 'WEREWOLF';
    return null;
  }

  const handleSeerInspect = (targetId) => {
    const validation = validateTarget(gameState, 'SEER', targetId);
    if (!validation.valid) return;
    const target = gameState.players.find(p => p.id === targetId);
    if (!target) return;
    let displayedRole = target.role, isLycanNote = false;
    if (target.role === 'LYCAN') { displayedRole = 'WEREWOLF'; isLycanNote = true; }
    setGameState(prev => ({ ...prev, seerTargetId: targetId, seerResult: { targetName: target.name, displayedRole, isLycanNote }, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Seer meramal ${target.name}.`) }));
  };

  const handleConfirmCupid = () => {
    const { cupidLover1Id, cupidLover2Id, players, nightNumber, dayNumber } = gameState;
    if (!cupidLover1Id || !cupidLover2Id || cupidLover1Id === cupidLover2Id) return;
    const p1 = players.find(p => p.id === cupidLover1Id), p2 = players.find(p => p.id === cupidLover2Id);
    if (!p1?.alive || !p2?.alive) return;
    const updatedPlayers = players.map(p => p.id === cupidLover1Id ? { ...p, loverId: cupidLover2Id } : p.id === cupidLover2Id ? { ...p, loverId: cupidLover1Id } : p);
    advanceNightPhase({ players: updatedPlayers, cupidUsed: true, gameLog: addLog(gameState.gameLog, nightNumber, dayNumber, 'ACTION', `Cupid memilih ${p1.name} & ${p2.name}.`) }, { recordUndo: true });
  };

  const handleConfirmDoppelganger = () => {
    const targetId = gameState.doppelgangerTargetId;
    const validation = validateTarget(gameState, 'DOPPELGANGER', targetId);
    if (!validation.valid) return;
    const target = gameState.players.find(p => p.id === targetId);
    advanceNightPhase({ doppelgangerTargetId: targetId, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', `Doppelganger memilih ${target.name}.`) }, { recordUndo: true });
  };

  const handleConfirmSheriff = () => {
    const validation = validateTarget(gameState, 'SHERIFF', gameState.sheriffTargetId);
    if (!validation.valid) return;
    advanceNightPhase({ sheriffResolved: true, sheriffUsed: true, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', 'Sheriff menggunakan kemampuan.') }, { recordUndo: true });
  };

  const handleSkipSheriff = () => {
    advanceNightPhase({ sheriffResolved: false, sheriffUsed: false, sheriffTargetId: null, sheriffSkippedNights: [...(gameState.sheriffSkippedNights || []), gameState.nightNumber], gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'INFO', `Sheriff SKIP malam ini.`) }, { recordUndo: true });
  };

  const handleConfirmWerewolf = (selectedIds) => {
    const required = gameState.wolfCubRagePending ? 2 : 1;
    if (!selectedIds || selectedIds.length !== required) return;
    advanceNightPhase({ werewolfTargetIds: [...selectedIds], werewolfTargetId: selectedIds[0] || null, wolfCubRagePending: false, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', `Werewolf mengunci target.`) }, { recordUndo: true });
  };

  const handleConfirmGuardian = () => {
    const validation = validateTarget(gameState, 'GUARDIAN', gameState.guardianTargetId);
    if (!validation.valid) return;
    advanceNightPhase({ guardianTargetId: gameState.guardianTargetId, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', 'Guardian mengunci target.') }, { recordUndo: true });
  };

  const handleFinishWitch = () => {
    let nextState = { witchHealUsed: gameState.witchHealUsed || !!gameState.witchHealTargetId, witchKillUsed: gameState.witchKillUsed || !!gameState.witchKillTargetId };
    advanceNightPhase({ ...nextState, nightSkips: { ...(gameState.nightSkips || {}), WITCH: true } }, { recordUndo: true });
  };

  const handleSkipNightAction = (roleKey, message) => {
    const cleared = { nightSkips: { ...(gameState.nightSkips || {}), [roleKey]: true }, gameLog: addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'INFO', message) };
    switch (roleKey) {
      case 'CUPID': cleared.cupidLover1Id = null; cleared.cupidLover2Id = null; break;
      case 'WEREWOLF': cleared.werewolfTargetId = null; cleared.werewolfTargetIds = []; break;
      case 'GUARDIAN': cleared.guardianTargetId = null; break;
      case 'DOPPELGANGER': cleared.doppelgangerTargetId = null; break;
      case 'SEER': cleared.seerTargetId = null; cleared.seerResult = null; break;
      case 'WITCH': cleared.witchHealTargetId = null; cleared.witchKillTargetId = null; cleared.witchHealUsedThisNight = false; break;
    }
    advanceNightPhase(cleared, { recordUndo: true });
  };

  const handleHunterRevenge = (targetId) => {
    setGameState(prev => {
      const hunter = prev.players.find(p => p.role === 'HUNTER' && !p.alive && !p.hunterRevengeUsed);
      const target = prev.players.find(p => p.id === targetId && p.alive && p.id !== hunter?.id);
      if (!hunter || !target) return prev;
      const updatedPlayers = prev.players.map(p => p.id === target.id ? { ...p, alive: false, deathReason: 'HUNTER', deathDay: prev.dayNumber, deathNight: prev.nightNumber } : p).map(p => p.id === hunter.id ? { ...p, hunterRevengeUsed: true } : p);
      let tempState = { ...prev, players: updatedPlayers, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'DEATH', `Hunter membalas dengan mengeliminasi ${target.name}.`), hunterPending: false, hunterTargetId: null, wolfCubRagePending: prev.wolfCubRagePending || target.role === 'WOLF_CUB' };
      tempState = activateTraitorIfNeeded(tempState);
      const winner = checkWinConditions(tempState);
      if (winner) return { ...tempState, currentPhase: 'GAME_OVER', winner };
      if (prev.lastNightDeaths && prev.lastNightDeaths.length > 0) return { ...tempState, currentPhase: 'MORNING' };
      return { ...tempState, currentPhase: 'NIGHT_INTRO', nightNumber: prev.nightNumber + 1, dayNumber: prev.dayNumber + 1, votes: {}, currentVoterIndex: 0 };
    });
  };

  const handleMayorReveal = () => {
    const mayor = gameState.players.find(p => p.role === 'MAYOR' && p.alive);
    if (!mayor || gameState.mayorRevealed) return;
    setGameState(prev => ({ ...prev, mayorRevealed: true, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Mayor ${mayor.name} mengungkap identitas. Suaranya bernilai 2.`) }));
  };

  const handleVoteSubmit = (voterId, targetId = null) => {
    if (gameState.currentPhase !== 'VOTING') return;
    const voter = gameState.players.find(p => p.id === voterId);
    if (!voter?.alive || Object.prototype.hasOwnProperty.call(gameState.votes, voterId)) return;
    if (targetId) {
      const target = gameState.players.find(p => p.id === targetId);
      if (!target?.alive || target.id === voterId) return;
    }
    setGameState(prev => {
      if (prev.currentPhase !== 'VOTING' || Object.prototype.hasOwnProperty.call(prev.votes, voterId)) return prev;
      const newVotes = { ...prev.votes, [voterId]: targetId };
      return { ...prev, undoStack: pushUndoState(prev), votes: newVotes, currentVoterIndex: prev.currentVoterIndex + 1, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', targetId ? `${voter.name} memberikan suara.` : `${voter.name} memilih SKIP VOTE.`) };
    });
  };

  const resetDoppelgangerAbilityState = (state, copiedRole) => {
    const next = { ...state };
    switch (copiedRole) {
      case 'SHERIFF': next.sheriffUsed = false; next.sheriffTargetId = null; break;
      case 'MAYOR': next.mayorRevealed = false; break;
      case 'WITCH': next.witchHealUsed = false; next.witchKillUsed = false; next.witchHealUsedThisNight = false; next.witchHealTargetId = null; next.witchKillTargetId = null; break;
      case 'CUPID': next.cupidUsed = false; next.cupidLover1Id = null; next.cupidLover2Id = null; break;
    }
    return next;
  };

  const applyDoppelgangerRoleIfTargetDead = (players, log, nightNumber, dayNumber, targetId = null) => {
    const doppel = players.find(p => p.role === 'DOPPELGANGER' && p.alive && !p.doppelgangerCopied);
    if (!doppel || !targetId) return { players, log, notice: null };
    const target = players.find(p => p.id === targetId);
    if (!target || target.alive) return { players, log, notice: null };
    const idx = players.findIndex(p => p.id === doppel.id);
    if (idx === -1) return { players, log, notice: null };
    const copiedRole = target.role;
    const updatedPlayers = [...players];
    updatedPlayers[idx] = { ...updatedPlayers[idx], role: copiedRole, team: getEffectiveTeam({ role: copiedRole, convertedToWerewolf: copiedRole === 'WEREWOLF' || copiedRole === 'WOLF_CUB' }), doppelgangerCopied: true };
    return { players: updatedPlayers, log: addLog(log, nightNumber, dayNumber, 'ACTION', `Doppelganger ${doppel.name} menggantikan role ${target.name} dan menjadi ${ROLES[copiedRole]?.name}.`), notice: { playerName: doppel.name, targetName: target.name, oldRole: doppel.role, newRole: copiedRole } };
  };

  const resolveVotingResults = () => {
    let log = [...gameState.gameLog];
    const { votes, players, nightNumber, dayNumber } = gameState;
    const voteCounts = {};
    let validVoteCount = 0;
    Object.entries(votes).forEach(([voterId, targetId]) => {
      const voter = players.find(p => p.id === voterId && p.alive);
      const target = targetId ? players.find(p => p.id === targetId && p.alive) : null;
      if (!voter || !target || target.id === voter.id) return;
      validVoteCount += 1;
      const weight = voter.role === 'MAYOR' && gameState.mayorRevealed ? 2 : 1;
      voteCounts[targetId] = (voteCounts[targetId] || 0) + weight;
    });

    let maxVotes = 0;
    Object.values(voteCounts).forEach(cnt => { if (cnt > maxVotes) maxVotes = cnt; });
    const topCandidates = maxVotes > 0 ? Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes) : [];
    const allVotesSkipped = validVoteCount === 0;

    let updatedPlayers = players.map(p => ({ ...p }));
    let dayDeaths = [], loverDeathNotice = [], doppelgangerRoleChangeNotice = null;

    if (topCandidates.length === 1 && maxVotes > 0) {
      const eliminatedId = topCandidates[0];
      const eliminatedPlayer = updatedPlayers.find(p => p.id === eliminatedId);
      log = addLog(log, nightNumber, dayNumber, 'ACTION', `${eliminatedPlayer.name} tereliminasi (${maxVotes} suara).`);
      let newDeathsMap = new Map();
      newDeathsMap.set(eliminatedId, 'VOTE');
      let resolved = false;
      while (!resolved) {
        resolved = true;
        Array.from(newDeathsMap.keys()).forEach(deadId => {
          const deadPlayer = updatedPlayers.find(p => p.id === deadId);
          if (deadPlayer && deadPlayer.loverId) {
            const partner = updatedPlayers.find(p => p.id === deadPlayer.loverId);
            if (partner && partner.alive && !newDeathsMap.has(partner.id)) {
              newDeathsMap.set(partner.id, 'LOVER');
              loverDeathNotice.push({ id: `lover_${partner.id}_${nightNumber}_${dayNumber}`, name: partner.name, partnerName: deadPlayer.name });
              resolved = false;
            }
          }
        });
      }
      newDeathsMap.forEach((reason, deadId) => {
        const idx = updatedPlayers.findIndex(p => p.id === deadId);
        if (idx !== -1) { updatedPlayers[idx].alive = false; updatedPlayers[idx].deathReason = reason; updatedPlayers[idx].deathDay = dayNumber; dayDeaths.push({ player: updatedPlayers[idx], reason }); }
      });
      ({ players: updatedPlayers, log, notice: doppelgangerRoleChangeNotice } = applyDoppelgangerRoleIfTargetDead(updatedPlayers, log, nightNumber, dayNumber, gameState.doppelgangerTargetId));

      if (eliminatedPlayer?.role === 'JESTER') {
        log = addLog(log, nightNumber, dayNumber, 'WIN', `Jester ${eliminatedPlayer.name} menang!`);
        setGameState({ ...gameState, players: updatedPlayers, gameLog: log, lastDayDeaths: dayDeaths, loverDeathNotice, doppelgangerRoleChangeNotice, currentPhase: 'GAME_OVER', winner: 'JESTER' });
        return;
      }
    } else if (allVotesSkipped) log = addLog(log, nightNumber, dayNumber, 'INFO', `Semua pemain SKIP VOTE.`);
    else log = addLog(log, nightNumber, dayNumber, 'INFO', `Hasil voting seri!`);

    let tempState = { ...gameState, players: updatedPlayers, gameLog: log, lastDayDeaths: dayDeaths, loverDeathNotice, doppelgangerRoleChangeNotice, wolfCubRagePending: gameState.wolfCubRagePending || dayDeaths.some(d => d.player.role === 'WOLF_CUB'), hunterPending: dayDeaths.some(d => d.player.role === 'HUNTER' && !d.player.hunterRevengeUsed) };
    tempState = activateTraitorIfNeeded(tempState); log = tempState.gameLog;
    if (doppelgangerRoleChangeNotice) tempState = resetDoppelgangerAbilityState(tempState, doppelgangerRoleChangeNotice.newRole);
    const winResult = checkWinConditions(tempState);
    if (winResult) log = addLog(log, nightNumber, dayNumber, 'WIN', winResult === 'WARGA' ? 'Kemenangan Tim WARGA!' : 'Kemenangan Tim WEREWOLF!');

    if (tempState.hunterPending && !winResult) setGameState({ ...tempState, currentPhase: 'HUNTER_REVENGE', gameLog: log });
    else if (winResult) setGameState({ ...tempState, currentPhase: 'GAME_OVER', winner: winResult, gameLog: log });
    else setGameState({ ...tempState, currentPhase: 'NIGHT_INTRO', nightNumber: nightNumber + 1, dayNumber: dayNumber + 1, votes: {}, currentVoterIndex: 0, discussionEndTimestamp: null, gameLog: addLog(log, nightNumber + 1, dayNumber + 1, 'INFO', `Memulai Malam ${nightNumber + 1}.`) });
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
    const roleList = Object.entries(gameState.roleCounts || {}).flatMap(([role, count]) => Array(Number(count)).fill(role));
    const shuffledRoles = shuffle(roleList);
    const newPlayers = playerNames.map((name, idx) => ({ id: 'player_' + (idx + 1) + '_' + Date.now(), name, role: shuffledRoles[idx], alive: true, loverId: null, protectedLastNight: false, protectedThisNight: false, deathReason: null, deathNight: null, deathDay: null, hunterRevengeUsed: false, convertedToWerewolf: false }));
    setGameState({ ...createInitialGameState(), players: newPlayers, currentPhase: 'ROLE_SUMMARY', gameLog: addLog([], 1, 1, 'INFO', `Game diulang.`) });
  };

  const handleBackToHome = () => { localStorage.removeItem(LOCAL_STORAGE_KEY); setGameState(createInitialGameState()); };
  const handleNewGame = () => { localStorage.removeItem(LOCAL_STORAGE_KEY); setGameState(createInitialGameState()); };

  // RENDER SECTIONS
  const formatTime = (totalSec) => `${Math.floor(totalSec / 60).toString().padStart(2, '0')}:${(totalSec % 60).toString().padStart(2, '0')}`;

  const renderSmartAssistant = () => {
    if (gameState.currentPhase === 'HOME' || gameState.currentPhase === 'SETUP') return null;
    const living = gameState.players.filter(p => p.alive);
    const configs = {
      ROLE_SUMMARY: ['ROLE SETUP', 'Komposisi role siap.', 'NEXT: Bagikan role.'],
      ROLE_REVEAL: ['ROLE REVEAL', `Membuka role ${Math.min(gameState.revealPlayerIndex + 1, gameState.players.length)}/${gameState.players.length}.`, 'NEXT: Sembunyikan & lanjut.'],
      NIGHT_INTRO: [`MALAM ${gameState.nightNumber}`, 'Semua pemain tutup mata.', 'NEXT: Mulai aksi malam.'],
      MORNING: [`PAGI ${gameState.dayNumber}`, `${gameState.lastNightDeaths.length} pemain tereliminasi.`, 'NEXT: Masuk diskusi.'],
      DISCUSSION: ['DISKUSI', gameState.discussionEndTimestamp ? `Timer ${formatTime(remainingSeconds)} tersisa.` : 'Timer belum dimulai.', 'NEXT: Selesaikan untuk voting.'],
      VOTING: ['VOTING', `${Object.keys(gameState.votes || {}).length}/${living.length} suara tercatat.`, 'NEXT: Proses hasil voting.'],
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
          {gameState.players.length > 0 && gameState.currentPhase !== 'HOME' && (
            <button onClick={() => setGameState(prev => ({ ...prev, currentPhase: 'NIGHT_INTRO' }))} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition">
              <Play className="w-5 h-5 fill-current" /><span>LANJUTKAN GAME (Malam {gameState.nightNumber})</span>
            </button>
          )}
          <button onClick={() => { localStorage.removeItem(LOCAL_STORAGE_KEY); setGameState({ ...createInitialGameState(), currentPhase: 'SETUP' }); }} className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-amber-700 hover:opacity-95 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition">
            <Sparkles className="w-5 h-5" /><span>MULAI GAME BARU</span>
          </button>
          <button onClick={() => setShowRulesModal(true)} className="w-full py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition">
            <BookOpen className="w-4 h-4 text-amber-400" /><span>ATURAN PERMAINAN</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSetup = () => (
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
          <button onClick={() => { const all = PARTICIPANT_LIST.slice(0, 25); setInputPlayerNames(all); setPlayerCount(all.length); setRoleCountsDraft({ WARGA: 21, WEREWOLF: 1, GUARDIAN: 1, SEER: 1, WITCH: 1 }); }} className="px-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black whitespace-nowrap">PILIH SEMUA</button>
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
        }} className="w-2/3 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition">
          <Sparkles className="w-5 h-5" /><span>ACAK ROLE</span>
        </button>
      </div>
    </div>
  );

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
      <div className="space-y-4 pt-8"><div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-950/90 border border-indigo-700/60 text-indigo-400 shadow-2xl"><Moon className="w-10 h-10 animate-pulse" /></div><h2 className="text-3xl font-black text-white tracking-wide">MALAM {gameState.nightNumber}</h2><p className="text-base sm:text-lg italic text-amber-200 font-serif">"Semua pemain, silakan tutup mata. Malam telah tiba."</p></div>
      <button onClick={() => advanceNightPhase()} className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>MULAI AKSI MALAM</span><ArrowRight className="w-5 h-5" /></button>
    </div>
  );

  const renderNightCupid = () => (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-pink-950/90 border border-pink-700/60 text-pink-400 shadow-lg"><Heart className="w-8 h-8 fill-current" /></div><h2 className="text-2xl font-black text-pink-400">CUPID</h2><p className="text-xs sm:text-sm text-slate-300">Pilih dua pemain hidup untuk terikat menjadi Lovers.</p></div>
      <div className="bg-slate-900/90 border border-pink-900/50 rounded-3xl p-4 text-center space-y-2 shadow-xl"><span className="text-[10px] font-black text-pink-300 uppercase tracking-widest">Pasangan Terpilih:</span><div className="flex items-center justify-center gap-3 text-lg font-black text-white"><span className={gameState.cupidLover1Id ? 'text-pink-400' : 'text-slate-600'}>{gameState.players.find(p => p.id === gameState.cupidLover1Id)?.name || '[ Pemain 1 ]'}</span><Heart className="w-5 h-5 text-pink-500 fill-current" /><span className={gameState.cupidLover2Id ? 'text-pink-400' : 'text-slate-600'}>{gameState.players.find(p => p.id === gameState.cupidLover2Id)?.name || '[ Pemain 2 ]'}</span></div></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
        {gameState.players.filter(p => p.alive).map(player => {
          const isSelected = gameState.cupidLover1Id === player.id || gameState.cupidLover2Id === player.id;
          return <button key={player.id} onClick={() => setGameState(prev => { if (prev.cupidLover1Id === player.id) return { ...prev, cupidLover1Id: null }; if (prev.cupidLover2Id === player.id) return { ...prev, cupidLover2Id: null }; if (!prev.cupidLover1Id) return { ...prev, cupidLover1Id: player.id }; if (!prev.cupidLover2Id) return { ...prev, cupidLover2Id: player.id }; return { ...prev, cupidLover2Id: player.id }; })} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition flex items-center justify-between ${isSelected ? 'bg-pink-950/80 border-pink-500 text-pink-200' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}><span className="truncate">{player.name}</span>{isSelected && <Heart className="w-4 h-4 text-pink-400 fill-current shrink-0" />}</button>;
        })}
      </div>
      <button onClick={() => handleSkipNightAction('CUPID', 'Cupid memilih SKIP.')} className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-black text-xs transition">SKIP CUPID</button>
      <div className="flex gap-3 pt-2"><button onClick={() => setGameState(prev => ({ ...prev, cupidLover1Id: null, cupidLover2Id: null }))} className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-sm transition">Reset</button><button onClick={handleConfirmCupid} className="w-2/3 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-black text-sm shadow-xl transition">KONFIRMASI PASANGAN</button></div>
    </div>
  );

  const renderNightWerewolf = () => {
    const livingCandidates = gameState.players.filter(p => p.alive && !isWolfAligned(p));
    const rage = gameState.wolfCubRagePending;
    const selectedIds = gameState.werewolfTargetIds || (gameState.werewolfTargetId ? [gameState.werewolfTargetId] : []);
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950/90 border border-red-700/60 text-red-400 shadow-lg"><PawPrint className="w-8 h-8" /></div><h2 className="text-2xl font-black text-red-400">WEREWOLF PHASE</h2><p className="text-xs sm:text-sm text-slate-300">Pilih {rage ? '2 pemain' : '1 pemain'} untuk dieliminasi.</p></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
          {livingCandidates.map(player => { const isSelected = selectedIds.includes(player.id); return <button key={player.id} onClick={() => setGameState(prev => { const current = prev.werewolfTargetIds || []; if (rage) { const next = current.includes(player.id) ? current.filter(x => x !== player.id) : current.length < 2 ? [...current, player.id] : [current[1], player.id]; return { ...prev, werewolfTargetIds: next, werewolfTargetId: next[0] || null }; } return { ...prev, werewolfTargetIds: [player.id], werewolfTargetId: player.id }; })} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition flex items-center justify-between ${isSelected ? 'bg-red-950/80 border-red-500 text-red-200' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}><span className="truncate">{player.name}</span>{isSelected && <Crosshair className="w-4 h-4 text-red-400 shrink-0" />}</button>; })}
        </div>
        <div className="flex gap-3"><button onClick={() => handleSkipNightAction('WEREWOLF', 'Werewolf SKIP.')} className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black text-xs transition">SKIP</button><button onClick={() => handleConfirmWerewolf(selectedIds)} className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>KONFIRMASI TARGET</span><ArrowRight className="w-5 h-5" /></button></div>
      </div>
    );
  };

  const renderNightGuardian = () => (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-950/90 border border-blue-700/60 text-blue-400 shadow-lg"><Shield className="w-8 h-8" /></div><h2 className="text-2xl font-black text-blue-400">GUARDIAN PHASE</h2><p className="text-xs sm:text-sm text-slate-300">Pilih 1 pemain untuk dilindungi malam ini.</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
        {gameState.players.filter(p => p.alive).map(player => { const isSelected = gameState.guardianTargetId === player.id; const isDisabled = player.protectedLastNight; return <button key={player.id} disabled={isDisabled} onClick={() => setGameState(prev => ({ ...prev, guardianTargetId: player.id }))} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition flex items-center justify-between ${isDisabled ? 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed' : isSelected ? 'bg-blue-950/80 border-blue-500 text-blue-200' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}><span className="truncate">{player.name}</span>{isSelected && <Shield className="w-4 h-4 text-blue-400 shrink-0" />}</button>; })}
      </div>
      <div className="flex gap-3"><button onClick={() => handleSkipNightAction('GUARDIAN', 'Guardian SKIP.')} className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black text-xs transition">SKIP</button><button onClick={handleConfirmGuardian} className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>KONFIRMASI GUARDIAN</span><ArrowRight className="w-5 h-5" /></button></div>
    </div>
  );

  const renderNightSheriff = () => (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-yellow-950/90 border border-yellow-700/60 text-yellow-300 shadow-lg"><Star className="w-8 h-8" /></div><h2 className="text-2xl font-black text-yellow-300">SHERIFF PHASE</h2><p className="text-xs sm:text-sm text-slate-300">Pilih 1 pemain untuk diuji. SKIP tidak menghabiskan kemampuan.</p></div>
      <button onClick={handleSkipSheriff} className="w-full py-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white font-black rounded-2xl text-xs transition">SKIP SHERIFF</button>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
        {gameState.players.filter(p => p.alive && p.id !== gameState.players.find(x => x.role === 'SHERIFF')?.id).map(p => <button key={p.id} onClick={() => setGameState(prev => ({ ...prev, sheriffTargetId: p.id }))} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition ${gameState.sheriffTargetId === p.id ? 'bg-yellow-950/80 border-yellow-500 text-yellow-200' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>{p.name}</button>)}
      </div>
      <button onClick={handleConfirmSheriff} disabled={!gameState.sheriffTargetId} className={`w-full py-4 rounded-2xl font-black text-xs sm:text-sm transition ${gameState.sheriffTargetId ? 'bg-yellow-600 text-slate-950 hover:bg-yellow-500 shadow-xl' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>KONFIRMASI SHERIFF</button>
    </div>
  );

  const renderNightDoppelganger = () => (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-950/90 border border-indigo-700/60 text-indigo-300 shadow-lg"><Masks className="w-8 h-8" /></div><h2 className="text-2xl font-black text-indigo-300">DOPPELGANGER PHASE</h2><p className="text-xs sm:text-sm text-slate-300">Malam 1: Pilih 1 target hidup.</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
        {gameState.players.filter(p => p.alive && p.role !== 'DOPPELGANGER').map(p => <button key={p.id} onClick={() => setGameState(prev => ({ ...prev, doppelgangerTargetId: p.id }))} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left ${gameState.doppelgangerTargetId === p.id ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>{p.name}</button>)}
      </div>
      <div className="flex gap-3"><button onClick={() => handleSkipNightAction('DOPPELGANGER', 'Doppelganger SKIP.')} className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black text-xs transition">SKIP</button><button onClick={handleConfirmDoppelganger} className="w-2/3 py-4 rounded-2xl bg-indigo-700 hover:bg-indigo-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition"><span>KONFIRMASI DOPPELGANGER</span><ArrowRight className="w-5 h-5" /></button></div>
    </div>
  );

  const renderNightSeer = () => (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-950/90 border border-cyan-700/60 text-cyan-400 shadow-lg"><Eye className="w-8 h-8" /></div><h2 className="text-2xl font-black text-cyan-400">SEER PHASE</h2><p className="text-xs sm:text-sm text-slate-300">Pilih 1 pemain untuk diramal perannya.</p></div>
      {!gameState.seerResult && <button onClick={() => handleSkipNightAction('SEER', 'Seer SKIP.')} className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-black text-xs transition mb-3">SKIP SEER</button>}
      {gameState.seerResult ? (
        <div className="bg-gradient-to-br from-cyan-950 via-slate-900 to-cyan-950 border-2 border-cyan-500/80 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-fadeIn">
          <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">HASIL RAMALAN SEER</span>
          <div className="space-y-1"><h3 className="text-2xl font-black text-white">{gameState.seerResult.targetName}</h3><div className="inline-block px-4 py-1.5 rounded-full bg-cyan-950 border border-cyan-600/80 text-cyan-300 font-bold text-sm">ROLE: {gameState.seerResult.displayedRole}</div></div>
          <button onClick={() => advanceNightPhase()} className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-sm shadow-xl transition">TUTUP HASIL & SELESAI SEER</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
          {gameState.players.filter(p => p.alive && p.role !== 'SEER').map(player => <button key={player.id} onClick={() => handleSeerInspect(player.id)} className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-cyan-950/80 text-xs sm:text-sm font-bold text-left transition flex items-center justify-between"><span className="truncate">{player.name}</span><Eye className="w-4 h-4 text-cyan-400 shrink-0" /></button>)}
        </div>
      )}
    </div>
  );

  const renderNightWitch = () => (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-950/90 border border-purple-700/60 text-purple-400 shadow-lg"><FlaskConical className="w-8 h-8" /></div><h2 className="text-2xl font-black text-purple-400">WITCH PHASE</h2><p className="text-xs sm:text-sm text-slate-300">{gameState.nightNumber === 1 ? 'Malam 1: Witch hanya bisa menggunakan Heal Potion.' : 'Pilih penggunaan Heal atau Kill Potion secara blind.'}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-md"><div className="flex items-center justify-between"><span className="font-bold text-emerald-400 text-sm">Heal Potion</span></div><select disabled={gameState.witchHealUsed} value={gameState.witchHealTargetId || ''} onChange={e => setGameState(prev => ({ ...prev, witchHealTargetId: e.target.value || null, witchHealUsedThisNight: !!e.target.value }))} className="w-full py-2.5 px-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none"><option value="">-- Tebak Target Heal --</option>{gameState.players.filter(p => p.alive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-md"><div className="flex items-center justify-between"><span className="font-bold text-purple-400 text-sm">Kill Potion</span></div><select disabled={gameState.witchKillUsed || gameState.nightNumber === 1} value={gameState.witchKillTargetId || ''} onChange={e => setGameState(prev => ({ ...prev, witchKillTargetId: e.target.value || null }))} className="w-full py-2.5 px-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none disabled:opacity-40"><option value="">-- Pilih Target Kill --</option>{gameState.players.filter(p => p.alive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      </div>
      <button onClick={() => handleSkipNightAction('WITCH', 'Witch SKIP.')} className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-black text-xs transition mb-3">SKIP WITCH</button>
      <button onClick={handleFinishWitch} className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>SELESAIKAN WITCH & PROSES MALAM</span><ArrowRight className="w-5 h-5" /></button>
    </div>
  );

  const renderHunterRevenge = () => (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-950/90 border border-orange-700/60 text-orange-300 shadow-lg"><Crosshair className="w-8 h-8" /></div><h2 className="text-2xl font-black text-orange-300">HUNTER REVENGE</h2><p className="text-xs sm:text-sm text-slate-300"><strong>{gameState.players.find(p => p.role === 'HUNTER' && !p.alive)?.name}</strong> tereliminasi. Pilih 1 pemain untuk dibalas dendam.</p></div>
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
        {gameState.lastNightDeaths.length === 0 ? (
          <div className="space-y-2"><Sun className="w-10 h-10 text-emerald-400 mx-auto" /><h3 className="text-xl font-black text-emerald-400">Semua Pemain Selamat!</h3><p className="text-xs text-slate-300">Semalam tidak ada pemain yang tereliminasi.</p></div>
        ) : (
          <div className="space-y-3"><Skull className="w-10 h-10 text-red-400 mx-auto" /><h3 className="text-base font-bold text-red-400">Pemain Tereliminasi Semalam:</h3><div className="space-y-2">{gameState.lastNightDeaths.map(({ player, reason }) => <div key={player.id} className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center justify-between"><span className="font-black text-white text-sm">{player.name}</span><span className="text-[10px] px-2.5 py-1 rounded-full bg-red-900/80 text-red-200 font-bold border border-red-700/60">{reason}</span></div>)}</div></div>
        )}
      </div>
      <button onClick={() => setGameState(prev => ({ ...prev, currentPhase: 'DISCUSSION', discussionEndTimestamp: null, isTimerPaused: false, pausedRemainingSeconds: null, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', `Memulai diskusi Hari ${prev.dayNumber}.`) }))} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>LANJUT KE WAKTU DISKUSI</span><ArrowRight className="w-5 h-5" /></button>
    </div>
  );

  const renderDiscussion = () => (
    <div className="max-w-lg mx-auto p-4 sm:p-6 text-center space-y-6 animate-fadeIn">
      <div className="space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-950/90 border border-orange-700/60 text-orange-400 shadow-lg"><MessageSquare className="w-8 h-8" /></div><h2 className="text-2xl font-black text-white">WAKTU DISKUSI</h2></div>
      <div className="bg-slate-900/90 border-2 border-slate-800/80 rounded-3xl p-8 space-y-4 shadow-2xl"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SISA WAKTU DISKUSI</span><div className="text-5xl sm:text-6xl font-black font-mono text-amber-400 tracking-wider">{formatTime(remainingSeconds)}</div><div className="flex items-center justify-center gap-3 pt-2">{!gameState.discussionEndTimestamp ? <button onClick={startDiscussionTimer} className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg transition"><Play className="w-4 h-4 fill-current" /><span>MULAI TIMER</span></button> : !gameState.isTimerPaused ? <button onClick={pauseDiscussionTimer} className="px-6 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center gap-2 border border-slate-700 transition"><Pause className="w-4 h-4" /><span>PAUSE</span></button> : <button onClick={resumeDiscussionTimer} className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg transition"><Play className="w-4 h-4 fill-current" /><span>RESUME</span></button>}</div></div>
      <button onClick={triggerAutoTransitionToVoting} className="w-full py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition"><span>SELESAIKAN DISKUSI & MULAI VOTING</span><ArrowRight className="w-4 h-4" /></button>
    </div>
  );

  const renderVoting = () => {
    const livingPlayers = gameState.players.filter(p => p.alive);
    const { currentVoterIndex, votes } = gameState;
    const currentVoter = livingPlayers[currentVoterIndex];
    const isAllVotesDone = currentVoterIndex >= livingPlayers.length || Object.keys(votes).length >= livingPlayers.length;
    const voteTally = {};
    Object.entries(votes).forEach(([voterId, targetId]) => { const voter = gameState.players.find(p => p.id === voterId && p.alive); if (!voter || !targetId) return; const weight = voter.role === 'MAYOR' && gameState.mayorRevealed ? 2 : 1; voteTally[targetId] = (voteTally[targetId] || 0) + weight; });
    const sortedCandidates = Object.entries(voteTally).map(([targetId, count]) => ({ player: gameState.players.find(p => p.id === targetId), count })).filter(item => item.player).sort((a, b) => b.count - a.count);
    const maxVotes = sortedCandidates.length > 0 ? sortedCandidates[0].count : 0;
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950/90 border border-red-700/60 text-red-400 shadow-lg"><CheckSquare className="w-8 h-8" /></div><h2 className="text-2xl font-black text-white">SESI VOTING</h2></div>
        {gameState.players.some(p => p.role === 'MAYOR' && p.alive) && !gameState.mayorRevealed && <button onClick={handleMayorReveal} className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-sm shadow-md transition flex items-center justify-center gap-2"><Crown className="w-4 h-4" /> UNGKAP IDENTITAS MAYOR</button>}
        {!isAllVotesDone && currentVoter ? (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PEMILIH ({currentVoterIndex + 1}/{livingPlayers.length})</span><span className="text-lg font-black text-amber-400">{currentVoter.name}</span></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[35vh] overflow-y-auto">
              {livingPlayers.filter(p => p.id !== currentVoter.id).map(target => <button key={target.id} onClick={() => handleVoteSubmit(currentVoter.id, target.id)} className="p-3.5 rounded-2xl border bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-red-950/80 text-xs sm:text-sm font-bold text-left transition flex items-center justify-between"><span className="truncate">{target.name}</span><Skull className="w-4 h-4 text-red-400 shrink-0" /></button>)}
            </div>
            <button onClick={() => handleVoteSubmit(currentVoter.id, null)} className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-black text-xs transition">SKIP VOTE</button>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-2xl">
            <h3 className="text-base font-bold text-white text-center">HASIL REKAP VOTING</h3>
            <div className="space-y-3">
              {sortedCandidates.length === 0 ? <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">Semua pemain memilih skip vote. Tidak ada eliminasi.</div> : sortedCandidates.map(({ player, count }) => { const isTop = count === maxVotes && maxVotes > 0; const percentage = Math.min(100, (count / livingPlayers.length) * 100); return <div key={player.id} className={`p-3.5 rounded-2xl border space-y-2 transition ${isTop ? 'bg-red-950/40 border-red-500/80' : 'bg-slate-950/80 border-slate-800/80'}`}><div className="flex justify-between items-center text-sm font-bold"><span className={isTop ? 'text-red-400' : 'text-white'}>{player.name}</span><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${isTop ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{count} Suara</span></div><div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden"><div className={`h-full rounded-full ${isTop ? 'bg-gradient-to-r from-red-600 to-amber-500' : 'bg-slate-600'}`} style={{ width: `${Math.max(8, percentage)}%` }} /></div></div>; })}
            </div>
            <button onClick={resolveVotingResults} className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"><span>PROSES HASIL VOTING</span><ArrowRight className="w-5 h-5" /></button>
          </div>
        )}
      </div>
    );
  };

  const renderGameOver = () => (
    <div className="max-w-xl mx-auto p-4 sm:p-6 text-center space-y-6 animate-fadeIn">
      <div className="space-y-4 pt-4"><div className={`inline-flex items-center justify-center p-5 rounded-3xl border shadow-2xl ${gameState.winner === 'WARGA' ? 'bg-emerald-950/90 border-emerald-600/60 text-emerald-400' : gameState.winner === 'JESTER' ? 'bg-pink-950/90 border-pink-600/60 text-pink-400' : 'bg-red-950/90 border-red-600/60 text-red-400'}`}><Crown className="w-16 h-16 animate-bounce" /></div><h2 className={`text-3xl font-black uppercase tracking-wider ${gameState.winner === 'WARGA' ? 'text-emerald-400' : gameState.winner === 'JESTER' ? 'text-pink-400' : 'text-red-400'}`}>{gameState.winner === 'WARGA' ? 'TIM WARGA MENANG' : gameState.winner === 'JESTER' ? 'JESTER MENANG' : 'TIM WEREWOLF MENANG'}</h2></div>
      
      {/* UI Dokumentasi Foto / Ringkasan Akhir */}
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
            <div className="space-y-2">{gameState.loverDeathNotice.map(notice => <div key={notice.id} className="p-4 rounded-2xl bg-pink-950/60 border border-pink-800/80 text-center"><p className="text-base font-black text-white">{notice.name}</p><p className="text-xs text-pink-300 mt-1">ikut meninggal karena <strong>{notice.partnerName}</strong> mati.</p></div>)}</div>
            <button onClick={() => setGameState(prev => ({ ...prev, loverDeathNotice: [] }))} className="w-full py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-black transition shadow-lg">MENGERTI</button>
          </div>
        </div>
      )}

      {gameState.currentPhase !== 'HOME' && gameState.currentPhase !== 'SETUP' && (
        <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-bold text-white shadow-sm"><Moon className="w-4 h-4 text-indigo-400" /><span>MALAM {gameState.nightNumber}</span></div></div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPrivacyMode(prev => !prev)} className={`p-2 rounded-xl border transition ${privacyMode ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700/80 text-amber-300'}`} title="Privacy Mode">{privacyMode ? <Unlock className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
              <button onClick={handleBackToHome} className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 transition" title="Kembali ke Home"><Home className="w-4 h-4" /></button>
              {gameState.undoStack && gameState.undoStack.length > 0 && <button onClick={handleUndo} className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-amber-400 transition" title="Undo"><CornerUpLeft className="w-4 h-4" /></button>}
              <button onClick={() => setShowGameLogDrawer(true)} className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 transition" title="Game Log"><History className="w-4 h-4" /></button>
              <button onClick={() => setShowDashboardDrawer(true)} className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-emerald-400 transition" title="Dashboard & Notes"><StickyNote className="w-4 h-4" /></button>
              <button onClick={() => setShowRulesModal(true)} className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 transition" title="Aturan"><HelpCircle className="w-4 h-4" /></button>
            </div>
          </div>
        </header>
      )}

      {renderSmartAssistant()}
      
      <main key={`${gameState.currentPhase}-${gameState.nightNumber}-${gameState.dayNumber}`} className="flex-1 pb-8">
        {renderCurrentPhase()}
      </main>

      {privacyMode && (
        <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center space-y-5">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-900 border border-slate-700 text-amber-400 shadow-2xl"><EyeOff className="w-10 h-10" /></div>
            <div><div className="text-[10px] font-black tracking-[0.25em] text-amber-400 uppercase">PRIVACY MODE</div><h2 className="text-2xl font-black text-white mt-2">INFORMASI RAHASIA TERSEMBUNYI</h2><p className="text-sm text-slate-400 mt-2">Layar aman untuk diperlihatkan kepada pemain.</p></div>
            <button onClick={() => setPrivacyMode(false)} className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-xl">KELUAR PRIVACY MODE</button>
          </div>
        </div>
      )}

      {showDashboardDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-start animate-fadeIn">
          <div className="bg-slate-900/95 border-r border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2"><StickyNote className="w-5 h-5 text-emerald-400" /><span>Dashboard Moderator</span></h3>
              <button onClick={() => setShowDashboardDrawer(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"><X className="w-5 h-5" /></button>
            </div>

            {/* Fitur Baru: Papan Catatan Moderator */}
            <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-inner">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Catatan Pribadi</span>
              <textarea 
                value={modNotes} 
                onChange={(e) => setModNotes(e.target.value)} 
                placeholder="Tulis curiga, alibi pemain, atau pola di sini..."
                className="w-full h-48 bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 resize-none"
              ></textarea>
              <p className="text-[10px] text-slate-500">Catatan tersimpan otomatis di perangkat ini.</p>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-3xl space-y-2 text-xs text-slate-300 shadow-inner">
              <div className="flex justify-between"><span className="text-slate-500 font-medium">Status Sesi:</span><span className="font-black text-white">Malam {gameState.nightNumber} / Hari {gameState.dayNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-medium">Pemain Hidup / Mati:</span><span className="font-black text-white">{gameState.players.filter(p => p.alive).length} Hidup · {gameState.players.filter(p => !p.alive).length} Mati</span></div>
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
              <section className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2"><h4 className="font-bold text-amber-300 text-sm flex items-center gap-2"><Crown className="w-4 h-4" /> Tujuan Permainan</h4><p>• <strong>Tim Warga:</strong> Eliminasi seluruh role Evil.</p><p>• <strong>Tim Werewolf:</strong> Jumlah role Evil >= jumlah pemain non-Evil.</p></section>
              <section className="space-y-2.5"><h4 className="font-bold text-white text-sm">Aturan Peran</h4>{Object.entries(ROLES).map(([key, role]) => { const Icon = ROLE_ICONS[key] || User; return <div key={key} className={`p-3 rounded-2xl border ${role.border} ${role.bg} flex items-start gap-3 shadow-md`}><Icon className={`w-6 h-6 ${role.color} mt-1`} /><div><span className={`font-black ${role.color}`}>{role.name} ({role.team})</span><p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{role.desc}</p></div></div>; })}</section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
