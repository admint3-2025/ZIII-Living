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
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_34%),linear-gradient(135deg,#fcfffd_0%,#f2fbf6_42%,#ffffff_100%)] p-6 shadow-[0_18px_42px_-30px_rgba(16,185,129,0.25)] lg:p-7">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/hub" className="font-medium text-slate-500 transition-colors hover:text-emerald-700">Hub</Link>
              <span>/</span>
              <span className="font-semibold text-emerald-700">Finanzas</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Panorama financiero residencial
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Control financiero con lectura ejecutiva y enfoque operativo.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Supervisa ingresos, egresos, multas, conciliaciones y presupuesto desde una vista clara para administración,
                comité y residentes con acceso permitido.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[340px]">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Cobranza estimada</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">92%</p>
              <p className="mt-1 text-sm text-slate-500">Meta mensual de recuperación para cuotas ordinarias.</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-600 p-4 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">Salud operativa</p>
              <p className="mt-2 text-3xl font-semibold">Estable</p>
              <p className="mt-1 text-sm text-emerald-100">Sin alertas críticas y con fondo de reserva protegido.</p>
            </div>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          {isManager && (
            <Link
              href="/finanzas/movimientos/nuevo"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar movimiento
            </Link>
          )}
          <Link
            href="/finanzas/reportes"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            Ver reportes ejecutivos
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <article key={i} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] transition-transform duration-200 hover:-translate-y-1">
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${kpi.color} text-white shadow-lg shadow-emerald-500/10`}>
                {kpi.icon}
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tiempo real</span>
            </div>
            <div className="mt-6 space-y-1">
              <p className="text-3xl font-semibold tracking-tight text-slate-950">{kpi.value}</p>
              <p className="text-sm font-semibold text-slate-700">{kpi.label}</p>
              <p className="text-sm leading-6 text-slate-500">{kpi.sub}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr,0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.20)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Arquitectura del módulo</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Circuitos financieros del condominio</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Cada bloque responde a una operación distinta: cobranza, sanciones, facturación y conciliación. La idea es que el
                administrador pueda leer el estado sin entrar a pantallas secundarias.
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleModules.map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="group rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 transition-all duration-200 hover:border-emerald-200 hover:shadow-[0_14px_28px_-22px_rgba(16,185,129,0.28)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl">{mod.icon}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Módulo</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900 transition-colors group-hover:text-emerald-700">{mod.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{mod.desc}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-slate-600 group-hover:text-emerald-700">
                  <span>Entrar</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,#f6fffb_0%,#ffffff_100%)] p-6 shadow-[0_18px_42px_-30px_rgba(16,185,129,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Lectura rápida</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Indicadores que importan</h2>
          <div className="mt-6 space-y-4">
            {[
              ['Morosidad', 'Identifica rápidamente unidades con atrasos antes de comprometer flujo operativo.'],
              ['Conciliación', 'Cruza movimientos bancarios y elimina diferencias antes del cierre contable.'],
              ['Presupuesto', 'Aterriza el gasto contra el plan anual del condominio y su fondo de reserva.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-emerald-100 bg-white p-4">
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-sm font-semibold">Siguiente etapa</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Conecta esta vista a movimientos reales, saldos por unidad y estado de cuenta del fondo de reserva para convertirla
              en tablero de operación diaria.
            </p>
          </div>
        </aside>
      </section>
    </div>
  )
}
