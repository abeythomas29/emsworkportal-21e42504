# Sales Portal Improvement Plan

Right now the Sales Portal only ingests finalized invoice Excel files — it shows revenue *after* a sale closes, but nothing about the journey that led to it. For a B2B operation driven by IndiaMART leads → samples → quotes → orders, we should turn this into a lightweight pipeline CRM so you can measure where leads drop off and which products/sources convert best.

---

## Proposed pipeline (new core)

Track every prospect through clear stages:

```text
New Lead  →  Sample Requested  →  Sample Sent  →  Quote Sent  →  Negotiation  →  Won / Lost
   │              │                   │              │               │
   └─ source      └─ product(s)       └─ courier     └─ amount       └─ reason if lost
      (IndiaMART,    + qty               + tracking     + validity
       referral,                         + sent date    + items
       direct…)
```

Each lead gets: company, contact person, phone, email, city/state, source, product interest, assigned salesperson, status, next-follow-up date, notes/timeline.

---

## Features to add

### 1. Leads module
- Add Lead form (manual + later: IndiaMART CSV import / webhook)
- Lead list with filters: source, status, assignee, date range, city
- Lead detail page with full activity timeline (calls, emails, samples, quotes)
- "Next follow-up" reminders → dashboard widget for overdue follow-ups

### 2. Samples tracker
- Log sample dispatch: product, qty, courier, AWB, dispatch date, cost
- Status: Pending → Dispatched → Delivered → Feedback received
- Auto-link to the lead; show sample-to-order conversion rate per product

### 3. Quotations
- Build quote (line items, price, GST, validity, terms) from a lead
- Generate PDF quote (download / share link)
- Status: Draft → Sent → Accepted → Rejected → Expired
- One-click "Convert to Order" once accepted

### 4. Orders & link to invoices
- Order = accepted quote + expected dispatch date + payment terms
- When the matching invoice arrives via Excel upload, auto-link by party name / invoice ref so you finally see **lead → order → invoice → payment** end-to-end

### 5. Customer 360
- Group all leads, samples, quotes, orders, invoices under one Customer record
- Lifetime value, last order date, outstanding balance, repeat-order rate

### 6. Analytics that actually help
Replace the current single revenue chart with:
- **Funnel:** Leads → Samples → Quotes → Orders (counts + % conversion)
- **Source ROI:** revenue per source (IndiaMART vs referral vs direct)
- **Sample efficiency:** % of samples that converted to orders, by product
- **Quote win rate** and avg time-to-close
- **Salesperson leaderboard:** leads handled, conversion %, revenue closed
- **Lost-reason breakdown** (price, competitor, no response, quality…)
- **Repeat vs new customer revenue** split

### 7. Productivity helpers
- Dashboard widget: "Today's follow-ups" + "Overdue follow-ups"
- WhatsApp / email quick-actions from the lead row (`wa.me/...`, `mailto:`)
- CSV export of leads / quotes / pipeline for any date range
- Optional: email reminders before quote expiry and follow-up due dates (via Lovable Cloud function)

### 8. Roles
- Salesperson: sees own leads + creates quotes
- Manager: sees team pipeline + analytics
- Admin: everything + settings (sources, lost reasons, quote templates)

---

## Suggested rollout (phased so it's not overwhelming)

1. **Phase 1 — Leads + Follow-ups** (biggest immediate value)
   Leads table, source tracking, follow-up reminders, dashboard widget.
2. **Phase 2 — Samples + Quotes** with PDF generation and status tracking.
3. **Phase 3 — Orders + auto-link to existing invoice uploads**, Customer 360.
4. **Phase 4 — Funnel & source-ROI analytics**, salesperson leaderboard.
5. **Phase 5 — IndiaMART integration** (CSV import first; API/webhook later if their plan supports it).

---

## Technical notes

- New tables (all RLS-protected, FKs to `public.profiles(id)` per project rules):
  `leads`, `lead_activities`, `samples`, `quotations`, `quotation_items`, `orders`, `customers`, plus lookup tables `lead_sources`, `lost_reasons`.
- Link existing `sales_invoices.party_name` to `customers` via a normalized name match (same fuzzy matcher already used for products).
- Quote PDFs: generate client-side with `@react-pdf/renderer` or server-side via an edge function — decide in Phase 2.
- IndiaMART: they expose a Lead Manager API (key-based). Phase 5 adds an edge function to pull new leads on a cron.
- All new modules go behind the existing `admin`/`manager` role checks; add a `salesperson` role if you want field reps to log in without seeing HR/payroll.

---

## Questions before I build

1. Who should be able to use the Sales Portal — only admins (current), or also a new "salesperson" role?
2. Do you want IndiaMART leads pulled automatically (API key needed) or is CSV upload enough to start?
3. Should quotes be generated as downloadable PDFs, or just tracked internally with status?
4. Which phase should I start with — **Phase 1 (Leads + Follow-ups)** is the highest-leverage starting point, but say the word if you'd rather begin elsewhere.
