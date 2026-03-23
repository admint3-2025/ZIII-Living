-- ============================================================
-- ZIII Living — Migración Comunitaria v1.0
-- Gestión de condominio: finanzas, residentes, acceso, reservas, votaciones
-- Aplicar en Supabase > SQL Editor
-- ============================================================

-- ─── 1. EXTENSIÓN DE PROFILES: Campos comunitarios ──────────────────────────
-- Agregar campos nuevos al perfil de usuario para el contexto comunitario

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS unit_number      TEXT,          -- Depto / casa / local (ej. "101", "A-3")
  ADD COLUMN IF NOT EXISTS property_id      UUID REFERENCES locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resident_since   DATE,          -- Fecha desde la que es residente
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,         -- Contacto de emergencia
  ADD COLUMN IF NOT EXISTS vehicle_plates   TEXT[],        -- Placas de vehículos registrados
  ADD COLUMN IF NOT EXISTS is_owner         BOOLEAN DEFAULT false; -- true = propietario, false = inquilino

-- Actualizar el enum de roles para incluir nuevos roles comunitarios
-- (Si el rol es VARCHAR o TEXT, simplemente los valores nuevos ya son válidos)
-- Si es ENUM de PostgreSQL, ejecutar:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    -- Agregar valores al enum solo si no existen
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'resident';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'security_guard';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Necesaria para usar tipos escalares (uuid, date) dentro de índices GiST (EXCLUDE constraint)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ─── 2. UNIDADES / DEPARTAMENTOS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  unit_number     TEXT NOT NULL,             -- "101", "Torre A - 302", "Local 5"
  unit_type       TEXT NOT NULL DEFAULT 'apartment'
                    CHECK (unit_type IN ('apartment', 'house', 'local', 'parking', 'storage')),
  floor           INTEGER,
  area_sqm        NUMERIC(8,2),             -- Metros cuadrados
  monthly_fee     NUMERIC(12,2) DEFAULT 0,  -- Cuota mensual de mantenimiento
  is_active       BOOLEAN DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (property_id, unit_number)
);

-- ─── 3. FINANZAS: CUENTAS BANCARIAS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  bank_name       TEXT NOT NULL,
  account_number  TEXT NOT NULL,            -- Últimos 4 dígitos o número completo cifrado
  account_alias   TEXT NOT NULL,            -- Nombre amigable: "BBVA Operativa"
  currency        TEXT NOT NULL DEFAULT 'MXN',
  current_balance NUMERIC(14,2) DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. FINANZAS: CATEGORÍAS DE MOVIMIENTOS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID REFERENCES locations(id) ON DELETE CASCADE,  -- NULL = global
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon            TEXT,                     -- emoji o nombre de icono
  is_system       BOOLEAN DEFAULT false,    -- true = no editable por usuario
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Categorías del sistema por defecto
INSERT INTO financial_categories (name, type, icon, is_system) VALUES
  ('Cuota de Mantenimiento', 'income',  '🏠', true),
  ('Cuota Extraordinaria',   'income',  '💰', true),
  ('Multa',                  'income',  '⚠️', true),
  ('Intereses Moratorios',   'income',  '📈', true),
  ('Pago de Fondo de Reserva','income', '🏦', true),
  ('Servicios (Agua, Luz, Gas)', 'expense', '💡', true),
  ('Limpieza y Mantenimiento',   'expense', '🧹', true),
  ('Seguridad',                  'expense', '🔒', true),
  ('Reparaciones',               'expense', '🔧', true),
  ('Administración',             'expense', '📋', true),
  ('Fondo de Reserva',           'expense', '🏦', true),
  ('Honorarios Profesionales',   'expense', '👔', true),
  ('Seguros',                    'expense', '🛡️', true),
  ('Varios',                     'expense', '📦', true)
ON CONFLICT DO NOTHING;

