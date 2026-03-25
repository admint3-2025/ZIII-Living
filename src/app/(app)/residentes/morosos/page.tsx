import Link from 'next/link'
import { formatCurrency, formatShortDate, getResidentsSession } from '../lib'

export const dynamic = 'force-dynamic'

export default async function ResidentesMorososPage() {
  const { supabase, propertyId } = await getResidentsSession()

  if (!propertyId) {
    return <div className="px-6 py-8 text-sm text-slate-500">Asigna una propiedad para revisar cuentas morosas.</div>
  }

  const [invoicesRes, finesRes, residentsRes, unitsRes] = await Promise.all([
    supabase.from('invoices').select('id, resident_id, unit_id, invoice_number, due_date, total, status').eq('property_id', propertyId).in('status', ['pending', 'overdue']).order('due_date', { ascending: true }),
    supabase.from('fines').select('id, resident_id, unit_id, category, due_date, amount, status').eq('property_id', propertyId).in('status', ['unpaid', 'appealed']).order('due_date', { ascending: true }),
    supabase.from('profiles').select('id, full_name, unit_number').eq('property_id', propertyId).eq('role', 'resident'),
    supabase.from('community_units').select('id, unit_number').eq('property_id', propertyId),
  ])

  const residentMap = new Map((residentsRes.data || []).map((resident) => [resident.id, resident]))
  const unitMap = new Map((unitsRes.data || []).map((unit) => [unit.id, unit]))

  const rows = [
    ...(invoicesRes.data || []).map((invoice) => ({
      id: invoice.id,
      kind: 'Factura',
      concept: invoice.invoice_number,
      dueDate: invoice.due_date,
      amount: invoice.total,
      status: invoice.status,
      residentName: residentMap.get(invoice.resident_id)?.full_name || 'Sin residente',
      unitNumber: unitMap.get(invoice.unit_id)?.unit_number || residentMap.get(invoice.resident_id)?.unit_number || '—',
    })),
    ...(finesRes.data || []).map((fine) => ({
      id: fine.id,
      kind: 'Multa',
      concept: fine.category,
      dueDate: fine.due_date,
      amount: fine.amount,
      status: fine.status,
      residentName: residentMap.get(fine.resident_id)?.full_name || 'Sin residente',
      unitNumber: unitMap.get(fine.unit_id)?.unit_number || residentMap.get(fine.resident_id)?.unit_number || '—',
    })),
  ].sort((left, right) => String(left.dueDate || '').localeCompare(String(right.dueDate || '')))

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/residentes" className="font-medium transition-colors hover:text-violet-700">Residentes</Link><span>/</span><span className="font-semibold text-violet-700">Morosos</span></div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Cuentas morosas</h1>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total pendiente</p><p className="mt-2 text-3xl font-semibold text-amber-700">{formatCurrency(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0))}</p></div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-5 py-4">Tipo</th><th className="px-5 py-4">Concepto</th><th className="px-5 py-4">Residente</th><th className="px-5 py-4">Unidad</th><th className="px-5 py-4">Vence</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Importe</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.length > 0 ? rows.map((row) => <tr key={`${row.kind}-${row.id}`}><td className="px-5 py-4 text-slate-600">{row.kind}</td><td className="px-5 py-4 font-semibold text-slate-900">{row.concept}</td><td className="px-5 py-4 text-slate-600">{row.residentName}</td><td className="px-5 py-4 text-slate-600">{row.unitNumber}</td><td className="px-5 py-4 text-slate-600">{formatShortDate(row.dueDate)}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{row.status}</span></td><td className="px-5 py-4 text-right font-semibold text-amber-700">{formatCurrency(row.amount)}</td></tr>) : <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">No hay saldos vencidos o pendientes en esta propiedad.</td></tr>}</tbody></table></div></div>
    </div>
  )
}
