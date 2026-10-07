import React, { useState, useEffect } from 'react';
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
  X,
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
  Check,
  RefreshCw,
  Award
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'WEREWOLF_MODERATOR_ASSISTANT_STATE_V3';

const ROLES = {
  WARGA: { name: 'Warga', team: 'Warga', icon: '👨', color: 'text-slate-300', bg: 'bg-slate-800/90', border: 'border-slate-600', accent: 'from-slate-700 to-slate-900', desc: 'Tidak memiliki kemampuan khusus. Bekerja sama mengeliminasi seluruh ancaman.' },
  WEREWOLF: { name: 'Werewolf', team: 'Evil', icon: '🐺', color: 'text-red-400', bg: 'bg-red-950/90', border: 'border-red-600', accent: 'from-red-900 to-red-950', desc: 'Setiap malam memilih 1 korban. Sesama Werewolf saling mengetahui.' },
  LYCAN: { name: 'Lycan', team: 'Warga', icon: '🌙', color: 'text-slate-200', bg: 'bg-zinc-800/90', border: 'border-zinc-500', accent: 'from-zinc-700 to-zinc-900', desc: 'Berada di tim Warga dan tidak memiliki aksi malam. Seer akan melihat Lycan sebagai Werewolf.' },
  SEER: { name: 'Seer', team: 'Warga', icon: '🔮', color: 'text-cyan-400', bg: 'bg-cyan-950/90', border: 'border-cyan-600', accent: 'from-cyan-900 to-cyan-950', desc: 'Setiap malam memeriksa 1 pemain untuk mengetahui wujud/perannya. Lycan terlihat sebagai Werewolf.' },
  GUARDIAN: { name: 'Guardian', team: 'Warga', icon: '🛡️', color: 'text-blue-400', bg: 'bg-blue-950/90', border: 'border-blue-600', accent: 'from-blue-900 to-blue-950', desc: 'Melindungi 1 pemain setiap malam dari serangan Werewolf. Tidak boleh melindungi pemain yang sama dua malam berturut-turut.' },
  CUPID: { name: 'Cupid', team: 'Warga', icon: '💘', color: 'text-pink-400', bg: 'bg-pink-950/90', border: 'border-pink-600', accent: 'from-pink-900 to-pink-950', desc: 'Hanya aktif Malam 1 dan memilih 2 pemain menjadi Lovers. Jika salah satu mati, pasangannya ikut mati.' },
  MAYOR: { name: 'Mayor', team: 'Warga', icon: '👑', color: 'text-amber-400', bg: 'bg-amber-950/90', border: 'border-amber-600', accent: 'from-amber-900 to-amber-950', desc: 'Sekali per game dapat mengungkapkan identitas sebagai Mayor. Setelah terungkap, bobot suaranya menjadi 2 pada voting.' },
  SHERIFF: { name: 'Sheriff', team: 'Warga', icon: '⭐', color: 'text-yellow-300', bg: 'bg-yellow-950/90', border: 'border-yellow-600', accent: 'from-yellow-900 to-yellow-950', desc: 'Sekali per game, pada malam hari memilih 1 pemain untuk diuji. Jika target adalah Werewolf, target tereliminasi. Jika bukan, Sheriff tereliminasi.' },
  HUNTER: { name: 'Hunter', team: 'Warga', icon: '🏹', color: 'text-orange-300', bg: 'bg-orange-950/90', border: 'border-orange-600', accent: 'from-orange-900 to-orange-950', desc: 'Jika mati, Hunter dapat memilih 1 pemain lain untuk dieliminasi sebagai balas dendam.' },
  TRAITOR: { name: 'Traitor', team: 'Warga', icon: '🗡️', color: 'text-slate-200', bg: 'bg-slate-950/90', border: 'border-slate-500', accent: 'from-slate-700 to-slate-950', desc: 'Awalnya di kubu Warga. Jika seluruh Werewolf mati dan Traitor masih hidup, ia berubah menjadi Werewolf.' },
  WOLF_CUB: { name: 'Wolf Cub', team: 'Evil', icon: '🐺', color: 'text-rose-300', bg: 'bg-rose-950/90', border: 'border-rose-600', accent: 'from-rose-900 to-rose-950', desc: 'Jika Wolf Cub mati, Werewolf mendapat amukan pada malam berikutnya dan dapat membunuh 2 pemain.' },
  WITCH: { name: 'Witch', team: 'Warga', icon: '🧪', color: 'text-purple-400', bg: 'bg-purple-950/90', border: 'border-purple-600', accent: 'from-purple-900 to-purple-950', desc: 'Memiliki Heal Potion dan Kill Potion, masing-masing 1x. Witch tidak melihat korban Werewolf dan menebak secara blind.' },
  JESTER: { name: 'Jester', team: 'Neutral', icon: '🃏', color: 'text-pink-300', bg: 'bg-pink-950/90', border: 'border-pink-600', accent: 'from-pink-900 to-pink-950', desc: 'Menang sendiri jika berhasil tereliminasi melalui voting siang hari.' },
  DOPPELGANGER: { name: 'Doppelganger', team: 'Neutral', icon: '🎭', color: 'text-indigo-300', bg: 'bg-indigo-950/90', border: 'border-indigo-600', accent: 'from-indigo-900 to-indigo-950', desc: 'Malam 1 memilih 1 target. Jika target mati, Doppelganger menggantikan role-nya.' }
};

const ROLE_KEYS = Object.keys(ROLES);

const GAME_PRESETS = [
  {
    id: 'quick_8',
    name: '⚡ Quick 8 Players',
    desc: 'Permainan cepat & intens untuk grup kecil (8 Pemain).',
    count: 8,
    roles: { WEREWOLF: 2, SEER: 1, GUARDIAN: 1, WARGA: 4 }
  },
  {
    id: 'classic_10',
    name: '📜 Classic 10 Players',
    desc: 'Komposisi standar seimbang untuk 10 Pemain.',
    count: 10,
    roles: { WEREWOLF: 2, SEER: 1, GUARDIAN: 1, WITCH: 1, WARGA: 5 }
  },
  {
    id: 'balanced_12',
    name: '🛡️ Balanced 12 Players',
    desc: 'Pengalaman penuh dengan peran khusus untuk 12 Pemain.',
    count: 12,
    roles: { WEREWOLF: 3, SEER: 1, GUARDIAN: 1, WITCH: 1, HUNTER: 1, CUPID: 1, WARGA: 4 }
  },
  {
    id: 'chaos_15',
    name: '🔥 Chaos 15 Players',
    desc: 'Mode seru & menantang untuk grup besar (15 Pemain).',
    count: 15,
    roles: { WEREWOLF: 3, WOLF_CUB: 1, SEER: 1, GUARDIAN: 1, WITCH: 1, HUNTER: 1, CUPID: 1, SHERIFF: 1, JESTER: 1, TRAITOR: 1, WARGA: 3 }
  }
];

