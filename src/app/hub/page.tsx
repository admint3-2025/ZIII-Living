import Image from 'next/image'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { ReactNode } from 'react'
import SignOutButton from '@/components/SignOutButton'
import NotificationBell from '@/components/NotificationBell'
import { getSafeServerUser } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getAvatarInitial } from '@/lib/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import Footer from '@/components/Footer'
import { es } from 'date-fns/locale'
import { isMaintenanceAssetCategory, isITAssetCategoryOrUnassigned } from '@/lib/permissions/asset-category'

// Tipos de actividad y sus configuraciones
const activityConfig: Record<string, { label: string; icon: string; color: string }> = {
  CREATE: { label: 'Nuevo', icon: '＋', color: 'text-emerald-400' },
  UPDATE: { label: 'Actualizado', icon: '✎', color: 'text-blue-400' },
  DELETE: { label: 'Eliminado', icon: '✕', color: 'text-red-400' },
  EXPORT: { label: 'Exportado', icon: '↓', color: 'text-violet-400' },
  ASSIGN: { label: 'Asignado', icon: '→', color: 'text-amber-400' },
  COMMENT: { label: 'Comentario en', icon: '💬', color: 'text-cyan-400' },
  CLOSE: { label: 'Cerrado', icon: '✓', color: 'text-green-400' },
  REOPEN: { label: 'Reabierto', icon: '↻', color: 'text-orange-400' },
  LOGIN: { label: 'Sesión iniciada', icon: '●', color: 'text-slate-400' },
}

const entityTypeLabels: Record<string, string> = {
  ticket: 'Ticket',
  tickets: 'Ticket',
  ticket_it: 'Ticket IT',
  ticket_maintenance: 'Ticket Mantenimiento',
  tickets_maintenance: 'Ticket Mantenimiento',
  user: 'Usuario',
  users: 'Usuario',
  asset: 'Activo',
  assets: 'Activo IT',
  assets_it: 'Activo IT',
  assets_maintenance: 'Activo Mantenimiento',
  asset_disposal_request: 'Solicitud de Baja',
  report: 'Reporte',
  location: 'Ubicación',
  locations: 'Ubicación',
  department: 'Departamento',
  departments: 'Departamento',
  profile: 'Perfil',
  profiles: 'Usuario',
  beo: 'Evento BEO',
  knowledge_base: 'Base de Conocimientos',
  inspection: 'Inspección',
  inspections: 'Inspección',
}

// Definición de módulos del sistema
type Module = {
  id: string
  name: string
  description: string
  icon: ReactNode
  href?: string
  getHref?: (profile: any) => string
  bgGradient: string
  iconBg: string
  textColor: string
  requiredRoles?: string[]
  checkPermission?: (profile: any) => boolean
}

