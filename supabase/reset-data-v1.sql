-- ============================================================
-- ZIII Living — Limpieza Total de Datos (Reset)
-- Versión: 1.0  |  Fecha: 2026-03-23
-- ============================================================
-- ⚠️  ADVERTENCIA: Este script es IRREVERSIBLE.
--     Elimina TODOS los datos de aplicación (usuarios, tickets,
--     activos, inspecciones, sedes, registros comunitarios, etc.)
--     El esquema (tablas, funciones, políticas RLS, índices)
--     se conserva intacto.
--
-- INSTRUCCIONES:
--   1. Ejecutar en Supabase > SQL Editor
--   2. Después de ejecutar, ir a Supabase > Authentication > Users
--      y eliminar manualmente los usuarios de autenticación.
--   3. (Opcional) re-invitar al primer admin desde tu aplicación.
-- ============================================================


-- ─── PASO 1: MÓDULO COMUNITARIO ──────────────────────────────────────────────
-- Orden: hijos primero, padres después

TRUNCATE TABLE
  survey_votes,
  survey_options,
  surveys,
  area_reservations,
  visitor_qr_codes,
  access_log,
  visitors,
  community_announcements,
  fines,
  financial_movements,
  bank_reconciliations,
  invoices,
  bank_accounts,
  common_areas,
  community_units
RESTART IDENTITY CASCADE;


-- ─── PASO 2: TICKETS IT ──────────────────────────────────────────────────────

TRUNCATE TABLE
  ticket_attachments_it,
  ticket_comments_it,
  tickets_it
RESTART IDENTITY CASCADE;


-- ─── PASO 3: TICKETS MANTENIMIENTO ──────────────────────────────────────────

TRUNCATE TABLE
  ticket_attachments_maintenance,
  ticket_comments_maintenance,
  maintenance_ticket_comments,
  tickets_maintenance
RESTART IDENTITY CASCADE;


-- ─── PASO 4: TICKETS LEGACY (sistema original) ───────────────────────────────

TRUNCATE TABLE
  ticket_attachments,
  ticket_comments,
  ticket_status_history,
  tickets
RESTART IDENTITY CASCADE;


-- ─── PASO 5: ACTIVOS IT ──────────────────────────────────────────────────────

TRUNCATE TABLE
  assets_it
RESTART IDENTITY CASCADE;


-- ─── PASO 6: ACTIVOS MANTENIMIENTO ───────────────────────────────────────────

TRUNCATE TABLE
  assets_maintenance
RESTART IDENTITY CASCADE;


-- ─── PASO 7: ACTIVOS LEGACY ──────────────────────────────────────────────────

TRUNCATE TABLE
  asset_disposal_requests,
  asset_location_changes,
  asset_assignment_changes,
  asset_changes,
  assets
RESTART IDENTITY CASCADE;


-- ─── PASO 8: INSPECCIONES RRHH ───────────────────────────────────────────────

TRUNCATE TABLE
  inspections_rrhh_item_evidences,
  inspections_rrhh_items,
  inspections_rrhh_areas,
  inspections_rrhh_deletion_log,
  inspections_rrhh
RESTART IDENTITY CASCADE;


-- ─── PASO 9: INSPECCIONES GSH ────────────────────────────────────────────────

TRUNCATE TABLE
  inspections_gsh_item_evidences,
  inspections_gsh_items,
  inspections_gsh_areas,
  inspections_gsh_deletion_log,
  inspections_gsh
RESTART IDENTITY CASCADE;


-- ─── PASO 10: BASE DE CONOCIMIENTO ───────────────────────────────────────────

TRUNCATE TABLE
  knowledge_base_usage,
  knowledge_base_suggestions,
  knowledge_base_articles
RESTART IDENTITY CASCADE;


-- ─── PASO 11: ACADEMIA / LMS ─────────────────────────────────────────────────

TRUNCATE TABLE
  academy_certificates,
  academy_bookmarks,
  academy_quiz_attempts,
  academy_progress,
  academy_enrollments,
  academy_quiz_questions,
  academy_quizzes,
  academy_content,
  academy_modules,
  academy_courses,
  academy_areas
RESTART IDENTITY CASCADE;


-- ─── PASO 12: POLÍTICAS ───────────────────────────────────────────────────────

TRUNCATE TABLE
  policy_acknowledgments,
  policies,
  policy_categories
RESTART IDENTITY CASCADE;


-- ─── PASO 13: NOTIFICACIONES E INTEGRACIONES ─────────────────────────────────

