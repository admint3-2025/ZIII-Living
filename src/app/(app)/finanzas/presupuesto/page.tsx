import Link from 'next/link'
import { formatCurrency, getFinanceOverview, getFinanceSession } from '../lib'

export const dynamic = 'force-dynamic'

export default async function FinanzasPresupuestoPage() {
  const { propertyId } = await getFinanceSession(true)
  const overview = await getFinanceOverview(propertyId)
  const annualProjection = overview.totalMonthlyFees * 12
  const netMonth = overview.monthIncome - overview.monthExpenses
  const averageFee = overview.activeUnits > 0 ? overview.totalMonthlyFees / overview.activeUnits : 0

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6 text-slate-900">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/finanzas" className="font-medium transition-colors hover:text-emerald-700">Finanzas</Link><span>/</span><span className="font-semibold text-emerald-700">Presupuesto</span></div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Presupuesto anual</h1>
      </div>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Proyección anual</p><p className="mt-2 text-3xl font-semibold text-slate-950">{formatCurrency(annualProjection)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Neto mensual</p><p className="mt-2 text-3xl font-semibold text-slate-950">{formatCurrency(netMonth)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cuota promedio</p><p className="mt-2 text-3xl font-semibold text-slate-950">{formatCurrency(averageFee)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fondo de reserva</p><p className="mt-2 text-3xl font-semibold text-slate-950">{formatCurrency(overview.reserveBalance)}</p></article>
      </section>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm leading-7 text-slate-600">Este tablero usa la suma de cuotas mensuales activas como base presupuestal. El siguiente paso natural es incorporar una tabla de presupuesto por rubro y periodo para contrastar plan vs real.</p>
      </div>
    </div>
  )
}