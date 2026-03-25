import Link from 'next/link'
import { formatCurrency, getResidentsOverview, getResidentsSession } from './lib'

export const dynamic = 'force-dynamic'

export default async function ResidentesPage() {
  const { propertyId, isManager } = await getResidentsSession()
  const overview = await getResidentsOverview(propertyId)
  const occupancy = overview.units > 0 ? Math.round((overview.occupiedUnits / overview.units) * 100) : 0

  const subModules = [
    {
      href: '/residentes/directorio',
      title: 'Directorio',
      desc: 'Listado de propietarios e inquilinos del condominio',
      icon: '📋',
      color: 'border-violet-500/40 hover:border-violet-400',
    },
    {
      href: '/residentes/unidades',
      title: 'Unidades',
      desc: 'Gestión de departamentos, casas y locales',
      icon: '🏠',
      color: 'border-blue-500/40 hover:border-blue-400',
    },
    {
      href: '/residentes/nuevo',
      title: 'Agregar Residente',
      desc: 'Registrar nuevo propietario o inquilino',
      icon: '➕',
      color: 'border-emerald-500/40 hover:border-emerald-400',
      adminOnly: true,
    },
    {
      href: '/residentes/morosos',
      title: 'Cuentas Morosas',
      desc: 'Residentes con pagos atrasados o multas pendientes',
      icon: '⚠️',
      color: 'border-amber-500/40 hover:border-amber-400',
      adminOnly: true,
    },
    {
      href: '/residentes/vehiculos',
      title: 'Vehículos',
      desc: 'Registro de vehículos autorizados por unidad',
      icon: '🚗',
      color: 'border-cyan-500/40 hover:border-cyan-400',
    },
    {
      href: '/residentes/mascotas',
      title: 'Mascotas',
      desc: 'Control de mascotas registradas en el condominio',
      icon: '🐾',
      color: 'border-pink-500/40 hover:border-pink-400',
    },
  ]

  const visibleModules = subModules.filter(m => !m.adminOnly || isManager)

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <section className="relative overflow-hidden rounded-3xl border border-violet-100 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.14),_transparent_34%),linear-gradient(135deg,#fdfcff_0%,#f6f3ff_45%,#ffffff_100%)] p-6 shadow-[0_18px_42px_-30px_rgba(124,58,237,0.22)] lg:p-7">
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-fuchsia-200/30 blur-3xl" />
        <div className="relative grid gap-4 xl:grid-cols-[1.4fr,0.8fr] xl:items-end">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/hub" className="font-medium transition-colors hover:text-violet-700">Hub</Link>
              <span>/</span>
              <span className="font-semibold text-violet-700">Residentes</span>
            </div>
            <span className="inline-flex rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-700">
              Comunidad y padrón interno
            </span>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Una vista más seria para administrar unidades, familias y reglas de convivencia.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Organiza el directorio de residentes, unidades, vehículos, cuentas morosas y expedientes con un lenguaje y una
              estructura propios de una administración residencial, no de un software genérico.
            </p>
            {isManager && (
              <Link
                href="/residentes/nuevo"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-violet-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Incorporar residente
              </Link>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Nivel de ocupación</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{occupancy}%</p>
              <p className="mt-1 text-sm text-slate-500">{overview.occupiedUnits} de {overview.units} unidades ya tienen residentes vinculados.</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-600 p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-100">Operación</p>
              <p className="mt-2 text-2xl font-semibold">{propertyId ? 'Operación activa' : 'Pendiente de asignación'}</p>
              <p className="mt-1 text-sm text-violet-100">{propertyId ? `Cuota base actual: ${formatCurrency(overview.monthlyFees)}` : 'La primera carga debe iniciar por propiedades y unidades.'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Total Unidades', value: String(overview.units), icon: '🏠', accent: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Residentes Activos', value: String(overview.residents), icon: '👥', accent: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Cuentas Morosas', value: String(overview.delinquent), icon: '⚠️', accent: 'bg-amber-50 text-amber-700 border-amber-100' },
        ].map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)]">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${stat.accent}`}>
              <span>{stat.icon}</span>
              {stat.label}
            </div>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">Vista consolidada del padrón y la cobranza residencial.</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr,0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.20)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">Núcleo de administración</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Bloques de trabajo del padrón residencial</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Esta sección concentra la operación del día a día: directorio, unidades, control de morosidad y registros de apoyo
              para vehículos y mascotas autorizadas por unidad.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleModules.map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="group rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-5 transition-all duration-200 hover:border-violet-200 hover:shadow-[0_14px_28px_-22px_rgba(139,92,246,0.22)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl">{mod.icon}</span>
                  {mod.adminOnly ? <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-700">Admin</span> : null}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900 transition-colors group-hover:text-violet-700">{mod.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{mod.desc}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-slate-600 group-hover:text-violet-700">
                  <span>Abrir módulo</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-violet-100 bg-[linear-gradient(180deg,#fbf9ff_0%,#ffffff_100%)] p-6 shadow-[0_18px_42px_-30px_rgba(124,58,237,0.14)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">Secuencia sugerida</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Orden correcto de carga</h2>
          <div className="mt-6 space-y-4">
            {[
              ['1. Propiedades y torres', 'Define primero el desarrollo, torres, etapas o clústeres.'],
              ['2. Unidades', 'Alta de departamentos, casas o lotes con su identificador interno.'],
              ['3. Residentes', 'Relaciona propietarios e inquilinos con sus unidades.'],
              ['4. Padrones complementarios', 'Vehículos, mascotas, cuentas morosas y datos de contacto.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-violet-100 bg-white p-4">
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
