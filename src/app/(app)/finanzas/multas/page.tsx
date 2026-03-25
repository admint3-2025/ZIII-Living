import Link from 'next/link'
import { formatCurrency, formatShortDate, getFinanceCatalogs, getFinanceSession } from '../lib'

export const dynamic = 'force-dynamic'

export default async function FinanzasMultasPage() {
  const { supabase, propertyId } = await getFinanceSession(true)
  const [catalogs, finesRes] = await Promise.all([
    getFinanceCatalogs(propertyId),
    propertyId
      ? supabase.from('fines').select('*').eq('property_id', propertyId).order('incident_date', { ascending: false }).limit(100)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const unitMap = new Map(catalogs.units.map((item) => [item.id, item]))
  const residentMap = new Map(catalogs.residents.map((item) => [item.id, item]))
  const fines = (finesRes.data || []).map((fine) => ({
    ...fine,
    unitNumber: unitMap.get(fine.unit_id)?.unit_number || '—',
    residentName: residentMap.get(fine.resident_id)?.full_name || '—',
  }))

  const unpaidTotal = fines.filter((fine) => fine.status === 'unpaid').reduce((sum, fine) => sum + Number(fine.amount || 0), 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/finanzas" className="font-medium transition-colors hover:text-emerald-700">Finanzas</Link><span>/</span><span className="font-semibold text-emerald-700">Multas</span></div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Multas e intereses</h1>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pendiente de cobro</p><p className="mt-2 text-3xl font-semibold text-amber-700">{formatCurrency(unpaidTotal)}</p></div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-5 py-4">Incidente</th><th className="px-5 py-4">Unidad</th><th className="px-5 py-4">Residente</th><th className="px-5 py-4">Vencimiento</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Importe</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{fines.length > 0 ? fines.map((fine) => <tr key={fine.id}><td className="px-5 py-4"><p className="font-semibold text-slate-900">{fine.category}</p><p className="mt-1 text-xs text-slate-500">{fine.description}</p></td><td className="px-5 py-4 text-slate-600">{fine.unitNumber}</td><td className="px-5 py-4 text-slate-600">{fine.residentName}</td><td className="px-5 py-4 text-slate-600">{formatShortDate(fine.due_date || fine.incident_date)}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{fine.status}</span></td><td className="px-5 py-4 text-right font-semibold text-amber-700">{formatCurrency(fine.amount)}</td></tr>) : <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">No hay multas registradas.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