const modules: Module[] = [
  // ── Tickets de servicio (base fuerte del sistema) ──────────────────────────
  {
    id: 'it-helpdesk',
    name: 'IT · HELPDESK',
    description: 'Soporte Técnico y Desarrollo: tickets, activos y mesa de ayuda',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    getHref: (profile: any) => {
      const isAdminOrSupervisor = profile?.role === 'admin' || profile?.role === 'supervisor'
      const isAgent = profile?.role === 'agent_l1' || profile?.role === 'agent_l2'
      const canManageIT = isITAssetCategoryOrUnassigned(profile?.asset_category)
      if (isAdminOrSupervisor && (profile?.role === 'admin' || canManageIT)) return '/dashboard'
      if (isAgent && canManageIT) return '/dashboard'
      return '/tickets?view=mine'
    },
    bgGradient: 'from-blue-500 via-indigo-500 to-purple-600',
    iconBg: 'bg-blue-100',
    textColor: 'text-blue-900',
    requiredRoles: ['admin', 'supervisor', 'agent_l1', 'agent_l2', 'requester', 'corporate_admin'],
  },
  {
    id: 'mantenimiento',
    name: 'MANTENIMIENTO',
    description: 'Órdenes de Trabajo: instalaciones, equipos e infraestructura',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    getHref: (profile: any) => {
      const isAdminOrSupervisor = profile?.role === 'admin' || profile?.role === 'supervisor'
      const canManageMaintenance = isMaintenanceAssetCategory(profile?.asset_category)
      if (isAdminOrSupervisor && (profile?.role === 'admin' || canManageMaintenance)) return '/mantenimiento/dashboard'
      return '/mantenimiento/tickets?view=mine'
    },
    bgGradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    iconBg: 'bg-emerald-100',
    textColor: 'text-emerald-900',
    requiredRoles: ['admin', 'supervisor', 'agent_l1', 'agent_l2', 'requester', 'corporate_admin'],
  },
  // ── Modules comunitarias ───────────────────────────────────────────────────
  {
    id: 'finanzas',
    name: 'FINANZAS',
    description: 'Control financiero: ingresos, egresos, multas, intereses y conciliación bancaria',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    href: '/finanzas',
    bgGradient: 'from-green-500 via-emerald-500 to-teal-600',
    iconBg: 'bg-green-100',
    textColor: 'text-green-900',
    requiredRoles: ['admin', 'corporate_admin', 'auditor', 'resident'],
  },
  {
    id: 'mi-portal',
    name: 'MI PORTAL',
    description: 'Transparencia financiera: consulta tus estados de cuenta y movimientos en tiempo real',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    href: '/mi-portal',
    bgGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconBg: 'bg-sky-100',
    textColor: 'text-sky-900',
    requiredRoles: ['resident'],
  },
  {
    id: 'residentes',
    name: 'RESIDENTES',
    description: 'Gestión de propietarios, inquilinos, unidades y directorio del condominio',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    href: '/residentes',
    bgGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    iconBg: 'bg-violet-100',
    textColor: 'text-violet-900',
    requiredRoles: ['admin', 'corporate_admin'],
  },
  {
    id: 'control-acceso',
    name: 'CONTROL DE ACCESO',
    description: 'Registro de visitantes, lectura de QR y bitácora de entradas y salidas',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    href: '/control-acceso',
    bgGradient: 'from-red-500 via-rose-500 to-pink-600',
    iconBg: 'bg-red-100',
    textColor: 'text-red-900',
    requiredRoles: ['admin', 'corporate_admin', 'security_guard', 'auditor'],
  },
  {
    id: 'reservas',
    name: 'RESERVAS',
    description: 'Reserva de áreas comunes: salón, gimnasio, alberca, asadores y más',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    href: '/reservas',
    bgGradient: 'from-amber-500 via-orange-500 to-red-500',
    iconBg: 'bg-amber-100',
    textColor: 'text-amber-900',
    requiredRoles: ['admin', 'corporate_admin', 'resident'],
  },
  {
    id: 'votaciones',
    name: 'VOTACIONES',
    description: 'Encuestas y votaciones comunitarias: toma de decisiones transparente',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    href: '/votaciones',
    bgGradient: 'from-cyan-500 via-sky-500 to-blue-600',
    iconBg: 'bg-cyan-100',
    textColor: 'text-cyan-900',
    requiredRoles: ['admin', 'corporate_admin', 'resident'],
  },
  // ── Gestión y administración ───────────────────────────────────────────────
  {
    id: 'corporativo',
    name: 'CORPORATIVO',
    description: 'Inspecciones, políticas, procedimientos y normativas',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    href: '/corporativo/dashboard',
    bgGradient: 'from-slate-500 via-gray-500 to-zinc-600',
    iconBg: 'bg-slate-100',
    textColor: 'text-slate-900',
    requiredRoles: ['admin', 'corporate_admin'],
  },
  {
    id: 'politicas',
    name: 'REGLAMENTO',
    description: 'Reglamento interno, normativas y procedimientos de la comunidad',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    href: '/politicas',
    bgGradient: 'from-indigo-500 via-violet-500 to-purple-600',
    iconBg: 'bg-indigo-100',
    textColor: 'text-indigo-900',
    requiredRoles: ['admin', 'corporate_admin', 'supervisor', 'agent_l1', 'agent_l2', 'requester', 'resident'],
  },
  {
    id: 'administracion',
    name: 'ADMINISTRACIÓN',
    description: 'Configuración del sistema: usuarios, propiedades, permisos y auditoría',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    href: '/admin',
    bgGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    iconBg: 'bg-violet-100',
    textColor: 'text-violet-900',
    requiredRoles: ['admin'],
  },
]

export const dynamic = 'force-dynamic'

