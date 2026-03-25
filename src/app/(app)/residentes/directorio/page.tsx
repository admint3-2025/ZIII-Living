import Link from 'next/link'
import { formatShortDate, getResidentsSession } from '../lib'

export const dynamic = 'force-dynamic'

export default async function ResidentesDirectorioPage() {
  const { supabase, propertyId, isManager } = await getResidentsSession()

  if (!propertyId) {
    return <div className="px-6 py-8 text-sm text-slate-500">Asigna una propiedad para consultar el directorio del condominio.</div>
  }

  const { data: residents } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, unit_number, resident_since, emergency_contact, vehicle_plates, is_owner')
    .eq('property_id', propertyId)
    .eq('role', 'resident')
    .order('unit_number')
    .order('full_name')

  const rows = residents || []
  const ownerCount = rows.filter((resident) => resident.is_owner).length

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/residentes" className="font-medium transition-colors hover:text-violet-700">Residentes</Link><span>/</span><span className="font-semibold text-violet-700">Directorio</span></div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Directorio de residentes</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Relación viva de propietarios e inquilinos por unidad.</p>
        </div>
        {isManager && <Link href="/residentes/nuevo" className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Incorporar residente</Link>}
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Residentes</p><p className="mt-2 text-3xl font-semibold text-slate-950">{rows.length}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Propietarios</p><p className="mt-2 text-3xl font-semibold text-slate-950">{ownerCount}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inquilinos</p><p className="mt-2 text-3xl font-semibold text-slate-950">{rows.length - ownerCount}</p></article>
      </section>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-5 py-4">Residente</th><th className="px-5 py-4">Unidad</th><th className="px-5 py-4">Tipo</th><th className="px-5 py-4">Desde</th><th className="px-5 py-4">Contacto</th><th className="px-5 py-4">Vehículos</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{rows.length > 0 ? rows.map((resident) => <tr key={resident.id}><td className="px-5 py-4"><p className="font-semibold text-slate-900">{resident.full_name || 'Sin nombre'}</p><p className="mt-1 text-xs text-slate-500">{resident.email || 'Sin email'}</p></td><td className="px-5 py-4 text-slate-600">{resident.unit_number || '—'}</td><td className="px-5 py-4 text-slate-600">{resident.is_owner ? 'Propietario' : 'Inquilino'}</td><td className="px-5 py-4 text-slate-600">{formatShortDate(resident.resident_since)}</td><td className="px-5 py-4 text-slate-600"><p>{resident.phone || '—'}</p><p className="mt-1 text-xs text-slate-500">Emergencia: {resident.emergency_contact || '—'}</p></td><td className="px-5 py-4 text-slate-600">{Array.isArray(resident.vehicle_plates) && resident.vehicle_plates.length > 0 ? resident.vehicle_plates.join(', ') : 'Sin placas'}</td></tr>) : <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">Todavía no hay residentes asociados a esta propiedad.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
