import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Lead,
  LeadSource,
  LeadStatus,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  useCreateLead,
  useUpdateLead,
} from '@/hooks/useLeads';
import { useEmployees } from '@/hooks/useEmployees';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead?: Lead | null;
}

const empty: Partial<Lead> = {
  company_name: '',
  contact_person: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  source: 'indiamart',
  source_details: '',
  product_interest: '',
  estimated_value: 0,
  status: 'new',
  next_follow_up: '',
  notes: '',
};

export function LeadDialog({ open, onOpenChange, lead }: Props) {
  const [form, setForm] = useState<Partial<Lead>>(empty);
  const create = useCreateLead();
  const update = useUpdateLead();
  const { employees } = useEmployees();

  useEffect(() => {
    if (open) {
      setForm(lead ? { ...lead } : empty);
    }
  }, [open, lead]);

  const set = <K extends keyof Lead>(k: K, v: Lead[K] | string | number | null) =>
    setForm((f) => ({ ...f, [k]: v as Lead[K] }));

  const handleSave = async () => {
    if (!form.company_name?.trim()) return;
    if (lead) {
      await update.mutateAsync({ id: lead.id, patch: form });
    } else {
      await create.mutateAsync(form);
    }
    onOpenChange(false);
  };

  const isLost = form.status === 'lost';
  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="md:col-span-2">
            <Label>Company Name *</Label>
            <Input value={form.company_name || ''} onChange={(e) => set('company_name', e.target.value)} />
          </div>
          <div>
            <Label>Contact Person</Label>
            <Input value={form.contact_person || ''} onChange={(e) => set('contact_person', e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <Label>Product Interest</Label>
            <Input value={form.product_interest || ''} onChange={(e) => set('product_interest', e.target.value)} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <Label>State</Label>
            <Input value={form.state || ''} onChange={(e) => set('state', e.target.value)} />
          </div>
          <div>
            <Label>Source</Label>
            <Select value={form.source} onValueChange={(v) => set('source', v as LeadSource)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v as LeadStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Estimated Value (₹)</Label>
            <Input
              type="number"
              value={form.estimated_value ?? 0}
              onChange={(e) => set('estimated_value', Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Next Follow-up</Label>
            <Input
              type="date"
              value={form.next_follow_up || ''}
              onChange={(e) => set('next_follow_up', e.target.value || null)}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Assigned To</Label>
            <Select
              value={form.assigned_to || ''}
              onValueChange={(v) => set('assigned_to', v || null)}
            >
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                {employees
                  .filter((e) => e.is_active)
                  .map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {isLost && (
            <div className="md:col-span-2">
              <Label>Lost Reason</Label>
              <Input value={form.lost_reason || ''} onChange={(e) => set('lost_reason', e.target.value)} />
            </div>
          )}
          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy || !form.company_name?.trim()}>
            {busy ? 'Saving…' : lead ? 'Update Lead' : 'Add Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
