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
  EyeOff,
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

const LOCAL_STORAGE_KEY = 'WEREWOLF_MODERATOR_ASSISTANT_STATE_V4';
const GAME_STATE_VERSION = 4;

const ROLES = {
  WARGA: { name: 'Warga', team: 'Warga', color: 'text-slate-300', bg: 'bg-slate-900/90', border: 'border-slate-700', accent: 'from-slate-800 to-slate-950', desc: 'Tidak memiliki kemampuan khusus. Bekerja sama mengeliminasi seluruh ancaman.' },
  WEREWOLF: { name: 'Werewolf', team: 'Evil', color: 'text-red-400', bg: 'bg-red-950/90', border: 'border-red-600/60', accent: 'from-red-900 via-red-950 to-slate-950', desc: 'Setiap malam memilih 1 korban. Sesama Werewolf saling mengetahui.' },
  LYCAN: { name: 'Lycan', team: 'Warga', color: 'text-zinc-200', bg: 'bg-zinc-900/90', border: 'border-zinc-600', accent: 'from-zinc-800 to-slate-950', desc: 'Berada di tim Warga dan tidak memiliki aksi malam. Seer akan melihat Lycan sebagai Werewolf.' },
  SEER: { name: 'Seer', team: 'Warga', color: 'text-cyan-400', bg: 'bg-cyan-950/90', border: 'border-cyan-600/60', accent: 'from-cyan-950 via-slate-900 to-slate-950', desc: 'Setiap malam memeriksa 1 pemain untuk mengetahui wujud/perannya. Lycan terlihat sebagai Werewolf.' },
  GUARDIAN: { name: 'Guardian', team: 'Warga', color: 'text-blue-400', bg: 'bg-blue-950/90', border: 'border-blue-600/60', accent: 'from-blue-950 via-slate-900 to-slate-950', desc: 'Melindungi 1 pemain setiap malam dari serangan Werewolf. Tidak boleh melindungi pemain yang sama dua malam berturut-turut.' },
  CUPID: { name: 'Cupid', team: 'Warga', color: 'text-pink-400', bg: 'bg-pink-950/90', border: 'border-pink-600/60', accent: 'from-pink-950 via-slate-900 to-slate-950', desc: 'Hanya aktif Malam 1 dan memilih 2 pemain menjadi Lovers. Jika salah satu mati, pasangannya ikut mati.' },
  MAYOR: { name: 'Mayor', team: 'Warga', color: 'text-amber-400', bg: 'bg-amber-950/90', border: 'border-amber-600/60', accent: 'from-amber-950 via-slate-900 to-slate-950', desc: 'Sekali per game dapat mengungkapkan identitas sebagai Mayor. Setelah terungkap, bobot suaranya menjadi 2 pada voting.' },
  SHERIFF: { name: 'Sheriff', team: 'Warga', color: 'text-yellow-300', bg: 'bg-yellow-950/90', border: 'border-yellow-600/60', accent: 'from-yellow-950 via-slate-900 to-slate-950', desc: 'Sekali per game, pada malam hari memilih 1 pemain untuk diuji. Jika target adalah Werewolf, target tereliminasi. Jika bukan, Sheriff tereliminasi.' },
  HUNTER: { name: 'Hunter', team: 'Warga', color: 'text-orange-300', bg: 'bg-orange-950/90', border: 'border-orange-600/60', accent: 'from-orange-950 via-slate-900 to-slate-950', desc: 'Jika mati, Hunter dapat memilih 1 pemain lain untuk dieliminasi sebagai balas dendam.' },
  TRAITOR: { name: 'Traitor', team: 'Warga', color: 'text-slate-200', bg: 'bg-slate-900/90', border: 'border-slate-700', accent: 'from-slate-800 to-slate-950', desc: 'Awalnya di kubu Warga. Jika seluruh Werewolf mati dan Traitor masih hidup, ia berubah menjadi Werewolf.' },
  WOLF_CUB: { name: 'Wolf Cub', team: 'Evil', color: 'text-rose-300', bg: 'bg-rose-950/90', border: 'border-rose-600/60', accent: 'from-rose-950 via-slate-900 to-slate-950', desc: 'Jika Wolf Cub mati, Werewolf mendapat amukan pada malam berikutnya dan dapat membunuh 2 pemain.' },
  WITCH: { name: 'Witch', team: 'Warga', color: 'text-purple-400', bg: 'bg-purple-950/90', border: 'border-purple-600/60', accent: 'from-purple-950 via-slate-900 to-slate-950', desc: 'Memiliki Heal Potion dan Kill Potion, masing-masing 1x. Witch tidak melihat korban Werewolf dan menebak secara blind.' },
  JESTER: { name: 'Jester', team: 'Neutral', color: 'text-pink-300', bg: 'bg-pink-950/90', border: 'border-pink-600/60', accent: 'from-pink-950 via-slate-900 to-slate-950', desc: 'Menang sendiri jika berhasil tereliminasi melalui voting siang hari.' },
  DOPPELGANGER: { name: 'Doppelganger', team: 'Neutral', color: 'text-indigo-300', bg: 'bg-indigo-950/90', border: 'border-indigo-600/60', accent: 'from-indigo-950 via-slate-900 to-slate-950', desc: 'Malam 1 memilih 1 target. Jika target mati, Doppelganger menggantikan role-nya.' }
};

const ROLE_KEYS = Object.keys(ROLES);

const GAME_PRESETS = [
  { id: 'quick_8', name: '⚡ Quick 8 Players', desc: 'Permainan cepat & intens untuk grup kecil (8 Pemain).', count: 8, roles: { WEREWOLF: 2, SEER: 1, GUARDIAN: 1, WARGA: 4 } },
  { id: 'classic_10', name: '📜 Classic 10 Players', desc: 'Komposisi standar seimbang untuk 10 Pemain.', count: 10, roles: { WEREWOLF: 2, SEER: 1, GUARDIAN: 1, WITCH: 1, WARGA: 5 } },
  { id: 'balanced_12', name: '🛡️ Balanced 12 Players', desc: 'Pengalaman penuh dengan peran khusus untuk 12 Pemain.', count: 12, roles: { WEREWOLF: 3, SEER: 1, GUARDIAN: 1, WITCH: 1, HUNTER: 1, CUPID: 1, WARGA: 4 } },
  { id: 'chaos_15', name: '🔥 Chaos 15 Players', desc: 'Mode seru & menantang untuk grup besar (15 Pemain).', count: 15, roles: { WEREWOLF: 3, WOLF_CUB: 1, SEER: 1, GUARDIAN: 1, WITCH: 1, HUNTER: 1, CUPID: 1, SHERIFF: 1, JESTER: 1, TRAITOR: 1, WARGA: 3 } },
  { id: 'epic_18', name: '🏰 Epic 18 Players', desc: 'Skala besar dengan variasi role melimpah (18 Pemain).', count: 18, roles: { WEREWOLF: 4, WOLF_CUB: 1, SEER: 1, GUARDIAN: 1, WITCH: 1, HUNTER: 1, CUPID: 1, SHERIFF: 1, MAYOR: 1, JESTER: 1, TRAITOR: 1, WARGA: 4 } },
  { id: 'war_20', name: '⚔️ Total War 20 Players', desc: 'Pertempuran puncak seluruh role khusus (20 Pemain).', count: 20, roles: { WEREWOLF: 4, WOLF_CUB: 1, SEER: 1, GUARDIAN: 1, WITCH: 1, HUNTER: 1, CUPID: 1, SHERIFF: 1, MAYOR: 1, LYCAN: 1, DOPPELGANGER: 1, JESTER: 1, TRAITOR: 1, WARGA: 5 } }
];

function isWolfAligned(player) {
  return Boolean(
    player &&
    (player.role === 'WEREWOLF' ||
      player.role === 'WOLF_CUB' ||
      (player.role === 'TRAITOR' && player.convertedToWerewolf))
  );
}

function getEffectiveTeam(player) {
  if (!player) return null;
  if (player.convertedToWerewolf) return 'Evil';
  if (player.role === 'WEREWOLF' || player.role === 'WOLF_CUB') return 'Evil';
  if (player.role === 'JESTER') return 'Neutral';
  return ROLES[player.role]?.team || 'Warga';
}