-- ─── 5. FINANZAS: MOVIMIENTOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES financial_categories(id),
  bank_account_id UUID REFERENCES bank_accounts(id),
  unit_id         UUID REFERENCES community_units(id),    -- Si aplica a un residente específico
  resident_id     UUID REFERENCES profiles(id),           -- Residente relacionado
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'MXN',
  description     TEXT NOT NULL,
  reference       TEXT,                                   -- Folio, cheque, transferencia
  movement_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,                                   -- Fecha límite de pago (para cargos)
  paid_date       DATE,                                   -- Fecha en que se pagó
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'reconciled')),
  is_recurring    BOOLEAN DEFAULT false,
  recurring_day   INTEGER CHECK (recurring_day BETWEEN 1 AND 31),  -- Día del mes para recurrente
  attachment_url  TEXT,                                   -- Comprobante / factura
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 6. FINANZAS: MULTAS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  unit_id         UUID NOT NULL REFERENCES community_units(id),
  resident_id     UUID NOT NULL REFERENCES profiles(id),
  category        TEXT NOT NULL,            -- "Ruidos", "Mascotas", "Estacionamiento", etc.
  description     TEXT NOT NULL,
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  incident_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT 'unpaid'
                    CHECK (status IN ('unpaid', 'paid', 'appealed', 'waived')),
  paid_date       DATE,
  movement_id     UUID REFERENCES financial_movements(id), -- Pago vinculado
  evidence_url    TEXT,                     -- Foto o evidencia del incidente
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. FINANZAS: CONCILIACIÓN BANCARIA ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_reconciliations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  bank_account_id   UUID NOT NULL REFERENCES bank_accounts(id),
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  opening_balance   NUMERIC(14,2) NOT NULL DEFAULT 0,
  closing_balance   NUMERIC(14,2) NOT NULL DEFAULT 0,
  statement_balance NUMERIC(14,2),          -- Saldo según estado de cuenta bancario
  difference        NUMERIC(14,2) GENERATED ALWAYS AS (closing_balance - COALESCE(statement_balance, closing_balance)) STORED,
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'in_review', 'approved', 'closed')),
  notes             TEXT,
  created_by        UUID NOT NULL REFERENCES profiles(id),
  approved_by       UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ─── 8. FACTURAS / RECIBOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  unit_id         UUID NOT NULL REFERENCES community_units(id),
  resident_id     UUID NOT NULL REFERENCES profiles(id),
  invoice_number  TEXT NOT NULL,            -- Folio consecutivo
  period_month    INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year     INTEGER NOT NULL,
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
  fines_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  interest_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total           NUMERIC(14,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  issued_at       TIMESTAMPTZ DEFAULT now(),
  due_date        DATE NOT NULL,
  paid_at         TIMESTAMPTZ,
  payment_ref     TEXT,
  pdf_url         TEXT,                     -- URL del PDF generado
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (property_id, invoice_number)
);

-- ─── 9. CONTROL DE ACCESO: VISITANTES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  id_type         TEXT DEFAULT 'ine' CHECK (id_type IN ('ine', 'passport', 'license', 'other')),
  id_number       TEXT,
  phone           TEXT,
  photo_url       TEXT,
  company         TEXT,
  is_frequent     BOOLEAN DEFAULT false,    -- Visitante frecuente pre-registrado
  is_blocked      BOOLEAN DEFAULT false,    -- Vetado del acceso
  blocked_reason  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 10. CONTROL DE ACCESO: BITÁCORA ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  visitor_id      UUID REFERENCES visitors(id),
  unit_id         UUID REFERENCES community_units(id),       -- Unidad destino
  resident_id     UUID REFERENCES profiles(id),              -- Quién autoriza
  guard_id        UUID REFERENCES profiles(id),              -- Guardia que registra
  entry_type      TEXT NOT NULL CHECK (entry_type IN ('visitor', 'resident', 'provider', 'delivery', 'emergency')),
  entry_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  exit_at         TIMESTAMPTZ,
  vehicle_plate   TEXT,
  qr_code_used    TEXT,                                      -- QR escaneado para acceso
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 11. CONTROL DE ACCESO: CÓDIGOS QR ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitor_qr_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  resident_id     UUID NOT NULL REFERENCES profiles(id),
  unit_id         UUID NOT NULL REFERENCES community_units(id),
  code            TEXT NOT NULL UNIQUE,                      -- Token único del QR
  visitor_name    TEXT NOT NULL,
  visitor_phone   TEXT,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until     TIMESTAMPTZ NOT NULL,
  max_uses        INTEGER DEFAULT 1,                         -- Usos máximos
  use_count       INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 12. ÁREAS COMUNES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS common_areas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  capacity        INTEGER,
  icon            TEXT DEFAULT '🏛️',
  photo_url       TEXT,
  rules           TEXT,                                      -- Reglas de uso
  requires_deposit BOOLEAN DEFAULT false,
  deposit_amount  NUMERIC(12,2) DEFAULT 0,
  cost_per_hour   NUMERIC(12,2) DEFAULT 0,
  advance_days    INTEGER DEFAULT 30,                        -- Días máximos de anticipación para reservar
  min_hours       NUMERIC(4,1) DEFAULT 1,
  max_hours       NUMERIC(4,1) DEFAULT 8,
  available_from  TIME DEFAULT '07:00',
  available_until TIME DEFAULT '22:00',
  available_days  INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],  -- 0=Dom, 6=Sáb
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 13. RESERVAS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS area_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  area_id         UUID NOT NULL REFERENCES common_areas(id) ON DELETE CASCADE,
  unit_id         UUID NOT NULL REFERENCES community_units(id),
  resident_id     UUID NOT NULL REFERENCES profiles(id),
  date            DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  attendees       INTEGER DEFAULT 1,
  purpose         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  approved_by     UUID REFERENCES profiles(id),
  approved_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  deposit_paid    BOOLEAN DEFAULT false,
  deposit_returned BOOLEAN DEFAULT false,
  total_cost      NUMERIC(12,2) DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  -- Evitar solapamiento de reservas (misma área, mismo día y rango de horas)
  -- date + time es IMMUTABLE en PostgreSQL (a diferencia de la concatenación de strings)
  CONSTRAINT no_overlap EXCLUDE USING gist (
    area_id WITH =,
    tsrange(
      (date + start_time)::TIMESTAMP,
      (date + end_time)::TIMESTAMP
    ) WITH &&
  ) WHERE (status NOT IN ('rejected', 'cancelled'))
);

