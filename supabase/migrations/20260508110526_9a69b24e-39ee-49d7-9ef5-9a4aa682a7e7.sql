
-- Enums
CREATE TYPE public.lead_status AS ENUM (
  'new',
  'sample_requested',
  'sample_sent',
  'quote_sent',
  'negotiation',
  'won',
  'lost'
);

CREATE TYPE public.lead_source AS ENUM (
  'indiamart',
  'referral',
  'website',
  'direct',
  'tradeshow',
  'other'
);

-- Leads
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  source public.lead_source NOT NULL DEFAULT 'other',
  source_details TEXT,
  product_interest TEXT,
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  status public.lead_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  next_follow_up DATE,
  notes TEXT,
  lost_reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_next_follow_up ON public.leads(next_follow_up);
CREATE INDEX idx_leads_source ON public.leads(source);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers view all leads"
ON public.leads FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
);

CREATE POLICY "Admins and managers insert leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins, managers, and assignees update leads"
ON public.leads FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR assigned_to = auth.uid()
);

CREATE POLICY "Admins delete leads"
ON public.leads FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lead Activities
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_activities_lead ON public.lead_activities(lead_id, created_at DESC);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View activities if can view lead"
ON public.lead_activities FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_activities.lead_id
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'manager'::app_role)
        OR l.assigned_to = auth.uid()
        OR l.created_by = auth.uid()
      )
  )
);

CREATE POLICY "Insert activities if can view lead"
ON public.lead_activities FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_activities.lead_id
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'manager'::app_role)
        OR l.assigned_to = auth.uid()
        OR l.created_by = auth.uid()
      )
  )
);

CREATE POLICY "Admins delete activities"
ON public.lead_activities FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
