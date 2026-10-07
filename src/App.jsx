import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Home,
  Lock,
  Unlock,
  Crosshair,
  Moon,
  Sun,
  Eye,
  FlaskConical,
  Heart,
  Skull,
  Users,
  Flame,
  RotateCcw,
  History,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  Play,
  Pause,
  HelpCircle,
  UserCheck,
  Sparkles,
  ArrowRight,
  CornerUpLeft,
  Info,
  ListOrdered,
  X,
  Volume2,
  VolumeX,
  Check,
  RefreshCw,
  Award
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'WEREWOLF_MODERATOR_ASSISTANT_STATE_V2';

// Role Definitions & Accents
const ROLES = {
  WARGA: { name: 'Warga', team: 'Warga', icon: '👨', color: 'text-slate-300', bg: 'bg-slate-800/90', border: 'border-slate-600', accent: 'from-slate-700 to-slate-900', desc: 'Tidak memiliki kemampuan khusus. Bekerja sama mengeliminasi seluruh ancaman.' },
  WEREWOLF: { name: 'Werewolf', team: 'Evil', icon: '🐺', color: 'text-red-400', bg: 'bg-red-950/90', border: 'border-red-600', accent: 'from-red-900 to-red-950', desc: 'Setiap malam memilih 1 korban. Sesama Werewolf saling mengetahui.' },
  LYCAN: { name: 'Lycan', team: 'Warga', icon: '🌙', color: 'text-slate-200', bg: 'bg-zinc-800/90', border: 'border-zinc-500', accent: 'from-zinc-700 to-zinc-900', desc: 'Berada di tim Warga dan tidak memiliki aksi malam. Seer akan melihat Lycan sebagai Werewolf.' },
  CULTIST: { name: 'Cultist', team: 'Evil', icon: '🕯️', color: 'text-fuchsia-400', bg: 'bg-fuchsia-950/90', border: 'border-fuchsia-700', accent: 'from-fuchsia-900 to-fuchsia-950', desc: 'Anggota tim Evil tanpa aksi malam khusus. Tujuannya membantu tim Evil mencapai kemenangan.' },
  SEER: { name: 'Seer', team: 'Warga', icon: '🔮', color: 'text-cyan-400', bg: 'bg-cyan-950/90', border: 'border-cyan-600', accent: 'from-cyan-900 to-cyan-950', desc: 'Setiap malam memeriksa 1 pemain untuk mengetahui wujud/perannya. Lycan terlihat sebagai Werewolf.' },
  GUARDIAN: { name: 'Guardian', team: 'Warga', icon: '🛡️', color: 'text-blue-400', bg: 'bg-blue-950/90', border: 'border-blue-600', accent: 'from-blue-900 to-blue-950', desc: 'Melindungi 1 pemain setiap malam dari serangan Werewolf. Tidak boleh melindungi pemain yang sama dua malam berturut-turut.' },
    CUPID: { name: 'Cupid', team: 'Warga', icon: '💘', color: 'text-pink-400', bg: 'bg-pink-950/90', border: 'border-pink-600', accent: 'from-pink-900 to-pink-950', desc: 'Hanya aktif Malam 1 dan memilih 2 pemain menjadi Lovers. Jika salah satu mati, pasangannya ikut mati.' },
  MAYOR: { name: 'Mayor', team: 'Warga', icon: '👑', color: 'text-amber-400', bg: 'bg-amber-950/90', border: 'border-amber-600', accent: 'from-amber-900 to-amber-950', desc: 'Sekali per game dapat mengungkapkan identitas sebagai Mayor. Setelah terungkap, bobot suaranya menjadi 2 pada voting.' },
  SHERIFF: { name: 'Sheriff', team: 'Warga', icon: '⭐', color: 'text-yellow-300', bg: 'bg-yellow-950/90', border: 'border-yellow-600', accent: 'from-yellow-900 to-yellow-950', desc: 'Sekali per game, pada malam hari memilih 1 pemain untuk diuji. Jika target adalah Werewolf, target tereliminasi dan Sheriff tetap hidup. Jika target bukan Werewolf, Sheriff ikut tereliminasi.' },
  DOCTOR: { name: 'Doctor', team: 'Warga', icon: '⚕️', color: 'text-emerald-400', bg: 'bg-emerald-950/90', border: 'border-emerald-600', accent: 'from-emerald-900 to-emerald-950', desc: 'Setiap malam memilih 1 pemain untuk dilindungi dari serangan Werewolf. Tidak menghentikan efek Witch.' },
  PRIEST: { name: 'Priest', team: 'Warga', icon: '✝️', color: 'text-violet-300', bg: 'bg-violet-950/90', border: 'border-violet-600', accent: 'from-violet-900 to-violet-950', desc: 'Sekali per game pada siang hari dapat memberkati 1 pemain. Pemain tersebut mendapat perlindungan dari serangan Werewolf pada malam berikutnya.' },
  WITCH: { name: 'Witch', team: 'Warga', icon: '🧪', color: 'text-purple-400', bg: 'bg-purple-950/90', border: 'border-purple-600', accent: 'from-purple-900 to-purple-950', desc: 'Memiliki Heal Potion dan Kill Potion, masing-masing hanya 1x. Witch tidak melihat korban Werewolf dan harus menebak target Heal secara blind.' },
  JESTER: { name: 'Jester', team: 'Neutral', icon: '🃏', color: 'text-pink-300', bg: 'bg-pink-950/90', border: 'border-pink-600', accent: 'from-pink-900 to-pink-950', desc: 'Menang sendiri jika berhasil tereliminasi melalui voting siang hari.' },
  DOPPELGANGER: { name: 'Doppelganger', team: 'Neutral', icon: '🎭', color: 'text-indigo-300', bg: 'bg-indigo-950/90', border: 'border-indigo-600', accent: 'from-indigo-900 to-indigo-950', desc: 'Malam 1 memilih 1 target. Jika target mati karena malam, voting, atau efek Lovers, Doppelganger menggantikan role-nya dengan role target tersebut dan mulai memakai kemampuan role itu.' }
};

const ROLE_KEYS = Object.keys(ROLES);
const EVIL_ROLES = ['WEREWOLF', 'CULTIST'];

function isWolfAligned(player) {
  return player?.role === 'WEREWOLF' || player?.role === 'CULTIST';
}

function getRoleComposition(playerCount) {
  const wolves = Math.max(1, Math.floor(playerCount / 4));
  const base = ['WEREWOLF'];
  for (let i = 1; i < wolves; i++) base.push('WEREWOLF');
  const specials = ['GUARDIAN', 'SEER', 'WITCH', 'CUPID'];
  for (const r of specials) if (base.length < playerCount) base.push(r);
  while (base.length < playerCount) base.push('WARGA');
  return base.slice(0, playerCount);
}

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createInitialGameState() {
  return {
    players: [],
    currentPhase: 'HOME', // HOME | RULES | SETUP | ROLE_SUMMARY | ROLE_REVEAL | NIGHT_INTRO | NIGHT_CUPID | NIGHT_WEREWOLF | NIGHT_GUARDIAN | NIGHT_DOCTOR | NIGHT_SHERIFF | NIGHT_DOPPELGANGER | NIGHT_SEER | NIGHT_WITCH | MORNING | DISCUSSION | VOTING | GAME_OVER
    nightNumber: 1,
    dayNumber: 1,
    
    // Discussion Timer
    discussionEndTimestamp: null,
    discussionDurationSeconds: 300, // 5 minutes
    isTimerPaused: false,
    pausedRemainingSeconds: null,

    // Night action buffers
    werewolfTargetId: null,
    guardianTargetId: null,
    doctorTargetId: null,
    sheriffTargetId: null,
    sheriffUsed: false,
    priestTargetId: null,
    priestUsed: false,
    priestBlessedId: null,
    doppelgangerTargetId: null,
    doppelgangerCopied: false,
    doppelgangerRoleChangeNotice: null,
    mayorRevealed: false,
    seerTargetId: null,
    seerResult: null,
    witchHealUsedThisNight: false,
    witchHealTargetId: null,
    witchKillTargetId: null,

    // Cupid selection buffer
    cupidLover1Id: null,
    cupidLover2Id: null,

    // Permanent status flags
    witchHealUsed: false,
    witchKillUsed: false,
    cupidUsed: false,

    // Voting state
    currentVoterIndex: 0,
    votes: {}, // voterId -> targetId

    // Reveal phase state
    revealPlayerIndex: 0,
    isRoleCardOpen: false,

    // Logs & History
    gameLog: [],
    lastNightDeaths: [],
    lastDayDeaths: [],
    loverDeathNotice: [],
    roleCounts: {},
    winner: null, // "WARGA" | "WEREWOLF" | "JESTER"

    // Undo Snapshot
    undoStack: []
  };
}