-- ─── 14. VOTACIONES / ENCUESTAS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surveys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL DEFAULT 'vote'
                    CHECK (type IN ('vote', 'survey', 'poll')),
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  allows_anonymous BOOLEAN DEFAULT false,
  requires_quorum  BOOLEAN DEFAULT false,
  quorum_percent   NUMERIC(5,2),             -- % de participación mínimo para ser válida
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  created_by       UUID NOT NULL REFERENCES profiles(id),
  closed_by        UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── 15. OPCIONES DE VOTACIÓN ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS survey_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id       UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  description     TEXT,
  sort_order      INTEGER DEFAULT 0,
  vote_count      INTEGER DEFAULT 0,          -- Desnormalizado para rendimiento
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 16. VOTOS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS survey_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id       UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  option_id       UUID NOT NULL REFERENCES survey_options(id) ON DELETE CASCADE,
  voter_id        UUID NOT NULL REFERENCES profiles(id),
  unit_id         UUID REFERENCES community_units(id),
  voted_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (survey_id, voter_id)                -- Un voto por encuesta por usuario
);

-- ─── 17. NOTIFICACIONES COMUNITARIAS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'general'
                    CHECK (type IN ('general', 'urgent', 'maintenance', 'financial', 'event', 'rule_violation')),
  target_roles    TEXT[] DEFAULT ARRAY['resident'],         -- Roles destinatarios
  target_units    UUID[],                                   -- Unidades específicas (null = todos)
  attachment_url  TEXT,
  is_pinned       BOOLEAN DEFAULT false,
  published_at    TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 18. ÍNDICES DE RENDIMIENTO ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_financial_movements_property ON financial_movements(property_id);
