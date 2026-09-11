-- ============================================================================
-- Inch Autos China Purchase Tracker - initial schema
-- ============================================================================
-- Run this once in Supabase: SQL Editor -> New Query -> paste -> Run.
-- Safe to re-run: every statement guards against already existing.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. suppliers
-- ----------------------------------------------------------------------------
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  contact_person text,
  phone text,
  wechat text,
  whatsapp text,
  link_1688 text,
  alibaba_url text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table suppliers is 'China suppliers Inch Autos buys from. Reused across purchase orders.';

-- ----------------------------------------------------------------------------
-- 2. products
-- ----------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  description text,
  category text,
  unit text default 'pcs',
  default_supplier_id uuid references suppliers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. purchase_orders
-- ----------------------------------------------------------------------------
create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  status text not null default 'ordered' check (status in (
    'ordered', 'supplier_preparing', 'ready_for_collection', 'collected',
    'at_china_warehouse', 'consolidated', 'shipped', 'in_transit', 'customs',
    'arrived_ireland', 'delivered', 'problem', 'cancelled'
  )),
  currency text not null default 'RMB',
  exchange_rate numeric(12,6),
  date_ordered date,
  date_dispatched date,
  date_received_at_warehouse date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_purchase_orders_supplier on purchase_orders(supplier_id);
create index if not exists idx_purchase_orders_status on purchase_orders(status);
create index if not exists idx_purchase_orders_order_number on purchase_orders(order_number);

-- ----------------------------------------------------------------------------
-- 4. purchase_order_items
-- ----------------------------------------------------------------------------
create table if not exists purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text,
  quantity numeric(14,3) not null default 0,
  unit_price_rmb numeric(14,4),
  unit_price_eur numeric(14,4),
  line_total_rmb numeric(14,2),
  line_total_eur numeric(14,2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_poi_purchase_order on purchase_order_items(purchase_order_id);
create index if not exists idx_poi_product on purchase_order_items(product_id);

-- ----------------------------------------------------------------------------
-- 5. shipments (many purchase orders consolidate into one shipment)
-- ----------------------------------------------------------------------------
create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  reference text unique,
  shipping_agent text,
  shipping_method text,
  tracking_number text,
  status text not null default 'at_china_warehouse' check (status in (
    'ordered', 'supplier_preparing', 'ready_for_collection', 'collected',
    'at_china_warehouse', 'consolidated', 'shipped', 'in_transit', 'customs',
    'arrived_ireland', 'delivered', 'problem', 'cancelled'
  )),
  warehouse text default 'Shenzhen Xietong Warehouse',
  shipping_mark text default 'INCH AUTOS',
  carton_count integer,
  carton_dimensions text,
  gross_weight_kg numeric(12,3),
  cbm numeric(12,4),
  cost_allocation_method text not null default 'value' check (cost_allocation_method in (
    'quantity', 'weight', 'cbm', 'value', 'manual'
  )),
  date_shipped_from_china date,
  estimated_arrival date,
  actual_arrival date,
  date_delivered date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipments_status on shipments(status);
create index if not exists idx_shipments_tracking on shipments(tracking_number);

-- ----------------------------------------------------------------------------
-- 6. shipment_items (links purchase orders / items into a shipment)
-- ----------------------------------------------------------------------------
create table if not exists shipment_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  purchase_order_item_id uuid references purchase_order_items(id) on delete cascade,
  quantity numeric(14,3),
  allocated_shipping_cost_eur numeric(14,2),
  notes text,
  created_at timestamptz not null default now(),
  unique (shipment_id, purchase_order_item_id)
);

create index if not exists idx_shipment_items_shipment on shipment_items(shipment_id);
create index if not exists idx_shipment_items_po on shipment_items(purchase_order_id);

-- ----------------------------------------------------------------------------
-- 7. costs (freight, customs, VAT, other charges - attach to PO and/or shipment)
-- ----------------------------------------------------------------------------
create table if not exists costs (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid references purchase_orders(id) on delete cascade,
  shipment_id uuid references shipments(id) on delete cascade,
  cost_type text not null check (cost_type in (
    'china_domestic_shipping', 'international_freight', 'customs_duty',
    'import_vat', 'other'
  )),
  description text,
  amount numeric(14,2) not null,
  currency text not null default 'EUR',
  amount_eur numeric(14,2) not null,
  date_incurred date default current_date,
  created_at timestamptz not null default now(),
  constraint costs_linked_to_something check (
    purchase_order_id is not null or shipment_id is not null
  )
);

create index if not exists idx_costs_po on costs(purchase_order_id);
create index if not exists idx_costs_shipment on costs(shipment_id);

-- ----------------------------------------------------------------------------
-- 8. tracking_updates
-- ----------------------------------------------------------------------------
create table if not exists tracking_updates (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  status text,
  location text,
  note text,
  event_date timestamptz default now(),
  source text default 'manual',
  created_at timestamptz not null default now()
);

create index if not exists idx_tracking_updates_shipment on tracking_updates(shipment_id);

