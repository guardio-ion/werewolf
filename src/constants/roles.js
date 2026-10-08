export const ROLES = {
  WARGA: {
    name: 'Warga',
    team: 'Warga',
    color: 'text-slate-300',
    bg: 'bg-slate-900/90',
    border: 'border-slate-700',
    accent: 'from-slate-800 to-slate-950',
    desc: 'Tidak memiliki kemampuan khusus. Bekerja sama mengeliminasi seluruh ancaman.'
  },

  WEREWOLF: {
    name: 'Werewolf',
    team: 'Evil',
    color: 'text-red-400',
    bg: 'bg-red-950/90',
    border: 'border-red-600/60',
    accent: 'from-red-900 via-red-950 to-slate-950',
    desc: 'Setiap malam memilih 1 korban. Sesama Werewolf saling mengetahui.'
  },

  LYCAN: {
    name: 'Lycan',
    team: 'Warga',
    color: 'text-zinc-200',
    bg: 'bg-zinc-900/90',
    border: 'border-zinc-600',
    accent: 'from-zinc-800 to-slate-950',
    desc: 'Berada di tim Warga dan tidak memiliki aksi malam. Seer akan melihat Lycan sebagai Werewolf.'
  },

  SEER: {
    name: 'Seer',
    team: 'Warga',
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/90',
    border: 'border-cyan-600/60',
    accent: 'from-cyan-950 via-slate-900 to-slate-950',
    desc: 'Setiap malam memeriksa 1 pemain untuk mengetahui wujud/perannya. Lycan terlihat sebagai Werewolf.'
  },

  GUARDIAN: {
    name: 'Guardian',
    team: 'Warga',
    color: 'text-blue-400',
    bg: 'bg-blue-950/90',
    border: 'border-blue-600/60',
    accent: 'from-blue-950 via-slate-900 to-slate-950',
    desc: 'Melindungi 1 pemain setiap malam dari serangan Werewolf. Tidak boleh melindungi pemain yang sama dua malam berturut-turut.'
  },

  CUPID: {
    name: 'Cupid',
    team: 'Warga',
    color: 'text-pink-400',
    bg: 'bg-pink-950/90',
    border: 'border-pink-600/60',
    accent: 'from-pink-950 via-slate-900 to-slate-950',
    desc: 'Hanya aktif Malam 1 dan memilih 2 pemain menjadi Lovers. Jika salah satu mati, pasangannya ikut mati.'
  },

  MAYOR: {
    name: 'Mayor',
    team: 'Warga',
    color: 'text-amber-400',
    bg: 'bg-amber-950/90',
    border: 'border-amber-600/60',
    accent: 'from-amber-950 via-slate-900 to-slate-950',
    desc: 'Sekali per game dapat mengungkapkan identitas sebagai Mayor. Setelah terungkap, bobot suaranya menjadi 2 pada voting.'
  },

  SHERIFF: {
    name: 'Sheriff',
    team: 'Warga',
    color: 'text-yellow-300',
    bg: 'bg-yellow-950/90',
    border: 'border-yellow-600/60',
    accent: 'from-yellow-950 via-slate-900 to-slate-950',
    desc: 'Sekali per game, pada malam hari memilih 1 pemain untuk diuji. Jika target adalah Werewolf, target tereliminasi. Jika bukan, Sheriff tereliminasi.'
  },

  HUNTER: {
    name: 'Hunter',
    team: 'Warga',
    color: 'text-orange-300',
    bg: 'bg-orange-950/90',
    border: 'border-orange-600/60',
    accent: 'from-orange-950 via-slate-900 to-slate-950',
    desc: 'Jika mati, Hunter dapat memilih 1 pemain lain untuk dieliminasi sebagai balas dendam.'
  },

  TRAITOR: {
    name: 'Traitor',
    team: 'Warga',
    color: 'text-slate-200',
    bg: 'bg-slate-900/90',
    border: 'border-slate-700',
    accent: 'from-slate-800 to-slate-950',
    desc: 'Awalnya di kubu Warga. Jika seluruh Werewolf mati dan Traitor masih hidup, ia berubah menjadi Werewolf.'
  },

  WOLF_CUB: {
    name: 'Wolf Cub',
    team: 'Evil',
    color: 'text-rose-300',
    bg: 'bg-rose-950/90',
    border: 'border-rose-600/60',
    accent: 'from-rose-950 via-slate-900 to-slate-950',
    desc: 'Jika Wolf Cub mati, Werewolf mendapat amukan pada malam berikutnya dan dapat membunuh 2 pemain.'
  },

  WITCH: {
    name: 'Witch',
    team: 'Warga',
    color: 'text-purple-400',
    bg: 'bg-purple-950/90',
    border: 'border-purple-600/60',
    accent: 'from-purple-950 via-slate-900 to-slate-950',
    desc: 'Memiliki Heal Potion dan Kill Potion, masing-masing 1x. Witch tidak melihat korban Werewolf dan menebak secara blind.'
  },

  JESTER: {
    name: 'Jester',
    team: 'Neutral',
    color: 'text-pink-300',
    bg: 'bg-pink-950/90',
    border: 'border-pink-600/60',
    accent: 'from-pink-950 via-slate-900 to-slate-950',
    desc: 'Menang sendiri jika berhasil tereliminasi melalui voting siang hari.'
  },

  DOPPELGANGER: {
    name: 'Doppelganger',
    team: 'Neutral',
    color: 'text-indigo-300',
    bg: 'bg-indigo-950/90',
    border: 'border-indigo-600/60',
    accent: 'from-indigo-950 via-slate-900 to-slate-950',
    desc: 'Malam 1 memilih 1 target. Jika target mati, Doppelganger menggantikan role-nya.'
  }
};

export const ROLE_KEYS = Object.keys(ROLES);
