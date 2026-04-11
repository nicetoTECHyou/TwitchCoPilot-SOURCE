
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Vote, Plus, Trophy, Clock, X } from 'lucide-react';
import { useTwitchStore } from '@/store/useTwitchStore';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import type { VoteSession } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export default function VotingPanel() {
  const activeVote = useTwitchStore((s) => s.activeVote);
  const setVote = useTwitchStore((s) => s.setVote);
  const [tick, setTick] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [newDuration, setNewDuration] = useState('60');
  const [showWinner, setShowWinner] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const prevActiveRef = useRef<string | null>(null);
  const voteEndTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute remaining time as derived value
  const remainingTime = useMemo(() => {
    if (!activeVote?.isActive) return 0;
    const elapsed = Date.now() - activeVote.startTime;
    return Math.max(0, Math.ceil((activeVote.duration * 1000 - elapsed) / 1000));
  }, [activeVote, activeVote?.isActive, tick]);

  // Tick every second when vote is active
  useEffect(() => {
    if (!activeVote?.isActive) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeVote?.isActive]);

  // Detect vote completion
  useEffect(() => {
    const voteId = activeVote?.id ?? null;
    if (prevActiveRef.current === voteId) return;
    prevActiveRef.current = voteId;
    if (activeVote && !activeVote.isActive && activeVote.winner) {
      setShowWinner(true);
      setCelebrationKey((k) => k + 1);
    }
  }, [activeVote]);

  // Auto-hide winner after 10s AND clear vote from store
  useEffect(() => {
    if (showWinner) {
      const timer = setTimeout(() => {
        setShowWinner(false);
        setVote(null); // clear vote from store so the result card disappears
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showWinner, setVote]);

  const totalVotes = useMemo(() => {
    if (!activeVote) return 0;
    return Object.values(activeVote.votes).reduce((sum, v) => sum + v, 0);
  }, [activeVote]);

  const handleStartVote = useCallback(() => {
    if (!newQuestion.trim()) return;
    const validOptions = newOptions.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) return;

    const duration = parseInt(newDuration, 10) || 60;
    const votes: Record<string, number> = {};
    validOptions.forEach((_, i) => {
      votes[String(i)] = 0;
    });

    const voteSession: VoteSession = {
      id: generateId(),
      question: newQuestion.trim(),
      options: validOptions,
      votes,
      voters: {},
      startTime: Date.now(),
      duration: Math.min(Math.max(duration, 10), 300),
      isActive: true,
    };

    setVote(voteSession);
    setShowDialog(false);
    setNewQuestion('');
    setNewOptions(['', '']);
    setNewDuration('60');

    // Auto-end timer
    if (voteEndTimerRef.current) clearTimeout(voteEndTimerRef.current);
    voteEndTimerRef.current = setTimeout(() => {
      const current = useTwitchStore.getState().activeVote;
      if (current?.isActive && current.id === voteSession.id) {
        const maxV = Math.max(...Object.values(current.votes));
        const wIdx = Object.entries(current.votes).findIndex(([, v]) => v === maxV);
        const w = wIdx >= 0 ? current.options[wIdx] : current.options[0];
        setVote({ ...current, isActive: false, winner: w });
        setShowWinner(true);
        setCelebrationKey((k) => k + 1);
      }
    }, duration * 1000);
  }, [newQuestion, newOptions, newDuration, setVote]);

  const handleAddOption = () => {
    if (newOptions.length < 6) {
      setNewOptions([...newOptions, '']);
    }
  };

  const handleRemoveOption = (idx: number) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx: number, value: string) => {
    const updated = [...newOptions];
    updated[idx] = value;
    setNewOptions(updated);
  };

  // Clean up vote timer on unmount
  useEffect(() => {
    return () => {
      if (voteEndTimerRef.current) clearTimeout(voteEndTimerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      {/* Active vote display */}
      {activeVote && (
        <div className="glass rounded-xl p-4">
          {activeVote.isActive && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">{t('vote.title')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className={remainingTime <= 10 ? 'text-danger font-bold animate-pulse' : ''}>
                    {formatTime(remainingTime)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-foreground font-medium mb-3">{activeVote.question}</p>

              <div className="space-y-2">
                {activeVote.options.map((option, idx) => {
                  const count = activeVote.votes[String(idx)] || 0;
                  const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/90 truncate mr-2">{option}</span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {count} {t('vote.votes')} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="relative h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, #9146FF, #00D4AA)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-[10px] text-muted-foreground/60 text-right">
                {Object.keys(activeVote.voters).length} {t('vote.participants')}
              </div>
            </>
          )}

          {/* Vote ended - show winner */}
          {!activeVote.isActive && activeVote.winner && (
            <div key={celebrationKey} className="text-center py-2 animate-in fade-in zoom-in duration-500 relative">
              <button
                onClick={() => { setShowWinner(false); setVote(null); }}
                className="absolute top-0 right-0 text-muted-foreground hover:text-danger transition-colors"
                title="Schließen"
              >
                <X className="w-4 h-4" />
              </button>
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2 animate-bounce" />
              <p className="text-xs text-muted-foreground mb-1">{t('vote.winner')}</p>
              <p className="text-lg font-bold text-yellow-400">{activeVote.winner}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{totalVotes} {t('vote.totalVotes')}</p>
            </div>
          )}
        </div>
      )}

      {/* Start new vote button */}
      {!activeVote?.isActive && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="w-full bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" />
              {t('vote.start')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle>{t('vote.start')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-foreground/80">{t('vote.question')}</Label>
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder={t('vote.questionPlaceholder')}
                  className="bg-foreground/5 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground/80">{t('vote.options')}</Label>
                {newOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`${t('vote.option')} ${idx + 1}`}
                      className="bg-foreground/5 border-border"
                    />
                    {newOptions.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(idx)}
                        className="text-muted-foreground hover:text-danger transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {newOptions.length < 6 && (
                  <button
                    onClick={handleAddOption}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> {t('vote.addOption')}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground/80">{t('vote.time')}</Label>
                <Input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  min={10}
                  max={300}
                  className="bg-foreground/5 border-border"
                />
              </div>

              <Button
                onClick={handleStartVote}
                disabled={!newQuestion.trim() || newOptions.filter((o) => o.trim()).length < 2}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {t('vote.start')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
