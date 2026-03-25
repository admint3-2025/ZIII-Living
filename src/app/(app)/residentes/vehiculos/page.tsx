import Link from 'next/link'
import { getResidentsSession } from '../lib'

export const dynamic = 'force-dynamic'

export default async function ResidentesVehiculosPage() {
  const { supabase, propertyId } = await getResidentsSession()

  if (!propertyId) {
    return <div className="px-6 py-8 text-sm text-slate-500">Asigna una propiedad para consultar vehículos registrados.</div>
  }

  const { data: residents } = await supabase
    .from('profiles')
    .select('id, full_name, unit_number, vehicle_plates')
    .eq('property_id', propertyId)
    .eq('role', 'resident')
    .order('unit_number')

  const rows = (residents || []).flatMap((resident) => {
    const plates = Array.isArray(resident.vehicle_plates) ? resident.vehicle_plates : []
    if (plates.length === 0) {
      return [{ id: `${resident.id}-empty`, full_name: resident.full_name, unit_number: resident.unit_number, plate: 'Sin placas registradas' }]
    }
    return plates.map((plate) => ({ id: `${resident.id}-${plate}`, full_name: resident.full_name, unit_number: resident.unit_number, plate }))
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6 text-slate-900">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/residentes" className="font-medium transition-colors hover:text-violet-700">Residentes</Link><span>/</span><span className="font-semibold text-violet-700">Vehículos</span></div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Vehículos autorizados</h1>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-5 py-4">Residente</th><th className="px-5 py-4">Unidad</th><th className="px-5 py-4">Placa</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.length > 0 ? rows.map((row) => <tr key={row.id}><td className="px-5 py-4 font-semibold text-slate-900">{row.full_name || 'Sin nombre'}</td><td className="px-5 py-4 text-slate-600">{row.unit_number || '—'}</td><td className="px-5 py-4 text-slate-600">{row.plate}</td></tr>) : <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-slate-500">Aún no hay vehículos registrados.</td></tr>}</tbody></table></div></div>
    </div>
  )
}