export default function App() {
  const [gameState, setGameState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.currentPhase) return {
          ...createInitialGameState(),
          ...parsed,
          players: (parsed.players || []).map(p => ({ ...p, protectedLastNight: !!p.protectedLastNight, protectedThisNight: !!p.protectedThisNight, doctorProtectedThisNight: !!p.doctorProtectedThisNight, priestProtectedThisNight: !!p.priestProtectedThisNight, doppelgangerCopied: !!p.doppelgangerCopied }))
        };
      }
    } catch (e) {
      console.error("Gagal memuat state dari localStorage:", e);
    }
    return createInitialGameState();
  });

  // UI state overlays
  const [showRoleListDrawer, setShowRoleListDrawer] = useState(false);
  const [showGameLogDrawer, setShowGameLogDrawer] = useState(false);
  const [showPlayerStatusDrawer, setShowPlayerStatusDrawer] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [inputPlayerNames, setInputPlayerNames] = useState(['Andi', 'Budi', 'Citra', 'Dika', 'Eka']);
  const [playerCount, setPlayerCount] = useState(5);
  const [nameErrors, setNameErrors] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [roleCountsDraft, setRoleCountsDraft] = useState({});
  useEffect(() => { if (Object.keys(roleCountsDraft).length === 0) setRoleCountsDraft({ WARGA: Math.max(0, playerCount - 4), WEREWOLF: 1, GUARDIAN: 1, SEER: 1, WITCH: 1 }); }, [playerCount]);

  // Synchronize state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
      console.error("Gagal menyimpan ke localStorage:", e);
    }
  }, [gameState]);

  // Toast notification timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [remainingSeconds, setRemainingSeconds] = useState(300);

  useEffect(() => {
    if (gameState.currentPhase !== 'DISCUSSION') return;

    if (gameState.isTimerPaused && gameState.pausedRemainingSeconds !== null) {
      setRemainingSeconds(gameState.pausedRemainingSeconds);
      return;
    }

    if (!gameState.discussionEndTimestamp) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((gameState.discussionEndTimestamp - Date.now()) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        // Auto transition to voting when timer reaches 0
        triggerAutoTransitionToVoting();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameState.currentPhase, gameState.discussionEndTimestamp, gameState.isTimerPaused, gameState.pausedRemainingSeconds]);

  function triggerAutoTransitionToVoting() {
    setGameState(prev => {
      if (prev.currentPhase !== 'DISCUSSION') return prev;
      const firstLivingIndex = prev.players.findIndex(p => p.alive);
      const newLog = addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', 'Waktu diskusi berakhir. Memulai sesi voting.');
      return {
        ...prev,
        currentPhase: 'VOTING',
        currentVoterIndex: firstLivingIndex >= 0 ? firstLivingIndex : 0,
        votes: {},
        gameLog: newLog
      };
    });
  }

  function addLog(logs, nightNumber, dayNumber, type, message) {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: timeStr,
      nightNumber,
      dayNumber,
      type,
      message
    };
    return [entry, ...logs];
  }

  function pushUndoState(state) {
    const { undoStack, ...rest } = state;
    // keep maximum 5 undo states to preserve memory
    const newStack = [rest, ...(undoStack || []).slice(0, 4)];
    return newStack;
  }

  function triggerToast(msg) {
    setToastMessage(msg);
  }

  const handlePlayerCountChange = (count) => {
    setPlayerCount(count);
    const defaultNames = ['Andi', 'Budi', 'Citra', 'Dika', 'Eka', 'Fani', 'Gani', 'Hana', 'Indra', 'Joko', 'Kiki', 'Lina', 'Maya', 'Niko', 'Oki', 'Putri', 'Qori', 'Rian', 'Siti', 'Tono'];
    const newNames = [];
    for (let i = 0; i < count; i++) {
      newNames.push(inputPlayerNames[i] || defaultNames[i] || `Pemain ${i + 1}`);
    }
    setInputPlayerNames(newNames);
    setNameErrors([]);
    setRoleCountsDraft(prev => { const total = Object.values(prev).reduce((a,b)=>a+(Number(b)||0),0); return total <= count ? prev : {}; });
  };

  const handleNameChange = (index, value) => {
    const updated = [...inputPlayerNames];
    updated[index] = value;
    setInputPlayerNames(updated);
  };

  const validateAndGenerateRoles = () => {
    const errors = [];
    const trimmed = inputPlayerNames.map(n => n.trim());

    // Check empty
    trimmed.forEach((n, idx) => {
      if (!n) errors[idx] = 'Nama tidak boleh kosong';
    });

    // Check duplicates
    trimmed.forEach((n, idx) => {
      if (n && trimmed.filter(x => x.toLowerCase() === n.toLowerCase()).length > 1) {
        errors[idx] = 'Nama tidak boleh sama';
      }
    });

    if (errors.length > 0) {
      setNameErrors(errors);
      triggerToast('Mohon perbaiki nama pemain yang belum valid.');
      return;
    }

    const totalRoles = Object.values(roleCountsDraft).reduce((sum, n) => sum + (Number(n) || 0), 0);
    if (totalRoles !== playerCount) {
      triggerToast(`Jumlah role harus tepat ${playerCount}. Saat ini ${totalRoles}.`);
      return;
    }
    const roleList = Object.entries(roleCountsDraft).flatMap(([role, count]) => Array(Number(count)).fill(role));
    const shuffledRoles = shuffle(roleList);

    const players = trimmed.map((name, idx) => ({
      id: 'player_' + (idx + 1) + '_' + Date.now(),
      name,
      role: shuffledRoles[idx],
      alive: true,
      loverId: null,
      protectedLastNight: false,
      protectedThisNight: false,
      doctorProtectedThisNight: false,
      priestProtectedThisNight: false,
      deathReason: null,
      deathNight: null,
      deathDay: null
    }));

    setGameState(prev => ({
      ...createInitialGameState(),
      players,
      currentPhase: 'ROLE_SUMMARY',
      roleCounts: { ...roleCountsDraft },
      gameLog: addLog([], 1, 1, 'INFO', `Permainan baru dibuat dengan ${playerCount} pemain.`)
    }));
  };

  const startRoleReveal = () => {
    setGameState(prev => ({
      ...prev,
      currentPhase: 'ROLE_REVEAL',
      revealPlayerIndex: 0,
      isRoleCardOpen: false
    }));
  };

  const toggleRoleCard = () => {
    setGameState(prev => ({
      ...prev,
      isRoleCardOpen: !prev.isRoleCardOpen
    }));
  };

  const nextRevealPlayer = () => {
    setGameState(prev => {
      const nextIndex = prev.revealPlayerIndex + 1;
      if (nextIndex >= prev.players.length) {
        // Reveal finished -> Start Night 1
        return {
          ...prev,
          currentPhase: 'NIGHT_INTRO',
          nightNumber: 1,
          gameLog: addLog(prev.gameLog, 1, 1, 'INFO', 'Pembagian role selesai. Memulai Malam 1.')
        };
      }
      return {
        ...prev,
        revealPlayerIndex: nextIndex,
        isRoleCardOpen: false
      };
    });
  };

  const advanceNightPhase = () => {
    setGameState(prev => {
      const { nightNumber, players, cupidUsed } = prev;
      const canContinueFrom = (...phases) => phases.includes(prev.currentPhase);

      if (nightNumber === 1 && players.some(p => p.role === 'CUPID' && p.alive) && !cupidUsed && prev.currentPhase === 'NIGHT_INTRO') {
        return { ...prev, currentPhase: 'NIGHT_CUPID' };
      }

      const livingWerewolves = players.filter(p => p.role === 'WEREWOLF' && p.alive);
      if (livingWerewolves.length > 0 && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID')) {
        return { ...prev, currentPhase: 'NIGHT_WEREWOLF' };
      }

      const guardian = players.find(p => p.role === 'GUARDIAN' && p.alive);
      if (guardian && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF')) {
        return { ...prev, currentPhase: 'NIGHT_GUARDIAN' };
      }

      const doctor = players.find(p => p.role === 'DOCTOR' && p.alive);
      if (doctor && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN')) {
        return { ...prev, currentPhase: 'NIGHT_DOCTOR' };
      }

      const sheriff = players.find(p => p.role === 'SHERIFF' && p.alive);
      if (sheriff && !prev.sheriffUsed && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_DOCTOR')) {
        return { ...prev, currentPhase: 'NIGHT_SHERIFF' };
      }

      const doppel = players.find(p => p.role === 'DOPPELGANGER' && p.alive && !p.doppelgangerCopied);
      if (doppel && nightNumber === 1 && !prev.doppelgangerTargetId && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_DOCTOR', 'NIGHT_SHERIFF')) {
        return { ...prev, currentPhase: 'NIGHT_DOPPELGANGER' };
      }

      const seer = players.find(p => p.role === 'SEER' && p.alive);
      if (seer && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_DOCTOR', 'NIGHT_SHERIFF', 'NIGHT_DOPPELGANGER')) {
        return { ...prev, currentPhase: 'NIGHT_SEER' };
      }

      const witch = players.find(p => p.role === 'WITCH' && p.alive);
      if (witch && (!prev.witchHealUsed || !prev.witchKillUsed) && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_DOCTOR', 'NIGHT_SHERIFF', 'NIGHT_DOPPELGANGER', 'NIGHT_SEER')) {
        return { ...prev, currentPhase: 'NIGHT_WITCH' };
      }

      return resolveNightActions(prev);
    });
  };

  function resolveNightActions(state) {
    let updatedPlayers = state.players.map(p => ({ ...p }));
    let log = [...state.gameLog];
    const night = state.nightNumber;
    const day = state.dayNumber;

    const targetWerewolf = state.werewolfTargetId;
    const targetGuardian = state.guardianTargetId;
    const targetDoctor = state.doctorTargetId;
    const sheriffTarget = state.sheriffTargetId;
    const witchHeal = state.witchHealUsedThisNight;
    const witchHealTarget = state.witchHealTargetId;
    const witchKillTarget = state.witchKillTargetId;
    const priestBlessedId = state.priestBlessedId;

    const directDeaths = [];
    const protectedByTown = new Set([targetGuardian, targetDoctor, priestBlessedId].filter(Boolean));

    if (targetWerewolf) {
      const victimName = updatedPlayers.find(p => p.id === targetWerewolf)?.name;
      log = addLog(log, night, day, 'ACTION', `Werewolf mengincar ${victimName}.`);
    }
    if (targetGuardian) {
      const name = updatedPlayers.find(p => p.id === targetGuardian)?.name;
      log = addLog(log, night, day, 'ACTION', `Guardian melindungi ${name}.`);
    }
    if (targetDoctor) {
      const name = updatedPlayers.find(p => p.id === targetDoctor)?.name;
      log = addLog(log, night, day, 'ACTION', `Doctor melindungi ${name}.`);
    }

    if (targetWerewolf) {
      if (protectedByTown.has(targetWerewolf)) {
        log = addLog(log, night, day, 'INFO', `Serangan Werewolf pada ${updatedPlayers.find(p => p.id === targetWerewolf)?.name} berhasil dicegah.`);
      } else if (witchHeal && witchHealTarget === targetWerewolf) {
        log = addLog(log, night, day, 'INFO', `Heal Potion Witch berhasil menyelamatkan korban Werewolf.`);
      } else if (witchHeal) {
        log = addLog(log, night, day, 'INFO', `Witch menggunakan Heal Potion, tetapi tebakannya salah.`);
        directDeaths.push({ id: targetWerewolf, reason: 'WEREWOLF' });
      } else {
        directDeaths.push({ id: targetWerewolf, reason: 'WEREWOLF' });
      }
    }

    // Sheriff test: only an actual WEREWOLF is a correct target. Lycan/Cultist are not Werewolf.
    if (sheriffTarget) {
      const sheriff = updatedPlayers.find(p => p.role === 'SHERIFF' && p.alive);
      const target = updatedPlayers.find(p => p.id === sheriffTarget && p.alive);
      if (sheriff && target) {
        if (target.role === 'WEREWOLF') {
          directDeaths.push({ id: target.id, reason: 'SHERIFF' });
          log = addLog(log, night, day, 'ACTION', `Sheriff berhasil menemukan Werewolf: ${target.name}.`);
        } else {
          directDeaths.push({ id: sheriff.id, reason: 'SHERIFF_MISS' });
          log = addLog(log, night, day, 'ACTION', `Sheriff salah memilih target dan tereliminasi.`);
        }
      }
    }

    if (witchKillTarget) {
      const killedName = updatedPlayers.find(p => p.id === witchKillTarget)?.name;
      if (killedName) {
        log = addLog(log, night, day, 'ACTION', `Witch menggunakan Kill Potion pada ${killedName}.`);
        directDeaths.push({ id: witchKillTarget, reason: 'WITCH' });
      }
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
          log = addLog(log, night, day, 'DEATH', `💔 ${partner.name} ikut tereliminasi karena pasangan ${deadPlayer.name} tereliminasi.`);
          changed = true;
        }
      }
    }

    const nightDeathsList = [];
    newDeathsMap.forEach((reason, deadId) => {
      const idx = updatedPlayers.findIndex(p => p.id === deadId);
      if (idx === -1) return;
      updatedPlayers[idx].alive = false;
      updatedPlayers[idx].deathReason = reason;
      updatedPlayers[idx].deathNight = night;
      nightDeathsList.push({ player: updatedPlayers[idx], reason });
      const label = reason === 'WEREWOLF' ? 'Diserang Werewolf' : reason === 'WITCH' ? 'Racun Witch' : reason === 'SHERIFF' ? 'Eliminasi Sheriff' : reason === 'SHERIFF_MISS' ? 'Salah memilih target Sheriff' : 'Efek Lovers';
      log = addLog(log, night, day, 'DEATH', `${updatedPlayers[idx].name} tereliminasi (${label}).`);
    });

    updatedPlayers = updatedPlayers.map(p => ({
      ...p,
      protectedLastNight: p.id === targetGuardian,
      protectedThisNight: false,
      doctorProtectedThisNight: false,
      priestProtectedThisNight: false
    }));

    // Doppelganger activates whenever their chosen target dies, including night deaths.
    let doppelgangerRoleChangeNotice = null;
    ({ players: updatedPlayers, log, notice: doppelgangerRoleChangeNotice } = applyDoppelgangerRoleIfTargetDead(updatedPlayers, log, night, day));

    const tempState = {
      ...state,
      players: updatedPlayers,
      gameLog: log,
      lastNightDeaths: nightDeathsList,
      loverDeathNotice,
      doppelgangerRoleChangeNotice,
      werewolfTargetId: null,
      guardianTargetId: null,
      doctorTargetId: null,
      sheriffTargetId: null,
      seerTargetId: null,
      seerResult: null,
      witchHealUsedThisNight: false,
      witchHealTargetId: null,
      witchKillTargetId: null,
      priestBlessedId: null
    };

    const winResult = checkWinConditions(tempState);
    if (winResult) {
      const winText = winResult === 'WARGA' ? 'Kemenangan Tim WARGA!' : winResult === 'WEREWOLF' ? 'Kemenangan Tim WEREWOLF!' : 'JESTER memenangkan permainan!';
      log = addLog(log, night, day, 'WIN', winText);
      return { ...tempState, currentPhase: 'GAME_OVER', winner: winResult, gameLog: log };
    }

    return { ...tempState, currentPhase: 'MORNING', gameLog: log };
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
    const target = gameState.players.find(p => p.id === targetId);
    if (!target) return;

    let displayedRole = target.role;
    let isLycanNote = false;

    if (target.role === 'LYCAN') {
      displayedRole = 'WEREWOLF';
      isLycanNote = true;
    }

    setGameState(prev => ({
      ...prev,
      seerTargetId: targetId,
      seerResult: {
        targetName: target.name,
        displayedRole,
        isLycanNote
      },
      gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Seer meramal ${target.name}.`)
    }));
  };

  const handleConfirmCupid = () => {
    const { cupidLover1Id, cupidLover2Id, players, nightNumber, dayNumber } = gameState;
    if (!cupidLover1Id || !cupidLover2Id || cupidLover1Id === cupidLover2Id) {
      triggerToast('Pilih dua pemain berbeda untuk menjadi pasangan.');
      return;
    }

    const p1 = players.find(p => p.id === cupidLover1Id);
    const p2 = players.find(p => p.id === cupidLover2Id);

    const updatedPlayers = players.map(p => {
      if (p.id === cupidLover1Id) return { ...p, loverId: cupidLover2Id };
      if (p.id === cupidLover2Id) return { ...p, loverId: cupidLover1Id };
      return p;
    });

    const newLog = addLog(gameState.gameLog, nightNumber, dayNumber, 'ACTION', `Cupid memilih ${p1.name} & ${p2.name} sebagai Pasangan Lovers.`);

    setGameState(prev => ({
      ...prev,
      undoStack: pushUndoState(prev),
      players: updatedPlayers,
      cupidUsed: true,
      gameLog: newLog
    }));

    triggerToast(`Pasangan ${p1.name} ❤️ ${p2.name} berhasil dibuat.`);
    advanceNightPhase();
  };

  const handleConfirmDoppelganger = () => {
    const targetId = gameState.doppelgangerTargetId;
    const target = gameState.players.find(p => p.id === targetId && p.alive && p.role !== 'DOPPELGANGER');
    if (!target) { triggerToast('Pilih satu target hidup untuk Doppelganger.'); return; }
    setGameState(prev => ({
      ...prev,
      gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Doppelganger memilih ${target.name} sebagai target.`)
    }));
    advanceNightPhase();
  };

  const handleConfirmSheriff = () => {
    if (!gameState.sheriffTargetId) { triggerToast('Pilih target Sheriff terlebih dahulu.'); return; }
    setGameState(prev => ({
      ...prev,
      sheriffUsed: true,
      gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Sheriff menggunakan kemampuan malam pada pemain terpilih.`)
    }));
    triggerToast('Aksi Sheriff dikonfirmasi. Sheriff silakan tutup mata.');
    advanceNightPhase();
  };

  const handlePriestBless = (targetId) => {
    const priest = gameState.players.find(p => p.role === 'PRIEST' && p.alive);
    const target = gameState.players.find(p => p.id === targetId && p.alive);
    if (!priest || gameState.priestUsed || !target) return;
    setGameState(prev => ({
      ...prev,
      priestUsed: true,
      priestTargetId: targetId,
      priestBlessedId: targetId,
      gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Priest memberkati ${target.name}. Perlindungan berlaku untuk malam berikutnya.`)
    }));
    triggerToast(`${target.name} mendapat berkat Priest untuk malam berikutnya.`);
  };

  const handleMayorReveal = () => {
    const mayor = gameState.players.find(p => p.role === 'MAYOR' && p.alive);
    if (!mayor || gameState.mayorRevealed) return;
    setGameState(prev => ({
      ...prev,
      mayorRevealed: true,
      gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Mayor ${mayor.name} mengungkapkan identitas. Mulai sekarang bobot suaranya menjadi 2.`)
    }));
    triggerToast(`${mayor.name} sekarang memiliki 2 suara dalam voting.`);
  };

  const handleVoteSubmit = (voterId, targetId = null) => {
    setGameState(prev => {
      const newVotes = { ...prev.votes, [voterId]: targetId };
      const nextVoterIndex = prev.currentVoterIndex + 1;
      const voter = prev.players.find(p => p.id === voterId);
      const voteLog = targetId
        ? `🗳️ ${voter?.name || 'Pemain'} memberikan suara.`
        : `⏭️ ${voter?.name || 'Pemain'} memilih SKIP VOTE.`;

      return {
        ...prev,
        undoStack: pushUndoState(prev),
        votes: newVotes,
        currentVoterIndex: nextVoterIndex,
        gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', voteLog)
      };
    });
  };

  // Doppelganger permanently replaces their role with the target's role
  // once the selected target has died, regardless of how the target died.
  const applyDoppelgangerRoleIfTargetDead = (players, log, nightNumber, dayNumber) => {
    const doppel = players.find(p => p.role === 'DOPPELGANGER' && p.alive && p.doppelgangerTargetId && !p.doppelgangerCopied);
    if (!doppel) return { players, log, notice: null };

    const target = players.find(p => p.id === doppel.doppelgangerTargetId);
    if (!target || target.alive) return { players, log, notice: null };

    const idx = players.findIndex(p => p.id === doppel.id);
    if (idx === -1) return { players, log, notice: null };

    const oldRole = doppel.role;
    const copiedRole = target.role;
    const updatedPlayers = [...players];
    updatedPlayers[idx] = {
      ...updatedPlayers[idx],
      role: copiedRole,
      doppelgangerCopied: true
    };

    const updatedLog = addLog(
      log,
      nightNumber,
      dayNumber,
      'ACTION',
      `🎭 Doppelganger ${doppel.name} menggantikan role ${target.name} dan sekarang menjadi ${ROLES[copiedRole]?.name || copiedRole}.`
    );

    return {
      players: updatedPlayers,
      log: updatedLog,
      notice: {
        playerName: doppel.name,
        targetName: target.name,
        oldRole,
        newRole: copiedRole
      }
    };
  };

  const resolveVotingResults = () => {
    let log = [...gameState.gameLog];
    const { votes, players, nightNumber, dayNumber } = gameState;

    // Calculate vote count per living candidate
    const voteCounts = {};
    Object.entries(votes).forEach(([voterId, targetId]) => {
      const voter = players.find(p => p.id === voterId && p.alive);
      if (!voter || !targetId) return; // SKIP VOTE does not add a vote to any candidate
      const weight = voter.role === 'MAYOR' && gameState.mayorRevealed ? 2 : 1;
      voteCounts[targetId] = (voteCounts[targetId] || 0) + weight;
    });

    let maxVotes = 0;
    Object.values(voteCounts).forEach(cnt => {
      if (cnt > maxVotes) maxVotes = cnt;
    });

    const topCandidates = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);

    let updatedPlayers = players.map(p => ({ ...p }));
    let dayDeaths = [];
    // Must live outside the winner/tie branch because it is used when building tempState.
    // Previously this was declared inside the winner branch, causing a ReferenceError
    // when PROSES HASIL VOTING was pressed.
    let loverDeathNotice = [];
    let doppelgangerRoleChangeNotice = null;

    if (topCandidates.length === 1 && maxVotes > 0) {
      // Single highest candidate eliminated
      const eliminatedId = topCandidates[0];
      const eliminatedPlayer = updatedPlayers.find(p => p.id === eliminatedId);

      log = addLog(log, nightNumber, dayNumber, 'ACTION', `${eliminatedPlayer.name} mendapatkan suara terbanyak (${maxVotes} suara) dan tereliminasi.`);

      // Direct voting death
      let newDeathsMap = new Map();
      newDeathsMap.set(eliminatedId, 'VOTE');
      // Recursive Lovers Chain for Voting
      let loversChainResolved = false;
      while (!loversChainResolved) {
        loversChainResolved = true;
        const currentDeadIds = Array.from(newDeathsMap.keys());

        for (const deadId of currentDeadIds) {
          const deadPlayer = updatedPlayers.find(p => p.id === deadId);
          if (deadPlayer && deadPlayer.loverId) {
            const partnerId = deadPlayer.loverId;
            const partner = updatedPlayers.find(p => p.id === partnerId);
            if (partner && partner.alive && !newDeathsMap.has(partnerId)) {
              newDeathsMap.set(partnerId, 'LOVER');
              loverDeathNotice.push({
                id: `lover_${partner.id}_${nightNumber}_${dayNumber}`,
                name: partner.name,
                partnerName: deadPlayer.name
              });
              log = addLog(log, nightNumber, dayNumber, 'DEATH', `💔 ${partner.name} ikut meninggal karena pasangan ${deadPlayer.name} mati.`);
              loversChainResolved = false;
            }
          }
        }
      }

      // Mark deaths in state
      newDeathsMap.forEach((reason, deadId) => {
        const idx = updatedPlayers.findIndex(p => p.id === deadId);
        if (idx !== -1) {
          updatedPlayers[idx].alive = false;
          updatedPlayers[idx].deathReason = reason;
          updatedPlayers[idx].deathDay = dayNumber;
          dayDeaths.push({ player: updatedPlayers[idx], reason });
        }
      });

      // If the Doppelganger's target was eliminated by voting (or the Lovers chain),
      // copy that role before evaluating the next win condition.
      ({ players: updatedPlayers, log, notice: doppelgangerRoleChangeNotice } = applyDoppelgangerRoleIfTargetDead(updatedPlayers, log, nightNumber, dayNumber));

      const eliminatedWasJester = eliminatedPlayer?.role === 'JESTER';
      if (eliminatedWasJester) {
        log = addLog(log, nightNumber, dayNumber, 'WIN', `Jester ${eliminatedPlayer.name} berhasil tereliminasi lewat voting dan menang!`);
        const jesterState = {
          ...gameState,
          players: updatedPlayers,
          gameLog: log,
          lastDayDeaths: dayDeaths,
          loverDeathNotice,
          doppelgangerRoleChangeNotice,
          currentPhase: 'GAME_OVER',
          winner: 'JESTER'
        };
        setGameState(jesterState);
        return;
      }
    } else if (maxVotes === 0) {
      // Everyone skipped (or there were no valid votes).
      log = addLog(log, nightNumber, dayNumber, 'INFO', `Semua pemain memilih SKIP VOTE. Tidak ada pemain yang tereliminasi.`);
    } else {
      // Tie vote
      log = addLog(log, nightNumber, dayNumber, 'INFO', `Hasil voting seri! Tidak ada pemain yang tereliminasi.`);
    }

    const tempState = {
      ...gameState,
      players: updatedPlayers,
      gameLog: log,
      lastDayDeaths: dayDeaths,
      loverDeathNotice,
      doppelgangerRoleChangeNotice
    };

    const winResult = checkWinConditions(tempState);
    if (winResult) {
      log = addLog(log, nightNumber, dayNumber, 'WIN', winResult === 'WARGA' ? 'Kemenangan Tim WARGA!' : 'Kemenangan Tim WEREWOLF!');
      setGameState({
        ...tempState,
        currentPhase: 'GAME_OVER',
        winner: winResult,
        gameLog: log
      });
    } else {
      // Advance to next night
      setGameState({
        ...tempState,
        currentPhase: 'NIGHT_INTRO',
        nightNumber: nightNumber + 1,
        dayNumber: dayNumber + 1,
        votes: {},
        currentVoterIndex: 0,
        discussionEndTimestamp: null,
        gameLog: addLog(log, nightNumber + 1, dayNumber + 1, 'INFO', `Memulai Malam ${nightNumber + 1}.`)
      });
    }
  };

  const startDiscussionTimer = () => {
    const endTimestamp = Date.now() + gameState.discussionDurationSeconds * 1000;
    setGameState(prev => ({
      ...prev,
      undoStack: pushUndoState(prev),
      discussionEndTimestamp: endTimestamp,
      isTimerPaused: false,
      pausedRemainingSeconds: null,
      gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', 'Diskusi dimulai (5 Menit).')
    }));
  };

  const pauseDiscussionTimer = () => {
    setGameState(prev => ({
      ...prev,
      isTimerPaused: true,
      pausedRemainingSeconds: remainingSeconds
    }));
  };

  const resumeDiscussionTimer = () => {
    const newEndTimestamp = Date.now() + remainingSeconds * 1000;
    setGameState(prev => ({
      ...prev,
      isTimerPaused: false,
      discussionEndTimestamp: newEndTimestamp,
      pausedRemainingSeconds: null
    }));
  };

  const handleFinishDiscussionEarly = () => {
    setConfirmModalData({
      title: 'Akhiri Diskusi Sekarang?',
      message: 'Apakah Anda yakin ingin menyelesaikan waktu diskusi dan langsung melanjutkan ke sesi voting?',
      onConfirm: () => {
        setConfirmModalData(null);
        triggerAutoTransitionToVoting();
      }
    });
  };

  const handleUndo = () => {
    if (!gameState.undoStack || gameState.undoStack.length === 0) {
      triggerToast('Tidak ada aksi yang dapat dibatalkan.');
      return;
    }

    setConfirmModalData({
      title: 'Batalkan Aksi Terakhir (Undo)?',
      message: 'Apakah Anda yakin ingin membatalkan konfirmasi aksi sebelumnya?',
      onConfirm: () => {
        setConfirmModalData(null);
        setGameState(prev => {
          const stack = [...prev.undoStack];
          const previousState = stack.shift();
          triggerToast('Aksi sebelumnya berhasil dibatalkan.');
          return {
            ...previousState,
            undoStack: stack
          };
        });
      }
    });
  };

  const handleRestartSamePlayers = () => {
    setConfirmModalData({
      title: 'Main Lagi Dengan Pemain Sama?',
      message: 'Semua progres game ini akan direset, dan peran akan diacak ulang untuk pemain yang sama.',
      onConfirm: () => {
        setConfirmModalData(null);
        const playerNames = gameState.players.map(p => p.name);
        const roleList = Object.entries(gameState.roleCounts || {}).flatMap(([role, count]) => Array(Number(count)).fill(role));
        const shuffledRoles = shuffle(roleList.length === playerNames.length ? roleList : getRoleComposition(playerNames.length));

        const newPlayers = playerNames.map((name, idx) => ({
          id: 'player_' + (idx + 1) + '_' + Date.now(),
          name,
          role: shuffledRoles[idx],
          alive: true,
          loverId: null,
          protectedLastNight: false,
          protectedThisNight: false,
          deathReason: null,
          deathNight: null,
          deathDay: null
        }));

        setGameState({
          ...createInitialGameState(),
          players: newPlayers,
          currentPhase: 'ROLE_SUMMARY',
          gameLog: addLog([], 1, 1, 'INFO', `Game diulang dengan ${newPlayers.length} pemain yang sama.`)
        });
      }
    });
  };

  const handleBackToHome = () => {
    setConfirmModalData({
      title: 'KEMBALI KE HALAMAN AWAL?',
      message: 'Permainan yang sedang berjalan akan ditinggalkan. Data permainan saat ini akan dihapus.',
      onConfirm: () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setConfirmModalData(null);
        setShowRoleListDrawer(false);
        setShowGameLogDrawer(false);
        setShowPlayerStatusDrawer(false);
        setShowRulesModal(false);
        setToastMessage(null);
        setInputPlayerNames(['Andi', 'Budi', 'Citra', 'Dika', 'Eka']);
        setPlayerCount(5);
        setNameErrors([]);
        setGameState(createInitialGameState());
      }
    });
  };

  const handleNewGame = () => {
    setConfirmModalData({
      title: 'Mulai Game Baru?',
      message: 'Semua data permainan saat ini akan dihapus permanen. Lanjutkan?',
      onConfirm: () => {
        setConfirmModalData(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setGameState(createInitialGameState());
      }
    });
  };

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderToast = () => {
    if (!toastMessage) return null;
    return (
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-amber-500/50 text-amber-200 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-sm animate-bounce">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{toastMessage}</span>
      </div>
    );
  };

  const renderLoverDeathNotice = () => {
    const notices = gameState.loverDeathNotice || [];
    if (notices.length === 0) return null;

    return (
      <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border-2 border-pink-600 rounded-3xl p-6 shadow-2xl shadow-pink-950/50 space-y-5">
          <div className="text-center space-y-2">
            <div className="text-5xl">💔</div>
            <h3 className="text-2xl font-black text-pink-400">COUPLE TERPUTUS</h3>
            <p className="text-sm text-slate-300">Pasangan Cupid ikut meninggal karena pasangannya mati.</p>
          </div>

          <div className="space-y-2">
            {notices.map((notice) => (
              <div key={notice.id} className="p-4 rounded-2xl bg-pink-950/60 border border-pink-800 text-center">
                <p className="text-lg font-black text-white">{notice.name}</p>
                <p className="text-xs text-pink-300 mt-1">
                  ikut meninggal karena <strong>{notice.partnerName}</strong> mati.
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setGameState(prev => ({ ...prev, loverDeathNotice: [] }))}
            className="w-full py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-black transition"
          >
            MENGERTI
          </button>
        </div>
      </div>
    );
  };

  const renderConfirmModal = () => {
    if (!confirmModalData) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h3 className="text-lg font-bold text-white">{confirmModalData.title}</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{confirmModalData.message}</p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setConfirmModalData(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              onClick={confirmModalData.onConfirm}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-lg shadow-red-900/30 transition"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRulesModal = () => {
    if (!showRulesModal) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <BookOpen className="w-5 h-5" />
              <span>Panduan Aturan Werewolf</span>
            </div>
            <button onClick={() => setShowRulesModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-300">
            <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-300 text-base flex items-center gap-2">
                <Crown className="w-4 h-4" /> Tujuan Permainan
              </h4>
              <p>• <strong>Tim Warga:</strong> Eliminasi seluruh role Evil (Werewolf dan Cultist) dari desa.</p>
              <p>• <strong>Tim Werewolf:</strong> Jumlah role Evil yang hidup mencapai atau melebihi jumlah pemain non-Evil yang hidup.</p>
            </section>

            <section className="space-y-3">
              <h4 className="font-bold text-white text-base">Aturan Peran</h4>
              {Object.entries(ROLES).map(([key, role]) => (
                <div key={key} className={`p-3 rounded-xl border ${role.border} ${role.bg} flex items-start gap-3`}>
                  <span className="text-2xl">{role.icon}</span>
                  <div>
                    <span className={`font-bold ${role.color}`}>{role.name} ({role.team})</span>
                    <p className="text-xs text-slate-300 mt-1">{role.desc}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-pink-400 text-base">Aturan Pasangan (Lovers)</h4>
              <p>• Dipilih oleh Cupid pada Malam 1. Saling terikat secara emosional.</p>
              <p>• Jika salah satu mati (karena Werewolf, Racun Witch, atau Voting), pasangannya akan otomatis ikut mati seketika.</p>
            </section>

            <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-cyan-400 text-base">Urutan Aksi Malam</h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-xs">
                <li><strong>Cupid</strong> (Hanya Malam 1) — Memilih 2 Lovers.</li>
                <li><strong>Werewolf</strong> — Memilih 1 target mangsa.</li>
                <li><strong>Guardian</strong> — Memilih 1 pemain untuk dilindungi.</li>
                <li><strong>Doctor</strong> — Memilih 1 pemain untuk dilindungi.</li>
                <li><strong>Sheriff</strong> — 1x memilih target; hanya Werewolf adalah target benar.</li>
                <li><strong>Doppelganger</strong> — Malam 1 memilih target.</li>
                <li><strong>Seer</strong> — Meramal 1 peran pemain.</li>
                <li><strong>Witch</strong> — Memilih Heal korban Werewolf atau Kill pemain lain.</li>
              </ol>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderRoleListDrawer = () => {
    if (!showRoleListDrawer) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
        <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              <span>Daftar Peran Moderator</span>
            </h3>
            <button onClick={() => setShowRoleListDrawer(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
            {gameState.players.map(player => {
              const roleMeta = ROLES[player.role];
              const lover = player.loverId ? gameState.players.find(p => p.id === player.loverId) : null;
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    player.alive ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-950/60 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{roleMeta.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${player.alive ? 'text-white' : 'text-slate-500 line-through'}`}>
                          {player.name}
                        </span>
                        {lover && (
                          <span className="text-xs bg-pink-950 border border-pink-700 text-pink-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ❤️ {lover.name}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${roleMeta.color}`}>{roleMeta.name}</span>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      player.alive
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                        : 'bg-red-950/80 text-red-400 border-red-900'
                    }`}
                  >
                    {player.alive ? '🟢 Hidup' : '☠️ Tereliminasi'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderGameLogDrawer = () => {
    if (!showGameLogDrawer) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
        <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <span>Catatan Permainan (Game Log)</span>
            </h3>
            <button onClick={() => setShowGameLogDrawer(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {gameState.gameLog.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">Belum ada riwayat permainan.</p>
            ) : (
              gameState.gameLog.map(entry => (
                <div key={entry.id} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-amber-400">
                      Malam {entry.nightNumber} / Hari {entry.dayNumber}
                    </span>
                    <span>{entry.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-snug">{entry.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHeader = () => {
    if (gameState.currentPhase === 'HOME' || gameState.currentPhase === 'SETUP') return null;

    const livingCount = gameState.players.filter(p => p.alive).length;
    const totalCount = gameState.players.length;

    let phaseBadge = '';
    let phaseIcon = <Moon className="w-4 h-4" />;

    switch (gameState.currentPhase) {
      case 'ROLE_SUMMARY':
      case 'ROLE_REVEAL':
        phaseBadge = 'PEMBAGIAN ROLE';
        phaseIcon = <UserCheck className="w-4 h-4 text-cyan-400" />;
        break;
      case 'NIGHT_INTRO':
      case 'NIGHT_CUPID':
      case 'NIGHT_WEREWOLF':
      case 'NIGHT_GUARDIAN':
      case 'NIGHT_DOCTOR':
      case 'NIGHT_SHERIFF':
      case 'NIGHT_DOPPELGANGER':
      case 'NIGHT_SEER':
      case 'NIGHT_WITCH':
        phaseBadge = `MALAM ${gameState.nightNumber}`;
        phaseIcon = <Moon className="w-4 h-4 text-indigo-400" />;
        break;
      case 'MORNING':
        phaseBadge = `PAGI ${gameState.dayNumber}`;
        phaseIcon = <Sun className="w-4 h-4 text-amber-400" />;
        break;
      case 'DISCUSSION':
        phaseBadge = 'WAKTU DISKUSI';
        phaseIcon = <Flame className="w-4 h-4 text-orange-400" />;
        break;
      case 'VOTING':
        phaseBadge = 'SESI VOTING';
        phaseIcon = <Skull className="w-4 h-4 text-red-400" />;
        break;
      case 'GAME_OVER':
        phaseBadge = 'PERMAINAN SELESAI';
        phaseIcon = <Crown className="w-4 h-4 text-amber-400" />;
        break;
      default:
        phaseBadge = 'WEREWOLF';
    }

    return (
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-white shadow-sm">
              {phaseIcon}
              <span>{phaseBadge}</span>
            </div>

            {totalCount > 0 && (
              <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{livingCount}/{totalCount} Hidup</span>
              </div>
            )}
          </div>

          {/* Quick Moderator Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleBackToHome}
              className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 transition"
              title="Kembali ke Halaman Awal"
            >
              <Home className="w-4 h-4" />
            </button>

            {gameState.undoStack && gameState.undoStack.length > 0 && (
              <button
                onClick={handleUndo}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 transition"
                title="Batalkan Aksi Terakhir (Undo)"
              >
                <CornerUpLeft className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowRoleListDrawer(true)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Lihat Semua Role"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Role List</span>
            </button>

            <button
              onClick={() => setShowGameLogDrawer(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              title="Game Log"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowRulesModal(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              title="Aturan"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    );
  };

  const renderHome = () => {
    const hasExistingGame = gameState.players.length > 0 && gameState.currentPhase !== 'HOME';

    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-tr from-red-950 via-slate-900 to-indigo-950 border border-red-500/30 shadow-2xl shadow-red-950/50">
              <span className="text-5xl">🌙</span>
            </div>
            <h1 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-200 to-purple-400 uppercase">
              WEREWOLF
            </h1>
            <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
              Moderator Game Assistant
            </p>
            <p className="text-sm text-slate-300 leading-relaxed px-4">
              Panduan lengkap untuk menjalankan permainan Werewolf tanpa perlu menghafal semua aturan, giliran peran, dan status pemain.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {hasExistingGame && (
              <button
                onClick={() => {}} // Remains in state phase
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 transition"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>LANJUTKAN GAME (Malam {gameState.nightNumber})</span>
              </button>
            )}

            <button
              onClick={() => {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                setGameState({ ...createInitialGameState(), currentPhase: 'SETUP' });
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-amber-700 hover:opacity-95 text-white font-bold text-base shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-5 h-5" />
              <span>MULAI GAME BARU</span>
            </button>

            <button
              onClick={() => setShowRulesModal(true)}
              className="w-full py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>ATURAN PERMAINAN</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSetup = () => {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>SETUP PEMAIN</span>
          </h2>
          <p className="text-xs text-slate-400">Pilih jumlah pemain (5–20) dan masukkan nama setiap pemain.</p>
        </div>

        {/* Player Count Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Jumlah Pemain: <span className="text-amber-400 text-base">{playerCount} Pemain</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(cnt => (
              <button
                key={cnt}
                onClick={() => handlePlayerCountChange(cnt)}
                className={`w-10 h-10 rounded-xl font-bold text-sm border transition ${
                  playerCount === cnt
                    ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>

        {/* Role Quantity Setup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Jumlah Role</h3><span className="text-xs font-bold text-amber-400">{Object.values(roleCountsDraft).reduce((a,b)=>a+(Number(b)||0),0)} / {playerCount}</span></div>
          <p className="text-xs text-slate-500">Moderator bebas menentukan jumlah setiap role. Total harus sama dengan jumlah pemain.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[45vh] overflow-y-auto pr-1">
            {ROLE_KEYS.map(roleKey => { const meta=ROLES[roleKey]; const value=Number(roleCountsDraft[roleKey]||0); return <div key={roleKey} className="rounded-xl border border-slate-800 bg-slate-950 p-2.5"><div className="flex items-center gap-2 mb-2"><span>{meta.icon}</span><span className={`text-xs font-bold ${meta.color}`}>{meta.name}</span></div><div className="flex items-center gap-1"><button onClick={()=>setRoleCountsDraft(prev=>({...prev,[roleKey]:Math.max(0,value-1)}))} className="w-8 h-8 rounded-lg bg-slate-800 text-white">−</button><div className="flex-1 text-center font-black text-white">{value}</div><button onClick={()=>setRoleCountsDraft(prev=>({...prev,[roleKey]:Math.min(playerCount,value+1)}))} className="w-8 h-8 rounded-lg bg-slate-800 text-white">+</button></div></div>; })}
          </div>
        </div>

        {/* Player Name Inputs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nama Pemain</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
            {inputPlayerNames.map((name, idx) => (
              <div key={idx} className="space-y-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    placeholder={`Nama Pemain ${idx + 1}`}
                    className={`w-full pl-10 pr-3 py-2.5 bg-slate-950 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 ${
                      nameErrors[idx]
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-800 focus:border-amber-500 focus:ring-amber-500/20'
                    }`}
                  />
                </div>
                {nameErrors[idx] && <p className="text-xs text-red-400 font-medium pl-1">{nameErrors[idx]}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { localStorage.removeItem(LOCAL_STORAGE_KEY); setGameState(createInitialGameState()); }}
            className="w-1/3 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
          >
            Batal
          </button>
          <button
            onClick={validateAndGenerateRoles}
            className="w-2/3 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-base shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-5 h-5" />
            <span>ACAK ROLE</span>
          </button>
        </div>
      </div>
    );
  };

  const renderRoleSummary = () => {
    const rolesInGame = gameState.players.reduce((acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <UserCheck className="w-6 h-6 text-cyan-400" />
            <span>KOMPOSISI ROLE</span>
          </h2>
          <p className="text-xs text-slate-400">
            Berikut adalah peran yang akan dibagikan secara acak kepada {gameState.players.length} pemain.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(rolesInGame).map(([roleKey, count]) => {
            const meta = ROLES[roleKey];
            return (
              <div key={roleKey} className={`p-4 rounded-2xl border ${meta.border} ${meta.bg} flex items-center justify-between shadow-lg`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{meta.icon}</span>
                  <div>
                    <h4 className={`font-bold ${meta.color}`}>{meta.name}</h4>
                    <span className="text-xs text-slate-400">{meta.team}</span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-slate-900/80 rounded-xl border border-slate-700 text-white font-extrabold text-sm">
                  x{count}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            Setiap pemain akan diberikan kesempatan melihat peran masing-masing secara rahasia satu per satu pada tahap selanjutnya.
          </span>
        </div>

        <button
          onClick={startRoleReveal}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-cyan-950/40 flex items-center justify-center gap-2 transition"
        >
          <span>BAGIKAN ROLE</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderRoleReveal = () => {
    const { revealPlayerIndex, isRoleCardOpen, players } = gameState;
    const currentPlayer = players[revealPlayerIndex];
    const roleMeta = ROLES[currentPlayer.role];

    // Additional info for specific roles
    let extraNotes = null;
    if (currentPlayer.role === 'WEREWOLF') {
      const werewolfTeammates = players.filter(p => p.role === 'WEREWOLF' && p.id !== currentPlayer.id);
      if (werewolfTeammates.length > 0) {
        extraNotes = `Rekan Werewolf kamu: ${werewolfTeammates.map(p => p.name).join(', ')}`;
      } else {
        extraNotes = `Kamu adalah satu-satunya Werewolf dalam permainan ini.`;
      }
    } else if (currentPlayer.role === 'LYCAN') {
      extraNotes = `Seer akan melihatmu sebagai Werewolf jika diramal.`;
    } else if (currentPlayer.role === 'CUPID') {
      extraNotes = `Kamu akan memilih dua pemain menjadi Pasangan Lovers pada Malam Pertama.`;
    }

    return (
      <div className="max-w-md mx-auto p-4 sm:p-6 min-h-[80vh] flex flex-col justify-between space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            PEMBAGIAN ROLE ({revealPlayerIndex + 1} / {players.length})
          </span>
          <h2 className="text-3xl font-extrabold text-white">{currentPlayer.name}</h2>
          <p className="text-xs text-amber-300">Serahkan perangkat ini hanya kepada {currentPlayer.name}.</p>
        </div>

        {/* Card flip reveal area */}
        <div className="flex-1 flex items-center justify-center my-4">
          {!isRoleCardOpen ? (
            <div
              onClick={toggleRoleCard}
              className="w-full aspect-[3/4] max-w-xs rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-2 border-dashed border-amber-500/40 flex flex-col items-center justify-center p-6 text-center cursor-pointer shadow-2xl hover:border-amber-400 transition"
            >
              <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 shadow-inner mb-4">
                <Lock className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">ROLE RAHASIA</h3>
              <p className="text-xs text-slate-400">Ketuk di sini untuk membuka kartu role kamu.</p>
            </div>
          ) : (
            <div
              className={`w-full max-w-xs rounded-3xl bg-gradient-to-br ${roleMeta.accent} border-2 ${roleMeta.border} p-6 flex flex-col items-center justify-between text-center shadow-2xl space-y-6 animate-fadeIn`}
            >
              <div className="space-y-3">
                <span className="text-6xl block">{roleMeta.icon}</span>
                <h3 className={`text-2xl font-black uppercase tracking-wider ${roleMeta.color}`}>
                  {roleMeta.name}
                </h3>
                <span className="inline-block px-3 py-1 rounded-full bg-black/40 text-xs font-semibold text-slate-200">
                  Tim {roleMeta.team}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/10">
                {roleMeta.desc}
              </p>

              {extraNotes && (
                <div className="text-xs font-medium text-amber-300 bg-amber-950/60 p-2.5 rounded-xl border border-amber-700/50">
                  {extraNotes}
                </div>
              )}

              <button
                onClick={toggleRoleCard}
                className="px-4 py-2 rounded-xl bg-black/50 hover:bg-black/70 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Sembunyikan Role</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div>
          {isRoleCardOpen ? (
            <button
              onClick={nextRevealPlayer}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 transition"
            >
              <span>TUTUP & LANJUT PEMAIN PERAN NEXT</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={toggleRoleCard}
              className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base border border-slate-700 shadow-xl transition"
            >
              LIHAT ROLE
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderNightIntro = () => {
    return (
      <div className="max-w-md mx-auto p-6 min-h-[75vh] flex flex-col justify-between text-center space-y-6">
        <div className="space-y-4 pt-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-950 border border-indigo-700/50 text-indigo-400 shadow-2xl shadow-indigo-950/80">
            <Moon className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">MALAM {gameState.nightNumber}</h2>
          <p className="text-lg italic text-amber-200 font-serif">
            "Semua pemain, silakan tutup mata. Malam telah tiba."
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2 text-left">
          <span className="font-bold text-slate-200 uppercase tracking-wider block">Urutan Aksi Malam Ini:</span>
          <ul className="space-y-1 list-disc list-inside">
            {gameState.nightNumber === 1 && gameState.players.some(p => p.role === 'CUPID' && p.alive) && (
              <li>Cupid memilih 2 Lovers</li>
            )}
            {gameState.players.some(p => p.role === 'WEREWOLF' && p.alive) && <li>Werewolf memilih korban</li>}
            {gameState.players.some(p => p.role === 'GUARDIAN' && p.alive) && <li>Guardian melindungi 1 pemain</li>}
            {gameState.players.some(p => p.role === 'DOCTOR' && p.alive) && <li>Doctor melindungi 1 pemain</li>}
            {gameState.players.some(p => p.role === 'SHERIFF' && p.alive && !gameState.sheriffUsed) && <li>Sheriff memilih 1 target (1x per game)</li>}
            {gameState.nightNumber === 1 && gameState.players.some(p => p.role === 'DOPPELGANGER' && p.alive && !gameState.doppelgangerTargetId) && <li>Doppelganger memilih target</li>}
            {gameState.players.some(p => p.role === 'SEER' && p.alive) && <li>Seer meramal 1 pemain</li>}
            {gameState.players.some(p => p.role === 'WITCH' && p.alive) && <li>Witch memutuskan potion</li>}
          </ul>
        </div>

        <button
          onClick={advanceNightPhase}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 transition"
        >
          <span>MULAI AKSI MALAM</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderNightCupid = () => {
    const livingPlayers = gameState.players.filter(p => p.alive);
    const lover1 = gameState.players.find(p => p.id === gameState.cupidLover1Id);
    const lover2 = gameState.players.find(p => p.id === gameState.cupidLover2Id);

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-pink-950 border border-pink-700 text-pink-400">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-2xl font-bold text-pink-400">💘 CUPID</h2>
          <p className="text-sm text-slate-300">
            Cupid, silakan buka mata. Pilih dua pemain hidup yang akan terikat menjadi Pasangan (Lovers).
          </p>
        </div>

        {/* Selected Couple Display */}
        <div className="bg-slate-900 border border-pink-900/50 rounded-2xl p-4 text-center space-y-2">
          <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">Pasangan Terpilih:</span>
          <div className="flex items-center justify-center gap-3 text-lg font-bold text-white">
            <span className={lover1 ? 'text-pink-400' : 'text-slate-600'}>
              {lover1 ? lover1.name : '[ Pilih Pemain 1 ]'}
            </span>
            <Heart className="w-5 h-5 text-pink-500 fill-current" />
            <span className={lover2 ? 'text-pink-400' : 'text-slate-600'}>
              {lover2 ? lover2.name : '[ Pilih Pemain 2 ]'}
            </span>
          </div>
        </div>

        {/* Player Selection Grid */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pilih Pemain:</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
            {livingPlayers.map(player => {
              const isSelected1 = gameState.cupidLover1Id === player.id;
              const isSelected2 = gameState.cupidLover2Id === player.id;
              const isSelected = isSelected1 || isSelected2;

              return (
                <button
                  key={player.id}
                  onClick={() => {
                    setGameState(prev => {
                      if (prev.cupidLover1Id === player.id) {
                        return { ...prev, cupidLover1Id: null };
                      }
                      if (prev.cupidLover2Id === player.id) {
                        return { ...prev, cupidLover2Id: null };
                      }
                      if (!prev.cupidLover1Id) {
                        return { ...prev, cupidLover1Id: player.id };
                      }
                      if (!prev.cupidLover2Id) {
                        return { ...prev, cupidLover2Id: player.id };
                      }
                      return { ...prev, cupidLover2Id: player.id };
                    });
                  }}
                  className={`p-3 rounded-xl border text-sm font-bold text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-pink-950 border-pink-500 text-pink-200 shadow-lg shadow-pink-950/50'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{player.name}</span>
                  {isSelected && <Heart className="w-4 h-4 text-pink-400 fill-current" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setGameState(prev => ({ ...prev, cupidLover1Id: null, cupidLover2Id: null }))}
            className="w-1/3 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
          >
            Reset
          </button>
          <button
            onClick={handleConfirmCupid}
            className="w-2/3 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-base shadow-xl shadow-pink-950/50 transition"
          >
            KONFIRMASI PASANGAN
          </button>
        </div>
      </div>
    );
  };

  const renderNightWerewolf = () => {
    const livingWerewolves = gameState.players.filter(p => p.role === 'WEREWOLF' && p.alive);
    const livingCandidates = gameState.players.filter(p => p.alive);
    const selectedTarget = gameState.players.find(p => p.id === gameState.werewolfTargetId);

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950 border border-red-700 text-red-400">
            <span className="text-3xl">🐺</span>
          </div>
          <h2 className="text-2xl font-bold text-red-400">WEREWOLF PHASE</h2>
          <p className="text-sm text-slate-300">
            Beritahu para Werewolf untuk membuka mata. Werewolf memilih 1 pemain hidup untuk dieliminasi.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center justify-between">
          <span className="font-semibold">Werewolf Hidup:</span>
          <span className="text-red-400 font-bold">{livingWerewolves.map(w => w.name).join(', ')}</span>
        </div>

        {/* Selected Target Banner */}
        {selectedTarget && (
          <div className="bg-red-950/80 border border-red-700 rounded-2xl p-4 text-center space-y-1 animate-fadeIn">
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider">Target Mengsa Terpilih:</span>
            <div className="text-xl font-black text-white">{selectedTarget.name}</div>
          </div>
        )}

        {/* Target Options */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pilih Target Mangsa:</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
            {livingCandidates.map(player => {
              const isSelected = gameState.werewolfTargetId === player.id;
              const isWerewolf = player.role === 'WEREWOLF';

              return (
                <button
                  key={player.id}
                  onClick={() => {
                    setGameState(prev => ({
                      ...prev,
                      werewolfTargetId: player.id
                    }));
                  }}
                  className={`p-3 rounded-xl border text-sm font-bold text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-red-950 border-red-500 text-red-200 shadow-lg shadow-red-950/50'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{player.name}</span>
                  {isWerewolf && <span className="text-xs text-red-400 font-normal">(WW)</span>}
                  {isSelected && <Crosshair className="w-4 h-4 text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => {
            if (!gameState.werewolfTargetId) {
              triggerToast('Silakan pilih target mangsa Werewolf terlebih dahulu.');
              return;
            }
            triggerToast(`Target Werewolf terpilih: ${selectedTarget?.name}. Werewolf silakan tutup mata.`);
            advanceNightPhase();
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-base shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition"
        >
          <span>KONFIRMASI TARGET WEREWOLF</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderNightGuardian = () => {
    const livingPlayers = gameState.players.filter(p => p.alive);
    const selectedTarget = gameState.players.find(p => p.id === gameState.guardianTargetId);

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-950 border border-blue-700 text-blue-400">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-blue-400">🛡️ GUARDIAN PHASE</h2>
          <p className="text-sm text-slate-300">
            Guardian, silakan buka mata. Pilih 1 pemain hidup yang ingin dilindungi dari serangan Werewolf malam ini.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Guardian tidak dapat melindungi pemain yang sama 2 malam berturut-turut.</span>
        </div>

        {/* Selected Protection Banner */}
        {selectedTarget && (
          <div className="bg-blue-950/80 border border-blue-700 rounded-2xl p-4 text-center space-y-1 animate-fadeIn">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Pemain Dilindungi:</span>
            <div className="text-xl font-black text-white">{selectedTarget.name}</div>
          </div>
        )}

        {/* Selection Options */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pilih Pemain:</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
            {livingPlayers.map(player => {
              const isSelected = gameState.guardianTargetId === player.id;
              const isDisabled = player.protectedLastNight;

              return (
                <button
                  key={player.id}
                  disabled={isDisabled}
                  onClick={() => {
                    setGameState(prev => ({
                      ...prev,
                      guardianTargetId: player.id
                    }));
                  }}
                  className={`p-3 rounded-xl border text-sm font-bold text-left transition flex items-center justify-between ${
                    isDisabled
                      ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-950 border-blue-500 text-blue-200 shadow-lg shadow-blue-950/50'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{player.name}</span>
                  {isDisabled && <span className="text-[10px] text-slate-500 font-normal">(Malam Lalu)</span>}
                  {isSelected && <Shield className="w-4 h-4 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => {
            if (!gameState.guardianTargetId) {
              triggerToast('Silakan pilih pemain untuk dilindungi Guardian.');
              return;
            }
            triggerToast(`Guardian melindungi ${selectedTarget?.name}. Guardian silakan tutup mata.`);
            advanceNightPhase();
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-blue-950/50 flex items-center justify-center gap-2 transition"
        >
          <span>KONFIRMASI PERLINDUNGAN GUARDIAN</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderNightDoctor = () => {
    const livingPlayers = gameState.players.filter(p => p.alive);
    const selected = gameState.players.find(p => p.id === gameState.doctorTargetId);
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-950 border border-emerald-700 text-emerald-400"><span className="text-3xl">⚕️</span></div><h2 className="text-2xl font-bold text-emerald-400">DOCTOR PHASE</h2><p className="text-sm text-slate-300">Doctor memilih 1 pemain hidup untuk dilindungi dari serangan Werewolf malam ini.</p></div>
        {selected && <div className="bg-emerald-950/80 border border-emerald-700 rounded-2xl p-4 text-center"><span className="text-xs font-bold text-emerald-300">TARGET PERLINDUNGAN</span><div className="text-xl font-black text-white mt-1">{selected.name}</div></div>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
          {livingPlayers.map(p => <button key={p.id} onClick={() => setGameState(prev => ({ ...prev, doctorTargetId: p.id }))} className={`p-3 rounded-xl border text-sm font-bold text-left transition ${gameState.doctorTargetId === p.id ? 'bg-emerald-950 border-emerald-500 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>{p.name}</button>)}
        </div>
        <button onClick={() => { if (!gameState.doctorTargetId) return triggerToast('Pilih target Doctor.'); triggerToast('Doctor selesai.'); advanceNightPhase(); }} className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2"><span>KONFIRMASI DOCTOR</span><ArrowRight className="w-5 h-5" /></button>
      </div>
    );
  };

  const renderNightSheriff = () => {
    const sheriff = gameState.players.find(p => p.role === 'SHERIFF' && p.alive);
    const candidates = gameState.players.filter(p => p.alive && p.id !== sheriff?.id);
    const selected = gameState.players.find(p => p.id === gameState.sheriffTargetId);
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-yellow-950 border border-yellow-700 text-yellow-300"><Award className="w-8 h-8" /></div><h2 className="text-2xl font-bold text-yellow-300">⭐ SHERIFF PHASE</h2><p className="text-sm text-slate-300">Sekali per game, Sheriff memilih 1 pemain. Jika target adalah Werewolf, target tereliminasi dan Sheriff selamat. Jika target bukan Werewolf, Sheriff tereliminasi.</p></div>
        <div className="bg-yellow-950/50 border border-yellow-800 rounded-2xl p-4 text-center text-xs text-yellow-200">Lycan dan Cultist <strong>bukan</strong> target benar. Hanya role Werewolf yang dianggap jawaban benar.</div>
        {selected && <div className="bg-slate-900 border border-yellow-700 rounded-2xl p-4 text-center"><span className="text-xs font-bold text-yellow-300">TARGET TERPILIH</span><div className="text-xl font-black text-white mt-1">{selected.name}</div></div>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
          {candidates.map(p => <button key={p.id} onClick={() => setGameState(prev => ({ ...prev, sheriffTargetId: p.id }))} className={`p-3 rounded-xl border text-sm font-bold text-left transition ${gameState.sheriffTargetId === p.id ? 'bg-yellow-950 border-yellow-500 text-yellow-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>{p.name}</button>)}
        </div>
        <button onClick={handleConfirmSheriff} className="w-full py-4 rounded-2xl bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-black flex items-center justify-center gap-2"><span>KONFIRMASI AKSI SHERIFF</span><ArrowRight className="w-5 h-5" /></button>
      </div>
    );
  };

  const renderNightDoppelganger = () => {
    const livingPlayers = gameState.players.filter(p => p.alive && p.role !== 'DOPPELGANGER');
    const selected = gameState.players.find(p => p.id === gameState.doppelgangerTargetId);
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2"><div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-950 border border-indigo-700 text-indigo-300"><span className="text-3xl">🎭</span></div><h2 className="text-2xl font-bold text-indigo-300">DOPPELGANGER PHASE</h2><p className="text-sm text-slate-300">Malam 1: pilih 1 target hidup. Jika target mati, Doppelganger mengambil role target tersebut.</p></div>
        {selected && <div className="bg-indigo-950/70 border border-indigo-700 rounded-2xl p-4 text-center"><span className="text-xs font-bold text-indigo-300">TARGET DOPPELGANGER</span><div className="text-xl font-black text-white mt-1">{selected.name}</div></div>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">{livingPlayers.map(p => <button key={p.id} onClick={() => setGameState(prev => ({ ...prev, doppelgangerTargetId: p.id }))} className={`p-3 rounded-xl border text-sm font-bold text-left ${gameState.doppelgangerTargetId === p.id ? 'bg-indigo-950 border-indigo-500 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>{p.name}</button>)}</div>
        <button onClick={handleConfirmDoppelganger} className="w-full py-4 rounded-2xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold flex items-center justify-center gap-2"><span>KONFIRMASI TARGET DOPPELGANGER</span><ArrowRight className="w-5 h-5" /></button>
      </div>
    );
  };

  const renderNightSeer = () => {
    const livingPlayers = gameState.players.filter(p => p.alive && p.role !== 'SEER');
    const result = gameState.seerResult;

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-950 border border-cyan-700 text-cyan-400">
            <Eye className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-cyan-400">🔮 SEER PHASE</h2>
          <p className="text-sm text-slate-300">
            Seer, silakan buka mata. Pilih 1 pemain hidup untuk diramal perannya.
          </p>
        </div>

        {/* Seer Inspection Result Modal Overlay Card */}
        {result ? (
          <div className="bg-gradient-to-br from-cyan-950 via-slate-900 to-cyan-950 border-2 border-cyan-500 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-fadeIn">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">HASIL RAMALAN SEER</span>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">{result.targetName}</h3>
              <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold text-base">
                ROLE: {result.displayedRole}
              </div>
            </div>

            {result.isLycanNote && (
              <p className="text-xs text-amber-300 bg-amber-950/60 p-3 rounded-xl border border-amber-700/50">
                Catatan: Lycan terlihat sebagai Werewolf bagi Seer (Secara internal tetap Warga).
              </p>
            )}

            <button
              onClick={() => {
                triggerToast('Seer silakan tutup mata.');
                advanceNightPhase();
              }}
              className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-950/50 transition"
            >
              TUTUP HASIL & SELESAI SEER
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pilih Pemain Untuk Diramal:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
              {livingPlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => handleSeerInspect(player.id)}
                  className="p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-300 hover:bg-cyan-950 hover:border-cyan-700 text-sm font-bold text-left transition flex items-center justify-between"
                >
                  <span className="truncate">{player.name}</span>
                  <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNightWitch = () => {
    const livingTargets = gameState.players.filter(p => p.alive);
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-950 border border-purple-700 text-purple-400">
            <FlaskConical className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-purple-400">🧪 WITCH PHASE</h2>
          <p className="text-sm text-slate-300">Witch, buka mata. Korban Werewolf TIDAK ditampilkan. Jika memakai Heal, pilih tebakan target secara blind.</p>
        </div>
        <div className="bg-slate-900 border border-purple-900/50 rounded-2xl p-4 text-center">
          <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">Informasi Korban</div>
          <div className="text-lg font-black text-slate-300 mt-1">RAHASIA — WITCH TIDAK MELIHAT KORBAN</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="font-bold text-emerald-400 text-sm">❤️ Heal Potion</span><span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">{gameState.witchHealUsed ? 'TERPAKAI' : 'TERSEDIA'}</span></div>
            <p className="text-xs text-slate-400">Pilih tebakan pemain yang ingin diselamatkan. Tebakan benar-benar blind.</p>
            <select disabled={gameState.witchHealUsed} value={gameState.witchHealTargetId || ''} onChange={e => setGameState(prev => ({ ...prev, witchHealTargetId: e.target.value || null, witchHealUsedThisNight: !!e.target.value, witchHealUsed: !!e.target.value }))} className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none">
              <option value="">-- Tebak Target Heal --</option>
              {livingTargets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="font-bold text-purple-400 text-sm">☠️ Kill Potion</span><span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-950 text-purple-400 border border-purple-800">{gameState.witchKillUsed ? 'TERPAKAI' : 'TERSEDIA'}</span></div>
            <p className="text-xs text-slate-400">Membunuh 1 pemain hidup pilihan Witch.</p>
            <select disabled={gameState.witchKillUsed} value={gameState.witchKillTargetId || ''} onChange={e => { const id=e.target.value||null; setGameState(prev=>({...prev, witchKillTargetId:id, witchKillUsed:!!id})); }} className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none">
              <option value="">-- Pilih Target Kill --</option>
              {livingTargets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => { triggerToast('Witch silakan tutup mata.'); advanceNightPhase(); }} className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-purple-950/50 flex items-center justify-center gap-2 transition"><span>SELESAIKAN WITCH & PROSES MALAM</span><ArrowRight className="w-5 h-5" /></button>
      </div>
    );
  };

  const renderMorning = () => {
    const deaths = gameState.lastNightDeaths;

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 text-center space-y-6">
        <div className="space-y-3 pt-4">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-amber-950/80 border border-amber-600/50 text-amber-400 shadow-2xl">
            <Sun className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">🌅 PAGI HARI {gameState.dayNumber}</h2>
          <p className="text-sm text-slate-300">Matahari telah terbit di desa Werewolf.</p>
        </div>

        {/* Outcome Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          {deaths.length === 0 ? (
            <div className="space-y-2">
              <span className="text-4xl">🕊️</span>
              <h3 className="text-xl font-bold text-emerald-400">Semua Pemain Selamat!</h3>
              <p className="text-xs text-slate-300">Semalam tidak ada pemain yang tereliminasi dari permainan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-4xl">☠️</span>
              <h3 className="text-lg font-bold text-red-400">Pemain Tereliminasi Semalam:</h3>
              <div className="space-y-2">
                {deaths.map(({ player, reason }) => (
                  <div key={player.id} className="p-3 bg-red-950/60 border border-red-800 rounded-2xl flex items-center justify-between">
                    <span className="font-extrabold text-white text-base">{player.name}</span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-red-900 text-red-200 font-semibold">
                      {reason === 'WEREWOLF' ? 'Serangan Werewolf' : reason === 'WITCH' ? 'Racun Witch' : reason === 'SHERIFF' ? 'Eliminasi Sheriff' : reason === 'SHERIFF_MISS' ? 'Salah memilih target Sheriff' : 'Efek Lovers'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setGameState(prev => ({
              ...prev,
              currentPhase: 'DISCUSSION',
              gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', `Sesi Pagi selesai. Memulai diskusi Hari ${prev.dayNumber}.`)
            }));
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition"
        >
          <span>LANJUT KE WAKTU DISKUSI</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderDiscussion = () => {
    const isTimerRunning = gameState.discussionEndTimestamp && !gameState.isTimerPaused;

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 text-center space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-950 border border-orange-700 text-orange-400">
            <Flame className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">🗣️ WAKTU DISKUSI</h2>
          <p className="text-xs text-slate-400">
            Pemain mendiskusikan petunjuk dan dugaan untuk menentukan siapa yang akan divote.
          </p>
        </div>

        {gameState.players.some(p => p.role === 'PRIEST' && p.alive) && (
          <div className="bg-violet-950/50 border border-violet-800 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-violet-300">✝️ Priest</span>
              <span className="text-[10px] px-2 py-1 rounded-full border border-violet-700 bg-violet-950 text-violet-300 font-bold">{gameState.priestUsed ? 'TERPAKAI' : '1x TERSEDIA'}</span>
            </div>
            <p className="text-xs text-slate-300">Sekali per game, pilih 1 pemain hidup untuk diberkati. Target terlindungi dari serangan Werewolf pada malam berikutnya.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gameState.players.filter(p => p.alive).map(p => (
                <button key={p.id} disabled={gameState.priestUsed} onClick={() => handlePriestBless(p.id)} className={`p-2 rounded-xl border text-xs font-bold ${gameState.priestTargetId === p.id ? 'bg-violet-900 border-violet-500 text-violet-100' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'} ${gameState.priestUsed ? 'opacity-60 cursor-not-allowed' : ''}`}>{p.name}</button>
              ))}
            </div>
          </div>
        )}

        {/* Big Countdown Timer */}
        <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">SISA WAKTU DISKUSI</span>
          <div className="text-6xl font-black font-mono text-amber-400 tracking-wider">
            {formatTime(remainingSeconds)}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {!gameState.discussionEndTimestamp ? (
              <button
                onClick={startDiscussionTimer}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>MULAI TIMER</span>
              </button>
            ) : isTimerRunning ? (
              <button
                onClick={pauseDiscussionTimer}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center gap-2 border border-slate-700 transition"
              >
                <Pause className="w-4 h-4" />
                <span>PAUSE</span>
              </button>
            ) : (
              <button
                onClick={resumeDiscussionTimer}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME</span>
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleFinishDiscussionEarly}
          className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition"
        >
          <span>SELESAIKAN DISKUSI & MULAI VOTING</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderVoting = () => {
    const livingMayor = gameState.players.find(p => p.role === 'MAYOR' && p.alive);
    const livingPlayers = gameState.players.filter(p => p.alive);
    const { currentVoterIndex, votes } = gameState;
    const currentVoter = livingPlayers[currentVoterIndex];

    const isAllVotesDone = currentVoterIndex >= livingPlayers.length;

    // Tally vote counts for preview
    const voteTally = {};
    Object.entries(votes).forEach(([voterId, targetId]) => {
      const voter = gameState.players.find(p => p.id === voterId && p.alive);
      if (!voter || !targetId) return; // SKIP VOTE is not counted
      const weight = voter.role === 'MAYOR' && gameState.mayorRevealed ? 2 : 1;
      voteTally[targetId] = (voteTally[targetId] || 0) + weight;
    });

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950 border border-red-700 text-red-400">
            <Skull className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">🗳️ SESI VOTING</h2>
          <p className="text-xs text-slate-400">
            Setiap pemain hidup memberikan 1 suara untuk mengeliminasi terduga Werewolf.
          </p>
        </div>

        <div className="space-y-2">
          {livingMayor && !gameState.mayorRevealed && <button onClick={handleMayorReveal} className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-sm">👑 UNGKAP IDENTITAS MAYOR</button>}
          {gameState.mayorRevealed && livingMayor && <div className="bg-amber-950/50 border border-amber-800 rounded-2xl p-3 text-center text-xs text-amber-200">👑 Mayor <strong>{livingMayor.name}</strong> aktif. Suara Mayor bernilai 2.</div>}
        </div>

        {!isAllVotesDone && currentVoter ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400">PEMILIH ({currentVoterIndex + 1}/{livingPlayers.length})</span>
              <span className="text-lg font-black text-amber-400">{currentVoter.name}</span>
            </div>

            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Pilih Target Vote:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[35vh] overflow-y-auto">
              {livingPlayers
                .filter(p => p.id !== currentVoter.id) // Cannot vote self
                .map(target => (
                  <button
                    key={target.id}
                    onClick={() => handleVoteSubmit(currentVoter.id, target.id)}
                    className="p-3 rounded-xl border bg-slate-950 border-slate-800 text-slate-300 hover:bg-red-950 hover:border-red-700 text-sm font-bold text-left transition flex items-center justify-between"
                  >
                    <span className="truncate">{target.name}</span>
                    <Skull className="w-4 h-4 text-red-400 shrink-0" />
                  </button>
                ))}
            </div>

            <button
              onClick={() => handleVoteSubmit(currentVoter.id, null)}
              className="w-full py-3 rounded-2xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm flex items-center justify-center gap-2 transition"
            >
              <span>⏭️ SKIP VOTE</span>
            </button>
            <p className="text-[11px] text-center text-slate-500">Skip Vote = tidak memberikan suara kepada siapa pun.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white text-center">HASIL VOTING TERKUMPUL</h3>
            <div className="space-y-2">
              {Object.entries(voteTally).length === 0 && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center text-sm text-slate-400">
                  Semua pemain memilih skip / belum ada suara masuk. Tidak ada pemain yang akan tereliminasi.
                </div>
              )}
              {Object.entries(voteTally).map(([targetId, count]) => {
                const targetName = gameState.players.find(p => p.id === targetId)?.name;
                return (
                  <div key={targetId} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white">{targetName}</span>
                    <span className="px-3 py-1 bg-red-950 text-red-300 border border-red-800 rounded-full font-black text-xs">
                      {count} Suara
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={resolveVotingResults}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-base shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition"
            >
              <span>PROSES HASIL VOTING</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderGameOver = () => {
    const isWargaWin = gameState.winner === 'WARGA';
    const isJesterWin = gameState.winner === 'JESTER';

    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6 text-center space-y-6">
        <div className="space-y-4 pt-4">
          <div className={`inline-flex items-center justify-center p-5 rounded-3xl border shadow-2xl ${
            isWargaWin ? 'bg-emerald-950 border-emerald-600 text-emerald-400' : isJesterWin ? 'bg-pink-950 border-pink-600 text-pink-400' : 'bg-red-950 border-red-600 text-red-400'
          }`}>
            <Crown className="w-16 h-16 animate-bounce" />
          </div>
          <h2 className={`text-3xl font-black uppercase tracking-wider ${isWargaWin ? 'text-emerald-400' : isJesterWin ? 'text-pink-400' : 'text-red-400'}`}>
            {isWargaWin ? '🏆 TIM WARGA MENANG' : isJesterWin ? '🃏 JESTER MENANG' : '🐺 TIM WEREWOLF MENANG'}
          </h2>
          <p className="text-xs text-slate-300">
            {isWargaWin
              ? 'Seluruh role Evil berhasil dieliminasi dari desa!'
              : isJesterWin
              ? 'Jester berhasil tereliminasi melalui voting siang hari dan memenangkan permainan!'
              : 'Jumlah role Evil telah menyamai atau melebihi pemain non-Evil yang hidup!'}
          </p>
        </div>

        {/* Final Player Roles Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl text-left">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">HASIL PERAN AKHIR PEMAIN</h3>
          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            {gameState.players.map(p => {
              const meta = ROLES[p.role];
              return (
                <div key={p.id} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <span className="font-bold text-white text-sm block">{p.name}</span>
                      <span className={`font-semibold ${meta.color}`}>{meta.name}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full font-bold border ${
                    p.alive ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-red-950 text-red-400 border-red-900'
                  }`}>
                    {p.alive ? '🟢 Bertahan Hidup' : `☠️ Mati (${p.deathReason || 'Eliminasi'})`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleRestartSamePlayers}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-5 h-5" />
            <span>MAIN LAGI DENGAN PEMAIN SAMA</span>
          </button>

          <button
            onClick={handleNewGame}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition"
          >
            GAME BARU
          </button>
        </div>
      </div>
    );
  };

  const renderDoppelgangerRoleChangeNotice = () => {
    const notice = gameState.doppelgangerRoleChangeNotice;
    if (!notice) return null;

    const newRole = ROLES[notice.newRole] || { name: notice.newRole, icon: '🎭', color: 'text-indigo-300', bg: 'bg-indigo-950/80', border: 'border-indigo-600' };

    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-indigo-500/60 bg-slate-900 shadow-2xl shadow-indigo-950/60 overflow-hidden">
          <div className="p-6 text-center space-y-5">
            <div className="mx-auto w-20 h-20 rounded-full bg-indigo-950 border border-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950">
              <span className="text-5xl">🎭</span>
            </div>
            <div>
              <div className="text-xs font-black tracking-[0.2em] text-indigo-400 uppercase">DOPPELGANGER AKTIF</div>
              <h2 className="text-2xl font-black text-white mt-2">Peranmu telah berubah!</h2>
              <p className="text-sm text-slate-400 mt-2">Target yang kamu pilih, <strong className="text-white">{notice.targetName}</strong>, telah mati.</p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div className="text-xs text-slate-500 uppercase font-bold">Sebelumnya</div>
                <div className="text-lg font-black text-slate-300 mt-1">🎭 Doppelganger</div>
              </div>
              <ArrowRight className="w-6 h-6 text-indigo-400 shrink-0" />
              <div className={`flex-1 rounded-2xl border ${newRole.border} ${newRole.bg} p-4`}>
                <div className="text-xs text-indigo-300 uppercase font-bold">Sekarang</div>
                <div className={`text-lg font-black ${newRole.color} mt-1`}>{newRole.icon} {newRole.name}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-indigo-950/50 border border-indigo-800/60 p-4 text-sm text-indigo-100">
              Mulai sekarang <strong>{notice.playerName}</strong> menggunakan kemampuan dan kondisi kemenangan dari role <strong>{newRole.name}</strong>.
            </div>

            <button
              onClick={() => setGameState(prev => ({ ...prev, doppelgangerRoleChangeNotice: null }))}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>PAHAM, LANJUTKAN</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentPhase = () => {
    switch (gameState.currentPhase) {
      case 'HOME':
        return renderHome();
      case 'SETUP':
        return renderSetup();
      case 'ROLE_SUMMARY':
        return renderRoleSummary();
      case 'ROLE_REVEAL':
        return renderRoleReveal();
      case 'NIGHT_INTRO':
        return renderNightIntro();
      case 'NIGHT_CUPID':
        return renderNightCupid();
      case 'NIGHT_WEREWOLF':
        return renderNightWerewolf();
      case 'NIGHT_GUARDIAN':
        return renderNightGuardian();
      case 'NIGHT_DOCTOR':
        return renderNightDoctor();
      case 'NIGHT_SHERIFF':
        return renderNightSheriff();
      case 'NIGHT_DOPPELGANGER':
        return renderNightDoppelganger();
      case 'NIGHT_SEER':
        return renderNightSeer();
      case 'NIGHT_WITCH':
        return renderNightWitch();
      case 'MORNING':
        return renderMorning();
      case 'DISCUSSION':
        return renderDiscussion();
      case 'VOTING':
        return renderVoting();
      case 'GAME_OVER':
        return renderGameOver();
      default:
        return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      {renderToast()}
      {renderDoppelgangerRoleChangeNotice()}
      {renderLoverDeathNotice()}
      {renderConfirmModal()}
      {renderRulesModal()}
      {renderRoleListDrawer()}
      {renderGameLogDrawer()}
      {renderHeader()}

      <main className="flex-1 pb-8">
        {renderCurrentPhase()}
      </main>
    </div>
  );
}