export default async function HubPage() {
  const user = await getSafeServerUser()
  
  if (!user) {
    redirect('/login')
  }

  // Use admin client here to avoid any user-session refresh-token rotation on the server.
  // We still scope all queries to the authenticated user's id.
  const supabase = createSupabaseAdminClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Obtener actividades recientes del usuario
  const { data: recentActivities } = await supabase
    .from('audit_log')
    .select('id, action, entity_type, entity_id, metadata, created_at')
    .eq('actor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Determinar módulos accesibles según el rol del usuario
  const accessibleByRole = modules.filter(module => {
    if (!module.requiredRoles) return true
    if (module.checkPermission) return module.checkPermission(profile)
    return module.requiredRoles.includes(profile.role)
  })

  // Aplicar preferencias de módulos visibles del usuario (disponible para TODOS los usuarios)
  const hubVisibleModules = (profile as any)?.hub_visible_modules as Record<string, boolean> | null
  const accessibleModules = hubVisibleModules && typeof hubVisibleModules === 'object'
    ? accessibleByRole.filter((m) => hubVisibleModules[m.id] !== false)
    : accessibleByRole

  // NO redirigir automáticamente si es el único módulo
  // Los usuarios deben ver el hub para navegar entre sus módulos disponibles
  // (comentado porque causaba loops infinitos con corporate_admin)
  // if (accessibleModules.length === 1) {
  //   redirect(accessibleModules[0].href)
  // }

  // Si no tiene acceso a ningún módulo (caso raro), mostrar mensaje
  if (accessibleModules.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <div className="card-body p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Sin Acceso a Módulos</h1>
            <p className="text-sm text-gray-600 mb-6">
              Tu cuenta no tiene permisos asignados. Contacta al administrador del sistema.
            </p>
            <Link href="/login" className="btn btn-primary">
              Cerrar Sesión
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Datos de header
  const hdrs = await headers()
  const forwardedFor = hdrs.get('x-forwarded-for') || hdrs.get('x-real-ip') || ''
  const clientIpRaw = forwardedFor.split(',')[0]?.trim() || ''
  const clientIp = clientIpRaw.replace(/^::ffff:/i, '') || '—'

  const roleLabel =
    profile?.role === 'admin'
      ? 'ADMINISTRADOR'
      : profile?.role === 'corporate_admin'
        ? 'GESTOR COMUNITARIO'
      : profile?.role === 'resident'
        ? 'RESIDENTE'
        : profile?.role === 'security_guard'
          ? 'GUARDIA DE SEGURIDAD'
          : profile?.role === 'agent_l1'
            ? 'AGENTE L1'
            : profile?.role === 'agent_l2'
              ? 'AGENTE L2'
              : profile?.role === 'supervisor'
                ? (isMaintenanceAssetCategory(profile?.asset_category) ? 'SUPERVISOR MANTENIMIENTO' : 'SUPERVISOR IT')
                : profile?.role === 'requester'
                  ? 'USUARIO'
                  : profile?.role === 'auditor'
                    ? 'AUDITOR'
                    : 'USUARIO'

  const userDisplayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const sessionContext = [profile?.position || null, clientIp !== '—' ? `Nodo ${clientIp}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_22%),linear-gradient(180deg,#0f172a_0%,#111827_38%,#0f172a_100%)]">
      {/* Header fijo */}
      <div className="sticky top-0 z-40 border-b border-slate-800/70 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 min-w-0">
              <div className="flex items-center gap-3 flex-shrink-0">
                <Image
                  src="/ziii-logo.png"
                  alt="ZIII Living"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain rounded-xl bg-white shadow-lg shadow-slate-900/40"
                />
                <div className="leading-tight">
                  <p className="text-base font-bold text-white tracking-tight">ZIII Living</p>
                  <p className="text-[11px] text-slate-400 font-medium">Gestión Comunitaria</p>
                </div>
              </div>

              <div className="h-12 w-px bg-slate-800/70 hidden lg:block" />

              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30 ring-2 ring-violet-400/20">
                  {getAvatarInitial({
                    fullName: profile?.full_name,
                    description: profile?.position,
                    email: user?.email,
                  })}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <p className="text-lg font-semibold text-white truncate" title={profile?.full_name || user?.email || ''}>
                      {userDisplayName}
                    </p>
                    <span className="flex-shrink-0 inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-bold text-violet-200 uppercase tracking-wide">
                      {roleLabel}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="truncate" title={user?.email || ''}>{user?.email || '—'}</span>
                    <span className="text-slate-600">•</span>
                    <span className="uppercase truncate" title={profile?.position || ''}>{profile?.position || '—'}</span>
                    <span className="text-slate-600">•</span>
                    <span title={`IP: ${clientIp}`}>{clientIp}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/70 text-slate-200 hover:text-white hover:border-slate-600 transition-colors text-sm font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" />
                </svg>
                Perfil
              </Link>
              <NotificationBell />
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 lg:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(30,41,59,0.96)_45%,rgba(15,23,42,0.98)_100%)] p-6 shadow-[0_22px_60px_-36px_rgba(0,0,0,0.65)] lg:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_24%)]" />
          <div className="relative grid gap-6 xl:grid-cols-[1.2fr,0.8fr] xl:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200">
                Centro de operación
              </div>
              <div className="space-y-2">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Opera todo el ecosistema desde una sola capa clara, rápida y sin ruido repetido.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Tus módulos habilitados, accesos operativos y actividad reciente se concentran aquí con prioridad en la
                  navegación diaria, no en repetir los datos de sesión que ya viven en el encabezado.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/35 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Resumen operativo</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {accessibleModules.length} módulos habilitados
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    {recentActivities?.length || 0} movimientos recientes
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-violet-400" />
                    {sessionContext || 'Sesión activa lista para operar'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/65 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Cobertura del hub</p>
                <p className="mt-2 text-2xl font-semibold text-white">{accessibleModules.length}</p>
                <p className="mt-1 text-sm text-slate-400">Accesos directos disponibles según permisos y preferencias visibles.</p>
              </div>
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/65 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Actividad reciente</p>
                <p className="mt-2 text-2xl font-semibold text-white">{recentActivities?.length || 0}</p>
                <p className="mt-1 text-sm text-slate-400">Movimientos detectados en tu bitácora más reciente.</p>
              </div>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-200">Enfoque</p>
                <p className="mt-2 text-lg font-semibold text-white">{accessibleModules[0]?.name || 'Inicio'}</p>
                <p className="mt-1 text-sm text-violet-100/80">El primer acceso visible marca tu ruta principal de trabajo.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Módulos disponibles</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {accessibleModules.map((module) => {
            const moduleHref = module.getHref ? module.getHref(profile) : (module.href || '#')
            return (
            <Link
              key={module.id}
              href={moduleHref}
              className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-[linear-gradient(180deg,rgba(30,41,59,0.84)_0%,rgba(15,23,42,0.88)_100%)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-600 hover:shadow-[0_28px_60px_-36px_rgba(0,0,0,0.75)]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${module.bgGradient} opacity-[0.08] group-hover:opacity-[0.16] transition-opacity duration-300`}></div>
              <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

              <div className="relative z-10 p-7">
                <div className="flex items-start gap-5">
                  <div className={`${module.iconBg} p-4 rounded-2xl group-hover:scale-105 transition-transform duration-300 flex-shrink-0 shadow-inner`}>
                    <div className={module.textColor}>{module.icon}</div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                        {module.name}
                      </h2>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Acceso
                      </span>
                    </div>
                    <p className="max-w-[32rem] text-slate-400 text-sm leading-relaxed">{module.description}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-white/6 pt-4 text-sm font-semibold text-slate-300 transition-colors group-hover:text-white">
                      <span>Entrar al módulo</span>
                      <span className="translate-x-0 transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 top-0 h-1 opacity-80">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${module.bgGradient}`}></div>
              </div>
            </Link>
            )
          })}
        </div>

        <div className="mt-14 pb-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800"></div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Actividad reciente</span>
            <div className="h-px flex-1 bg-slate-800"></div>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-[linear-gradient(180deg,rgba(15,23,42,0.92)_0%,rgba(17,24,39,0.96)_100%)] p-5 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.65)]">
            <div className="space-y-1">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.map((activity, idx) => {
                  const config = activityConfig[activity.action] || { label: activity.action, icon: '•', color: 'text-slate-400' }
                  const entityLabel = entityTypeLabels[activity.entity_type] || activity.entity_type.replace(/_/g, ' ')
                  const metadata = activity.metadata as Record<string, any> | null
                  const detail = metadata?.email || metadata?.title || metadata?.name || metadata?.asset_tag || metadata?.code || null
                  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: es })
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-slate-800 hover:bg-white/[0.03] animate-in fade-in slide-in-from-left-2 duration-300"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-sm ${config.color} flex-shrink-0`}>
                        {config.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-200">
                          <span className="font-semibold text-white">{config.label}</span> {entityLabel}
                          {detail && <span className="text-slate-400"> — {detail}</span>}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-500 flex-shrink-0">{timeAgo}</span>
                    </div>
                  )
                })
              ) : (
                <p className="rounded-2xl px-4 py-6 text-center text-sm text-slate-500">Sin actividad reciente</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Footer sticky solo en el hub */}
      <div className="fixed bottom-0 left-0 w-full z-50">
        <Footer />
      </div>
    </main>
  )
}
