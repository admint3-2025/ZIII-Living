import Link from 'next/link'
import { formatCurrency, formatShortDate, getFinanceCatalogs, getFinanceSession } from '../lib'

export const dynamic = 'force-dynamic'

export default async function FinanzasMovimientosPage() {
  const { supabase, propertyId, isManager } = await getFinanceSession()

  if (!propertyId) {
    return <div className="px-6 py-8 text-sm text-slate-500">Configura una propiedad para ver movimientos financieros.</div>
  }

  const [{ data: movements }, catalogs] = await Promise.all([
    supabase
      .from('financial_movements')
      .select('*')
      .eq('property_id', propertyId)
      .order('movement_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
    getFinanceCatalogs(propertyId),
  ])

  const categoryMap = new Map(catalogs.categories.map((item) => [item.id, item]))
  const unitMap = new Map(catalogs.units.map((item) => [item.id, item]))
  const accountMap = new Map(catalogs.bankAccounts.map((item) => [item.id, item]))
  const residentMap = new Map(catalogs.residents.map((item) => [item.id, item]))

  const rows = (movements || []).map((movement) => ({
    ...movement,
    categoryName: categoryMap.get(movement.category_id)?.name || 'Sin categoría',
    unitNumber: unitMap.get(movement.unit_id)?.unit_number || '—',
    accountAlias: accountMap.get(movement.bank_account_id)?.account_alias || 'Sin cuenta',
    residentName: residentMap.get(movement.resident_id)?.full_name || '—',
  }))

  const incomeTotal = rows.filter((row) => row.type === 'income' && row.status !== 'cancelled').reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const expenseTotal = rows.filter((row) => row.type === 'expense' && row.status !== 'cancelled').reduce((sum, row) => sum + Number(row.amount || 0), 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/finanzas" className="font-medium transition-colors hover:text-emerald-700">Finanzas</Link>
            <span>/</span>
            <span className="font-semibold text-emerald-700">Movimientos</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Movimientos financieros</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Consulta ingresos, egresos, referencias, cuentas y responsables desde una sola bandeja.</p>
        </div>
        {isManager && (
          <Link href="/finanzas/movimientos/nuevo" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
            <span className="text-lg">＋</span>
            Nuevo movimiento
          </Link>
        )}
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ingresos</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">{formatCurrency(incomeTotal)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Egresos</p>
          <p className="mt-2 text-3xl font-semibold text-rose-700">{formatCurrency(expenseTotal)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Registros</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{rows.length}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Concepto</th>
                <th className="px-5 py-4">Categoría</th>
                <th className="px-5 py-4">Unidad</th>
                <th className="px-5 py-4">Cuenta</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length > 0 ? rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="px-5 py-4 text-slate-500">{formatShortDate(row.movement_date)}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{row.description}</p>
                    <p className="mt-1 text-xs text-slate-500">Ref. {row.reference || '—'} · Residente {row.residentName}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{row.categoryName}</td>
                  <td className="px-5 py-4 text-slate-600">{row.unitNumber}</td>
                  <td className="px-5 py-4 text-slate-600">{row.accountAlias}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{row.status}</span>
                  </td>
                  <td className={`px-5 py-4 text-right font-semibold ${row.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">No hay movimientos registrados todavía.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
