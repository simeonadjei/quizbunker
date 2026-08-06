import { Layout } from '@/components/Layout';
import { useGetLeaderboard } from '@workspace/api-client-react';
import { Trophy, Medal, Star, Info } from 'lucide-react';
import { Link } from 'wouter';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', boxShadow: '0 0 12px rgba(251,191,36,0.6)' }}>
        <Trophy className="w-4 h-4 text-yellow-900" strokeWidth={2.5} />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg,#d1d5db,#9ca3af)', boxShadow: '0 0 10px rgba(209,213,219,0.5)' }}>
        <Medal className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 0 10px rgba(249,115,22,0.5)' }}>
        <Medal className="w-4 h-4 text-orange-900" strokeWidth={2.5} />
      </div>
    );
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-white/5 border border-white/10">
      <span className="font-display text-sm text-white/50">#{rank}</span>
    </div>
  );
}

function ScoreBar({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? '#22d3ee' :
    pct >= 60 ? '#a78bfa' :
    '#f97316';
  return (
    <div className="w-full bg-white/5 rounded-full h-1.5 mt-1 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
      />
    </div>
  );
}

export default function Leaderboard() {
  const { data: entries, isLoading, isError } = useGetLeaderboard();

  return (
    <Layout>
      <div className="flex-1 w-full flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-md space-y-5">

          {/* Header */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
              <h1 className="text-game-title text-3xl tracking-wide">LEADERBOARD</h1>
              <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
            </div>
            <p className="text-white/50 text-sm font-bold">Top 20 subscribed students by average score</p>
          </div>

          {/* How scoring works */}
          <div
            className="rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'hsl(220 30% 10%)', border: '1px solid hsl(220 30% 20%)' }}
          >
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs font-bold text-white/60 leading-relaxed">
              <span className="text-cyan-300">How it works: </span>
              Rankings are based on your <span className="text-white/90">average score %</span> across all completed quizzes.
              You need at least <span className="text-white/90">3 completed quizzes</span> to appear here.
              Only active subscribers are ranked.
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card-game animate-pulse h-16 opacity-40" />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="card-game border-l-4 border-red-500 text-red-400 font-bold text-sm px-4 py-3">
              Failed to load leaderboard. Please try again later.
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && (!entries || entries.length === 0) && (
            <div className="card-game text-center py-10 space-y-3">
              <Trophy className="w-10 h-10 mx-auto text-yellow-400/30" />
              <p className="text-white/40 font-bold text-sm">No rankings yet.</p>
              <p className="text-white/30 text-xs">Complete 3+ quizzes with an active subscription to appear here.</p>
            </div>
          )}

          {/* Podium — top 3 */}
          {!isLoading && entries && entries.length > 0 && (
            <>
              {entries.length >= 3 && (
                <div className="grid grid-cols-3 gap-2 pb-2">
                  {/* 2nd */}
                  <div className="flex flex-col items-center gap-1.5 pt-6">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg"
                      style={{ background: 'linear-gradient(135deg,#d1d5db,#9ca3af)', boxShadow: '0 0 12px rgba(209,213,219,0.4)', color: '#374151' }}>
                      2
                    </div>
                    <p className="text-white/80 font-bold text-xs text-center leading-tight truncate w-full px-1">{entries[1].name.split(' ')[0]}</p>
                    <p className="text-white font-display text-sm">{entries[1].avgScore}%</p>
                    <div className="w-full h-12 rounded-t-lg" style={{ background: 'linear-gradient(180deg,#6b7280,#4b5563)' }} />
                  </div>
                  {/* 1st */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center font-display text-xl"
                        style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', boxShadow: '0 0 20px rgba(251,191,36,0.7)', color: '#78350f' }}>
                        1
                      </div>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-lg">👑</div>
                    </div>
                    <p className="text-yellow-300 font-bold text-xs text-center leading-tight truncate w-full px-1">{entries[0].name.split(' ')[0]}</p>
                    <p className="text-yellow-300 font-display text-sm" style={{ textShadow: '0 0 8px rgba(251,191,36,0.8)' }}>{entries[0].avgScore}%</p>
                    <div className="w-full h-20 rounded-t-lg" style={{ background: 'linear-gradient(180deg,#f59e0b,#d97706)' }} />
                  </div>
                  {/* 3rd */}
                  <div className="flex flex-col items-center gap-1.5 pt-10">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg"
                      style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 0 12px rgba(249,115,22,0.4)', color: '#431407' }}>
                      3
                    </div>
                    <p className="text-white/80 font-bold text-xs text-center leading-tight truncate w-full px-1">{entries[2].name.split(' ')[0]}</p>
                    <p className="text-white font-display text-sm">{entries[2].avgScore}%</p>
                    <div className="w-full h-8 rounded-t-lg" style={{ background: 'linear-gradient(180deg,#ea580c,#c2410c)' }} />
                  </div>
                </div>
              )}

              {/* Full ranking list — 4th onward (or all if < 3 total) */}
              <div className="space-y-2">
                {entries.slice(entries.length >= 3 ? 3 : 0).map((entry) => (
                  <div
                    key={entry.userId}
                    className="card-game flex items-center gap-3 px-3 py-3"
                    style={entry.rank <= 10
                      ? { borderColor: 'hsl(220 60% 28%)' }
                      : undefined}
                  >
                    <RankBadge rank={entry.rank} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{entry.name}</p>
                      <ScoreBar pct={entry.avgScore} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-base"
                        style={{ color: entry.avgScore >= 80 ? '#22d3ee' : entry.avgScore >= 60 ? '#a78bfa' : '#f97316' }}>
                        {entry.avgScore}%
                      </p>
                      <p className="text-white/30 text-[10px] font-bold">{entry.quizzesCompleted} quiz{entry.quizzesCompleted !== 1 ? 'zes' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* All rows when < 3 entries (no podium) */}
              {entries.length < 3 && (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.userId} className="card-game flex items-center gap-3 px-3 py-3">
                      <RankBadge rank={entry.rank} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{entry.name}</p>
                        <ScoreBar pct={entry.avgScore} />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-base"
                          style={{ color: entry.avgScore >= 80 ? '#22d3ee' : entry.avgScore >= 60 ? '#a78bfa' : '#f97316' }}>
                          {entry.avgScore}%
                        </p>
                        <p className="text-white/30 text-[10px] font-bold">{entry.quizzesCompleted} quiz{entry.quizzesCompleted !== 1 ? 'zes' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* CTA for non-subscribers */}
          <div className="card-game text-center py-4 space-y-2">
            <p className="text-white/50 text-xs font-bold">Want to appear on the leaderboard?</p>
            <Link href="/subscribe">
              <button className="btn-game px-6 py-2 text-sm">Get Subscribed</button>
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}
