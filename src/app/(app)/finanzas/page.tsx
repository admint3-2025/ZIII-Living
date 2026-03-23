import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSafeServerUser } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canManageFinances, canViewFinances } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function FinanzasPage() {
  const user = await getSafeServerUser()
  if (!user) redirect('/login')

  const supabase = createSupabaseAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !canViewFinances(profile as any)) redirect('/hub')

  const isManager = canManageFinances(profile as any)

  // KPIs financieros (se calcularán cuando existan las tablas de finanzas)
  const kpis = [
    {
      label: 'Ingresos del Mes',
      value: '$0.00',
      sub: 'Cuotas y pagos recibidos',
      color: 'from-emerald-500 to-teal-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Egresos del Mes',
      value: '$0.00',
      sub: 'Gastos operativos y servicios',
      color: 'from-red-500 to-rose-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      label: 'Multas Pendientes',
      value: '$0.00',
      sub: 'Infracciones sin pagar',
      color: 'from-amber-500 to-orange-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: 'Saldo en Fondo',
      value: '$0.00',
      sub: 'Fondo de reserva disponible',
      color: 'from-blue-500 to-indigo-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ]

  const subModules = [
    {
      href: '/finanzas/movimientos',
      title: 'Movimientos',
      desc: 'Registro de ingresos y egresos del condominio',
      icon: '📋',
      color: 'border-emerald-500/40 hover:border-emerald-400',
    },
    {
      href: '/finanzas/multas',
      title: 'Multas e Intereses',
      desc: 'Aplicación y seguimiento de multas a residentes',
      icon: '⚠️',
      color: 'border-amber-500/40 hover:border-amber-400',
      adminOnly: true,
    },
    {
      href: '/finanzas/facturacion',
      title: 'Facturación',
      desc: 'Generación y gestión de facturas y recibos',
      icon: '🧾',
      color: 'border-blue-500/40 hover:border-blue-400',
      adminOnly: true,
    },
    {
      href: '/finanzas/conciliacion',
      title: 'Conciliación Bancaria',
      desc: 'Reconciliación de movimientos con estados de cuenta',
      icon: '🏦',
      color: 'border-violet-500/40 hover:border-violet-400',
      adminOnly: true,
    },
    {
      href: '/finanzas/reportes',
      title: 'Reportes Financieros',
      desc: 'Estados financieros, balances y presupuestos',
      icon: '📊',
      color: 'border-cyan-500/40 hover:border-cyan-400',
    },
    {
      href: '/finanzas/presupuesto',
      title: 'Presupuesto Anual',
      desc: 'Planificación y seguimiento presupuestal',
      icon: '📅',
      color: 'border-pink-500/40 hover:border-pink-400',
      adminOnly: true,
    },
  ]

  const visibleModules = subModules.filter(m => !m.adminOnly || isManager)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link href="/hub" className="hover:text-white transition-colors">Hub</Link>
            <span>/</span>
            <span className="text-white">Finanzas</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Control Financiero</h1>
          <p className="text-slate-400 mt-1">Gestión de ingresos, egresos, multas y conciliación bancaria del condominio</p>
        </div>
        {isManager && (
          <Link
            href="/finanzas/movimientos/nuevo"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Movimiento
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
              <p className="text-sm font-medium text-slate-300">{kpi.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-módulos */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Módulos Financieros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleModules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`group bg-slate-800/40 border ${mod.color} rounded-xl p-6 transition-all duration-200 hover:bg-slate-800/70 hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{mod.icon}</span>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">{mod.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{mod.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Coming soon banner */}
      <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-6 text-center">
        <p className="text-emerald-400 font-medium">🚀 Módulo en construcción</p>
        <p className="text-slate-400 text-sm mt-1">
          Los movimientos financieros estarán disponibles una vez aplicada la migración de base de datos.
          Consulta el archivo <code className="bg-slate-800 px-1 rounded text-xs">supabase/migrations/</code> para aplicar el esquema.
        </p>
      </div>
    </div>
  )
}