-- ----------------------------------------------------------------------------
-- 9. attachments (screenshots, photos, invoices, packing lists...)
-- ----------------------------------------------------------------------------
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'supplier', 'product', 'purchase_order', 'shipment', 'problem'
  )),
  entity_id uuid not null,
  file_path text not null,
  file_name text,
  file_type text,
  notes text,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_attachments_entity on attachments(entity_type, entity_id);

-- ----------------------------------------------------------------------------
-- 10. problems_claims
-- ----------------------------------------------------------------------------
create table if not exists problems_claims (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid references purchase_orders(id) on delete set null,
  shipment_id uuid references shipments(id) on delete set null,
  supplier_id uuid references suppliers(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  type text not null check (type in (
    'missing_goods', 'wrong_quantity', 'wrong_product', 'damaged_goods',
    'faulty_goods', 'supplier_dispute', 'shipping_dispute'
  )),
  description text not null,
  status text not null default 'open' check (status in (
    'open', 'in_progress', 'resolved', 'refunded', 'replaced', 'closed_no_action'
  )),
  resolution text,
  refund_amount numeric(14,2),
  refund_currency text default 'EUR',
  replacement_order_id uuid references purchase_orders(id) on delete set null,
  date_reported date not null default current_date,
  date_resolved date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_problems_status on problems_claims(status);
create index if not exists idx_problems_po on problems_claims(purchase_order_id);
create index if not exists idx_problems_shipment on problems_claims(shipment_id);

-- ============================================================================
-- updated_at auto-touch trigger
-- ============================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array['suppliers','products','purchase_orders','shipments','problems_claims']
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on %1$s;
       create trigger trg_%1$s_updated_at before update on %1$s
       for each row execute function set_updated_at();', t
    );
  end loop;
end $$;

-- ============================================================================
-- Rollup views
-- ============================================================================

-- Supplier stats: total orders, total spend (EUR), average lead time, open problems
create or replace view supplier_stats as
select
  s.id as supplier_id,
  count(distinct po.id) as total_orders,
  coalesce(sum(poi.line_total_eur), 0) as total_spend_eur,
  avg(
    case when po.date_ordered is not null and po.date_received_at_warehouse is not null
      then (po.date_received_at_warehouse - po.date_ordered)
    end
  ) as avg_lead_time_days,
  count(distinct pc.id) filter (where pc.status = 'open') as open_problems,
  count(distinct pc.id) as total_problems
from suppliers s
left join purchase_orders po on po.supplier_id = s.id
left join purchase_order_items poi on poi.purchase_order_id = po.id
left join problems_claims pc on pc.supplier_id = s.id
group by s.id;

-- Purchase order cost summary: items + directly attached costs
create or replace view purchase_order_cost_summary as
select
  po.id as purchase_order_id,
  coalesce(sum(poi.line_total_eur), 0) as items_total_eur,
  coalesce((
    select sum(c.amount_eur) from costs c where c.purchase_order_id = po.id
  ), 0) as direct_costs_eur,
  coalesce((
    select sum(si.allocated_shipping_cost_eur)
    from shipment_items si where si.purchase_order_id = po.id
  ), 0) as allocated_shipping_eur
from purchase_orders po
left join purchase_order_items poi on poi.purchase_order_id = po.id
group by po.id;

-- Product cost history: every purchase order line for a product, most recent first
create or replace view product_cost_history as
select
  poi.product_id,
  po.id as purchase_order_id,
  po.order_number,
  s.name as supplier_name,
  po.date_ordered,
  poi.quantity,
  poi.unit_price_rmb,
  poi.unit_price_eur,
  poi.line_total_eur
from purchase_order_items poi
join purchase_orders po on po.id = poi.purchase_order_id
join suppliers s on s.id = po.supplier_id
where poi.product_id is not null
order by po.date_ordered desc nulls last;

-- ============================================================================
-- Row Level Security
-- This is a single-business internal tool: any signed-in user has full access.
-- ============================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'suppliers','products','purchase_orders','purchase_order_items',
    'shipments','shipment_items','costs','tracking_updates',
    'attachments','problems_claims'
  ]
  loop
    execute format('alter table %1$s enable row level security;', t);
    execute format('drop policy if exists "authenticated_full_access" on %1$s;', t);
    execute format(
      'create policy "authenticated_full_access" on %1$s
       for all using (auth.role() = ''authenticated'')
       with check (auth.role() = ''authenticated'');', t
    );
  end loop;
end $$;

-- ============================================================================
-- Storage bucket for attachments
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "authenticated_read_attachments" on storage.objects;
create policy "authenticated_read_attachments" on storage.objects
  for select using (bucket_id = 'attachments' and auth.role() = 'authenticated');

drop policy if exists "authenticated_write_attachments" on storage.objects;
create policy "authenticated_write_attachments" on storage.objects
  for insert with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

drop policy if exists "authenticated_update_attachments" on storage.objects;
create policy "authenticated_update_attachments" on storage.objects
  for update using (bucket_id = 'attachments' and auth.role() = 'authenticated');

drop policy if exists "authenticated_delete_attachments" on storage.objects;
create policy "authenticated_delete_attachments" on storage.objects
  for delete using (bucket_id = 'attachments' and auth.role() = 'authenticated');
