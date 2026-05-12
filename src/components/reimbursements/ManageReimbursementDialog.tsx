import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ExternalLink } from 'lucide-react';
import { useReimbursements, getReimbursementScreenshotUrl, type Reimbursement, type ReimbursementStatus } from '@/hooks/useReimbursements';
import { format } from 'date-fns';

interface Props {
  request: Reimbursement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageReimbursementDialog({ request, open, onOpenChange }: Props) {
  const { update, isUpdating } = useReimbursements();
  const [status, setStatus] = useState<ReimbursementStatus>('pending');
  const [notes, setNotes] = useState('');
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (request) {
      setStatus(request.status);
      setNotes(request.admin_notes ?? '');
      if (request.screenshot_url) {
        getReimbursementScreenshotUrl(request.screenshot_url).then(setSignedUrl);
      } else setSignedUrl(null);
    }
  }, [request]);

  if (!request) return null;

  const submit = async () => {
    await update({ id: request.id, status, admin_notes: notes });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Manage Reimbursement</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3 rounded-lg">
            <div><div className="text-xs text-muted-foreground">Requester</div><div className="font-medium">{request.requester_name}</div></div>
            <div><div className="text-xs text-muted-foreground">Amount</div><div className="font-medium">₹{request.amount.toLocaleString()}</div></div>
            <div><div className="text-xs text-muted-foreground">Category</div><div className="font-medium capitalize">{request.category.replace('_', ' ')}</div></div>
            <div><div className="text-xs text-muted-foreground">Expense date</div><div className="font-medium">{format(new Date(request.expense_date), 'MMM d, yyyy')}</div></div>
            <div className="col-span-2"><div className="text-xs text-muted-foreground">Description</div><div>{request.description}</div></div>
          </div>

          {request.screenshot_url && (
            <div>
              <Label className="text-xs">Receipt / Screenshot</Label>
              {signedUrl ? (
                <a href={signedUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-2 text-sm text-primary hover:underline">
                  <ExternalLink className="w-4 h-4" /> Open attachment
                </a>
              ) : (
                <div className="text-xs text-muted-foreground mt-1">Loading…</div>
              )}
              {signedUrl && /\.(png|jpe?g|gif|webp)$/i.test(request.screenshot_url) && (
                <img src={signedUrl} alt="Receipt" className="mt-2 max-h-64 rounded border border-border" />
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ReimbursementStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Admin notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for the requester" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={isUpdating}>
            {isUpdating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