CREATE INDEX IF NOT EXISTS idx_financial_movements_date ON financial_movements(movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_movements_status ON financial_movements(status);
CREATE INDEX IF NOT EXISTS idx_financial_movements_unit ON financial_movements(unit_id);
CREATE INDEX IF NOT EXISTS idx_fines_unit ON fines(unit_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);
CREATE INDEX IF NOT EXISTS idx_access_log_property ON access_log(property_id);
CREATE INDEX IF NOT EXISTS idx_access_log_entry_at ON access_log(entry_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_qr_codes_code ON visitor_qr_codes(code);
CREATE INDEX IF NOT EXISTS idx_area_reservations_date ON area_reservations(date, area_id);
CREATE INDEX IF NOT EXISTS idx_surveys_property ON surveys(property_id, status);
CREATE INDEX IF NOT EXISTS idx_survey_votes_survey ON survey_votes(survey_id);
CREATE INDEX IF NOT EXISTS idx_community_units_property ON community_units(property_id);
CREATE INDEX IF NOT EXISTS idx_announcements_property ON community_announcements(property_id, published_at DESC);

-- ─── 19. ROW LEVEL SECURITY ──────────────────────────────────────────────────
-- Habilitar RLS en todas las tablas comunitarias
ALTER TABLE community_units             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_movements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_log                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_qr_codes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_areas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_reservations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_options              ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_votes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_announcements     ENABLE ROW LEVEL SECURITY;

-- Política helper: admin y corporate_admin tienen acceso total
-- Usamos role::text para evitar el error de enum no confirmado en la misma transacción
CREATE OR REPLACE FUNCTION is_community_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role::text IN ('admin', 'corporate_admin')
  )
$$;

-- Política helper: el usuario es guardia de seguridad
CREATE OR REPLACE FUNCTION is_security_guard()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role::text = 'security_guard'
  )
$$;

-- ── community_units ──
DROP POLICY IF EXISTS "community_units_read" ON community_units;
CREATE POLICY "community_units_read" ON community_units FOR SELECT
  USING (is_community_admin() OR is_security_guard() OR auth.uid() IN (
    SELECT id FROM profiles WHERE property_id = community_units.property_id
  ));
DROP POLICY IF EXISTS "community_units_write" ON community_units;
CREATE POLICY "community_units_write" ON community_units FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());

-- ── financial_movements ──
DROP POLICY IF EXISTS "financial_movements_admin" ON financial_movements;
CREATE POLICY "financial_movements_admin" ON financial_movements FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());
DROP POLICY IF EXISTS "financial_movements_resident_read" ON financial_movements;
CREATE POLICY "financial_movements_resident_read" ON financial_movements FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role::text = 'resident' AND property_id = financial_movements.property_id
    )
  );

-- ── fines ──
DROP POLICY IF EXISTS "fines_admin" ON fines;
CREATE POLICY "fines_admin" ON fines FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());
DROP POLICY IF EXISTS "fines_own_read" ON fines;
CREATE POLICY "fines_own_read" ON fines FOR SELECT
  USING (resident_id = auth.uid());

-- ── invoices ──
DROP POLICY IF EXISTS "invoices_admin" ON invoices;
CREATE POLICY "invoices_admin" ON invoices FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());
DROP POLICY IF EXISTS "invoices_own_read" ON invoices;
CREATE POLICY "invoices_own_read" ON invoices FOR SELECT
  USING (resident_id = auth.uid());

-- ── access_log ──
DROP POLICY IF EXISTS "access_log_admin" ON access_log;
CREATE POLICY "access_log_admin" ON access_log FOR ALL
  USING (is_community_admin() OR is_security_guard());
DROP POLICY IF EXISTS "access_log_guard_insert" ON access_log;
CREATE POLICY "access_log_guard_insert" ON access_log FOR INSERT
  WITH CHECK (is_community_admin() OR is_security_guard());

-- ── visitors ──
DROP POLICY IF EXISTS "visitors_admin_guard" ON visitors;
CREATE POLICY "visitors_admin_guard" ON visitors FOR ALL
  USING (is_community_admin() OR is_security_guard());

-- ── visitor_qr_codes ──
DROP POLICY IF EXISTS "qr_admin" ON visitor_qr_codes;
CREATE POLICY "qr_admin" ON visitor_qr_codes FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());
DROP POLICY IF EXISTS "qr_own_resident" ON visitor_qr_codes;
CREATE POLICY "qr_own_resident" ON visitor_qr_codes FOR SELECT
  USING (resident_id = auth.uid());
DROP POLICY IF EXISTS "qr_resident_create" ON visitor_qr_codes;
CREATE POLICY "qr_resident_create" ON visitor_qr_codes FOR INSERT
  WITH CHECK (resident_id = auth.uid());
DROP POLICY IF EXISTS "qr_guard_read" ON visitor_qr_codes;
CREATE POLICY "qr_guard_read" ON visitor_qr_codes FOR SELECT
  USING (is_security_guard());

