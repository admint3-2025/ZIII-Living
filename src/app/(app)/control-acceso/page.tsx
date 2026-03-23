import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSafeServerUser } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canManageAccessControl, canViewAccessLog } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function ControlAccesoPage() {
  const user = await getSafeServerUser()
  if (!user) redirect('/login')

  const supabase = createSupabaseAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !canViewAccessLog(profile as any)) redirect('/hub')

  const isGuard = profile.role === 'security_guard'
  const isManager = canManageAccessControl(profile as any)

  const subModules = [
    {
      href: '/control-acceso/scanner',
      title: 'Escanear QR',
      desc: 'Lectura rápida de códigos QR de residentes y visitantes',
      icon: '📷',
      color: 'border-red-500/40 hover:border-red-400',
      highlight: isGuard,
    },
    {
      href: '/control-acceso/visitantes',
      title: 'Registro de Visitantes',
      desc: 'Registrar, buscar y gestionar visitas en tiempo real',
      icon: '👤',
      color: 'border-orange-500/40 hover:border-orange-400',
    },
    {
      href: '/control-acceso/bitacora',
      title: 'Bitácora de Accesos',
      desc: 'Historial completo de entradas y salidas',
      icon: '📒',
      color: 'border-amber-500/40 hover:border-amber-400',
    },
    {
      href: '/control-acceso/invitaciones',
      title: 'Invitaciones / QR',
      desc: 'Generar pases QR de acceso para visitantes esperados',
      icon: '🎫',
      color: 'border-pink-500/40 hover:border-pink-400',
    },
    {
      href: '/control-acceso/proveedores',
      title: 'Proveedores',
      desc: 'Registro y control de acceso de proveedores y contratistas',
      icon: '🔧',
      color: 'border-cyan-500/40 hover:border-cyan-400',
    },
    {
      href: '/control-acceso/alertas',
      title: 'Alertas de Seguridad',
      desc: 'Incidentes, accesos no autorizados y reportes',
      icon: '🚨',
      color: 'border-red-600/40 hover:border-red-500',
      adminOnly: true,
    },
  ]

  const visibleModules = subModules.filter(m => !m.adminOnly || isManager)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link href="/hub" className="hover:text-white transition-colors">Hub</Link>
            <span>/</span>
            <span className="text-white">Control de Acceso</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Control de Acceso</h1>
          <p className="text-slate-400 mt-1">Gestión de visitantes, QR y bitácora de entradas y salidas</p>
        </div>
        <Link
          href="/control-acceso/scanner"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16M4.5 4.5l15 15" />
          </svg>
          Escanear QR
        </Link>
      </div>

      {/* Estado en tiempo real */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Visitantes Activos', value: '0', icon: '👤', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
          { label: 'Entradas Hoy', value: '0', icon: '🟢', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
          { label: 'Salidas Hoy', value: '0', icon: '🔴', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' },
          { label: 'Alertas Activas', value: '0', icon: '🚨', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
        ].map((stat, i) => (
          <div key={i} className={`border rounded-xl p-5 flex items-center gap-4 ${stat.bg}`}>
            <span className="text-3xl">{stat.icon}</span>
            <div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Acceso rápido para guardias */}
      {isGuard && (
        <div className="bg-red-950/40 border border-red-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">G</div>
            <div>
              <p className="font-semibold text-white">Panel de Guardia</p>
              <p className="text-sm text-slate-400">Acceso rápido a tus funciones principales</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/control-acceso/scanner" className="bg-red-600 hover:bg-red-500 text-white rounded-lg p-4 text-center font-medium transition-colors">
              📷 Escanear QR
            </Link>
            <Link href="/control-acceso/visitantes/nuevo" className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg p-4 text-center font-medium transition-colors">
              ➕ Registrar Visita
            </Link>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Funciones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleModules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`group bg-slate-800/40 border ${mod.color} rounded-xl p-6 transition-all duration-200 hover:bg-slate-800/70 hover:scale-[1.02] ${mod.highlight ? 'ring-2 ring-red-500/50' : ''}`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{mod.icon}</span>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-red-300 transition-colors">{mod.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{mod.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-6 text-center">
        <p className="text-red-400 font-medium">🚀 Módulo en construcción</p>
        <p className="text-slate-400 text-sm mt-1">
          El control de acceso con QR estará operativo tras aplicar la migración SQL de visitantes y accesos.
        </p>
      </div>
    </div>
  )
}
