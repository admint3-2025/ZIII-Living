import Link from 'next/link'
import { formatCurrency, formatShortDate, getFinanceCatalogs, getFinanceSession } from '../lib'

export const dynamic = 'force-dynamic'

export default async function FinanzasFacturacionPage() {
  const { supabase, propertyId } = await getFinanceSession(true)
  const [catalogs, invoicesRes] = await Promise.all([
    getFinanceCatalogs(propertyId),
    propertyId
      ? supabase.from('invoices').select('*').eq('property_id', propertyId).order('issued_at', { ascending: false }).limit(100)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const unitMap = new Map(catalogs.units.map((item) => [item.id, item]))
  const residentMap = new Map(catalogs.residents.map((item) => [item.id, item]))
  const invoices = (invoicesRes.data || []).map((invoice) => ({
    ...invoice,
    unitNumber: unitMap.get(invoice.unit_id)?.unit_number || '—',
    residentName: residentMap.get(invoice.resident_id)?.full_name || '—',
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/finanzas" className="font-medium transition-colors hover:text-emerald-700">Finanzas</Link><span>/</span><span className="font-semibold text-emerald-700">Facturación</span></div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Facturación y recibos</h1>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-5 py-4">Folio</th><th className="px-5 py-4">Unidad</th><th className="px-5 py-4">Residente</th><th className="px-5 py-4">Periodo</th><th className="px-5 py-4">Vencimiento</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Total</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{invoices.length > 0 ? invoices.map((invoice) => <tr key={invoice.id}><td className="px-5 py-4 font-semibold text-slate-900">{invoice.invoice_number}</td><td className="px-5 py-4 text-slate-600">{invoice.unitNumber}</td><td className="px-5 py-4 text-slate-600">{invoice.residentName}</td><td className="px-5 py-4 text-slate-600">{String(invoice.period_month).padStart(2, '0')}/{invoice.period_year}</td><td className="px-5 py-4 text-slate-600">{formatShortDate(invoice.due_date)}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{invoice.status}</span></td><td className="px-5 py-4 text-right font-semibold text-slate-950">{formatCurrency(invoice.total)}</td></tr>) : <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">No hay facturas emitidas todavía.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
