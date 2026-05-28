import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUpdateTest, type ResearchTest } from '@/hooks/useResearch';

interface Props {
  test: ResearchTest | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function FeedbackDialog({ test, open, onOpenChange }: Props) {
  const [observation, setObservation] = useState(test?.observation ?? '');
  const [nextChanges, setNextChanges] = useState(test?.next_test_changes ?? '');
  const update = useUpdateTest();

  // Reset when test changes
  if (test && open && observation === '' && nextChanges === '' && (test.observation || test.next_test_changes)) {
    setObservation(test.observation ?? '');
    setNextChanges(test.next_test_changes ?? '');
  }

  const submit = async () => {
    if (!test) return;
    await update.mutateAsync({
      id: test.id,
      observation: observation.trim() || null,
      next_test_changes: nextChanges.trim() || null,
      result_recorded_at: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setObservation('');
          setNextChanges('');
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Result & Feedback</DialogTitle>
        </DialogHeader>
        {test && (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/30 p-3 max-h-40 overflow-auto">
              <p className="text-xs text-muted-foreground mb-1">Test from {test.test_date}</p>
              <p className="text-sm whitespace-pre-wrap font-mono">{test.instructions}</p>
            </div>
            <div className="space-y-2">
              <Label>Observation / Result</Label>
              <Textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                rows={5}
                placeholder="What did you observe? Colour, strength, defects…"
              />
            </div>
            <div className="space-y-2">
              <Label>Changes for Next Test in this Series</Label>
              <Textarea
                value={nextChanges}
                onChange={(e) => setNextChanges(e.target.value)}
                rows={5}
                placeholder="What should be tried next time? e.g. reduce flux 5%, fire 30°C higher…"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={update.isPending}>Save Feedback</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
