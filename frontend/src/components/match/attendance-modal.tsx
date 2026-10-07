'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Match } from '@/types';
import { ReliabilityBadge } from '@/components/profile/reliability-badge';
import { useToast } from '@/components/shared/toast';
import * as matchService from '@/services/matches';
import { CheckCircle2, XCircle, Loader2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedMatch: Match) => void;
}

export function AttendanceModal({
  match,
  isOpen,
  onClose,
  onSuccess,
}: AttendanceModalProps) {
  const { showToast } = useToast();
  const confirmedPlayers = (match.participants || []).filter(
    p => p.role === 'player' && p.userId !== match.hostId
  );

  // Map of userId -> 'attended' | 'no_show'
  const [attendance, setAttendance] = useState<Record<string, 'attended' | 'no_show'>>(() => {
    const initial: Record<string, 'attended' | 'no_show'> = {};
    confirmedPlayers.forEach(p => {
      initial[p.userId] = (p.status === 'no_show' ? 'no_show' : 'attended');
    });
    return initial;
  });

  const [submitting, setSubmitting] = useState(false);

  const toggleStatus = (userId: string, status: 'attended' | 'no_show') => {
    setAttendance(prev => ({ ...prev, [userId]: status }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const items = Object.entries(attendance).map(([userId, status]) => ({
        userId,
        status,
      }));
      const updated = await matchService.markAttendance(match.id, items);
      showToast('Attendance recorded! Player karma scores updated.', 'success');
      onSuccess(updated);
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to record attendance', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Mark Match Attendance
          </DialogTitle>
          <DialogDescription>
            Reward reliable players (+2 Karma) or penalize no-shows (-15 Karma). This maintains community trust.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3 max-h-80 overflow-y-auto">
          {confirmedPlayers.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-4">
              No other players joined this match to review.
            </p>
          ) : (
            confirmedPlayers.map(p => {
              const currentChoice = attendance[p.userId] || 'attended';
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {p.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.user.name}</p>
                      <ReliabilityBadge score={p.user.reliabilityScore} size="sm" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleStatus(p.userId, 'attended')}
                      className={cn(
                        'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all',
                        currentChoice === 'attended'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Attended
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(p.userId, 'no_show')}
                      className={cn(
                        'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all',
                        currentChoice === 'no_show'
                          ? 'bg-destructive text-destructive-foreground shadow-xs'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      No-Show
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Karma...
              </>
            ) : (
              'Confirm & Update Karma'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
