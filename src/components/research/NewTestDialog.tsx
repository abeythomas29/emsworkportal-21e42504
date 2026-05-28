import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTest, useResearchSeries } from '@/hooks/useResearch';
import { NewSeriesDialog } from './NewSeriesDialog';
import { FlaskConical } from 'lucide-react';

export function NewTestDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [seriesId, setSeriesId] = useState<string>('none');
  const [instructions, setInstructions] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const create = useCreateTest();
  const { data: series = [] } = useResearchSeries();

  const submit = async () => {
    if (!instructions.trim()) return;
    await create.mutateAsync({
      instructions: instructions.trim(),
      title: title.trim() || null,
      series_id: seriesId === 'none' ? null : seriesId,
      test_date: date,
    });
    setTitle('');
    setInstructions('');
    setSeriesId('none');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <FlaskConical className="w-4 h-4 mr-2" /> Log Today's Test
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log a Research Test</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Series</Label>
              <div className="flex gap-2">
                <Select value={seriesId} onValueChange={setSeriesId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select series" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No series —</SelectItem>
                    {series.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <NewSeriesDialog />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Trial #3 — increased flux" />
          </div>
          <div className="space-y-2">
            <Label>Test Instructions / Procedure</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={10}
              placeholder="Paste the written set of instructions for this test…"
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!instructions.trim() || create.isPending}>Save Test</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
