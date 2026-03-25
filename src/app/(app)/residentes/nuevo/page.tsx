import Link from 'next/link'
import { createResidentAccount } from '../actions'
import { getResidentsSession } from '../lib'

export const dynamic = 'force-dynamic'

export default async function NuevoResidentePage() {
  const { supabase, propertyId } = await getResidentsSession(true)

  const { data: units } = propertyId
    ? await supabase.from('community_units').select('id, unit_number, unit_type, is_active').eq('property_id', propertyId).eq('is_active', true).order('unit_number')
    : { data: [] as any[] }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6 text-slate-900">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/residentes" className="font-medium transition-colors hover:text-violet-700">Residentes</Link><span>/</span><span className="font-semibold text-violet-700">Nuevo</span></div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Incorporar residente</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Crea al residente, lo liga a su propiedad y lo deja apuntando a una unidad real del padrón.</p>
      </div>

      <form action={createResidentAccount} className="grid gap-6 xl:grid-cols-[1.3fr,0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Nombre completo</label><input name="full_name" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300" placeholder="Nombre y apellidos" /></div>
            <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</label><input name="email" type="email" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300" placeholder="residente@correo.com" /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Unidad</label><select name="unit_id" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300"><option value="">Selecciona una unidad</option>{(units || []).map((unit) => <option key={unit.id} value={unit.id}>{unit.unit_number}</option>)}</select></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Tipo de residente</label><select name="resident_type" defaultValue="owner" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300"><option value="owner">Propietario</option><option value="tenant">Inquilino</option></select></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Teléfono</label><input name="phone" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300" placeholder="55 0000 0000" /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Residente desde</label><input name="resident_since" type="date" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300" /></div>
            <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Contacto de emergencia</label><input name="emergency_contact" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300" placeholder="Nombre y teléfono" /></div>
            <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Placas de vehículos</label><textarea name="vehicle_plates" rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-300" placeholder="Una por línea o separadas por comas" /></div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-violet-100 bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">Qué pasa al guardar</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>Se envía invitación al correo del residente.</li>
              <li>Su perfil queda enlazado a la propiedad actual.</li>
              <li>La unidad queda lista para cobranzas, multas y reportes.</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
            <div className="flex flex-col gap-3">
              <button type="submit" className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700">Crear residente</button>
              <Link href="/residentes/directorio" className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-semibold text-slate-200 hover:bg-white/5">Cancelar</Link>
            </div>
          </div>
        </aside>
      </form>
    </div>
  )
}
