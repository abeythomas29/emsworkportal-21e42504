import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';

export type LeadStatus =
  | 'new'
  | 'sample_requested'
  | 'sample_sent'
  | 'quote_sent'
  | 'negotiation'
  | 'won'
  | 'lost';

export type LeadSource =
  | 'indiamart'
  | 'referral'
  | 'website'
  | 'direct'
  | 'tradeshow'
  | 'other';

export interface Lead {
  id: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  source: LeadSource;
  source_details: string | null;
  product_interest: string | null;
  estimated_value: number;
  status: LeadStatus;
  assigned_to: string | null;
  next_follow_up: string | null;
  notes: string | null;
  lost_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string | null;
  activity_type: string;
  description: string | null;
  created_at: string;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  sample_requested: 'Sample Requested',
  sample_sent: 'Sample Sent',
  quote_sent: 'Quote Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  indiamart: 'IndiaMART',
  referral: 'Referral',
  website: 'Website',
  direct: 'Direct',
  tradeshow: 'Tradeshow',
  other: 'Other',
};

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Lead[];
    },
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['lead', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as Lead | null;
    },
  });
}

export function useLeadActivities(leadId: string | undefined) {
  return useQuery({
    queryKey: ['lead-activities', leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as LeadActivity[];
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<Lead>) => {
      if (!user) throw new Error('Not authenticated');
      const insertPayload = {
        company_name: payload.company_name!,
        contact_person: payload.contact_person ?? null,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        city: payload.city ?? null,
        state: payload.state ?? null,
        source: (payload.source ?? 'other') as LeadSource,
        source_details: payload.source_details ?? null,
        product_interest: payload.product_interest ?? null,
        estimated_value: payload.estimated_value ?? 0,
        status: (payload.status ?? 'new') as LeadStatus,
        assigned_to: payload.assigned_to ?? user.id,
        next_follow_up: payload.next_follow_up ?? null,
        notes: payload.notes ?? null,
        created_by: user.id,
      };
      const { data, error } = await supabase.from('leads').insert(insertPayload).select().single();
      if (error) throw error;
      // log creation activity
      await supabase.from('lead_activities').insert({
        lead_id: data.id,
        user_id: user.id,
        activity_type: 'created',
        description: `Lead created from ${LEAD_SOURCE_LABELS[insertPayload.source]}`,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Lead added');
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leads-followups'] });
    },
    onError: (e: Error) => {
      logError('useCreateLead', e);
      toast.error(e.message || 'Failed to add lead');
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, patch, activityNote }: { id: string; patch: Partial<Lead>; activityNote?: string }) => {
      const { data, error } = await supabase.from('leads').update(patch).eq('id', id).select().single();
      if (error) throw error;
      if (user && (patch.status || activityNote)) {
        await supabase.from('lead_activities').insert({
          lead_id: id,
          user_id: user.id,
          activity_type: patch.status ? 'status_change' : 'note',
          description:
            activityNote ||
            (patch.status ? `Status changed to ${LEAD_STATUS_LABELS[patch.status as LeadStatus]}` : null),
        });
      }
      return data;
    },
    onSuccess: (_d, vars) => {
      toast.success('Lead updated');
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['lead', vars.id] });
      qc.invalidateQueries({ queryKey: ['lead-activities', vars.id] });
      qc.invalidateQueries({ queryKey: ['leads-followups'] });
    },
    onError: (e: Error) => {
      logError('useUpdateLead', e);
      toast.error(e.message || 'Failed to update lead');
    },
  });
}

export function useAddLeadActivity() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ leadId, type, description }: { leadId: string; type: string; description: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('lead_activities').insert({
        lead_id: leadId,
        user_id: user.id,
        activity_type: type,
        description,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['lead-activities', vars.leadId] });
    },
    onError: (e: Error) => {
      logError('useAddLeadActivity', e);
      toast.error(e.message || 'Failed to add activity');
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lead deleted');
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leads-followups'] });
    },
    onError: (e: Error) => {
      logError('useDeleteLead', e);
      toast.error(e.message || 'Failed to delete lead');
    },
  });
}

export function useUpcomingFollowUps() {
  return useQuery({
    queryKey: ['leads-followups'],
    queryFn: async () => {
      const today = new Date();
      const in7 = new Date();
      in7.setDate(today.getDate() + 7);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .not('next_follow_up', 'is', null)
        .not('status', 'in', '(won,lost)')
        .lte('next_follow_up', in7.toISOString().slice(0, 10))
        .order('next_follow_up', { ascending: true });
      if (error) throw error;
      return (data || []) as Lead[];
    },
  });
}
