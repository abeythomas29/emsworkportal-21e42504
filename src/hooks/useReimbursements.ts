import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ReimbursementStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Reimbursement {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  expense_date: string;
  screenshot_url: string | null;
  status: ReimbursementStatus;
  admin_notes: string | null;
  handled_by: string | null;
  handled_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  requester_name?: string;
  requester_department?: string | null;
}

export interface CreateReimbursementInput {
  amount: number;
  category: string;
  description: string;
  expense_date: string;
  screenshot_file?: File | null;
}

export interface UpdateReimbursementInput {
  id: string;
  status: ReimbursementStatus;
  admin_notes?: string | null;
}

export function useReimbursements() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['reimbursements'],
    queryFn: async (): Promise<Reimbursement[]> => {
      const { data, error } = await supabase
        .from('reimbursement_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      if (userIds.length === 0) return (data ?? []) as Reimbursement[];

      const { data: profiles } = await supabase.rpc('get_basic_profiles', { _user_ids: userIds });
      const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return (data ?? []).map((r: any) => ({
        ...r,
        requester_name: map.get(r.user_id)?.full_name ?? 'Unknown',
        requester_department: map.get(r.user_id)?.department ?? null,
      })) as Reimbursement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateReimbursementInput) => {
      if (!user?.id) throw new Error('Not signed in');
      let screenshot_url: string | null = null;
      if (input.screenshot_file) {
        const ext = input.screenshot_file.name.split('.').pop() || 'png';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('reimbursements')
          .upload(path, input.screenshot_file, { upsert: false });
        if (upErr) throw upErr;
        screenshot_url = path;
      }
      const { error } = await supabase.from('reimbursement_requests').insert({
        user_id: user.id,
        amount: input.amount,
        category: input.category,
        description: input.description,
        expense_date: input.expense_date,
        screenshot_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
      toast.success('Reimbursement submitted');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to submit'),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateReimbursementInput) => {
      const patch: Record<string, any> = {
        status: input.status,
        handled_by: user?.id ?? null,
        handled_at: new Date().toISOString(),
      };
      if (input.admin_notes !== undefined) patch.admin_notes = input.admin_notes || null;
      if (input.status === 'paid') patch.paid_at = new Date().toISOString();
      const { error } = await supabase
        .from('reimbursement_requests')
        .update(patch)
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
      toast.success('Reimbursement updated');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (r: Reimbursement) => {
      if (r.screenshot_url) {
        await supabase.storage.from('reimbursements').remove([r.screenshot_url]);
      }
      const { error } = await supabase.from('reimbursement_requests').delete().eq('id', r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
      toast.success('Deleted');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to delete'),
  });

  return {
    reimbursements: query.data ?? [],
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    remove: deleteMutation.mutateAsync,
  };
}

export async function getReimbursementScreenshotUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('reimbursements')
    .createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data?.signedUrl ?? null;
}
