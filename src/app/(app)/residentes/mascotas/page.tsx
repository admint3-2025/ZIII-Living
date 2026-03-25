import Link from 'next/link'
import { getResidentsSession } from '../lib'

export const dynamic = 'force-dynamic'

export default async function ResidentesMascotasPage() {
  await getResidentsSession()

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6 text-slate-900">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/residentes" className="font-medium transition-colors hover:text-violet-700">Residentes</Link><span>/</span><span className="font-semibold text-violet-700">Mascotas</span></div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Registro de mascotas</h1>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm leading-7 text-slate-600">La base comunitaria actual no trae todavía una tabla formal para mascotas. Ya quedó habilitado el módulo residencial operativo para propiedades, unidades, residentes, morosidad y vehículos; la siguiente ampliación natural es agregar el padrón estructurado de mascotas con especie, raza, número de ejemplares y reglamento asociado.</p>
      </div>
    </div>
  )
}