function normalizePlayer(player) {
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

function loadSavedGame() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.players) || typeof parsed.currentPhase !== 'string') return null;
    if (parsed.stateVersion && parsed.stateVersion !== GAME_STATE_VERSION) return null;
    return parsed;
  } catch (error) {
    console.error('State game tidak dapat dimuat:', error);
    return null;
  }
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
      const parsed = loadSavedGame();
      if (parsed) {
        return {
          ...createInitialGameState(),
          ...parsed,
          stateVersion: GAME_STATE_VERSION,
          players: parsed.players.map(normalizePlayer)
        };
      }
    } catch (e) {
      console.error("Gagal memuat state:", e);
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
  const [privacyMode, setPrivacyMode] = useState(false);
const discussionTransitionLock = useRef(false);

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
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...gameState, stateVersion: GAME_STATE_VERSION }));
    } catch (e) {
      console.error("Gagal menyimpan state:", e);
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
  if (gameState.currentPhase === 'DISCUSSION') discussionTransitionLock.current = false;
}, [gameState.currentPhase]);

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
    if (discussionTransitionLock.current) return;
    discussionTransitionLock.current = true;
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
    return [{ id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), timestamp: timeStr, nightNumber, dayNumber, type, message }, ...logs];
  }

  function pushUndoState(state) {
    const { undoStack, ...rest } = state;
    return [rest, ...(undoStack || []).slice(0, 4)];
  }

  function triggerToast(msg) {
    setToastMessage(msg);
  }

  const getLivingTargets = (state, kind) => {
    const players = state.players || [];
    switch (kind) {
      case 'WEREWOLF':
        return players.filter(p => p.alive && !isWolfAligned(p));
      case 'GUARDIAN':
        return players.filter(p => p.alive && !p.protectedLastNight);
      case 'SHERIFF': {
        const sheriff = players.find(p => p.role === 'SHERIFF' && p.alive);
        return players.filter(p => p.alive && p.id !== sheriff?.id);
      }
      case 'DOPPELGANGER':
        const doppelganger = players.find(p => p.alive && p.role === 'DOPPELGANGER');
      return players.filter(p => p.alive && p.id !== doppelganger?.id);
      case 'SEER': {
        const seer = players.find(p => p.role === 'SEER' && p.alive);
        return players.filter(p => p.alive && p.id !== seer?.id);
      }
      case 'HUNTER':
        return players.filter(p => p.alive);
      case 'WITCH':
      default:
        return players.filter(p => p.alive);
    }
  };

  const validateTarget = (state, kind, targetId) => {
    if (!targetId) return { valid: false, reason: 'Pilih target terlebih dahulu.' };
    const target = state.players.find(p => p.id === targetId);
    if (!target || !target.alive) return { valid: false, reason: 'Target tidak valid: pemain sudah tereliminasi atau tidak ditemukan.' };
    if (!getLivingTargets(state, kind).some(p => p.id === targetId)) {
      const reasons = {
        WEREWOLF: 'Werewolf hanya dapat memilih pemain non-Evil yang masih hidup.',
        GUARDIAN: 'Guardian tidak boleh melindungi pemain yang sama dua malam berturut-turut.',
        SHERIFF: 'Sheriff harus memilih pemain hidup selain dirinya sendiri.',
        DOPPELGANGER: 'Doppelganger harus memilih target hidup selain dirinya sendiri.',
        SEER: 'Seer harus memilih pemain hidup selain dirinya sendiri.'
      };
      return { valid: false, reason: reasons[kind] || 'Target tidak tersedia untuk aksi ini.' };
    }
    return { valid: true };
  };

  const getPhaseAssistant = () => {
    const state = gameState;
    if (privacyMode) {
      return {
        eyebrow: '🔒 PRIVACY MODE',
        title: 'Informasi moderator disembunyikan',
        detail: 'Layar aman untuk diperlihatkan kepada pemain. State permainan tidak berubah.',
        next: 'Lanjutkan hanya dengan kontrol fase yang terlihat.',
        tone: 'border-slate-700 bg-slate-900/95'
      };
    }

    const living = state.players.filter(p => p.alive);
    const configs = {
      ROLE_SUMMARY: ['🎭 ROLE SETUP', 'Komposisi role siap dibagikan.', 'NEXT: Bagikan role secara berurutan.'],
      ROLE_REVEAL: ['🔐 ROLE REVEAL', `Sedang membuka role pemain ${Math.min(state.revealPlayerIndex + 1, state.players.length)} dari ${state.players.length}.`, 'NEXT: Sembunyikan kembali kartu lalu lanjut ke pemain berikutnya.'],
      DOPPELGANGER_REVEAL: ['🎭 DOPPELGANGER', 'Ada perubahan role yang perlu dibaca moderator.', 'NEXT: Konfirmasi reveal untuk melanjutkan flow.'],
      NIGHT_INTRO: [`🌙 MALAM ${state.nightNumber}`, 'Semua pemain menutup mata.', 'NEXT: Mulai urutan aksi malam.'],
      MORNING: [`☀️ PAGI ${state.dayNumber}`, `${state.lastNightDeaths.length} pemain tereliminasi pada malam terakhir.`, 'NEXT: Tampilkan hasil malam lalu masuk diskusi.'],
      DISCUSSION: ['💬 DISKUSI', state.discussionEndTimestamp ? `Timer ${formatTime(remainingSeconds)} tersisa.` : 'Timer belum dimulai.', 'NEXT: Selesaikan diskusi untuk masuk voting.'],
      VOTING: ['🗳️ VOTING', `${Object.keys(state.votes || {}).length}/${living.length} suara tercatat.`, 'NEXT: Selesaikan seluruh voting lalu proses hasil.'],
      HUNTER_REVENGE: ['🏹 HUNTER REVENGE', 'Hunter yang tereliminasi memiliki kesempatan balas dendam.', 'NEXT: Pilih target hidup atau lanjut sesuai aturan meja.'],
      GAME_OVER: ['🏆 GAME OVER', 'Kondisi kemenangan sudah tercapai.', 'NEXT: Tidak ada aksi permainan yang boleh dijalankan.']
    };

    const cfg = configs[state.currentPhase];
    if (cfg) return { eyebrow: cfg[0], title: cfg[1], detail: cfg[2], next: cfg[2], tone: 'border-amber-700/50 bg-slate-900/95' };

    const phaseConfig = {
      NIGHT_CUPID: ['💘 CUPID', 'Pilih dua pemain hidup untuk Lovers.', 'NEXT: Konfirmasi pasangan.'],
      NIGHT_WEREWOLF: ['🐺 WEREWOLF', `${getLivingTargets(state, 'WEREWOLF').length} target valid tersedia.`, state.werewolfTargetIds?.length ? 'NEXT: Konfirmasi target Werewolf.' : 'NEXT: Pilih target yang valid.'],
      NIGHT_GUARDIAN: ['🛡️ GUARDIAN', `${getLivingTargets(state, 'GUARDIAN').length} target valid tersedia.`, state.guardianTargetId ? 'NEXT: Konfirmasi perlindungan.' : 'NEXT: Pilih target perlindungan.'],
      NIGHT_SHERIFF: ['⭐ SHERIFF', state.sheriffUsed ? 'Ability sudah digunakan.' : 'Investigation masih tersedia 1x.', state.sheriffTargetId ? 'NEXT: Konfirmasi atau gunakan SKIP.' : 'NEXT: Pilih target atau SKIP.'],
      NIGHT_DOPPELGANGER: ['🎭 DOPPELGANGER', `${getLivingTargets(state, 'DOPPELGANGER').length} target valid tersedia.`, state.doppelgangerTargetId ? 'NEXT: Konfirmasi target.' : 'NEXT: Pilih target.'],
      NIGHT_SEER: ['🔮 SEER', state.seerResult ? `Hasil untuk ${state.seerResult.targetName} sudah tersedia.` : `${getLivingTargets(state, 'SEER').length} target valid tersedia.`, state.seerResult ? 'NEXT: Tutup hasil Seer.' : 'NEXT: Pilih target untuk diperiksa.'],
      NIGHT_WITCH: ['🧪 WITCH', `Heal ${state.witchHealUsed ? 'TERPAKAI' : 'TERSEDIA'} · Kill ${state.witchKillUsed ? 'TERPAKAI' : 'TERSEDIA'}.`, 'NEXT: Gunakan potion yang diperlukan atau selesaikan fase Witch.']
    };
    const pc = phaseConfig[state.currentPhase];
    if (pc) return { eyebrow: pc[0], title: pc[1], detail: pc[2], next: pc[2], tone: 'border-indigo-700/50 bg-slate-900/95' };
    return { eyebrow: '🎮 GAME MASTER', title: 'State permainan siap.', detail: 'Gunakan kontrol fase yang tersedia.', next: 'NEXT: Ikuti instruksi layar.', tone: 'border-slate-700 bg-slate-900/95' };
  };

  const renderSmartAssistant = () => {
    if (gameState.currentPhase === 'HOME' || gameState.currentPhase === 'SETUP') return null;
    const assistant = getPhaseAssistant();
    return (
      <section className={`w-full border-b ${assistant.tone} px-4 py-3 shadow-inner animate-fadeIn`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="min-w-0">
            <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase">{assistant.eyebrow}</div>
            <div className="text-sm font-black text-white truncate">{assistant.title}</div>
            <div className="text-[11px] text-slate-400 truncate">{assistant.detail}</div>
          </div>
          <div className="shrink-0 text-[10px] sm:text-xs font-black text-slate-200 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2">
            {assistant.next}
          </div>
        </div>
      </section>
    );
  };

  const toggleParticipant = (name) => {
    setInputPlayerNames(prev => {
      const exists = prev.includes(name);
      if (!exists && prev.length >= 25) {
        triggerToast('Maksimal peserta adalah 25 orang.');
        return prev;
      }
      const next = exists ? prev.filter(n => n !== name) : [...prev, name];
      setPlayerCount(next.length);
      return next;
    });
  };

  const selectAllParticipants = () => {
    const limitedNames = PARTICIPANT_LIST.slice(0, 25);
    setInputPlayerNames(limitedNames);
    setPlayerCount(limitedNames.length);
    setRoleCountsDraft({ WARGA: Math.max(0, limitedNames.length - 4), WEREWOLF: 1, GUARDIAN: 1, SEER: 1, WITCH: 1 });
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
    if (trimmed.length < 5 || trimmed.length > 25) {
      triggerToast('Pilih 5–25 peserta untuk memulai permainan.');
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
      hunterRevengeUsed: false,
       convertedToWerewolf: false
    }));

    setGameState(prev => ({
      ...createInitialGameState(),
      players,
      currentPhase: 'ROLE_SUMMARY',
      roleCounts: { ...roleCountsDraft },
      gameLog: addLog([], 1, 1, 'INFO', `Permainan baru dibuat dengan ${playerCount} pemain.`)
    }));
  };

  const startRoleReveal = () => setGameState(prev => ({ ...prev, currentPhase: 'ROLE_REVEAL', revealPlayerIndex: 0, isRoleCardOpen: false }));
  const toggleRoleCard = () => setGameState(prev => ({ ...prev, isRoleCardOpen: !prev.isRoleCardOpen }));

  const nextRevealPlayer = () => {
    setGameState(prev => {
      const nextIndex = prev.revealPlayerIndex + 1;
      if (nextIndex >= prev.players.length) {
        return { ...prev, currentPhase: 'NIGHT_INTRO', nightNumber: 1, gameLog: addLog(prev.gameLog, 1, 1, 'INFO', 'Pembagian role selesai. Memulai Malam 1.') };
      }
      return { ...prev, revealPlayerIndex: nextIndex, isRoleCardOpen: false };
    });
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
      if (sheriff && !state.sheriffResolved && !state.nightSkips?.SHERIFF && sheriffTargets.length > 0 && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN')) {
        return { ...commit, currentPhase: 'NIGHT_SHERIFF' };
      }



      const seer = state.players.find(p => p.role === 'SEER' && p.alive);
      const seerTargets = getLivingTargets(state, 'SEER');
      if (seer && seerTargets.length > 0 && !state.seerTargetId && !state.nightSkips?.SEER && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_SHERIFF', 'NIGHT_DOPPELGANGER', 'NIGHT_SEER')) {
        return { ...commit, currentPhase: 'NIGHT_SEER' };
      }

      const witch = state.players.find(p => p.role === 'WITCH' && p.alive);
      const witchTargets = getLivingTargets(state, 'WITCH');
      if (witch && witchTargets.length > 0 && !state.nightSkips?.WITCH && (!state.witchHealUsed || !state.witchKillUsed) && canContinueFrom('NIGHT_INTRO', 'NIGHT_CUPID', 'NIGHT_WEREWOLF', 'NIGHT_GUARDIAN', 'NIGHT_SHERIFF', 'NIGHT_DOPPELGANGER', 'NIGHT_SEER')) {
        return { ...commit, currentPhase: 'NIGHT_WITCH' };
      }

      return resolveNightActions(commit);
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
        if (target.role === 'WEREWOLF' || target.role === 'WOLF_CUB' || (target.role === 'TRAITOR' && target.convertedToWerewolf)) {
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
      wolfCubRagePending: state.wolfCubRagePending || nightDeathsList.some(d => d.player.role === 'WOLF_CUB'),
      hunterPending: nightDeathsList.some(d => d.player.role === 'HUNTER' && !d.player.hunterRevengeUsed),
      loverDeathNotice,
      doppelgangerRoleChangeNotice,
      werewolfTargetId: null,
      werewolfTargetIds: [],
      guardianTargetId: null,
      sheriffTargetId: null,
      sheriffResolved: Boolean(state.sheriffResolved),
      seerTargetId: null,
      seerResult: null,
      witchHealUsedThisNight: false,
      witchHealTargetId: null,
      witchKillTargetId: null,
      hunterTargetId: null,
      nightSkips: {},
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
    const players = state.players.map(p =>
      p.alive && p.role === 'TRAITOR'
        ? { ...p, convertedToWerewolf: true }
        : p
    );
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
    const validation = validateTarget(gameState, 'SEER', targetId);
    if (!validation.valid) {
      triggerToast(validation.reason);
      return;
    }
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
      seerResult: { targetName: target.name, displayedRole, isLycanNote },
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
    if (!p1?.alive || !p2?.alive) {
      triggerToast('Kedua pemain harus masih hidup.');
      return;
    }

    const updatedPlayers = players.map(p => {
      if (p.id === cupidLover1Id) return { ...p, loverId: cupidLover2Id };
      if (p.id === cupidLover2Id) return { ...p, loverId: cupidLover1Id };
      return p;
    });

    const newLog = addLog(gameState.gameLog, nightNumber, dayNumber, 'ACTION', `Cupid memilih ${p1.name} & ${p2.name} sebagai Pasangan Lovers.`);
    triggerToast(`Pasangan ${p1.name} ❤️ ${p2.name} berhasil dibuat.`);
    advanceNightPhase(
      { players: updatedPlayers, cupidUsed: true, gameLog: newLog },
      { recordUndo: true }
    );
  };

  const handleConfirmDoppelganger = () => {
    const targetId = gameState.doppelgangerTargetId;
    const validation = validateTarget(gameState, 'DOPPELGANGER', targetId);
    if (!validation.valid) {
      triggerToast(validation.reason);
      return;
    }

    const target = gameState.players.find(p => p.id === targetId);
    const newLog = addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', `Doppelganger memilih ${target.name} sebagai target.`);
    advanceNightPhase(
      { doppelgangerTargetId: targetId, gameLog: newLog },
      { recordUndo: true }
    );
  };

  const handleConfirmSheriff = () => {
    const validation = validateTarget(gameState, 'SHERIFF', gameState.sheriffTargetId);
    if (!validation.valid) {
      triggerToast('Pilih target Sheriff terlebih dahulu, atau tekan SKIP.');
      return;
    }

    const newLog = addLog(gameState.gameLog, gameState.nightNumber, gameState.dayNumber, 'ACTION', 'Sheriff menggunakan kemampuan malam pada pemain terpilih.');
    triggerToast('Aksi Sheriff dikonfirmasi.');
    advanceNightPhase(
      { sheriffResolved: true, sheriffUsed: true, gameLog: newLog },
      { recordUndo: true }
    );
  };

  const handleSkipSheriff = () => {
    const night = gameState.nightNumber;
    const newLog = addLog(
      gameState.gameLog,
      night,
      gameState.dayNumber,
      'INFO',
      `Sheriff memilih SKIP pada Malam ${night}. Kemampuan masih tersedia.`
    );
    triggerToast('Sheriff memilih SKIP. Kemampuan tetap tersedia untuk malam berikutnya.');
    advanceNightPhase(
      {
        sheriffResolved: false,
        sheriffUsed: false,
        sheriffTargetId: null,
        sheriffSkippedNights: [...(gameState.sheriffSkippedNights || []), night],
        gameLog: newLog
      },
      { recordUndo: true }
    );
  };

  const handleConfirmWerewolf = (selectedIds) => {
    const required = gameState.wolfCubRagePending ? 2 : 1;
    if (!selectedIds || selectedIds.length !== required) {
      triggerToast(`Pilih ${required} target${required > 1 ? 's' : ''}.`);
      return;
    }
    for (const targetId of selectedIds) {
      const validation = validateTarget(gameState, 'WEREWOLF', targetId);
      if (!validation.valid) {
        triggerToast(validation.reason);
        return;
      }
    }
    const log = addLog(
      gameState.gameLog,
      gameState.nightNumber,
      gameState.dayNumber,
      'ACTION',
      `Werewolf mengunci ${selectedIds.length} target untuk malam ini.`
    );
    advanceNightPhase(
      { werewolfTargetIds: [...selectedIds], werewolfTargetId: selectedIds[0] || null, wolfCubRagePending: false, gameLog: log },
      { recordUndo: true }
    );
  };

  const handleConfirmGuardian = () => {
    const validation = validateTarget(gameState, 'GUARDIAN', gameState.guardianTargetId);
    if (!validation.valid) {
      triggerToast(validation.reason);
      return;
    }
    const log = addLog(
      gameState.gameLog,
      gameState.nightNumber,
      gameState.dayNumber,
      'ACTION',
      'Guardian mengunci target perlindungan.'
    );
    advanceNightPhase(
      { guardianTargetId: gameState.guardianTargetId, gameLog: log },
      { recordUndo: true }
    );
  };

  const handleFinishWitch = () => {
    const nextState = {
      witchHealUsed: gameState.witchHealUsed || !!gameState.witchHealTargetId,
      witchKillUsed: gameState.witchKillUsed || !!gameState.witchKillTargetId
    };

    if (gameState.witchHealTargetId) {
      const validation = validateTarget(gameState, 'WITCH', gameState.witchHealTargetId);
      if (!validation.valid) {
        triggerToast(validation.reason);
        return;
      }
    }
    if (gameState.witchKillTargetId) {
      const validation = validateTarget(gameState, 'WITCH', gameState.witchKillTargetId);
      if (!validation.valid) {
        triggerToast(validation.reason);
        return;
      }
    }

    advanceNightPhase(
      { ...nextState, nightSkips: { ...(gameState.nightSkips || {}), WITCH: true } },
      { recordUndo: true }
    );
  };

  const handleSkipNightAction = (roleKey, message) => {
    const cleared = {
      nightSkips: { ...(gameState.nightSkips || {}), [roleKey]: true },
      gameLog: addLog(
        gameState.gameLog,
        gameState.nightNumber,
        gameState.dayNumber,
        'INFO',
        `⏭️ ${message}`
      )
    };

    switch (roleKey) {
      case 'CUPID':
        cleared.cupidLover1Id = null;
        cleared.cupidLover2Id = null;
        break;
      case 'WEREWOLF':
        cleared.werewolfTargetId = null;
        cleared.werewolfTargetIds = [];
        break;
      case 'GUARDIAN':
        cleared.guardianTargetId = null;
        break;
      case 'DOPPELGANGER':
        cleared.doppelgangerTargetId = null;
        break;
      case 'SEER':
        cleared.seerTargetId = null;
        cleared.seerResult = null;
        break;
      case 'WITCH':
        cleared.witchHealTargetId = null;
        cleared.witchKillTargetId = null;
        cleared.witchHealUsedThisNight = false;
        break;
      default:
        break;
    }

    advanceNightPhase(cleared, { recordUndo: true });
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

      if (winner) return { ...tempState, currentPhase: 'GAME_OVER', winner };
      if (prev.lastNightDeaths && prev.lastNightDeaths.length > 0) return { ...tempState, currentPhase: 'MORNING' };

      return { ...tempState, currentPhase: 'NIGHT_INTRO', nightNumber: prev.nightNumber + 1, dayNumber: prev.dayNumber + 1, votes: {}, currentVoterIndex: 0 };
    });
  };

  const handleMayorReveal = () => {
    const mayor = gameState.players.find(p => p.role === 'MAYOR' && p.alive);
    if (!mayor || gameState.mayorRevealed) return;
    setGameState(prev => ({ ...prev, mayorRevealed: true, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'ACTION', `Mayor ${mayor.name} mengungkapkan identitas. Suaranya bernilai 2.`) }));
    triggerToast(`${mayor.name} sekarang memiliki 2 suara.`);
  };

  const handleVoteSubmit = (voterId, targetId = null) => {
    if (gameState.currentPhase !== 'VOTING') {
      triggerToast('Voting sudah tidak aktif.');
      return;
    }

    const voter = gameState.players.find(p => p.id === voterId);
    if (!voter?.alive) {
      triggerToast('Pemain mati tidak dapat memberikan suara.');
      return;
    }
    if (Object.prototype.hasOwnProperty.call(gameState.votes, voterId)) {
      triggerToast('Pemain ini sudah memberikan suara.');
      return;
    }
    if (targetId) {
      const target = gameState.players.find(p => p.id === targetId);
      if (!target?.alive || target.id === voterId) {
        triggerToast('Target voting tidak valid.');
        return;
      }
    }

    setGameState(prev => {
      if (prev.currentPhase !== 'VOTING') return prev;
      if (Object.prototype.hasOwnProperty.call(prev.votes, voterId)) return prev;
      const newVotes = { ...prev.votes, [voterId]: targetId };
      const nextVoterIndex = prev.currentVoterIndex + 1;
      const voteLog = targetId
        ? `🗳️ ${voter.name} memberikan suara.`
        : `⏭️ ${voter.name} memilih SKIP VOTE.`;

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
      case 'SHERIFF': next.sheriffUsed = false; next.sheriffTargetId = null; break;
      case 'MAYOR': next.mayorRevealed = false; break;
      case 'WITCH': next.witchHealUsed = false; next.witchKillUsed = false; next.witchHealUsedThisNight = false; next.witchHealTargetId = null; next.witchKillTargetId = null; break;
      case 'CUPID': next.cupidUsed = false; next.cupidLover1Id = null; next.cupidLover2Id = null; break;
      default: break;
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
    updatedPlayers[idx] = { ...updatedPlayers[idx], role: copiedRole, team: getEffectiveTeam({ role: copiedRole, convertedToWerewolf: copiedRole === 'WEREWOLF' || copiedRole === 'WOLF_CUB' }), doppelgangerCopied: true };

    const updatedLog = addLog(log, nightNumber, dayNumber, 'ACTION', `🎭 Doppelganger ${doppel.name} menggantikan role ${target.name} dan menjadi ${ROLES[copiedRole]?.name || copiedRole}.`);
    return { players: updatedPlayers, log: updatedLog, notice: { playerName: doppel.name, targetName: target.name, oldRole, newRole: copiedRole } };
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
              loverDeathNotice.push({ id: `lover_${partner.id}_${nightNumber}_${dayNumber}`, name: partner.name, partnerName: deadPlayer.name });
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
            ...gameState, players: updatedPlayers, gameLog: log, lastDayDeaths: dayDeaths, loverDeathNotice, doppelgangerRoleChangeNotice,
            currentPhase: 'DOPPELGANGER_REVEAL', doppelgangerRevealNextPhase: 'GAME_OVER', doppelgangerRevealWinner: 'JESTER', winner: 'JESTER',
            ...resetDoppelgangerAbilityState(gameState, doppelgangerRoleChangeNotice.newRole)
          });
          return;
        }
        setGameState({ ...gameState, players: updatedPlayers, gameLog: log, lastDayDeaths: dayDeaths, loverDeathNotice, doppelgangerRoleChangeNotice, currentPhase: 'GAME_OVER', winner: 'JESTER' });
        return;
      }
    } else if (allVotesSkipped) {
      log = addLog(log, nightNumber, dayNumber, 'INFO', `⏭️ Semua pemain memilih SKIP VOTE. Tidak ada pemain yang tereliminasi.`);
    } else {
      log = addLog(log, nightNumber, dayNumber, 'INFO', `Hasil voting seri! Tidak ada pemain yang tereliminasi.`);
    }

    let tempState = {
      ...gameState, players: updatedPlayers, gameLog: log, lastDayDeaths: dayDeaths, loverDeathNotice, doppelgangerRoleChangeNotice,
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
      setGameState({ ...tempState, currentPhase: 'DOPPELGANGER_REVEAL', doppelgangerRevealNextPhase: winResult ? 'GAME_OVER' : 'NIGHT_INTRO', doppelgangerRevealWinner: winResult || null, winner: winResult || null, gameLog: log });
    } else if (winResult) {
      setGameState({ ...tempState, currentPhase: 'GAME_OVER', winner: winResult, gameLog: log });
    } else {
      setGameState({
        ...tempState, currentPhase: 'NIGHT_INTRO', nightNumber: nightNumber + 1, dayNumber: dayNumber + 1, votes: {}, currentVoterIndex: 0, discussionEndTimestamp: null,
        gameLog: addLog(log, nightNumber + 1, dayNumber + 1, 'INFO', `Memulai Malam ${nightNumber + 1}.`)
      });
    }
  };

  const startDiscussionTimer = () => {
    const endTimestamp = Date.now() + gameState.discussionDurationSeconds * 1000;
    setGameState(prev => ({ ...prev, undoStack: pushUndoState(prev), discussionEndTimestamp: endTimestamp, isTimerPaused: false, pausedRemainingSeconds: null, gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', 'Diskusi dimulai.') }));
  };

  const pauseDiscussionTimer = () => setGameState(prev => ({ ...prev, isTimerPaused: true, pausedRemainingSeconds: remainingSeconds }));
  const resumeDiscussionTimer = () => setGameState(prev => ({ ...prev, isTimerPaused: false, discussionEndTimestamp: Date.now() + remainingSeconds * 1000, pausedRemainingSeconds: null }));

  const handleFinishDiscussionEarly = () => {
    setConfirmModalData({
      title: 'Akhiri Diskusi Sekarang?',
      message: 'Lanjut langsung ke sesi voting?',
      onConfirm: () => { setConfirmModalData(null); triggerAutoTransitionToVoting(); }
    });
  };

  const handleUndo = () => {
    if (!gameState.undoStack || gameState.undoStack.length === 0) { triggerToast('Tidak ada aksi yang dapat dibatalkan.'); return; }
    setConfirmModalData({
      title: 'Batalkan Aksi Terakhir (Undo)?',
      message: 'Kembali ke state konfirmasi sebelumnya?',
      onConfirm: () => {
        setConfirmModalData(null);
        setGameState(prev => {
          const stack = [...prev.undoStack];
          const previousState = stack.shift();
          triggerToast('Aksi sebelumnya berhasil dibatalkan.');
          return { ...previousState, undoStack: stack };
        });
      }
    });
  };

  const handleRestartSamePlayers = () => {
    setConfirmModalData({
      title: 'Main Lagi Dengan Pemain Sama?',
      message: 'Peran akan diacak ulang untuk pemain yang sama.',
      onConfirm: () => {
        setConfirmModalData(null);
        const playerNames = gameState.players.map(p => p.name);
        const roleList = Object.entries(gameState.roleCounts || {}).flatMap(([role, count]) => Array(Number(count)).fill(role));
        const shuffledRoles = shuffle(roleList);

        const newPlayers = playerNames.map((name, idx) => ({
          id: 'player_' + (idx + 1) + '_' + Date.now(), name, role: shuffledRoles[idx], alive: true, loverId: null, protectedLastNight: false, protectedThisNight: false, deathReason: null, deathNight: null, deathDay: null, hunterRevengeUsed: false,
       convertedToWerewolf: false
        }));

        setGameState({ ...createInitialGameState(), players: newPlayers, currentPhase: 'ROLE_SUMMARY', gameLog: addLog([], 1, 1, 'INFO', `Game diulang.`) });
      }
    });
  };

  const clearSavedGame = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setGameState(createInitialGameState());
    setToastMessage('Data game tersimpan telah dihapus.');
  };

  const handleBackToHome = () => {
    setConfirmModalData({
      title: 'KEMBALI KE HALAMAN AWAL?',
      message: 'Data permainan saat ini akan dihapus.',
      onConfirm: () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setConfirmModalData(null); setShowRoleListDrawer(false); setShowGameLogDrawer(false); setShowDashboardDrawer(false); setShowRulesModal(false); setToastMessage(null); setInputPlayerNames([]); setPlayerCount(0); setGameState(createInitialGameState());
      }
    });
  };

  const handleNewGame = () => {
    setConfirmModalData({
      title: 'Mulai Game Baru?',
      message: 'Hapus data game saat ini?',
      onConfirm: () => { setConfirmModalData(null); localStorage.removeItem(LOCAL_STORAGE_KEY); setGameState(createInitialGameState()); }
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
      { key: 'NIGHT_SHERIFF', label: 'Sheriff', active: gameState.players.some(p => p.role === 'SHERIFF' && p.alive) && !gameState.sheriffResolved },
      { key: 'NIGHT_DOPPELGANGER', label: 'Doppelganger', active: gameState.nightNumber === 1 && gameState.players.some(p => p.role === 'DOPPELGANGER' && p.alive && !gameState.doppelgangerTargetId) },
      { key: 'NIGHT_SEER', label: 'Seer', active: gameState.players.some(p => p.role === 'SEER' && p.alive) },
      { key: 'NIGHT_WITCH', label: 'Witch', active: gameState.players.some(p => p.role === 'WITCH' && p.alive) && (!gameState.witchHealUsed || !gameState.witchKillUsed) }
    ].filter(s => s.active);

    const activeIndex = nightSteps.findIndex(s => s.key === gameState.currentPhase);

    return (
      <div className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 overflow-x-auto shadow-inner">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2 text-xs">
          {nightSteps.map((step, idx) => {
            const isDone = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <React.Fragment key={step.key}>
                {idx > 0 && <span className="text-slate-700">→</span>}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-300 font-bold whitespace-nowrap ${
                  isCurrent 
                    ? 'bg-indigo-950/90 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-950/60 scale-105' 
                    : isDone 
                    ? 'bg-slate-950/80 border-slate-800 text-emerald-400 opacity-80' 
                    : 'bg-slate-950/30 border-slate-900/60 text-slate-600'
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
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-start animate-fadeIn">
        <div className="bg-slate-900/95 border-r border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>📊 Moderator Dashboard</span>
            </h3>
            <button onClick={() => setShowDashboardDrawer(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-inner">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Kekuatan Kubu (Health Bar)</span>
            <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800/80 p-0.5 shadow-inner">
              <div style={{ width: `${goodPct}%` }} className="bg-emerald-500 h-full transition-all duration-500 rounded-l-full shadow-sm" title="Warga" />
              <div style={{ width: `${evilPct}%` }} className="bg-red-500 h-full transition-all duration-500 shadow-sm" title="Evil" />
              <div style={{ width: `${neutralPct}%` }} className="bg-pink-500 h-full transition-all duration-500 rounded-r-full shadow-sm" title="Netral" />
            </div>
            <div className="flex justify-between text-xs font-bold pt-1">
              <span className="text-emerald-400">🏘️ Warga: {livingGood}</span>
              <span className="text-red-400">🐺 Evil: {livingEvil}</span>
              {livingNeutral > 0 && <span className="text-pink-400">🃏 Netral: {livingNeutral}</span>}
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-inner">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Role Ability Tracker</span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="font-semibold text-slate-300">🧪 Witch Heal Potion</span>
                <span className={`font-black px-2.5 py-1 rounded-full ${gameState.witchHealUsed ? 'bg-red-950/80 text-red-400 border border-red-900/50' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50'}`}>
                  {gameState.witchHealUsed ? 'TERPAKAI' : 'TERSEDIA'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="font-semibold text-slate-300">☠️ Witch Kill Potion</span>
                <span className={`font-black px-2.5 py-1 rounded-full ${gameState.witchKillUsed ? 'bg-red-950/80 text-red-400 border border-red-900/50' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50'}`}>
                  {gameState.witchKillUsed ? 'TERPAKAI' : 'TERSEDIA'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="font-semibold text-slate-300">⭐ Sheriff Ability</span>
                <span className={`font-black px-2.5 py-1 rounded-full ${gameState.sheriffUsed ? 'bg-red-950/80 text-red-400 border border-red-900/50' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50'}`}>
                  {gameState.sheriffUsed ? 'TERPAKAI' : 'TERSEDIA'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="font-semibold text-slate-300">👑 Mayor Reveal</span>
                <span className={`font-black px-2.5 py-1 rounded-full ${gameState.mayorRevealed ? 'bg-amber-950/80 text-amber-400 border border-amber-900/50' : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'}`}>
                  {gameState.mayorRevealed ? 'AKTIF (2 Suara)' : 'BELUM AKTIF'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-3xl space-y-2 text-xs text-slate-300 shadow-inner">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Status Sesi:</span>
              <span className="font-black text-white">Malam {gameState.nightNumber} / Hari {gameState.dayNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Pemain Hidup / Mati:</span>
              <span className="font-black text-white">{livingPlayers.length} Hidup · {deadPlayers.length} Mati</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPrivacyOverlay = () => {
    if (!privacyMode) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-xl flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-900 border border-slate-700 text-amber-400 shadow-2xl">
            <EyeOff className="w-10 h-10" />
          </div>
          <div>
            <div className="text-[10px] font-black tracking-[0.25em] text-amber-400 uppercase">PRIVACY MODE</div>
            <h2 className="text-2xl font-black text-white mt-2">INFORMASI RAHASIA TERSEMBUNYI</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Layar aman untuk diperlihatkan kepada pemain. Role, target, hasil investigasi, log rahasia, dan informasi moderator tidak ditampilkan.
            </p>
          </div>
          <button
            onClick={() => setPrivacyMode(false)}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-xl shadow-amber-950/40"
          >
            KELUAR PRIVACY MODE
          </button>
        </div>
      </div>
    );
  };

  const renderToast = () => {
    if (!toastMessage) return null;
    return (
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-800/95 backdrop-blur-md border border-amber-500/50 text-amber-200 px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-bounce">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{toastMessage}</span>
      </div>
    );
  };

  const renderLoverDeathNotice = () => {
    const notices = gameState.loverDeathNotice || [];
    if (notices.length === 0) return null;

    return (
      <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
        <div className="w-full max-w-md bg-slate-900 border-2 border-pink-600/80 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="text-5xl">💔</div>
            <h3 className="text-2xl font-black text-pink-400">COUPLE TERPUTUS</h3>
            <p className="text-xs text-slate-300">Pasangan Cupid ikut meninggal karena pasangannya mati.</p>
          </div>

          <div className="space-y-2">
            {notices.map((notice) => (
              <div key={notice.id} className="p-4 rounded-2xl bg-pink-950/60 border border-pink-800/80 text-center">
                <p className="text-base font-black text-white">{notice.name}</p>
                <p className="text-xs text-pink-300 mt-1">
                  ikut meninggal karena <strong>{notice.partnerName}</strong> mati.
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setGameState(prev => ({ ...prev, loverDeathNotice: [] }))}
            className="w-full py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-black transition shadow-lg shadow-pink-950/50"
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
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h3 className="text-base font-bold text-white">{confirmModalData.title}</h3>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{confirmModalData.message}</p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setConfirmModalData(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              onClick={confirmModalData.onConfirm}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-lg shadow-red-950/50 transition"
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
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl max-h-[85vh] rounded-3xl flex flex-col shadow-2xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <BookOpen className="w-5 h-5" />
              <span>Panduan Aturan Werewolf</span>
            </div>
            <button onClick={() => setShowRulesModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300">
            <section className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <Crown className="w-4 h-4" /> Tujuan Permainan
              </h4>
              <p>• <strong>Tim Warga:</strong> Eliminasi seluruh role Evil (Werewolf dan Wolf Cub) dari desa.</p>
              <p>• <strong>Tim Werewolf:</strong> Jumlah role Evil yang hidup mencapai atau melebihi jumlah pemain non-Evil yang hidup.</p>
            </section>

            <section className="space-y-2.5">
              <h4 className="font-bold text-white text-sm">Aturan Peran</h4>
              {Object.entries(ROLES).map(([key, role]) => (
                <div key={key} className={`p-3 rounded-2xl border ${role.border} ${role.bg} flex items-start gap-3 shadow-md`}>
                  <span className="text-2xl">{role.icon}</span>
                  <div>
                    <span className={`font-black ${role.color}`}>{role.name} ({role.team})</span>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{role.desc}</p>
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
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fadeIn">
        <div className="bg-slate-900/95 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              <span>Daftar Peran Moderator</span>
            </h3>
            <button onClick={() => setShowRoleListDrawer(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
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
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    player.alive ? 'bg-slate-950/80 border-slate-800 shadow-sm' : 'bg-slate-950/40 border-slate-900/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{roleMeta?.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${player.alive ? 'text-white' : 'text-slate-500 line-through'}`}>
                          {player.name}
                        </span>
                        {lover && (
                          <span className="text-[10px] bg-pink-950/80 border border-pink-700/60 text-pink-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            ❤️ {lover.name}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${roleMeta?.color}`}>{roleMeta?.name}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                      player.alive
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                        : 'bg-red-950/80 text-red-400 border-red-900/80'
                    }`}
                  >
                    {player.alive ? '🟢 Hidup' : '☠️ Mati'}
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
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fadeIn">
        <div className="bg-slate-900/95 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <span>Catatan Permainan</span>
            </h3>
            <button onClick={() => setShowGameLogDrawer(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {gameState.gameLog.length === 0 ? (
              <p className="text-center text-slate-500 text-xs py-8">Belum ada riwayat permainan.</p>
            ) : (
              gameState.gameLog.map(entry => (
                <div key={entry.id} className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-amber-400">
                      Malam {entry.nightNumber} / Hari {entry.dayNumber}
                    </span>
                    <span>{entry.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{entry.message}</p>
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
        return { ...prev, currentPhase: 'GAME_OVER', winner, doppelgangerRoleChangeNotice: null, doppelgangerRevealNextPhase: null, doppelgangerRevealWinner: null };
      }
      if (nextPhase === 'MORNING') {
        return { ...prev, currentPhase: 'MORNING', doppelgangerRoleChangeNotice: null, doppelgangerRevealNextPhase: null, doppelgangerRevealWinner: null };
      }
      return {
        ...prev, currentPhase: 'NIGHT_INTRO', nightNumber: prev.nightNumber + 1, dayNumber: prev.dayNumber + 1, votes: {}, currentVoterIndex: 0, discussionEndTimestamp: null,
        doppelgangerRoleChangeNotice: null, doppelgangerRevealNextPhase: null, doppelgangerRevealWinner: null,
        gameLog: addLog(prev.gameLog, prev.nightNumber + 1, prev.dayNumber + 1, 'INFO', `Memulai Malam ${prev.nightNumber + 1}.`)
      };
    });
  };

  const renderDoppelgangerReveal = () => {
    const notice = gameState.doppelgangerRoleChangeNotice;
    if (!notice) return renderNightIntro();

    const newRole = ROLES[notice.newRole] || { name: notice.newRole, team: 'Unknown', icon: '🎭', color: 'text-indigo-300', bg: 'bg-indigo-950/80', border: 'border-indigo-600', desc: 'Role baru Doppelganger.' };

    return (
      <div className="max-w-xl mx-auto px-4 py-8 animate-fadeIn">
        <div className="rounded-3xl border border-indigo-500/40 bg-slate-900/90 backdrop-blur-md shadow-2xl overflow-hidden p-6 sm:p-8 text-center space-y-6">
          <div className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">🎭 SESI DOPPELGANGER</div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Targetmu telah mati</h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            <strong className="text-white">{notice.targetName}</strong>, target yang kamu pilih, telah tereliminasi.
          </p>

          <div className={`rounded-2xl border ${newRole.border} ${newRole.bg} p-5 space-y-2 text-center`}>
            <div className="text-[10px] font-black tracking-widest text-indigo-300 uppercase">Role barumu</div>
            <div className={`text-3xl font-black ${newRole.color}`}>{newRole.icon} {newRole.name}</div>
            <div className="text-xs text-slate-300">Tim: <strong>{newRole.team}</strong></div>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">{newRole.desc}</p>
          </div>

          <button
            onClick={continueAfterDoppelgangerReveal}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50"
          >
            <Check className="w-5 h-5" />
            <span>PAHAM, LANJUTKAN PERMAINAN</span>
          </button>
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
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-bold text-white shadow-sm">
              {phaseIcon}
              <span>{phaseBadge}</span>
            </div>

            {totalCount > 0 && (
              <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{livingCount}/{totalCount} Hidup</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowDashboardDrawer(true)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-emerald-400 transition"
              title="Dashboard Moderator"
            >
              📊
            </button>

            <button
              onClick={() => setPrivacyMode(prev => !prev)}
              className={`p-2 rounded-xl border transition ${privacyMode ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700/80 text-amber-300'}`}
              title={privacyMode ? 'Keluar Privacy Mode' : 'Aktifkan Privacy Mode'}
              aria-label={privacyMode ? 'Keluar Privacy Mode' : 'Aktifkan Privacy Mode'}
            >
              {privacyMode ? <Unlock className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <button
              onClick={handleBackToHome}
              className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 transition"
              title="Kembali ke Halaman Awal"
            >
              <Home className="w-4 h-4" />
            </button>

            {gameState.undoStack && gameState.undoStack.length > 0 && (
              <button
                onClick={handleUndo}
                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-amber-400 transition"
                title="Batalkan Aksi Terakhir (Undo)"
              >
                <CornerUpLeft className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowRoleListDrawer(true)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800/80 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Role List</span>
            </button>

            <button
              onClick={() => setShowGameLogDrawer(true)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 transition"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={() => setConfirmModalData({
                title: 'Hapus Data Tersimpan?',
                message: 'State game yang tersimpan di perangkat ini akan dihapus.',
                onConfirm: () => { setConfirmModalData(null); clearSavedGame(); }
              })}
              className="w-full py-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-xs sm:text-sm transition"
            >
              HAPUS DATA TERSIMPAN
            </button>

            <button
              onClick={() => setShowRulesModal(true)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 transition"
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
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="max-w-md w-full space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-tr from-red-950 via-slate-900 to-indigo-950 border border-red-500/30 shadow-2xl shadow-red-950/40">
              <span className="text-5xl">🌙</span>
            </div>
            <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-200 to-purple-400 uppercase">
              WEREWOLF
            </h1>
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Moderator Game Assistant
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed px-4">
              Panduan lengkap untuk menjalankan permainan Werewolf secara otomatis dan terstruktur.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {hasExistingGame && (
              <button
                onClick={() => {}}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 transition"
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-amber-700 hover:opacity-95 text-white font-black text-sm sm:text-base shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-5 h-5" />
              <span>MULAI GAME BARU</span>
            </button>

            <button
              onClick={() => setShowRulesModal(true)}
              className="w-full py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
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
      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>SETUP PEMAIN</span>
          </h2>
          <p className="text-xs text-slate-400">Pilih preset cepat atau atur peserta manual (maks 25 orang).</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-3 shadow-xl">
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
                className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800/80 hover:border-amber-500/50 text-left transition space-y-1 group shadow-sm"
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

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Daftar Peserta
              </label>
              <p className="text-xs text-slate-500 mt-1">Pilih 5–25 nama peserta.</p>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-2xl font-black ${playerCount >= 5 && playerCount <= 25 ? 'text-amber-400' : 'text-red-400'}`}>{playerCount}</div>
              <div className="text-[10px] text-slate-500 uppercase">dipilih / 25 maks.</div>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={participantSearch}
              onChange={e => setParticipantSearch(e.target.value)}
              placeholder="Cari nama peserta..."
              className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button onClick={selectAllParticipants} className="px-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black transition whitespace-nowrap">PILIH SEMUA</button>
            <button onClick={clearParticipants} className="px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">RESET</button>
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
                    className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition ${
                      selected
                        ? 'bg-amber-950/60 border-amber-500/80 text-amber-100 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 text-xs font-black ${selected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700 text-slate-600'}`}>
                      {selected ? '✓' : index + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold truncate">{name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-3 shadow-xl">
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
                <div key={roleKey} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-2.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{meta.icon}</span>
                    <span className={`text-xs font-bold ${meta.color}`}>{meta.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setRoleCountsDraft(prev => ({ ...prev, [roleKey]: Math.max(0, value - 1) }))} className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold">−</button>
                    <div className="flex-1 text-center font-black text-white text-xs">{value}</div>
                    <button onClick={() => setRoleCountsDraft(prev => ({ ...prev, [roleKey]: Math.min(playerCount, value + 1) }))} className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { localStorage.removeItem(LOCAL_STORAGE_KEY); setGameState(createInitialGameState()); }}
            className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition"
          >
            Batal
          </button>
          <button
            onClick={validateAndGenerateRoles}
            className="w-2/3 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 transition"
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
      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
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
              <div key={roleKey} className={`p-4 rounded-3xl border ${meta?.border} ${meta?.bg} flex items-center justify-between shadow-xl`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{meta?.icon}</span>
                  <div>
                    <h4 className={`font-black ${meta?.color}`}>{meta?.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{meta?.team}</span>
                  </div>
                </div>
                <div className="px-3.5 py-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-white font-black text-xs sm:text-sm">
                  x{count}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={startRoleReveal}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm sm:text-base shadow-xl shadow-cyan-950/40 flex items-center justify-center gap-2 transition"
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
    if (!currentPlayer) {
      return (
        <div className="max-w-md mx-auto p-6 text-center space-y-4 animate-fadeIn">
          <div className="bg-red-950/70 border border-red-700/60 rounded-3xl p-6 space-y-3">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h2 className="text-xl font-black text-white">ROLE REVEAL TIDAK VALID</h2>
            <p className="text-xs text-slate-400">Index pemain pada state tersimpan tidak valid. Flow dikembalikan ke ringkasan role.</p>
            <button
              onClick={() => setGameState(prev => ({ ...prev, currentPhase: 'ROLE_SUMMARY', revealPlayerIndex: 0, isRoleCardOpen: false }))}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm"
            >
              KEMBALI KE RINGKASAN ROLE
            </button>
          </div>
        </div>
      );
    }
    const roleMeta = ROLES[currentPlayer.role] || ROLES.WARGA;

    return (
      <div className="max-w-md mx-auto p-4 sm:p-6 min-h-[80vh] flex flex-col justify-between space-y-6 animate-fadeIn">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            PEMBAGIAN ROLE ({revealPlayerIndex + 1} / {players.length})
          </span>
          <h2 className="text-3xl font-black text-white">{currentPlayer.name}</h2>
          <p className="text-xs text-amber-300">Serahkan perangkat hanya kepada {currentPlayer.name}.</p>
        </div>

        <div className="flex-1 flex items-center justify-center my-4">
          {!isRoleCardOpen ? (
            <div
              onClick={toggleRoleCard}
              className="w-full aspect-[3/4] max-w-xs rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-2 border-dashed border-amber-500/40 flex flex-col items-center justify-center p-6 text-center cursor-pointer shadow-2xl hover:border-amber-400 transition"
            >
              <div className="w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 mb-4 shadow-inner">
                <Lock className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">ROLE RAHASIA</h3>
              <p className="text-xs text-slate-400">Ketuk untuk membuka kartu role.</p>
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
                <span className="inline-block px-3 py-1 rounded-full bg-black/40 text-[10px] font-black uppercase tracking-widest text-slate-200">
                  Tim {roleMeta.team}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed bg-black/40 p-3.5 rounded-2xl border border-white/10">
                {roleMeta.desc}
              </p>

              <button
                onClick={toggleRoleCard}
                className="px-4 py-2 rounded-xl bg-black/50 hover:bg-black/70 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
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
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 transition"
            >
              <span>LANJUT PEMAIN NEXT</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={toggleRoleCard}
              className="w-full py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm sm:text-base border border-slate-700 shadow-xl transition"
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
      <div className="max-w-md mx-auto p-6 min-h-[75vh] flex flex-col justify-between text-center space-y-6 animate-fadeIn">
        <div className="space-y-4 pt-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-950/90 border border-indigo-700/60 text-indigo-400 shadow-2xl shadow-indigo-950/80">
            <Moon className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-wide">MALAM {gameState.nightNumber}</h2>
          <p className="text-base sm:text-lg italic text-amber-200 font-serif leading-relaxed">
            "Semua pemain, silakan tutup mata. Malam telah tiba."
          </p>
        </div>

        <button
          onClick={advanceNightPhase}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm sm:text-base shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 transition"
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
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-pink-950/90 border border-pink-700/60 text-pink-400 shadow-lg">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-2xl font-black text-pink-400">💘 CUPID</h2>
          <p className="text-xs sm:text-sm text-slate-300">Pilih dua pemain hidup untuk terikat menjadi Lovers.</p>
        </div>

        <div className="bg-slate-900/90 border border-pink-900/50 rounded-3xl p-4 text-center space-y-2 shadow-xl">
          <span className="text-[10px] font-black text-pink-300 uppercase tracking-widest">Pasangan Terpilih:</span>
          <div className="flex items-center justify-center gap-3 text-base sm:text-lg font-black text-white">
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
                className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition flex items-center justify-between ${
                  isSelected ? 'bg-pink-950/80 border-pink-500 text-pink-200 shadow-md' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{player.name}</span>
                {isSelected && <Heart className="w-4 h-4 text-pink-400 fill-current shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => handleSkipNightAction('CUPID', 'Cupid memilih SKIP; Lovers tidak dibentuk malam ini.')}
          className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-black text-xs sm:text-sm transition"
        >
          ⏭️ SKIP CUPID
        </button>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setGameState(prev => ({ ...prev, cupidLover1Id: null, cupidLover2Id: null }))}
            className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition"
          >
            Reset
          </button>
          <button
            onClick={handleConfirmCupid}
            className="w-2/3 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-pink-950/50 transition"
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
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950/90 border border-red-700/60 text-red-400 shadow-lg"><span className="text-3xl">🐺</span></div>
          <h2 className="text-2xl font-black text-red-400">WEREWOLF PHASE</h2>
          <p className="text-xs sm:text-sm text-slate-300">Pilih {rage ? '2 pemain' : '1 pemain'} untuk dieliminasi.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto">
          {livingCandidates.map(player => {
            const isSelected = selectedIds.includes(player.id);
            return (
              <button key={player.id} onClick={() => toggleTarget(player.id)} className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition flex items-center justify-between ${isSelected ? 'bg-red-950/80 border-red-500 text-red-200 shadow-md' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>
                <span className="truncate">{player.name}</span>
                {isSelected && <Crosshair className="w-4 h-4 text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleSkipNightAction('WEREWOLF', 'Werewolf memilih SKIP; tidak ada serangan Werewolf malam ini.')}
            className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black text-xs transition"
          >
            ⏭️ SKIP
          </button>
          <button onClick={() => handleConfirmWerewolf(selectedIds)} className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition">
          <span>KONFIRMASI TARGET WEREWOLF</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        </div>
      </div>
    );
  };

  const renderNightGuardian = () => {
    const livingPlayers = gameState.players.filter(p => p.alive);

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-950/90 border border-blue-700/60 text-blue-400 shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-blue-400">🛡️ GUARDIAN PHASE</h2>
          <p className="text-xs sm:text-sm text-slate-300">Pilih 1 pemain untuk dilindungi malam ini.</p>
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
                className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition flex items-center justify-between ${
                  isDisabled ? 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed' : isSelected ? 'bg-blue-950/80 border-blue-500 text-blue-200 shadow-md' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{player.name}</span>
                {isSelected && <Shield className="w-4 h-4 text-blue-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleSkipNightAction('GUARDIAN', 'Guardian memilih SKIP; tidak ada perlindungan malam ini.')}
            className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black text-xs transition"
          >
            ⏭️ SKIP
          </button>
          <button
          onClick={handleConfirmGuardian}
          className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-950/50 flex items-center justify-center gap-2 transition"
        >
          <span>KONFIRMASI GUARDIAN</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        </div>
      </div>
    );
  };

  const renderNightSheriff = () => {
    const sheriff = gameState.players.find(p => p.role === 'SHERIFF' && p.alive);
    const candidates = gameState.players.filter(p => p.alive && p.id !== sheriff?.id);

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-yellow-950/90 border border-yellow-700/60 text-yellow-300 shadow-lg">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-yellow-300">⭐ SHERIFF PHASE</h2>
          <p className="text-xs sm:text-sm text-slate-300">Pilih 1 pemain untuk diuji. SKIP tidak menghabiskan kemampuan; Sheriff berhenti hanya setelah mati atau berhasil menembak anggota Evil.</p>
        </div>

        <button onClick={handleSkipSheriff} className="w-full py-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white font-black rounded-2xl text-xs sm:text-sm transition">
          ⏭️ SKIP SHERIFF
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
          {candidates.map(p => (
            <button
              key={p.id}
              onClick={() => setGameState(prev => ({ ...prev, sheriffTargetId: p.id }))}
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition ${gameState.sheriffTargetId === p.id ? 'bg-yellow-950/80 border-yellow-500 text-yellow-200 shadow-md' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirmSheriff}
          disabled={!gameState.sheriffTargetId}
          className={`w-full py-4 rounded-2xl font-black text-xs sm:text-sm transition ${gameState.sheriffTargetId ? 'bg-yellow-600 text-slate-950 hover:bg-yellow-500 shadow-xl shadow-yellow-950/50' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
          KONFIRMASI SHERIFF
        </button>
      </div>
    );
  };

  const renderNightDoppelganger = () => {
    const livingPlayers = gameState.players.filter(p => p.alive && p.role !== 'DOPPELGANGER');
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-950/90 border border-indigo-700/60 text-indigo-300 shadow-lg"><span className="text-3xl">🎭</span></div>
          <h2 className="text-2xl font-black text-indigo-300">DOPPELGANGER PHASE</h2>
          <p className="text-xs sm:text-sm text-slate-300">Malam 1: Pilih 1 target hidup.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto">
          {livingPlayers.map(p => (
            <button
              key={p.id}
              onClick={() => setGameState(prev => ({ ...prev, doppelgangerTargetId: p.id }))}
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left ${gameState.doppelgangerTargetId === p.id ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow-md' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleSkipNightAction('DOPPELGANGER', 'Doppelganger memilih SKIP; target tidak dipilih malam ini.')}
            className="w-1/3 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black text-xs transition"
          >
            ⏭️ SKIP
          </button>
          <button onClick={handleConfirmDoppelganger} className="w-2/3 py-4 rounded-2xl bg-indigo-700 hover:bg-indigo-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/50 transition">
          <span>KONFIRMASI DOPPELGANGER</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        </div>
      </div>
    );
  };

  const renderNightSeer = () => {
    const livingPlayers = gameState.players.filter(p => p.alive && p.role !== 'SEER');
    const result = gameState.seerResult;

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-950/90 border border-cyan-700/60 text-cyan-400 shadow-lg">
            <Eye className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-cyan-400">🔮 SEER PHASE</h2>
          <p className="text-xs sm:text-sm text-slate-300">Pilih 1 pemain untuk diramal perannya.</p>
        </div>

        {!result && (
          <button
            onClick={() => handleSkipNightAction('SEER', 'Seer memilih SKIP; tidak melakukan pemeriksaan malam ini.')}
            className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-black text-xs sm:text-sm transition mb-3"
          >
            ⏭️ SKIP SEER
          </button>
        )}

        {result ? (
          <div className="bg-gradient-to-br from-cyan-950 via-slate-900 to-cyan-950 border-2 border-cyan-500/80 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-fadeIn">
            <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">HASIL RAMALAN SEER</span>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">{result.targetName}</h3>
              <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-950 border border-cyan-600/80 text-cyan-300 font-bold text-sm">
                ROLE: {result.displayedRole}
              </div>
            </div>

            <button
              onClick={advanceNightPhase}
              className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-950/50 transition"
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
                className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-cyan-950/80 text-xs sm:text-sm font-bold text-left transition flex items-center justify-between"
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
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-950/90 border border-purple-700/60 text-purple-400 shadow-lg">
            <FlaskConical className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-purple-400">🧪 WITCH PHASE</h2>
          <p className="text-xs sm:text-sm text-slate-300">Pilih penggunaan Heal atau Kill Potion secara blind.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between"><span className="font-bold text-emerald-400 text-xs sm:text-sm">❤️ Heal Potion</span></div>
            <select
              disabled={gameState.witchHealUsed}
              value={gameState.witchHealTargetId || ''}
              onChange={e => {
                const val = e.target.value || null;
                setGameState(prev => ({ ...prev, witchHealTargetId: val, witchHealUsedThisNight: !!val }));
              }}
              className="w-full py-2.5 px-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none"
            >
              <option value="">-- Tebak Target Heal --</option>
              {livingTargets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between"><span className="font-bold text-purple-400 text-xs sm:text-sm">☠️ Kill Potion</span></div>
            <select
              disabled={gameState.witchKillUsed}
              value={gameState.witchKillTargetId || ''}
              onChange={e => {
                const val = e.target.value || null;
                setGameState(prev => ({ ...prev, witchKillTargetId: val }));
              }}
              className="w-full py-2.5 px-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none"
            >
              <option value="">-- Pilih Target Kill --</option>
              {livingTargets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => handleSkipNightAction('WITCH', 'Witch memilih SKIP; potion tetap tersimpan untuk malam berikutnya.')}
          className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-black text-xs sm:text-sm transition mb-3"
        >
          ⏭️ SKIP WITCH
        </button>

        <button
          onClick={handleFinishWitch}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-950/50 flex items-center justify-center gap-2 transition"
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
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-950/90 border border-orange-700/60 text-orange-300 shadow-lg">
            <span className="text-3xl">🏹</span>
          </div>
          <h2 className="text-2xl font-black text-orange-300">HUNTER REVENGE</h2>
          <p className="text-xs sm:text-sm text-slate-300"><strong>{hunter.name}</strong> tereliminasi. Pilih 1 pemain untuk dibalas dendam.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto">
          {candidates.map(p => (
            <button
              key={p.id}
              onClick={() => setGameState(prev => ({ ...prev, hunterTargetId: p.id }))}
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition ${gameState.hunterTargetId === p.id ? 'bg-orange-950/80 border-orange-500 text-orange-200 shadow-md' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          disabled={!selected}
          onClick={() => handleHunterRevenge(selected?.id)}
          className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm shadow-xl shadow-orange-950/50 transition"
        >
          KONFIRMASI BALAS DENDAM
        </button>
      </div>
    );
  };

  const renderMorning = () => {
    const deaths = gameState.lastNightDeaths;

    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6 text-center space-y-6 animate-fadeIn">
        <div className="space-y-3 pt-4">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-amber-950/80 border border-amber-600/50 text-amber-400 shadow-2xl shadow-amber-950/40">
            <Sun className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-white">🌅 PAGI HARI {gameState.dayNumber}</h2>
          <p className="text-xs sm:text-sm text-slate-300">Matahari telah terbit di desa.</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
          {deaths.length === 0 ? (
            <div className="space-y-2">
              <span className="text-4xl">🕊️</span>
              <h3 className="text-xl font-black text-emerald-400">Semua Pemain Selamat!</h3>
              <p className="text-xs text-slate-300">Semalam tidak ada pemain yang tereliminasi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-4xl">☠️</span>
              <h3 className="text-base font-bold text-red-400">Pemain Tereliminasi Semalam:</h3>
              <div className="space-y-2">
                {deaths.map(({ player, reason }) => (
                  <div key={player.id} className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center justify-between">
                    <span className="font-black text-white text-sm">{player.name}</span>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-900/80 text-red-200 font-bold border border-red-700/60">
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
              discussionEndTimestamp: null,
              isTimerPaused: false,
              pausedRemainingSeconds: null,
              gameLog: addLog(prev.gameLog, prev.nightNumber, prev.dayNumber, 'INFO', `Memulai diskusi Hari ${prev.dayNumber}.`)
            }));
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition"
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
      <div className="max-w-lg mx-auto p-4 sm:p-6 text-center space-y-6 animate-fadeIn">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-950/90 border border-orange-700/60 text-orange-400 shadow-lg">
            <Flame className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">🗣️ WAKTU DISKUSI</h2>
        </div>

        <div className="bg-slate-900/90 border-2 border-slate-800/80 rounded-3xl p-8 space-y-4 shadow-2xl">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SISA WAKTU DISKUSI</span>
          <div className="text-5xl sm:text-6xl font-black font-mono text-amber-400 tracking-wider">
            {formatTime(remainingSeconds)}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {!gameState.discussionEndTimestamp ? (
              <button onClick={startDiscussionTimer} className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 transition">
                <Play className="w-4 h-4 fill-current" />
                <span>MULAI TIMER</span>
              </button>
            ) : isTimerRunning ? (
              <button onClick={pauseDiscussionTimer} className="px-6 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 transition">
                <Pause className="w-4 h-4" />
                <span>PAUSE</span>
              </button>
            ) : (
              <button onClick={resumeDiscussionTimer} className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 transition">
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME</span>
              </button>
            )}
          </div>
        </div>

        <button onClick={handleFinishDiscussionEarly} className="w-full py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition">
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
      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950/90 border border-red-700/60 text-red-400 shadow-lg">
            <Skull className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">🗳️ SESI VOTING</h2>
        </div>

        <div className="space-y-2">
          {livingMayor && !gameState.mayorRevealed && (
            <button onClick={handleMayorReveal} className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md transition">
              👑 UNGKAP IDENTITAS MAYOR
            </button>
          )}
        </div>

        {!isAllVotesDone && currentVoter ? (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PEMILIH ({currentVoterIndex + 1}/{livingPlayers.length})</span>
              <span className="text-base sm:text-lg font-black text-amber-400">{currentVoter.name}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[35vh] overflow-y-auto">
              {livingPlayers.filter(p => p.id !== currentVoter.id).map(target => (
                <button
                  key={target.id}
                  onClick={() => handleVoteSubmit(currentVoter.id, target.id)}
                  className="p-3.5 rounded-2xl border bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-red-950/80 text-xs sm:text-sm font-bold text-left transition flex items-center justify-between"
                >
                  <span className="truncate">{target.name}</span>
                  <Skull className="w-4 h-4 text-red-400 shrink-0" />
                </button>
              ))}
            </div>

            <button onClick={() => handleVoteSubmit(currentVoter.id, null)} className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-black text-xs sm:text-sm transition">
              ⏭️ SKIP VOTE
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-2xl">
            <h3 className="text-base font-bold text-white text-center">HASIL REKAP VOTING</h3>

            {isTie && (
              <div className="p-3 bg-amber-950/80 border border-amber-600/80 rounded-2xl text-amber-200 text-xs text-center font-bold leading-relaxed">
                ⚠️ HASIL SERI: {topCandidates.map(c => c.player.name).join(' & ')} memperoleh suara terbanyak yang sama ({maxVotes} suara).
              </div>
            )}

            <div className="space-y-3">
              {sortedCandidates.length === 0 ? (
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                  Semua pemain memilih skip vote. Tidak ada pemain yang tereliminasi.
                </div>
              ) : (
                sortedCandidates.map(({ player, count }) => {
                  const isTop = count === maxVotes && maxVotes > 0;
                  const percentage = Math.min(100, (count / livingPlayers.length) * 100);

                  return (
                    <div key={player.id} className={`p-3.5 rounded-2xl border space-y-2 transition ${isTop ? 'bg-red-950/40 border-red-500/80 shadow-md' : 'bg-slate-950/80 border-slate-800/80'}`}>
                      <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                        <span className={isTop ? 'text-red-400 font-black' : 'text-white'}>
                          {player.name} {isTop && '🔥'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${isTop ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {count} Suara
                        </span>
                      </div>

                      <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
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

            <button onClick={resolveVotingResults} className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition">
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
      <div className="max-w-xl mx-auto p-4 sm:p-6 text-center space-y-6 animate-fadeIn">
        <div className="space-y-4 pt-4">
          <div className={`inline-flex items-center justify-center p-5 rounded-3xl border shadow-2xl ${
            isWargaWin ? 'bg-emerald-950/90 border-emerald-600/60 text-emerald-400 shadow-emerald-950/50' : isJesterWin ? 'bg-pink-950/90 border-pink-600/60 text-pink-400 shadow-pink-950/50' : 'bg-red-950/90 border-red-600/60 text-red-400 shadow-red-950/50'
          }`}>
            <Crown className="w-16 h-16 animate-bounce" />
          </div>
          <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-wider ${isWargaWin ? 'text-emerald-400' : isJesterWin ? 'text-pink-400' : 'text-red-400'}`}>
            {isWargaWin ? '🏆 TIM WARGA MENANG' : isJesterWin ? '🃏 JESTER MENANG' : '🐺 TIM WEREWOLF MENANG'}
          </h2>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-3 shadow-2xl text-left">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HASIL PERAN AKHIR PEMAIN</h3>
          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            {gameState.players.map(p => {
              const meta = ROLES[p.role];
              return (
                <div key={p.id} className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta?.icon}</span>
                    <div>
                      <span className="font-bold text-white text-xs sm:text-sm block">{p.name}</span>
                      <span className={`font-bold ${meta?.color}`}>{meta?.name}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${p.alive ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80' : 'bg-red-950/80 text-red-400 border-red-900/80'}`}>
                    {p.alive ? '🟢 Hidup' : `☠️ Mati (${p.deathReason || 'Eliminasi'})`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button onClick={handleRestartSamePlayers} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition">
            <RefreshCw className="w-5 h-5" />
            <span>MAIN LAGI DENGAN PEMAIN SAMA</span>
          </button>
          <button onClick={handleNewGame} className="w-full py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700/80 transition">
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col relative overflow-x-hidden selection:bg-amber-500 selection:text-slate-950">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-900/15 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-950/15 blur-[120px] pointer-events-none -z-10 rounded-full" />

      {renderToast()}
      {renderLoverDeathNotice()}
      {renderConfirmModal()}
      {renderRulesModal()}
      {renderRoleListDrawer()}
      {renderGameLogDrawer()}
      {renderModeratorDashboard()}
      {renderHeader()}
      {renderSmartAssistant()}
      {renderNightTimeline()}
      <main
        key={`${gameState.currentPhase}-${gameState.nightNumber}-${gameState.dayNumber}-${gameState.revealPlayerIndex}`}
        className="flex-1 pb-8"
      >
        {renderCurrentPhase()}
      </main>
      {renderPrivacyOverlay()}
    </div>
  );
}