TRUNCATE TABLE
  notifications,
  user_telegram_chat_ids
RESTART IDENTITY CASCADE;


-- ─── PASO 14: AUDITORÍAS Y LOGS DE SEGURIDAD ─────────────────────────────────

TRUNCATE TABLE
  audit_log,
  login_audits,
  user_category_audit
RESTART IDENTITY CASCADE;


-- ─── PASO 15: USUARIOS Y SEDES ───────────────────────────────────────────────
-- profiles se eliminan en cascada cuando se borran auth.users desde el Dashboard.
-- Aquí limpiamos la tabla de perfiles y la relación muchos-a-muchos de sedes.

TRUNCATE TABLE
  user_locations,
  profiles
RESTART IDENTITY CASCADE;

-- Nota: para eliminar los usuarios de autenticación (auth.users),
-- ve a Supabase Dashboard > Authentication > Users y elimínalos manualmente.
-- O ejecuta la siguiente línea si tienes acceso de superusuario:
-- DELETE FROM auth.users;


-- ─── PASO 16: SEDES (LOCATIONS) ──────────────────────────────────────────────

TRUNCATE TABLE
  locations
RESTART IDENTITY CASCADE;


-- ─── PASO 17: CATÁLOGOS OPERATIVOS ───────────────────────────────────────────
-- Limpiamos categorías de tickets y catálogos de activos para empezar
-- desde cero con la nomenclatura de ZIII Living.

TRUNCATE TABLE
  categories,
  departments,
  job_positions,
  brands,
  asset_types,
  asset_processors,
  asset_operating_systems,
  asset_custom_types,
  asset_type_categories
RESTART IDENTITY CASCADE;


-- ─── PASO 18: REINSTALAR CATEGORÍAS FINANCIERAS DEL SISTEMA ─────────────────
-- Las categorías financieras del sistema (is_system = true) son insertadas
-- por la migración. Las re-insertamos aquí para que el módulo de finanzas
-- funcione correctamente desde el primer día.

TRUNCATE TABLE financial_categories RESTART IDENTITY CASCADE;

INSERT INTO financial_categories (name, type, icon, is_system) VALUES
  ('Cuota de Mantenimiento',    'income',  '🏠', true),
  ('Cuota Extraordinaria',      'income',  '💰', true),
  ('Multa',                     'income',  '⚠️', true),
  ('Intereses Moratorios',      'income',  '📈', true),
  ('Pago de Fondo de Reserva',  'income',  '🏦', true),
  ('Servicios (Agua, Luz, Gas)','expense', '💡', true),
  ('Limpieza y Mantenimiento',  'expense', '🧹', true),
  ('Seguridad',                 'expense', '🔒', true),
  ('Reparaciones',              'expense', '🔧', true),
  ('Administración',            'expense', '📋', true),
  ('Fondo de Reserva',          'expense', '🏦', true),
  ('Honorarios Profesionales',  'expense', '👔', true),
  ('Seguros',                   'expense', '🛡️', true),
  ('Varios',                    'expense', '📦', true)
ON CONFLICT DO NOTHING;


-- ─── VERIFICACIÓN FINAL ───────────────────────────────────────────────────────
-- Ejecuta estas consultas para confirmar que la limpieza fue exitosa:

/*
SELECT
  'profiles'              AS tabla, COUNT(*) FROM profiles
UNION ALL SELECT 'locations',             COUNT(*) FROM locations
UNION ALL SELECT 'tickets_it',            COUNT(*) FROM tickets_it
UNION ALL SELECT 'tickets_maintenance',   COUNT(*) FROM tickets_maintenance
UNION ALL SELECT 'assets_it',             COUNT(*) FROM assets_it
UNION ALL SELECT 'assets_maintenance',    COUNT(*) FROM assets_maintenance
UNION ALL SELECT 'community_units',       COUNT(*) FROM community_units
UNION ALL SELECT 'financial_movements',   COUNT(*) FROM financial_movements
UNION ALL SELECT 'financial_categories',  COUNT(*) FROM financial_categories
UNION ALL SELECT 'access_log',            COUNT(*) FROM access_log
UNION ALL SELECT 'area_reservations',     COUNT(*) FROM area_reservations
UNION ALL SELECT 'surveys',               COUNT(*) FROM surveys;
*/

-- ─── FIN DEL SCRIPT ──────────────────────────────────────────────────────────
-- Resultado esperado: todas las tablas en 0 filas, excepto
-- financial_categories que debe tener 14 filas (categorías del sistema).
