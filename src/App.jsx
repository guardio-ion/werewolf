-3xl p-8 space-y-4 shadow-2xl"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SISA WAKTU DISKUSI</span><div className="text-5xl sm:text-6xl font-black font-mono text-amber-400 tracking-wider">{formatTime(remainingSeconds)}</div><div className="flex items-center justify-center gap-3 pt-2">{!gameState.discussionEndTimestamp ? <button onClick={startDiscussionTimer} className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg transition"><Play className="w-4 h-4 fill-current" /><span>MULAI TIMER</span></button> : !gameState.isTimerPaused ? <button onClick={pauseDiscussionTimer} className="px-6 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center gap-2 border border-slate-700 transition"><Pause className="w-4 h-4" /><span>PAUSE</span></button> : <button onClick={resumeDiscussionTimer} className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg transition"><Play className="w-4 h-4 fill-current" /><span>RESUME</span></button>}</div></div>
      <button onClick={triggerAutoTransitionToVoting} className="w-full py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition"><span>SELESAIKAN DISKUSI DAN MULAI VOTING</span><ArrowRight className="w-4 h-4" /></button>
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