-- ── common_areas ──
DROP POLICY IF EXISTS "common_areas_public_read" ON common_areas;
CREATE POLICY "common_areas_public_read" ON common_areas FOR SELECT USING (true);
DROP POLICY IF EXISTS "common_areas_admin_write" ON common_areas;
CREATE POLICY "common_areas_admin_write" ON common_areas FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());

-- ── area_reservations ──
DROP POLICY IF EXISTS "reservations_admin" ON area_reservations;
CREATE POLICY "reservations_admin" ON area_reservations FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());
DROP POLICY IF EXISTS "reservations_own_resident" ON area_reservations;
CREATE POLICY "reservations_own_resident" ON area_reservations FOR SELECT
  USING (resident_id = auth.uid());
DROP POLICY IF EXISTS "reservations_resident_create" ON area_reservations;
CREATE POLICY "reservations_resident_create" ON area_reservations FOR INSERT
  WITH CHECK (resident_id = auth.uid());

-- ── surveys ──
DROP POLICY IF EXISTS "surveys_public_read" ON surveys;
CREATE POLICY "surveys_public_read" ON surveys FOR SELECT
  USING (status IN ('active', 'closed') OR is_community_admin());
DROP POLICY IF EXISTS "surveys_admin_write" ON surveys;
CREATE POLICY "surveys_admin_write" ON surveys FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());

-- ── survey_options ──
DROP POLICY IF EXISTS "survey_options_read" ON survey_options;
CREATE POLICY "survey_options_read" ON survey_options FOR SELECT USING (true);
DROP POLICY IF EXISTS "survey_options_admin" ON survey_options;
CREATE POLICY "survey_options_admin" ON survey_options FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());

-- ── survey_votes ──
DROP POLICY IF EXISTS "votes_admin" ON survey_votes;
CREATE POLICY "votes_admin" ON survey_votes FOR SELECT USING (is_community_admin());
DROP POLICY IF EXISTS "votes_own" ON survey_votes;
CREATE POLICY "votes_own" ON survey_votes FOR SELECT USING (voter_id = auth.uid());
DROP POLICY IF EXISTS "votes_insert" ON survey_votes;
CREATE POLICY "votes_insert" ON survey_votes FOR INSERT
  WITH CHECK (voter_id = auth.uid());

-- ── community_announcements ──
DROP POLICY IF EXISTS "announcements_admin" ON community_announcements;
CREATE POLICY "announcements_admin" ON community_announcements FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());
DROP POLICY IF EXISTS "announcements_resident_read" ON community_announcements;
CREATE POLICY "announcements_resident_read" ON community_announcements FOR SELECT
  USING (auth.uid() IS NOT NULL AND expires_at IS NULL OR expires_at > now());

-- ── bank_accounts y conciliación: solo admins ──
DROP POLICY IF EXISTS "bank_accounts_admin" ON bank_accounts;
CREATE POLICY "bank_accounts_admin" ON bank_accounts FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());
DROP POLICY IF EXISTS "bank_reconciliations_admin" ON bank_reconciliations;
CREATE POLICY "bank_reconciliations_admin" ON bank_reconciliations FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());
DROP POLICY IF EXISTS "financial_categories_read" ON financial_categories;
CREATE POLICY "financial_categories_read" ON financial_categories FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "financial_categories_admin" ON financial_categories;
CREATE POLICY "financial_categories_admin" ON financial_categories FOR ALL
  USING (is_community_admin()) WITH CHECK (is_community_admin());

-- ─── 20. TRIGGERS DE ACTUALIZACIÓN ──────────────────────────────────────────
-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'community_units', 'bank_accounts', 'financial_movements', 'fines',
    'bank_reconciliations', 'invoices', 'visitors', 'common_areas',
    'area_reservations', 'surveys'
  ]
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_updated_at ON %I;
      CREATE TRIGGER trg_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END $$;

-- Trigger para actualizar vote_count en survey_options
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE survey_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_vote_count ON survey_votes;
CREATE TRIGGER trg_vote_count
  AFTER INSERT ON survey_votes
  FOR EACH ROW EXECUTE FUNCTION increment_vote_count();

-- ─── FIN DE MIGRACIÓN ────────────────────────────────────────────────────────
-- Verificar tablas creadas:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'community%' OR tablename IN ('financial_movements','fines','bank_accounts','bank_reconciliations','invoices','visitors','access_log','visitor_qr_codes','common_areas','area_reservations','surveys','survey_options','survey_votes');
