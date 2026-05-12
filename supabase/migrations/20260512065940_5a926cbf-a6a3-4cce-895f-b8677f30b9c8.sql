-- Reimbursement requests table
CREATE TABLE public.reimbursement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  screenshot_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  handled_by uuid,
  handled_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reimbursement_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all reimbursements"
ON public.reimbursement_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own reimbursements"
ON public.reimbursement_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending' AND handled_by IS NULL);

CREATE POLICY "Users can update their own pending reimbursements"
ON public.reimbursement_requests FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can delete their own pending reimbursements"
ON public.reimbursement_requests FOR DELETE TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all reimbursements"
ON public.reimbursement_requests FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_reimbursement_requests_updated_at
BEFORE UPDATE ON public.reimbursement_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for screenshots (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('reimbursements', 'reimbursements', false);

CREATE POLICY "Users can upload their own reimbursement files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reimbursements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own reimbursement files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'reimbursements' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users can delete their own reimbursement files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'reimbursements' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Admins can manage reimbursement files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'reimbursements' AND has_role(auth.uid(), 'admin'::app_role));