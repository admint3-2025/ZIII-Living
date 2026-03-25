import Link from 'next/link'
import { formatCurrency, formatShortDate, getFinanceCatalogs, getFinanceSession } from '../lib'

export const dynamic = 'force-dynamic'

export default async function FinanzasConciliacionPage() {
  const { supabase, propertyId } = await getFinanceSession(true)
  const [catalogs, reconciliationsRes] = await Promise.all([
    getFinanceCatalogs(propertyId),
    propertyId
      ? supabase.from('bank_reconciliations').select('*').eq('property_id', propertyId).order('period_end', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const accountMap = new Map(catalogs.bankAccounts.map((item) => [item.id, item]))
  const reconciliations = (reconciliationsRes.data || []).map((item) => ({
    ...item,
    accountAlias: accountMap.get(item.bank_account_id)?.account_alias || 'Cuenta desconocida',
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/finanzas" className="font-medium transition-colors hover:text-emerald-700">Finanzas</Link><span>/</span><span className="font-semibold text-emerald-700">Conciliación</span></div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Conciliación bancaria</h1>
      </div>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {catalogs.bankAccounts.map((account) => <article key={account.id} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">{account.account_alias}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(account.current_balance)}</p><p className="mt-1 text-sm text-slate-500">{account.bank_name}</p></article>)}
      </section>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-5 py-4">Cuenta</th><th className="px-5 py-4">Periodo</th><th className="px-5 py-4">Saldo cierre</th><th className="px-5 py-4">Estado de cuenta</th><th className="px-5 py-4">Diferencia</th><th className="px-5 py-4">Estado</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{reconciliations.length > 0 ? reconciliations.map((item) => <tr key={item.id}><td className="px-5 py-4 font-semibold text-slate-900">{item.accountAlias}</td><td className="px-5 py-4 text-slate-600">{formatShortDate(item.period_start)} → {formatShortDate(item.period_end)}</td><td className="px-5 py-4 text-slate-600">{formatCurrency(item.closing_balance)}</td><td className="px-5 py-4 text-slate-600">{formatCurrency(item.statement_balance)}</td><td className="px-5 py-4 text-slate-600">{formatCurrency(item.difference)}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{item.status}</span></td></tr>) : <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">No hay conciliaciones registradas.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
