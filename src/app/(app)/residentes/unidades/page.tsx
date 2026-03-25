import Link from 'next/link'
import { createCommunityUnit } from '../actions'
import { formatCurrency, getResidentsSession } from '../lib'

export const dynamic = 'force-dynamic'

const UNIT_TYPE_LABELS: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  local: 'Área / local',
  parking: 'Cajón',
  storage: 'Bodega',
}

export default async function ResidentesUnidadesPage() {
  const { supabase, propertyId, isManager } = await getResidentsSession()

  if (!propertyId) {
    return <div className="px-6 py-8 text-sm text-slate-500">Asigna o crea una propiedad activa para comenzar a registrar unidades.</div>
  }

  const [{ data: units }, { data: residents }] = await Promise.all([
    supabase.from('community_units').select('*').eq('property_id', propertyId).order('unit_number'),
    supabase.from('profiles').select('id, full_name, unit_number').eq('property_id', propertyId).eq('role', 'resident'),
  ])

  const residentCountByUnit = new Map<string, number>()
  for (const resident of residents || []) {
    const key = resident.unit_number || ''
    if (!key) continue
    residentCountByUnit.set(key, (residentCountByUnit.get(key) || 0) + 1)
  }

  const unitRows = (units || []).map((unit) => ({
    ...unit,
    occupiedBy: residentCountByUnit.get(unit.unit_number) || 0,
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/residentes" className="font-medium transition-colors hover:text-violet-700">Residentes</Link>
            <span>/</span>
            <span className="font-semibold text-violet-700">Unidades</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Viviendas, casas y áreas</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Da de alta el inventario real del condominio para después enlazar residentes, cuotas y cobranza.</p>
        </div>
        {isManager && <Link href="/residentes/nuevo" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-violet-200 hover:text-violet-700">Agregar residente</Link>}
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Unidades activas</p><p className="mt-2 text-3xl font-semibold text-slate-950">{unitRows.length}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Con ocupación</p><p className="mt-2 text-3xl font-semibold text-slate-950">{unitRows.filter((unit) => unit.occupiedBy > 0).length}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cuota mensual base</p><p className="mt-2 text-3xl font-semibold text-slate-950">{formatCurrency(unitRows.reduce((sum, unit) => sum + Number(unit.monthly_fee || 0), 0))}</p></article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr,0.8fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Unidad</th>
                  <th className="px-5 py-4">Tipo</th>
                  <th className="px-5 py-4">Piso</th>
                  <th className="px-5 py-4">Área</th>
                  <th className="px-5 py-4">Cuota</th>
                  <th className="px-5 py-4">Ocupación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unitRows.length > 0 ? unitRows.map((unit) => (
                  <tr key={unit.id}>
                    <td className="px-5 py-4"><p className="font-semibold text-slate-900">{unit.unit_number}</p><p className="mt-1 text-xs text-slate-500">{unit.notes || 'Sin notas'}</p></td>
                    <td className="px-5 py-4 text-slate-600">{UNIT_TYPE_LABELS[unit.unit_type] || unit.unit_type}</td>
                    <td className="px-5 py-4 text-slate-600">{unit.floor ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{unit.area_sqm ? `${unit.area_sqm} m²` : '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{formatCurrency(unit.monthly_fee)}</td>
                    <td className="px-5 py-4 text-slate-600">{unit.occupiedBy} residente(s)</td>
                  </tr>
                )) : <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">Todavía no hay unidades registradas para esta propiedad.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-3xl border border-violet-100 bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">Alta rápida</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Registrar unidad</h2>
          {isManager ? (
            <form action={createCommunityUnit} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Identificador</label>
                <input name="unit_number" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300" placeholder="Ej. Torre A-302, Casa 14, Salón de eventos" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Tipo</label>
                <select name="unit_type" defaultValue="apartment" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300">
                  <option value="apartment">Departamento</option>
                  <option value="house">Casa</option>
                  <option value="local">Área / local</option>
                  <option value="parking">Cajón</option>
                  <option value="storage">Bodega</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Piso</label>
                  <input name="floor" type="number" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Área m²</label>
                  <input name="area_sqm" type="number" step="0.01" min="0" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Cuota mensual</label>
                <input name="monthly_fee" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Notas</label>
                <textarea name="notes" rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300" placeholder="Torre, etapa, uso o aclaraciones" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700">Guardar unidad</button>
            </form>
          ) : <p className="mt-4 text-sm leading-6 text-slate-500">Tu perfil solo tiene permisos de consulta para el padrón residencial.</p>}
        </aside>
      </section>
    </div>
  )
}
