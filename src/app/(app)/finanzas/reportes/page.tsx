import Link from 'next/link'
import { formatCurrency, getFinanceOverview, getFinanceSession } from '../lib'

export const dynamic = 'force-dynamic'

export default async function FinanzasReportesPage() {
  const { propertyId } = await getFinanceSession()
  const overview = await getFinanceOverview(propertyId)

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/finanzas" className="font-medium transition-colors hover:text-emerald-700">Finanzas</Link>
          <span>/</span>
          <span className="font-semibold text-emerald-700">Reportes</span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Reportes financieros</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Lectura ejecutiva del comportamiento financiero reciente de la propiedad.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ingreso mensual</p><p className="mt-2 text-3xl font-semibold text-emerald-700">{formatCurrency(overview.monthIncome)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Egreso mensual</p><p className="mt-2 text-3xl font-semibold text-rose-700">{formatCurrency(overview.monthExpenses)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cuotas activas</p><p className="mt-2 text-3xl font-semibold text-slate-950">{formatCurrency(overview.totalMonthlyFees)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cuentas activas</p><p className="mt-2 text-3xl font-semibold text-slate-950">{overview.activeAccounts}</p></article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Tendencia 6 meses</p>
          <div className="mt-5 space-y-4">
            {overview.monthlyTrend.map((item: any) => {
              const maxValue = Math.max(item.income, item.expense, 1)
              return (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="text-slate-500">{formatCurrency(item.income - item.expense)} neto</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500"><span>Ingresos</span><span>{formatCurrency(item.income)}</span></div>
                      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(6, (item.income / maxValue) * 100)}%` }} /></div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500"><span>Egresos</span><span>{formatCurrency(item.expense)}</span></div>
                      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-rose-500" style={{ width: `${Math.max(6, (item.expense / maxValue) * 100)}%` }} /></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Categorías dominantes</p>
          <div className="mt-5 space-y-3">
            {overview.categoryBreakdown.length > 0 ? overview.categoryBreakdown.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-800">{item.name}</span>
                <span className="font-semibold text-slate-950">{formatCurrency(item.total)}</span>
              </div>
            )) : <p className="text-sm text-slate-500">Aún no hay movimientos suficientes para elaborar distribución.</p>}
          </div>
        </div>
      </section>
    </div>
  )
}