function isWolfAligned(player) {
  return player?.role === 'WEREWOLF' || player?.role === 'WOLF_CUB';
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

const PARTICIPANT_LIST = [
  'Adinda Ramadhani Himawan', 'Ahmad Raditya', 'Aisyanabila Maiza Ramadhany',
  'Annastasya Cahya Kamila F.', 'Cesar Hafidz Ausafurrizal', 'Citra Alea',
  'Dysto Arbi', 'Dzakki Alvanno Luke Evendi', 'Ega Noval Saputra',
  'Evan Haris Pramana', 'Galih Tata Arung Samudra', 'Ghaida Mazaya Aqila Hariyadi',
  'Hasan Farros Mubarok', "Hirdan Ma'ruf Besari", 'Keisya Auliayanti',
  'Kyna Azarina Paristuti', 'M. Naufal El Shafa Hadi', 'Maiza Reihanadiva',
  'Mutia Lutfi Safira', 'Nayya Anggun Almaeda', 'Rafi Azmi Putra Wasono',
  'Raihan Ariq Ghossan', 'Renando Dewantoro Sakti', 'Reyhan Arya Putra Pratama',
  'Rizky Pratama Agico Anantyan', 'Rizky Valiant Suwondo', 'Rorensa Desicha Pramesti',
  'Safira Azka Gina', 'Salwa Refaldina Paramesti', 'Satria Aji Syahputra',
  'Shafaa Rizky Savinna Mashuri', 'Sonia Velita Lukita', 'Tidar Endah Rahmawati',
  'Zahra Anindhita Wicaksono', 'Zahra Mai Kalinda', 'Zahro Habibah'
];

export default function App() {
  const [gameState, setGameState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.currentPhase) {
          return {
            ...createInitialGameState(),
            ...parsed,
            players: (parsed.players || []).map(p => ({
              ...p,
              protectedLastNight: !!p.protectedLastNight,
              protectedThisNight: !!p.protectedThisNight,
              doppelgangerCopied: !!p.doppelgangerCopied
            }))
          };
        }
      }
    } catch (e) {
      console.error("Gagal memuat state dari localStorage:", e);
    }
    return createInitialGameState();
  });

  const [showRoleListDrawer, setShowRoleListDrawer] = useState(false);
  const [showGameLogDrawer, setShowGameLogDrawer] = useState(false);
  const [showDashboardDrawer, setShowDashboardDrawer] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [inputPlayerNames, setInputPlayerNames] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [participantSearch, setParticipantSearch] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [roleCountsDraft, setRoleCountsDraft] = useState({});

  useEffect(() => {
    if (Object.keys(roleCountsDraft).length === 0 && playerCount > 0) {
      setRoleCountsDraft({
        WARGA: Math.max(0, playerCount - 4),
        WEREWOLF: 1,
        GUARDIAN: 1,
        SEER: 1,
        WITCH: 1
      });
    }
  }, [playerCount]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
      console.error("Gagal menyimpan ke localStorage:", e);
    }
  }, [gameState]);

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
        triggerAutoTransitionToVoting();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameState.currentPhase, gameState.discussionEndTimestamp, gameState.isTimerPaused, gameState.pausedRemainingSeconds]);

  function triggerAutoTransitionToVoting() {
    setGameState(prev => {
      if (prev.currentPhase !== 'DISCUSSION') return prev;
      const newLog = addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', 'Waktu diskusi berakhir. Memulai sesi voting.');
      return {
        ...prev,
        currentPhase: 'VOTING',
        currentVoterIndex: 0,
        votes: {},
        gameLog: newLog
      };
    });
  }

  function addLog(logs, nightNumber, dayNumber, type, message) {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return [{
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: timeStr,
      nightNumber,
      dayNumber,
      type,
      message
    }, ...logs];
  }

  function pushUndoState(state) {
    const { undoStack, ...rest } = state;
    return [rest, ...(undoStack || []).slice(0, 4)];
  }

  function triggerToast(msg) {
    setToastMessage(msg);
  }

  const toggleParticipant = (name) => {
    setInputPlayerNames(prev => {
      const exists = prev.includes(name);
      const next = exists ? prev.filter(n => n !== name) : [...prev, name];
      setPlayerCount(next.length);
      return next;
    });
  };

  const selectAllParticipants = () => {
    setInputPlayerNames([...PARTICIPANT_LIST]);
    setPlayerCount(PARTICIPANT_LIST.length);
    setRoleCountsDraft({
      WARGA: Math.max(0, PARTICIPANT_LIST.length - 4),
      WEREWOLF: 1,
      GUARDIAN: 1,
      SEER: 1,
      WITCH: 1
    });
  };

  const clearParticipants = () => {
    setInputPlayerNames([]);
    setPlayerCount(0);
    setRoleCountsDraft({});
  };

  const applyGamePreset = (preset) => {
    const selectedNames = PARTICIPANT_LIST.slice(0, preset.count);
    setInputPlayerNames(selectedNames);
    setPlayerCount(preset.count);
    setRoleCountsDraft(preset.roles);
    triggerToast(`Preset "${preset.name}" diterapkan.`);
  };

  const validateAndGenerateRoles = () => {
    const trimmed = inputPlayerNames.map(n => n.trim()).filter(Boolean);

    if (trimmed.length < 5 || trimmed.length > 20) {
      triggerToast('Pilih 5–20 peserta untuk memulai permainan.');
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
      deathReason: null,
      deathNight: null,
      deathDay: null,
      hunterRevengeUsed: false
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

      const livingWerewolves = players.filter(p => isWolfAligned(p) && p.alive);
      if (livingWerewolves.length > 0 && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID')) {
        return { ...prev, currentPhase: 'NIGHT_WEREWOLF' };
      }

      const guardian = players.find(p => p.role === 'GUARDIAN' && p.alive);
      if (guardian && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF')) {
        return { ...prev, currentPhase: 'NIGHT_GUARDIAN' };
      }

      const sheriff = players.find(p => p.role === 'SHERIFF' && p.alive);
      if (sheriff && !prev.sheriffUsed && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN')) {
        return { ...prev, currentPhase: 'NIGHT_SHERIFF' };
      }

      const doppel = players.find(p => p.role === 'DOPPELGANGER' && p.alive && !p.doppelgangerCopied);
      if (doppel && nightNumber === 1 && !prev.doppelgangerTargetId && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_SHERIFF')) {
        return { ...prev, currentPhase: 'NIGHT_DOPPELGANGER' };
      }

      const seer = players.find(p => p.role === 'SEER' && p.alive);
      if (seer && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_SHERIFF', 'NIGHT_DOPPELGANGER')) {
        return { ...prev, currentPhase: 'NIGHT_SEER' };
      }

      const witch = players.find(p => p.role === 'WITCH' && p.alive);
      if (witch && (!prev.witchHealUsed || !prev.witchKillUsed) && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_SHERIFF', 'NIGHT_DOPPELGANGER', 'NIGHT_SEER')) {
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
    const sheriffTarget = state.sheriffTargetId;
    const witchHeal = state.witchHealUsedThisNight;
    const witchHealTarget = state.witchHealTargetId;
    const witchKillTarget = state.witchKillTargetId;

    const directDeaths = [];
    const protectedByTown = new Set([targetGuardian].filter(Boolean));

    const wolfTargets = Array.from(new Set([...(state.werewolfTargetIds || []), targetWerewolf].filter(Boolean)));
    wolfTargets.forEach(targetId => {
      const victimName = updatedPlayers.find(p => p.id === targetId)?.name;
      if (!victimName) return;
      log = addLog(log, night, day, 'ACTION', `Werewolf mengincar ${victimName}.`);
      if (protectedByTown.has(targetId)) {
        log = addLog(log, night, day, 'INFO', `Serangan Werewolf pada ${victimName} berhasil dicegah Guardian.`);
      } else if (witchHeal && witchHealTarget === targetId) {
        log = addLog(log, night, day, 'INFO', `Heal Potion Witch berhasil menyelamatkan korban Werewolf.`);
      } else {
        directDeaths.push({ id: targetId, reason: 'WEREWOLF' });
      }
    });

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
    }));

    let doppelgangerRoleChangeNotice = null;
    ({ players: updatedPlayers, log, notice: doppelgangerRoleChangeNotice } = applyDoppelgangerRoleIfTargetDead(updatedPlayers, log, night, day, state.doppelgangerTargetId));

    let tempState = {
      ...state,
      players: updatedPlayers,
      gameLog: log,
      lastNightDeaths: nightDeathsList,
      wolfCubRagePending: nightDeathsList.some(d => d.player.role === 'WOLF_CUB'),
      hunterPending: nightDeathsList.some(d => d.player.role === 'HUNTER' && !d.player.hunterRevengeUsed),
      loverDeathNotice,
      doppelgangerRoleChangeNotice,
      werewolfTargetId: null,
      werewolfTargetIds: [],
      guardianTargetId: null,
      sheriffTargetId: null,
      seerTargetId: null,
      seerResult: null,
      witchHealUsedThisNight: false,
      witchHealTargetId: null,
      witchKillTargetId: null,
      hunterTargetId: null,
    };

    if (doppelgangerRoleChangeNotice) {
      tempState = resetDoppelgangerAbilityState(tempState, doppelgangerRoleChangeNotice.newRole);
    }

    tempState = activateTraitorIfNeeded(tempState);
    log = tempState.gameLog;
    const winResult = checkWinConditions(tempState);

    if (!winResult && tempState.hunterPending) {
      return { ...tempState, currentPhase: 'HUNTER_REVENGE', gameLog: log };
    }

    if (winResult) {
      const winText = winResult === 'WARGA' ? 'Kemenangan Tim WARGA!' : winResult === 'WEREWOLF' ? 'Kemenangan Tim WEREWOLF!' : 'JESTER memenangkan permainan!';
      log = addLog(log, night, day, 'WIN', winText);
    }

    if (doppelgangerRoleChangeNotice) {
      return {
        ...tempState,
        currentPhase: 'DOPPELGANGER_REVEAL',
        doppelgangerRevealNextPhase: winResult ? 'GAME_OVER' : 'MORNING',
        doppelgangerRevealWinner: winResult || null,
        winner: winResult || null,
        gameLog: log
      };
    }

    if (winResult) {
      return { ...tempState, currentPhase: 'GAME_OVER', winner: winResult, gameLog: log };
    }

    return { ...tempState, currentPhase: 'MORNING', gameLog: log };
  }

  function activateTraitorIfNeeded(state) {
    const livingWolves = state.players.filter(p => p.alive && isWolfAligned(p));
    const traitors = state.players.filter(p => p.alive && p.role === 'TRAITOR');
    if (livingWolves.length > 0 || traitors.length === 0) return state;
    const players = state.players.map(p => p.alive && p.role === 'TRAITOR' ? { ...p, role: 'WEREWOLF' } : p);
    return { ...state, players, gameLog: addLog(state.gameLog, state.nightNumber, state.dayNumber, 'ROLE', `🗡️ Traitor bangkit! ${traitors.map(t => t.name).join(', ')} berubah menjadi Werewolf.`) };
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
    if (!gameState.sheriffTargetId) { triggerToast('Pilih target Sheriff terlebih dahulu, atau tekan SKIP.'); return; }
    setGameState(prev => ({
      ...prev,
      sheriffUsed: true,
      gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Sheriff menggunakan kemampuan malam pada pemain terpilih.`)
    }));
    triggerToast('Aksi Sheriff dikonfirmasi. Sheriff silakan tutup mata.');
    advanceNightPhase();
  };

  const handleSkipSheriff = () => {
    setGameState(prev => ({
      ...prev,
      sheriffUsed: true,
      sheriffTargetId: null,
      gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', 'Sheriff memilih SKIP. Tidak ada pemeriksaan malam ini.')
    }));
    triggerToast('Sheriff memilih SKIP. Sheriff silakan tutup mata.');
    advanceNightPhase();
  };

  const handleHunterRevenge = (targetId) => {
    setGameState(prev => {
      const hunter = prev.players.find(p => p.role === 'HUNTER' && !p.alive && !p.hunterRevengeUsed);
      const target = prev.players.find(p => p.id === targetId && p.alive && p.id !== hunter?.id);
      if (!hunter || !target) return prev;

      const updatedPlayers = prev.players
        .map(p => p.id === target.id ? { ...p, alive: false, deathReason: 'HUNTER', deathDay: prev.dayNumber, deathNight: prev.nightNumber } : p)
        .map(p => p.id === hunter.id ? { ...p, hunterRevengeUsed: true } : p);

      let log = addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'DEATH', `🏹 Hunter membalas kematian dengan mengeliminasi ${target.name}.`);

      let tempState = {
        ...prev,
        players: updatedPlayers,
        gameLog: log,
        hunterPending: false,
        hunterTargetId: null,
        wolfCubRagePending: prev.wolfCubRagePending || target.role === 'WOLF_CUB'
      };

      tempState = activateTraitorIfNeeded(tempState);
      const winner = checkWinConditions(tempState);

      if (winner) {
        return { ...tempState, currentPhase: 'GAME_OVER', winner };
      }

      if (prev.lastNightDeaths && prev.lastNightDeaths.length > 0) {
        return { ...tempState, currentPhase: 'MORNING' };
      }

      return {
        ...tempState,
        currentPhase: 'NIGHT_INTRO',
        nightNumber: prev.nightNumber + 1,
        dayNumber: prev.dayNumber + 1,
        votes: {},
        currentVoterIndex: 0
      };
    });
  };

  const handleMayorReveal = () => {
    const mayor = gameState.players.find(p => p.role === 'MAYOR' && p.alive);
    if (!mayor || gameState.mayorRevealed) return;
    setGameState(prev => ({
      ...prev,
      mayorRevealed: true,
      gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Mayor ${mayor.name} mengungkapkan identitas. Suaranya menjadi bernilai 2.`)
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

  const resetDoppelgangerAbilityState = (state, copiedRole) => {
    const next = { ...state };
    switch (copiedRole) {
      case 'SHERIFF':
        next.sheriffUsed = false; next.sheriffTargetId = null; break;
      case 'MAYOR':
        next.mayorRevealed = false; break;
      case 'WITCH':
        next.witchHealUsed = false; next.witchKillUsed = false;
        next.witchHealUsedThisNight = false; next.witchHealTargetId = null; next.witchKillTargetId = null; break;
      case 'CUPID':
        next.cupidUsed = false; next.cupidLover1Id = null; next.cupidLover2Id = null; break;
      default:
        break;
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

    const voteCounts = {};
    Object.entries(votes).forEach(([voterId, targetId]) => {
      const voter = players.find(p => p.id === voterId && p.alive);
      if (!voter || !targetId) return;
      const weight = voter.role === 'MAYOR' && gameState.mayorRevealed ? 2 : 1;
      voteCounts[targetId] = (voteCounts[targetId] || 0) + weight;
    });

    let maxVotes = 0;
    Object.values(voteCounts).forEach(cnt => {
      if (cnt > maxVotes) maxVotes = cnt;
    });

    const topCandidates = maxVotes > 0
      ? Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes)
      : [];

    const validVoteCount = Object.values(votes).filter(Boolean).length;
    const allVotesSkipped = validVoteCount === 0;

    let updatedPlayers = players.map(p => ({ ...p }));
    let dayDeaths = [];
    let loverDeathNotice = [];
    let doppelgangerRoleChangeNotice = null;

    if (topCandidates.length === 1 && maxVotes > 0) {
      const eliminatedId = topCandidates[0];
      const eliminatedPlayer = updatedPlayers.find(p => p.id === eliminatedId);

      log = addLog(log, nightNumber, dayNumber, 'ACTION', `${eliminatedPlayer.name} mendapatkan suara terbanyak (${maxVotes} suara) dan tereliminasi.`);

      let newDeathsMap = new Map();
      newDeathsMap.set(eliminatedId, 'VOTE');
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

      newDeathsMap.forEach((reason, deadId) => {
        const idx = updatedPlayers.findIndex(p => p.id === deadId);
        if (idx !== -1) {
          updatedPlayers[idx].alive = false;
          updatedPlayers[idx].deathReason = reason;
          updatedPlayers[idx].deathDay = dayNumber;
          dayDeaths.push({ player: updatedPlayers[idx], reason });
        }
      });

      ({ players: updatedPlayers, log, notice: doppelgangerRoleChangeNotice } = applyDoppelgangerRoleIfTargetDead(updatedPlayers, log, nightNumber, dayNumber, gameState.doppelgangerTargetId));

      const eliminatedWasJester = eliminatedPlayer?.role === 'JESTER';
      if (eliminatedWasJester) {
        log = addLog(log, nightNumber, dayNumber, 'WIN', `Jester ${eliminatedPlayer.name} berhasil tereliminasi lewat voting dan menang!`);

        if (doppelgangerRoleChangeNotice) {
          setGameState({
            ...gameState,
            players: updatedPlayers,
            gameLog: log,
            lastDayDeaths: dayDeaths,
            loverDeathNotice,
            doppelgangerRoleChangeNotice,
            currentPhase: 'DOPPELGANGER_REVEAL',
            doppelgangerRevealNextPhase: 'GAME_OVER',
            doppelgangerRevealWinner: 'JESTER',
            winner: 'JESTER',
            ...resetDoppelgangerAbilityState(gameState, doppelgangerRoleChangeNotice.newRole)
          });
          return;
        }

        setGameState({
          ...gameState,
          players: updatedPlayers,
          gameLog: log,
          lastDayDeaths: dayDeaths,
          loverDeathNotice,
          doppelgangerRoleChangeNotice,
          currentPhase: 'GAME_OVER',
          winner: 'JESTER'
        });
        return;
      }
    } else if (allVotesSkipped) {
      log = addLog(log, nightNumber, dayNumber, 'INFO', `⏭️ Semua pemain memilih SKIP VOTE. Tidak ada pemain yang tereliminasi.`);
    } else {
      log = addLog(log, nightNumber, dayNumber, 'INFO', `Hasil voting seri! Tidak ada pemain yang tereliminasi.`);
    }

    let tempState = {
      ...gameState,
      players: updatedPlayers,
      gameLog: log,
      lastDayDeaths: dayDeaths,
      loverDeathNotice,
      doppelgangerRoleChangeNotice,
      wolfCubRagePending: gameState.wolfCubRagePending || dayDeaths.some(d => d.player.role === 'WOLF_CUB'),
      hunterPending: dayDeaths.some(d => d.player.role === 'HUNTER' && !d.player.hunterRevengeUsed)
    };
    tempState = activateTraitorIfNeeded(tempState);
    log = tempState.gameLog;

    if (doppelgangerRoleChangeNotice) {
      tempState = resetDoppelgangerAbilityState(tempState, doppelgangerRoleChangeNotice.newRole);
    }

    const winResult = checkWinConditions(tempState);
    if (winResult) {
      log = addLog(log, nightNumber, dayNumber, 'WIN', winResult === 'WARGA' ? 'Kemenangan Tim WARGA!' : 'Kemenangan Tim WEREWOLF!');
    }

    if (tempState.hunterPending && !winResult) {
      setGameState({ ...tempState, currentPhase: 'HUNTER_REVENGE', gameLog: log });
    } else if (doppelgangerRoleChangeNotice) {
      setGameState({
        ...tempState,
        currentPhase: 'DOPPELGANGER_REVEAL',
        doppelgangerRevealNextPhase: winResult ? 'GAME_OVER' : 'NIGHT_INTRO',
        doppelgangerRevealWinner: winResult || null,
        winner: winResult || null,
        gameLog: log
      });
    } else if (winResult) {
      setGameState({
        ...tempState,
        currentPhase: 'GAME_OVER',
        winner: winResult,
        gameLog: log
      });
    } else {
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
        const shuffledRoles = shuffle(roleList);

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
          deathDay: null,
          hunterRevengeUsed: false
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
        setShowDashboardDrawer(false);
        setShowRulesModal(false);
        setToastMessage(null);
        setInputPlayerNames([]);
        setPlayerCount(0);
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

  const renderNightTimeline = () => {
    if (!gameState.currentPhase.startsWith('NIGHT_') || gameState.currentPhase === 'NIGHT_INTRO') return null;

    const nightSteps = [
      { key: 'NIGHT_CUPID', label: 'Cupid', active: gameState.nightNumber === 1 && gameState.players.some(p => p.role === 'CUPID' && p.alive) },
      { key: 'NIGHT_WEREWOLF', label: 'Werewolf', active: gameState.players.some(p => isWolfAligned(p) && p.alive) },
      { key: 'NIGHT_GUARDIAN', label: 'Guardian', active: gameState.players.some(p => p.role === 'GUARDIAN' && p.alive) },
      { key: 'NIGHT_SHERIFF', label: 'Sheriff', active: gameState.players.some(p => p.role === 'SHERIFF' && p.alive) && !gameState.sheriffUsed },
      { key: 'NIGHT_DOPPELGANGER', label: 'Doppelganger', active: gameState.nightNumber === 1 && gameState.players.some(p => p.role === 'DOPPELGANGER' && p.alive && !gameState.doppelgangerTargetId) },
      { key: 'NIGHT_SEER', label: 'Seer', active: gameState.players.some(p => p.role === 'SEER' && p.alive) },
      { key: 'NIGHT_WITCH', label: 'Witch', active: gameState.players.some(p => p.role === 'WITCH' && p.alive) && (!gameState.witchHealUsed || !gameState.witchKillUsed) }
    ].filter(s => s.active);

    const activeIndex = nightSteps.findIndex(s => s.key === gameState.currentPhase);

    return (
      <div className="w-full bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 overflow-x-auto">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2 text-xs">
          {nightSteps.map((step, idx) => {
            const isDone = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <React.Fragment key={step.key}>
                {idx > 0 && <span className="text-slate-600">→</span>}
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition font-bold whitespace-nowrap ${
                  isCurrent 
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950/50' 
                    : isDone 
                    ? 'bg-slate-950 border-slate-800 text-emerald-400' 
                    : 'bg-slate-950/40 border-slate-900 text-slate-600'
                }`}>
                  <span>{isDone ? '✓' : isCurrent ? '●' : '○'}</span>
                  <span>{step.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderModeratorDashboard = () => {
    if (!showDashboardDrawer) return null;

    const livingPlayers = gameState.players.filter(p => p.alive);
    const deadPlayers = gameState.players.filter(p => !p.alive);

    const livingGood = livingPlayers.filter(p => !isWolfAligned(p) && p.role !== 'JESTER').length;
    const livingEvil = livingPlayers.filter(isWolfAligned).length;
    const livingNeutral = livingPlayers.filter(p => p.role === 'JESTER' || (p.role === 'DOPPELGANGER' && !p.doppelgangerCopied)).length;

    const totalLiving = livingPlayers.length || 1;
    const goodPct = (livingGood / totalLiving) * 100;
    const evilPct = (livingEvil / totalLiving) * 100;
    const neutralPct = (livingNeutral / totalLiving) * 100;

    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-start">
        <div className="bg-slate-900 border-r border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl p-5 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📊 Moderator Dashboard</span>
            </h3>
            <button onClick={() => setShowDashboardDrawer(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Kekuatan Kubu (Health Bar)</span>
            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
              <div style={{ width: `${goodPct}%` }} className="bg-emerald-500 h-full transition-all duration-500 rounded-l-full" title="Tim Warga" />
              <div style={{ width: `${evilPct}%` }} className="bg-red-500 h-full transition-all duration-500" title="Tim Evil" />
              <div style={{ width: `${neutralPct}%` }} className="bg-pink-500 h-full transition-all duration-500 rounded-r-full" title="Netral" />
            </div>
            <div className="flex justify-between text-xs font-bold pt-1">
              <span className="text-emerald-400">🏘️ Warga: {livingGood}</span>
              <span className="text-red-400">🐺 Evil: {livingEvil}</span>
              {livingNeutral > 0 && <span className="text-pink-400">🃏 Netral: {livingNeutral}</span>}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Role Ability Tracker</span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span>🧪 Witch Heal Potion</span>
                <span className={`font-bold px-2 py-0.5 rounded ${gameState.witchHealUsed ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'}`}>
                  {gameState.witchHealUsed ? 'TERPAKAI (0/1)' : 'TERSEDIA (1/1)'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span>☠️ Witch Kill Potion</span>
                <span className={`font-bold px-2 py-0.5 rounded ${gameState.witchKillUsed ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'}`}>
                  {gameState.witchKillUsed ? 'TERPAKAI (0/1)' : 'TERSEDIA (1/1)'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span>⭐ Sheriff Ability</span>
                <span className={`font-bold px-2 py-0.5 rounded ${gameState.sheriffUsed ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'}`}>
                  {gameState.sheriffUsed ? 'TERPAKAI (0/1)' : 'TERSEDIA (1/1)'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span>👑 Mayor Reveal</span>
                <span className={`font-bold px-2 py-0.5 rounded ${gameState.mayorRevealed ? 'bg-amber-950 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                  {gameState.mayorRevealed ? 'AKTIF (2 Suara)' : 'BELUM AKTIF'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Status Sesi:</span>
              <span className="font-bold text-white">Malam {gameState.nightNumber} / Hari {gameState.dayNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pemain Hidup / Mati:</span>
              <span className="font-bold text-white">{livingPlayers.length} Hidup · {deadPlayers.length} Mati</span>
            </div>
          </div>
        </div>
      </div>
    );
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
        <div className="w-full max-w-md bg-slate-900 border-2 border-pink-600 rounded-3xl p-6 shadow-2xl space-y-5">
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
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-lg transition"
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
              <p>• <strong>Tim Warga:</strong> Eliminasi seluruh role Evil (Werewolf dan Wolf Cub) dari desa.</p>
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
                    <span className="text-xl">{roleMeta?.icon}</span>
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
                      <span className={`text-xs font-medium ${roleMeta?.color}`}>{roleMeta?.name}</span>
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

  const continueAfterDoppelgangerReveal = () => {
    setGameState(prev => {
      const nextPhase = prev.doppelgangerRevealNextPhase;
      const winner = prev.doppelgangerRevealWinner;

      if (nextPhase === 'GAME_OVER') {
        return {
          ...prev,
          currentPhase: 'GAME_OVER',
          winner,
          doppelgangerRoleChangeNotice: null,
          doppelgangerRevealNextPhase: null,
          doppelgangerRevealWinner: null
        };
      }

      if (nextPhase === 'MORNING') {
        return {
          ...prev,
          currentPhase: 'MORNING',
          doppelgangerRoleChangeNotice: null,
          doppelgangerRevealNextPhase: null,
          doppelgangerRevealWinner: null
        };
      }

      return {
        ...prev,
        currentPhase: 'NIGHT_INTRO',
        nightNumber: prev.nightNumber + 1,
        dayNumber: prev.dayNumber + 1,
        votes: {},
        currentVoterIndex: 0,
        discussionEndTimestamp: null,
        doppelgangerRoleChangeNotice: null,
        doppelgangerRevealNextPhase: null,
        doppelgangerRevealWinner: null,
        gameLog: addLog(prev.gameLog, prev.nightNumber + 1, prev.dayNumber + 1, 'INFO', `Memulai Malam ${prev.nightNumber + 1}.`)
      };
    });
  };

  const renderDoppelgangerReveal = () => {
    const notice = gameState.doppelgangerRoleChangeNotice;
    if (!notice) return renderNightIntro();

    const newRole = ROLES[notice.newRole] || {
      name: notice.newRole,
      team: 'Unknown',
      icon: '🎭',
      color: 'text-indigo-300',
      bg: 'bg-indigo-950/80',
      border: 'border-indigo-600',
      desc: 'Role baru Doppelganger.'
    };

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-3xl border border-indigo-500/50 bg-slate-900 shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8 text-center">
            <div className="text-xs font-black tracking-[0.25em] text-indigo-400 uppercase">🎭 SESI DOPPELGANGER</div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-3">Targetmu telah mati</h1>
            <p className="text-slate-400 mt-3 leading-relaxed">
              <strong className="text-white">{notice.targetName}</strong>, target yang kamu pilih, sudah tereliminasi.
            </p>

            <div className="mt-7 rounded-2xl border border-slate-700 bg-slate-950 p-5">
              <div className="text-xs font-black tracking-widest text-slate-500 uppercase">Role target</div>
              <div className="text-2xl font-black text-white mt-2">{newRole.icon} {newRole.name}</div>
              <div className="text-sm text-slate-400 mt-1">Role ini sekarang menjadi role-mu.</div>
            </div>

            <div className={`mt-4 rounded-2xl border ${newRole.border} ${newRole.bg} p-5`}>
              <div className="text-xs font-black tracking-widest text-indigo-300 uppercase">Role barumu</div>
              <div className={`text-3xl font-black mt-2 ${newRole.color}`}>{newRole.icon} {newRole.name}</div>
              <div className="text-sm text-slate-300 mt-2">Tim: <strong>{newRole.team}</strong></div>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">{newRole.desc}</p>
            </div>

            <button
              onClick={continueAfterDoppelgangerReveal}
              className="w-full mt-7 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>PAHAM, LANJUTKAN PERMAINAN</span>
            </button>
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
      case 'DOPPELGANGER_REVEAL':
        phaseBadge = 'SESI DOPPELGANGER';
        phaseIcon = <span>🎭</span>;
        break;
      case 'NIGHT_INTRO':
      case 'NIGHT_CUPID':
      case 'NIGHT_WEREWOLF':
      case 'NIGHT_GUARDIAN':
      case 'NIGHT_SHERIFF':
      case 'NIGHT_DOPPELGANGER':
      case 'NIGHT_SEER':
      case 'NIGHT_WITCH':
        phaseBadge = `MALAM ${gameState.nightNumber}`;
        phaseIcon = <Moon className="w-4 h-4 text-indigo-400" />;
        break;
      case 'HUNTER_REVENGE':
        phaseBadge = 'HUNTER REVENGE';
        phaseIcon = <span>🏹</span>;
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
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-white">
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

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowDashboardDrawer(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 transition"
              title="Dashboard Moderator"
            >
              📊
            </button>

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
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Role List</span>
            </button>

            <button
              onClick={() => setShowGameLogDrawer(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowRulesModal(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
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
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-tr from-red-950 via-slate-900 to-indigo-950 border border-red-500/30 shadow-2xl">
              <span className="text-5xl">🌙</span>
            </div>
            <h1 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-200 to-purple-400 uppercase">
              WEREWOLF
            </h1>
            <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
              Moderator Game Assistant
            </p>
            <p className="text-sm text-slate-300 leading-relaxed px-4">
              Panduan lengkap untuk menjalankan permainan Werewolf secara otomatis dan terstruktur.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {hasExistingGame && (
              <button
                onClick={() => {}}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 transition"
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-amber-700 hover:opacity-95 text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 transition"
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
          <p className="text-xs text-slate-400">Pilih preset cepat atau atur peserta manual.</p>
        </div>

        {/* Game Presets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">⚡ Game Presets (Pilih Cepat)</h3>
            <span className="text-[10px] text-slate-500">Atur otomatis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {GAME_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyGamePreset(preset)}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-amber-500/50 text-left transition space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">{preset.name}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {preset.count} Pemain
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{preset.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Daftar Peserta
              </label>
              <p className="text-xs text-slate-500 mt-1">Pilih 5–20 nama peserta.</p>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-2xl font-black ${playerCount >= 5 && playerCount <= 20 ? 'text-amber-400' : 'text-red-400'}`}>{playerCount}</div>
              <div className="text-[10px] text-slate-500 uppercase">dipilih / 20 maks.</div>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={participantSearch}
              onChange={e => setParticipantSearch(e.target.value)}
              placeholder="Cari nama peserta..."
              className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button onClick={selectAllParticipants} className="px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black transition">PILIH SEMUA</button>
            <button onClick={clearParticipants} className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">RESET</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-1">
            {PARTICIPANT_LIST
              .filter(name => name.toLowerCase().includes(participantSearch.toLowerCase()))
              .map((name, index) => {
                const selected = inputPlayerNames.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleParticipant(name)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                      selected
                        ? 'bg-amber-950/60 border-amber-500 text-amber-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 text-xs font-black ${selected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700 text-slate-600'}`}>
                      {selected ? '✓' : index + 1}
                    </span>
                    <span className="text-sm font-semibold truncate">{name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Jumlah Role</h3>
            <span className="text-xs font-bold text-amber-400">
              {Object.values(roleCountsDraft).reduce((a, b) => a + (Number(b) || 0), 0)} / {playerCount}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto pr-1">
            {ROLE_KEYS.map(roleKey => {
              const meta = ROLES[roleKey];
              const value = Number(roleCountsDraft[roleKey] || 0);
              return (
                <div key={roleKey} className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{meta.icon}</span>
                    <span className={`text-xs font-bold ${meta.color}`}>{meta.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setRoleCountsDraft(prev => ({ ...prev, [roleKey]: Math.max(0, value - 1) }))} className="w-8 h-8 rounded-lg bg-slate-800 text-white">−</button>
                    <div className="flex-1 text-center font-black text-white">{value}</div>
                    <button onClick={() => setRoleCountsDraft(prev => ({ ...prev, [roleKey]: Math.min(playerCount, value + 1) }))} className="w-8 h-8 rounded-lg bg-slate-800 text-white">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { localStorage.removeItem(LOCAL_STORAGE_KEY); setGameState(createInitialGameState()); }}
            className="w-1/3 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
          >
            Batal
          </button>
          <button
            onClick={validateAndGenerateRoles}
            className="w-2/3 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-base shadow-xl flex items-center justify-center gap-2 transition"
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
            Peran yang akan dibagikan kepada {gameState.players.length} pemain.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(rolesInGame).map(([roleKey, count]) => {
            const meta = ROLES[roleKey];
            return (
              <div key={roleKey} className={`p-4 rounded-2xl border ${meta?.border} ${meta?.bg} flex items-center justify-between shadow-lg`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{meta?.icon}</span>
                  <div>
                    <h4 className={`font-bold ${meta?.color}`}>{meta?.name}</h4>
                    <span className="text-xs text-slate-400">{meta?.team}</span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-slate-900/80 rounded-xl border border-slate-700 text-white font-extrabold text-sm">
                  x{count}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={startRoleReveal}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 transition"
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

    return (
      <div className="max-w-md mx-auto p-4 sm:p-6 min-h-[80vh] flex flex-col justify-between space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            PEMBAGIAN ROLE ({revealPlayerIndex + 1} / {players.length})
          </span>
          <h2 className="text-3xl font-extrabold text-white">{currentPlayer.name}</h2>
          <p className="text-xs text-amber-300">Serahkan perangkat hanya kepada {currentPlayer.name}.</p>
        </div>

        <div className="flex-1 flex items-center justify-center my-4">
          {!isRoleCardOpen ? (
            <div
              onClick={toggleRoleCard}
              className="w-full aspect-[3/4] max-w-xs rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-2 border-dashed border-amber-500/40 flex flex-col items-center justify-center p-6 text-center cursor-pointer shadow-2xl hover:border-amber-400 transition"
            >
              <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 mb-4">
                <Lock className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">ROLE RAHASIA</h3>
              <p className="text-xs text-slate-400">Ketuk untuk membuka kartu role.</p>
            </div>
          ) : (
            <div
              className={`w-full max-w-xs rounded-3xl bg-gradient-to-br ${roleMeta.accent} border-2 ${roleMeta.border} p-6 flex flex-col items-center justify-between text-center shadow-2xl space-y-6`}
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

        <div>
          {isRoleCardOpen ? (
            <button
              onClick={nextRevealPlayer}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base shadow-xl flex items-center justify-center gap-2 transition"
            >
              <span>LANJUT PEMAIN NEXT</span>
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-950 border border-indigo-700/50 text-indigo-400 shadow-2xl">
            <Moon className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">MALAM {gameState.nightNumber}</h2>
          <p className="text-lg italic text-amber-200 font-serif">
            "Semua pemain, silakan tutup mata. Malam telah tiba."
          </p>
        </div>

        <button
          onClick={advanceNightPhase}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 transition"
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
          <p className="text-sm text-slate-300">Pilih dua pemain hidup untuk terikat menjadi Lovers.</p>
        </div>

        <div className="bg-slate-900 border border-pink-900/50 rounded-2xl p-4 text-center space-y-2">
          <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">Pasangan Terpilih:</span>
          <div className="flex items-center justify-center gap-3 text-lg font-bold text-white">
            <span className={lover1 ? 'text-pink-400' : 'text-slate-600'}>
              {lover1 ? lover1.name : '[ Pemain 1 ]'}
            </span>
            <Heart className="w-5 h-5 text-pink-500 fill-current" />
            <span className={lover2 ? 'text-pink-400' : 'text-slate-600'}>
              {lover2 ? lover2.name : '[ Pemain 2 ]'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
          {livingPlayers.map(player => {
            const isSelected = gameState.cupidLover1Id === player.id || gameState.cupidLover2Id === player.id;
            return (
              <button
                key={player.id}
                onClick={() => {
                  setGameState(prev => {
                    if (prev.cupidLover1Id === player.id) return { ...prev, cupidLover1Id: null };
                    if (prev.cupidLover2Id === player.id) return { ...prev, cupidLover2Id: null };
                    if (!prev.cupidLover1Id) return { ...prev, cupidLover1Id: player.id };
                    if (!prev.cupidLover2Id) return { ...prev, cupidLover2Id: player.id };
                    return { ...prev, cupidLover2Id: player.id };
                  });
                }}
                className={`p-3 rounded-xl border text-sm font-bold text-left transition flex items-center justify-between ${
                  isSelected ? 'bg-pink-950 border-pink-500 text-pink-200' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <span>{player.name}</span>
                {isSelected && <Heart className="w-4 h-4 text-pink-400 fill-current" />}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setGameState(prev => ({ ...prev, cupidLover1Id: null, cupidLover2Id: null }))}
            className="w-1/3 py-3.5 rounded-2xl bg-slate-800 text-slate-300 font-semibold text-sm"
          >
            Reset
          </button>
          <button
            onClick={handleConfirmCupid}
            className="w-2/3 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-base shadow-xl"
          >
            KONFIRMASI PASANGAN
          </button>
        </div>
      </div>
    );
  };

  const renderNightWerewolf = () => {
    const livingCandidates = gameState.players.filter(p => p.alive && !isWolfAligned(p));
    const rage = gameState.wolfCubRagePending;
    const selectedIds = gameState.werewolfTargetIds || (gameState.werewolfTargetId ? [gameState.werewolfTargetId] : []);

    const toggleTarget = (id) => {
      setGameState(prev => {
        const current = prev.werewolfTargetIds || [];
        if (rage) {
          const next = current.includes(id) ? current.filter(x => x !== id) : current.length < 2 ? [...current, id] : [current[1], id];
          return { ...prev, werewolfTargetIds: next, werewolfTargetId: next[0] || null };
        }
        return { ...prev, werewolfTargetIds: [id], werewolfTargetId: id };
      });
    };

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950 border border-red-700 text-red-400"><span className="text-3xl">🐺</span></div>
          <h2 className="text-2xl font-bold text-red-400">WEREWOLF PHASE</h2>
          <p className="text-sm text-slate-300">Pilih {rage ? '2 pemain' : '1 pemain'} untuk dieliminasi.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
          {livingCandidates.map(player => {
            const isSelected = selectedIds.includes(player.id);
            return (
              <button key={player.id} onClick={() => toggleTarget(player.id)} className={`p-3 rounded-xl border text-sm font-bold text-left transition flex items-center justify-between ${isSelected ? 'bg-red-950 border-red-500 text-red-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                <span className="truncate">{player.name}</span>
                {isSelected && <Crosshair className="w-4 h-4 text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        <button onClick={() => { if (selectedIds.length !== (rage ? 2 : 1)) { triggerToast(rage ? 'Pilih 2 target.' : 'Pilih 1 target.'); return; } advanceNightPhase(); }} className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 text-white font-bold text-base shadow-xl flex items-center justify-center gap-2">
          <span>KONFIRMASI TARGET WEREWOLF</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderNightGuardian = () => {
    const livingPlayers = gameState.players.filter(p => p.alive);

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-950 border border-blue-700 text-blue-400">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-blue-400">🛡️ GUARDIAN PHASE</h2>
          <p className="text-sm text-slate-300">Pilih 1 pemain untuk dilindungi malam ini.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
          {livingPlayers.map(player => {
            const isSelected = gameState.guardianTargetId === player.id;
            const isDisabled = player.protectedLastNight;

            return (
              <button
                key={player.id}
                disabled={isDisabled}
                onClick={() => setGameState(prev => ({ ...prev, guardianTargetId: player.id }))}
                className={`p-3 rounded-xl border text-sm font-bold text-left transition flex items-center justify-between ${
                  isDisabled ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed' : isSelected ? 'bg-blue-950 border-blue-500 text-blue-200' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <span className="truncate">{player.name}</span>
                {isSelected && <Shield className="w-4 h-4 text-blue-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (!gameState.guardianTargetId) { triggerToast('Pilih pemain untuk dilindungi.'); return; }
            advanceNightPhase();
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold text-base shadow-xl flex items-center justify-center gap-2"
        >
          <span>KONFIRMASI GUARDIAN</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderNightSheriff = () => {
    const sheriff = gameState.players.find(p => p.role === 'SHERIFF' && p.alive);
    const candidates = gameState.players.filter(p => p.alive && p.id !== sheriff?.id);

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-yellow-950 border border-yellow-700 text-yellow-300">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-yellow-300">⭐ SHERIFF PHASE</h2>
          <p className="text-sm text-slate-300">Pilih 1 pemain untuk diuji (1x per game).</p>
        </div>

        <button onClick={handleSkipSheriff} className="w-full py-3 bg-slate-700 text-white font-black rounded-2xl">
          ⏭️ SKIP SHERIFF
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
          {candidates.map(p => (
            <button
              key={p.id}
              onClick={() => setGameState(prev => ({ ...prev, sheriffTargetId: p.id }))}
              className={`p-3 rounded-xl border text-sm font-bold text-left transition ${gameState.sheriffTargetId === p.id ? 'bg-yellow-950 border-yellow-500 text-yellow-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirmSheriff}
          disabled={!gameState.sheriffTargetId}
          className={`w-full py-4 rounded-2xl font-black transition ${gameState.sheriffTargetId ? 'bg-yellow-600 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
          KONFIRMASI SHERIFF
        </button>
      </div>
    );
  };

  const renderNightDoppelganger = () => {
    const livingPlayers = gameState.players.filter(p => p.alive && p.role !== 'DOPPELGANGER');
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-950 border border-indigo-700 text-indigo-300"><span className="text-3xl">🎭</span></div>
          <h2 className="text-2xl font-bold text-indigo-300">DOPPELGANGER PHASE</h2>
          <p className="text-sm text-slate-300">Malam 1: Pilih 1 target hidup.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
          {livingPlayers.map(p => (
            <button
              key={p.id}
              onClick={() => setGameState(prev => ({ ...prev, doppelgangerTargetId: p.id }))}
              className={`p-3 rounded-xl border text-sm font-bold text-left ${gameState.doppelgangerTargetId === p.id ? 'bg-indigo-950 border-indigo-500 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button onClick={handleConfirmDoppelganger} className="w-full py-4 rounded-2xl bg-indigo-700 text-white font-bold flex items-center justify-center gap-2">
          <span>KONFIRMASI DOPPELGANGER</span>
          <ArrowRight className="w-5 h-5" />
        </button>
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
          <p className="text-sm text-slate-300">Pilih 1 pemain untuk diramal perannya.</p>
        </div>

        {result ? (
          <div className="bg-gradient-to-br from-cyan-950 via-slate-900 to-cyan-950 border-2 border-cyan-500 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">HASIL RAMALAN SEER</span>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">{result.targetName}</h3>
              <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold text-base">
                ROLE: {result.displayedRole}
              </div>
            </div>

            <button
              onClick={advanceNightPhase}
              className="w-full py-3.5 rounded-2xl bg-cyan-600 text-slate-950 font-black text-sm shadow-xl"
            >
              TUTUP HASIL & SELESAI SEER
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
            {livingPlayers.map(player => (
              <button
                key={player.id}
                onClick={() => handleSeerInspect(player.id)}
                className="p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-300 hover:bg-cyan-950 text-sm font-bold text-left transition flex items-center justify-between"
              >
                <span className="truncate">{player.name}</span>
                <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
              </button>
            ))}
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
          <p className="text-sm text-slate-300">Pilih penggunaan Heal atau Kill Potion secara blind.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="font-bold text-emerald-400 text-sm">❤️ Heal Potion</span></div>
            <select
              disabled={gameState.witchHealUsed}
              value={gameState.witchHealTargetId || ''}
              onChange={e => {
                const val = e.target.value || null;
                setGameState(prev => ({ ...prev, witchHealTargetId: val, witchHealUsedThisNight: !!val }));
              }}
              className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="">-- Tebak Target Heal --</option>
              {livingTargets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="font-bold text-purple-400 text-sm">☠️ Kill Potion</span></div>
            <select
              disabled={gameState.witchKillUsed}
              value={gameState.witchKillTargetId || ''}
              onChange={e => {
                const val = e.target.value || null;
                setGameState(prev => ({ ...prev, witchKillTargetId: val }));
              }}
              className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="">-- Pilih Target Kill --</option>
              {livingTargets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setGameState(prev => ({
              ...prev,
              witchHealUsed: prev.witchHealUsed || !!prev.witchHealTargetId,
              witchKillUsed: prev.witchKillUsed || !!prev.witchKillTargetId
            }));
            advanceNightPhase();
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-700 to-purple-600 text-white font-bold text-base shadow-xl flex items-center justify-center gap-2"
        >
          <span>SELESAIKAN WITCH & PROSES MALAM</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderHunterRevenge = () => {
    const hunter = gameState.players.find(p => p.role === 'HUNTER' && !p.alive && !p.hunterRevengeUsed);
    const candidates = gameState.players.filter(p => p.alive);
    const selected = gameState.players.find(p => p.id === gameState.hunterTargetId);

    if (!hunter) return null;

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-950 border border-orange-700 text-orange-300">
            <span className="text-3xl">🏹</span>
          </div>
          <h2 className="text-2xl font-bold text-orange-300">HUNTER REVENGE</h2>
          <p className="text-sm text-slate-300"><strong>{hunter.name}</strong> tereliminasi. Pilih 1 pemain untuk dibalas dendam.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto">
          {candidates.map(p => (
            <button
              key={p.id}
              onClick={() => setGameState(prev => ({ ...prev, hunterTargetId: p.id }))}
              className={`p-3 rounded-xl border text-sm font-bold text-left transition ${gameState.hunterTargetId === p.id ? 'bg-orange-950 border-orange-500 text-orange-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          disabled={!selected}
          onClick={() => handleHunterRevenge(selected?.id)}
          className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-black"
        >
          KONFIRMASI BALAS DENDAM
        </button>
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
          <p className="text-sm text-slate-300">Matahari telah terbit di desa.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          {deaths.length === 0 ? (
            <div className="space-y-2">
              <span className="text-4xl">🕊️</span>
              <h3 className="text-xl font-bold text-emerald-400">Semua Pemain Selamat!</h3>
              <p className="text-xs text-slate-300">Semalam tidak ada pemain yang tereliminasi.</p>
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
              gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', `Memulai diskusi Hari ${prev.dayNumber}.`)
            }));
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-black text-base shadow-xl flex items-center justify-center gap-2"
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
        </div>

        <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">SISA WAKTU DISKUSI</span>
          <div className="text-6xl font-black font-mono text-amber-400 tracking-wider">
            {formatTime(remainingSeconds)}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {!gameState.discussionEndTimestamp ? (
              <button onClick={startDiscussionTimer} className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                <span>MULAI TIMER</span>
              </button>
            ) : isTimerRunning ? (
              <button onClick={pauseDiscussionTimer} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm flex items-center gap-2 border border-slate-700">
                <Pause className="w-4 h-4" />
                <span>PAUSE</span>
              </button>
            ) : (
              <button onClick={resumeDiscussionTimer} className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME</span>
              </button>
            )}
          </div>
        </div>

        <button onClick={handleFinishDiscussionEarly} className="w-full py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2">
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
    const isAllVotesDone = currentVoterIndex >= livingPlayers.length || Object.keys(votes).length >= livingPlayers.length;

    const voteTally = {};
    Object.entries(votes).forEach(([voterId, targetId]) => {
      const voter = gameState.players.find(p => p.id === voterId && p.alive);
      if (!voter || !targetId) return;
      const weight = voter.role === 'MAYOR' && gameState.mayorRevealed ? 2 : 1;
      voteTally[targetId] = (voteTally[targetId] || 0) + weight;
    });

    const sortedCandidates = Object.entries(voteTally)
      .map(([targetId, count]) => ({
        player: gameState.players.find(p => p.id === targetId),
        count
      }))
      .filter(item => item.player)
      .sort((a, b) => b.count - a.count);

    const maxVotes = sortedCandidates.length > 0 ? sortedCandidates[0].count : 0;
    const topCandidates = sortedCandidates.filter(c => c.count === maxVotes && maxVotes > 0);
    const isTie = topCandidates.length > 1;

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950 border border-red-700 text-red-400">
            <Skull className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">🗳️ SESI VOTING</h2>
        </div>

        <div className="space-y-2">
          {livingMayor && !gameState.mayorRevealed && (
            <button onClick={handleMayorReveal} className="w-full py-3 rounded-2xl bg-amber-600 text-slate-950 font-black text-sm">
              👑 UNGKAP IDENTITAS MAYOR
            </button>
          )}
        </div>

        {!isAllVotesDone && currentVoter ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400">PEMILIH ({currentVoterIndex + 1}/{livingPlayers.length})</span>
              <span className="text-lg font-black text-amber-400">{currentVoter.name}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[35vh] overflow-y-auto">
              {livingPlayers.filter(p => p.id !== currentVoter.id).map(target => (
                <button
                  key={target.id}
                  onClick={() => handleVoteSubmit(currentVoter.id, target.id)}
                  className="p-3 rounded-xl border bg-slate-950 border-slate-800 text-slate-300 hover:bg-red-950 text-sm font-bold text-left transition flex items-center justify-between"
                >
                  <span className="truncate">{target.name}</span>
                  <Skull className="w-4 h-4 text-red-400 shrink-0" />
                </button>
              ))}
            </div>

            <button onClick={() => handleVoteSubmit(currentVoter.id, null)} className="w-full py-3 rounded-2xl border border-slate-600 bg-slate-800 text-slate-200 font-black text-sm">
              ⏭️ SKIP VOTE
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white text-center">HASIL REKAP VOTING</h3>

            {isTie && (
              <div className="p-3 bg-amber-950/80 border border-amber-600 rounded-2xl text-amber-200 text-xs text-center font-bold">
                ⚠️ HASIL SERI: {topCandidates.map(c => c.player.name).join(' & ')} memperoleh suara terbanyak yang sama ({maxVotes} suara).
              </div>
            )}

            <div className="space-y-3">
              {sortedCandidates.length === 0 ? (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center text-sm text-slate-400">
                  Semua pemain memilih skip vote. Tidak ada pemain yang tereliminasi.
                </div>
              ) : (
                sortedCandidates.map(({ player, count }) => {
                  const isTop = count === maxVotes && maxVotes > 0;
                  const percentage = Math.min(100, (count / livingPlayers.length) * 100);

                  return (
                    <div key={player.id} className={`p-3.5 rounded-2xl border space-y-2 transition ${isTop ? 'bg-red-950/40 border-red-500' : 'bg-slate-950 border-slate-800'}`}>
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className={isTop ? 'text-red-400 font-extrabold' : 'text-white'}>
                          {player.name} {isTop && '🔥'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs ${isTop ? 'bg-red-600 text-white font-black' : 'bg-slate-800 text-slate-400'}`}>
                          {count} Suara
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${isTop ? 'bg-gradient-to-r from-red-600 to-amber-500' : 'bg-slate-600'}`}
                          style={{ width: `${Math.max(8, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={resolveVotingResults} className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 text-white font-bold text-base shadow-xl flex items-center justify-center gap-2">
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
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl text-left">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">HASIL PERAN AKHIR PEMAIN</h3>
          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            {gameState.players.map(p => {
              const meta = ROLES[p.role];
              return (
                <div key={p.id} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{meta?.icon}</span>
                    <div>
                      <span className="font-bold text-white text-sm block">{p.name}</span>
                      <span className={`font-semibold ${meta?.color}`}>{meta?.name}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full font-bold border ${p.alive ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-red-950 text-red-400 border-red-900'}`}>
                    {p.alive ? '🟢 Bertahan Hidup' : `☠️ Mati (${p.deathReason || 'Eliminasi'})`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button onClick={handleRestartSamePlayers} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-black text-base shadow-xl flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5" />
            <span>MAIN LAGI DENGAN PEMAIN SAMA</span>
          </button>
          <button onClick={handleNewGame} className="w-full py-3.5 rounded-2xl bg-slate-800 text-white font-bold text-sm border border-slate-700">
            GAME BARU
          </button>
        </div>
      </div>
    );
  };

  const renderCurrentPhase = () => {
    switch (gameState.currentPhase) {
      case 'HOME': return renderHome();
      case 'SETUP': return renderSetup();
      case 'ROLE_SUMMARY': return renderRoleSummary();
      case 'ROLE_REVEAL': return renderRoleReveal();
      case 'DOPPELGANGER_REVEAL': return renderDoppelgangerReveal();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      {renderToast()}
      {renderLoverDeathNotice()}
      {renderConfirmModal()}
      {renderRulesModal()}
      {renderRoleListDrawer()}
      {renderGameLogDrawer()}
      {renderModeratorDashboard()}
      {renderHeader()}
      {renderNightTimeline()}
      <main className="flex-1 pb-8">{renderCurrentPhase()}</main>
    </div>
  );
}
