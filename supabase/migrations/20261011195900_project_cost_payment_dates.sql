-- Legacy incurred costs are not assumed paid. Owners confirm their payment date.
alter table public.project_costs add column paid_on date;
comment on column public.project_costs.paid_on is 'Owner-confirmed payment date for standalone project costs. Linked business expenses use their own payment date and are counted only once.';
