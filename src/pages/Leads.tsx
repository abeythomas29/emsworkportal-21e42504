import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Loader2,
  Plus,
  Search,
  Users2,
  Phone,
  Mail,
  MessageCircle,
  AlertCircle,
  Trash2,
  Pencil,
} from 'lucide-react';
import {
  Lead,
  LeadStatus,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  useLeads,
  useDeleteLead,
} from '@/hooks/useLeads';
import { LeadDialog } from '@/components/sales/LeadDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEmployees } from '@/hooks/useEmployees';

const STATUS_VARIANT: Record<LeadStatus, string> = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  sample_requested: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  sample_sent: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  quote_sent: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  negotiation: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  won: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  lost: 'bg-red-500/15 text-red-400 border-red-500/30',
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function daysFromToday(d: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export default function LeadsPage() {
  const { role, isLoading: authLoading } = useAuth();
  const { data: leads = [], isLoading } = useLeads();
  const { employees } = useEmployees();
  const del = useDeleteLead();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const empMap = useMemo(() => {
    const m = new Map<string, string>();
    employees.forEach((e) => m.set(e.id, e.full_name));
    return m;
  }, [employees]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          l.company_name.toLowerCase().includes(s) ||
          (l.contact_person || '').toLowerCase().includes(s) ||
          (l.phone || '').includes(s) ||
          (l.product_interest || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  const stats = useMemo(() => {
    const open = leads.filter((l) => !['won', 'lost'].includes(l.status));
    const won = leads.filter((l) => l.status === 'won');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = open.filter((l) => l.next_follow_up && new Date(l.next_follow_up) < today);
    const pipeline = open.reduce((s, l) => s + Number(l.estimated_value || 0), 0);
    return { total: leads.length, open: open.length, won: won.length, overdue: overdue.length, pipeline };
  }, [leads]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (role !== 'admin' && role !== 'manager') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users2 className="w-8 h-8 text-primary" />
              Sales Leads
            </h1>
            <p className="text-muted-foreground mt-1">Track every prospect from first enquiry to closed deal.</p>
          </div>
          <Button size="lg" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Lead
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total Leads" value={stats.total} />
          <StatCard label="Open" value={stats.open} />
          <StatCard label="Won" value={stats.won} accent="text-emerald-400" />
          <StatCard label="Overdue Follow-ups" value={stats.overdue} accent="text-red-400" />
          <StatCard
            label="Open Pipeline (₹)"
            value={new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(stats.pipeline)}
          />
        </div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle>All Leads</CardTitle>
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search company, contact…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No leads match your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company / Contact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead className="text-right">Value (₹)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l) => {
                      const fd = l.next_follow_up ? daysFromToday(l.next_follow_up) : null;
                      const overdue = fd !== null && fd < 0 && !['won', 'lost'].includes(l.status);
                      return (
                        <TableRow key={l.id}>
                          <TableCell>
                            <div className="font-medium text-foreground">{l.company_name}</div>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                              {l.contact_person && <span>{l.contact_person}</span>}
                              {l.city && <span>· {l.city}</span>}
                            </div>
                            <div className="flex gap-1 mt-1">
                              {l.phone && (
                                <>
                                  <a href={`tel:${l.phone}`} title="Call" className="text-primary hover:underline">
                                    <Phone className="w-3.5 h-3.5 inline" />
                                  </a>
                                  <a
                                    href={`https://wa.me/${l.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="WhatsApp"
                                    className="text-emerald-500 hover:underline ml-2"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 inline" />
                                  </a>
                                </>
                              )}
                              {l.email && (
                                <a href={`mailto:${l.email}`} title="Email" className="text-primary hover:underline ml-2">
                                  <Mail className="w-3.5 h-3.5 inline" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{LEAD_SOURCE_LABELS[l.source]}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate" title={l.product_interest || ''}>
                            {l.product_interest || '—'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-md text-xs border ${STATUS_VARIANT[l.status]}`}>
                              {LEAD_STATUS_LABELS[l.status]}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {l.assigned_to ? empMap.get(l.assigned_to) || '—' : '—'}
                          </TableCell>
                          <TableCell>
                            {l.next_follow_up ? (
                              <div className={`text-sm flex items-center gap-1 ${overdue ? 'text-red-400 font-medium' : ''}`}>
                                {overdue && <AlertCircle className="w-3.5 h-3.5" />}
                                {formatDate(l.next_follow_up)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(l.estimated_value || 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" onClick={() => { setEditing(l); setDialogOpen(true); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {role === 'admin' && (
                              <Button size="icon" variant="ghost" onClick={() => setDeleteId(l.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LeadDialog open={dialogOpen} onOpenChange={setDialogOpen} lead={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the lead and all its activity history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteId) await del.mutateAsync(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-bold ${accent || 'text-foreground'}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
