'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/page-skeletons';
import { api, ApiSuccess } from '@/lib/api';

interface Entry {
  rank: number;
  userName: string;
  avatar?: string;
  score: number;
  testsAttempted: number;
  accuracy: number;
  points: number;
}

export default function LeaderboardPage() {
  const [type, setType] = useState('global');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<ApiSuccess<{ entries: Entry[]; myRank: number | null }>>(`/leaderboard?type=${type}`)
      .then((res) => {
        setEntries(res.data.entries);
        setMyRank(res.data.myRank);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-amber-500" />
            Leaderboard
          </h1>
          {myRank && !loading && <p className="text-muted-foreground mt-1">Your rank: #{myRank}</p>}
        </div>
      </div>

      <div className="flex gap-2">
        {['global', 'weekly', 'monthly'].map((t) => (
          <Button key={t} variant={type === t ? 'default' : 'outline'} size="sm" onClick={() => setType(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <ListSkeleton count={8} />
          ) : (
            <>
              {entries.map((e) => (
                <div
                  key={e.rank}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    e.rank <= 3 ? 'bg-amber-50 dark:bg-amber-950/30' : 'hover:bg-muted/50'
                  }`}
                >
                  <span className="w-8 text-center font-bold">
                    {e.rank <= 3 ? <Medal className={`h-6 w-6 mx-auto ${e.rank === 1 ? 'text-amber-500' : e.rank === 2 ? 'text-gray-400' : 'text-amber-700'}`} /> : e.rank}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{e.userName}</p>
                    <p className="text-xs text-muted-foreground">{e.testsAttempted} tests · {e.accuracy}% accuracy</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{e.score}</p>
                    <p className="text-xs text-muted-foreground">{e.points} pts</p>
                  </div>
                </div>
              ))}
              {!entries.length && <p className="text-center text-muted-foreground py-8">No data yet</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
