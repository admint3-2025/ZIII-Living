import Link from 'next/link'
import { formatCurrency, formatShortDate, getFinanceOverview, getFinanceSession } from './lib'

export const dynamic = 'force-dynamic'

export default async function FinanzasPage() {
  const { propertyId, isManager } = await getFinanceSession()
  const overview = await getFinanceOverview(propertyId)

  const kpis = [
    {
      label: 'Ingresos del Mes',
      value: formatCurrency(overview.monthIncome),
      sub: 'Cobros y movimientos de entrada registrados',
      color: 'from-emerald-500 to-teal-600',
      icon: '💵',
    },
    {
      label: 'Egresos del Mes',
      value: formatCurrency(overview.monthExpenses),
      sub: 'Servicios, operación y salidas financieras',
      color: 'from-red-500 to-rose-600',
      icon: '💳',
    },
    {
      label: 'Multas Pendientes',
      value: formatCurrency(overview.pendingFinesAmount),
      sub: 'Importe en sanciones aún no cubiertas',
      color: 'from-amber-500 to-orange-600',
      icon: '⚠️',
    },
    {
      label: 'Fondo de Reserva',
      value: formatCurrency(overview.reserveBalance),
      sub: 'Saldo detectado en cuentas marcadas como reserva',
      color: 'from-blue-500 to-indigo-600',
      icon: '🏦',
    },
  ]

  const subModules = [
    {
      href: '/finanzas/movimientos',
      title: 'Movimientos',
      desc: 'Registro de ingresos y egresos del condominio',
      icon: '📋',
    },
    {
      href: '/finanzas/multas',
      title: 'Multas e Intereses',
      desc: 'Aplicación y seguimiento de multas a residentes',
      icon: '⚠️',
      adminOnly: true,
    },
    {
      href: '/finanzas/facturacion',
      title: 'Facturación',
      desc: 'Generación y gestión de facturas y recibos',
      icon: '🧾',
      adminOnly: true,
    },
    {
      href: '/finanzas/conciliacion',
      title: 'Conciliación Bancaria',
      desc: 'Reconciliación de movimientos con estados de cuenta',
      icon: '🏦',
      adminOnly: true,
    },
    {
      href: '/finanzas/reportes',
      title: 'Reportes Financieros',
      desc: 'Estados financieros, balances y presupuestos',
      icon: '📊',
    },
    {
      href: '/finanzas/presupuesto',
      title: 'Presupuesto Anual',
      desc: 'Planificación y seguimiento presupuestal',
      icon: '📅',
      adminOnly: true,
    },
  ]

  const visibleModules = subModules.filter(m => !m.adminOnly || isManager)

  if (!propertyId) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Finanzas</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Primero asigna una propiedad al perfil</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            El módulo financiero necesita una propiedad activa para calcular cuotas, movimientos, multas, facturas y saldos bancarios.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/hub" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Volver al hub</Link>
            <Link href="/admin/locations" className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700">Revisar propiedades</Link>
          </div>
        </div>
      </div>
    )
  }

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
                Finanzas conectadas a movimientos, cuentas y cobranza real.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                El tablero ya consume movimientos, cuotas activas, multas pendientes y saldos bancarios para que administración tenga lectura operativa diaria.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[340px]">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Cobranza estimada</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{overview.collectionRate}%</p>
              <p className="mt-1 text-sm text-slate-500">Contra la cuota mensual activa registrada en unidades.</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-600 p-4 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">Salud operativa</p>
              <p className="mt-2 text-3xl font-semibold">{overview.healthLabel}</p>
              <p className="mt-1 text-sm text-emerald-100">{overview.healthDescription}</p>
            </div>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          {isManager && (
            <Link
              href="/finanzas/movimientos/nuevo"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              <span className="text-lg">＋</span>
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
                Cada bloque ya apunta a una vista funcional del módulo para registrar, analizar o revisar el estado financiero del condominio.
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

        <aside className="space-y-6">
          <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,#f6fffb_0%,#ffffff_100%)] p-6 shadow-[0_18px_42px_-30px_rgba(16,185,129,0.16)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Lectura rápida</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Últimos movimientos</h2>
            <div className="mt-5 space-y-3">
              {overview.recentMovements.length > 0 ? overview.recentMovements.slice(0, 4).map((movement: any) => (
                <div key={movement.id} className="rounded-2xl border border-emerald-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{movement.description}</p>
                      <p className="mt-1 text-sm text-slate-500">{movement.category_name} · {formatShortDate(movement.movement_date)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${movement.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {movement.type === 'income' ? '+' : '-'}{formatCurrency(movement.amount)}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-5 text-sm text-slate-500">Aún no hay movimientos registrados para esta propiedad.</div>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-[0_18px_42px_-30px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Próxima atención</p>
            <h2 className="mt-2 text-xl font-semibold">Facturas pendientes</h2>
            <div className="mt-4 space-y-3">
              {overview.overdueInvoices.length > 0 ? overview.overdueInvoices.map((invoice: any) => (
                <div key={invoice.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{invoice.invoice_number}</p>
                      <p className="mt-1 text-sm text-slate-400">Vence {formatShortDate(invoice.due_date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-300">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              )) : (
                <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">No hay facturas pendientes registradas.</p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}

