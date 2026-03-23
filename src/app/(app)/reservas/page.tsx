import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSafeServerUser } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canManageReservations, isResident } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function ReservasPage() {
  const user = await getSafeServerUser()
  if (!user) redirect('/login')

  const supabase = createSupabaseAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/hub')

  // Residentes y admins pueden acceder
  const canAccess = ['admin', 'corporate_admin', 'resident'].includes(profile.role)
  if (!canAccess) redirect('/hub')

  const isManager = canManageReservations(profile as any)
  const resident = isResident(profile as any)

  // Áreas comunes de ejemplo (vendrán de la BD)
  const areas = [
    { name: 'Salón de Eventos', icon: '🏛️', capacity: 80, available: true, color: 'from-violet-500 to-purple-600' },
    { name: 'Alberca', icon: '🏊', capacity: 30, available: true, color: 'from-cyan-500 to-blue-600' },
    { name: 'Gimnasio', icon: '💪', capacity: 15, available: false, color: 'from-emerald-500 to-teal-600' },
    { name: 'Asadores / BBQ', icon: '🔥', capacity: 20, available: true, color: 'from-orange-500 to-red-600' },
    { name: 'Cancha de Tenis', icon: '🎾', capacity: 4, available: true, color: 'from-green-500 to-emerald-600' },
    { name: 'Sala de Juntas', icon: '💼', capacity: 12, available: true, color: 'from-slate-500 to-gray-600' },
  ]
  const availableCount = areas.filter(a => a.available).length

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <section className="relative overflow-hidden rounded-3xl border border-amber-100 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_32%),linear-gradient(135deg,#fffdf8_0%,#fff6e8_45%,#ffffff_100%)] p-6 shadow-[0_18px_42px_-30px_rgba(245,158,11,0.22)] lg:p-7">
        <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative grid gap-4 xl:grid-cols-[1.35fr,0.95fr] xl:items-end">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/hub" className="font-medium transition-colors hover:text-amber-700">Hub</Link>
              <span>/</span>
              <span className="font-semibold text-amber-700">Reservas</span>
            </div>
            <span className="inline-flex rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
              Amenidades y calendario
            </span>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Reserva amenidades con una experiencia más propia de un club residencial.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Salones, alberca, gimnasio y áreas comunes con lectura inmediata de disponibilidad, capacidad y flujo de uso para
              residentes y administración.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Disponibilidad actual</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{availableCount}/6</p>
              <p className="mt-1 text-sm text-slate-500">Amenidades disponibles en este momento para reserva inmediata.</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-500 p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">Perfil de acceso</p>
              <p className="mt-2 text-2xl font-semibold">{resident ? 'Residente' : 'Administrador'}</p>
              <p className="mt-1 text-sm text-amber-50">Vista preparada para reservar o administrar reglas, horarios y cupos.</p>
            </div>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/reservas/historial"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-amber-200 hover:text-amber-700"
          >
            Ver historial de reservas
          </Link>
          {isManager && (
            <Link
              href="/reservas/areas/gestionar"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-amber-600"
            >
              Gestionar amenidades
            </Link>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Mis Reservas Activas', value: '0', icon: '📅', accent: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Reservas Hoy', value: '0', icon: '📌', accent: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Áreas Disponibles', value: String(availableCount), icon: '✅', accent: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        ].map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)]">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${stat.accent}`}>
              <span>{stat.icon}</span>
              {stat.label}
            </div>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">Se actualizará con el calendario real y las reservas aprobadas.</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.92fr,1.4fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.20)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Mi agenda</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Reservas activas</h2>
            </div>
            <Link href="/reservas/historial" className="text-sm font-semibold text-amber-700 transition-colors hover:text-amber-800">Historial completo</Link>
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-amber-200 bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_100%)] p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">📅</div>
            <p className="mt-4 text-lg font-semibold text-slate-900">No tienes reservas activas.</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Selecciona una amenidad disponible y agenda tu primer uso con un flujo más claro y administrable.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.20)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Portafolio de amenidades</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Áreas comunes disponibles</h2>
            </div>
            {isManager && <Link href="/reservas/areas/nueva" className="text-sm font-semibold text-amber-700 transition-colors hover:text-amber-800">Agregar amenidad</Link>}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {areas.map((area, i) => (
              <div
                key={i}
                className={`group overflow-hidden rounded-2xl border bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] transition-all duration-200 ${area.available ? 'border-slate-200 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_14px_28px_-22px_rgba(245,158,11,0.22)]' : 'border-slate-150 opacity-75'}`}
              >
                <div className={`h-2 bg-gradient-to-r ${area.color}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{area.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{area.name}</h3>
                        <p className="text-sm text-slate-500">Capacidad para {area.capacity} personas</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${area.available ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {area.available ? 'Libre' : 'Ocupada'}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    {area.available
                      ? 'Disponible para reserva. Considera reglas, horarios y cupo antes de confirmar.'
                      : 'Actualmente bloqueada por uso o mantenimiento. Se habilitará al liberarse el espacio.'}
                  </p>
                  {area.available ? (
                    <Link
                      href={`/reservas/nueva?area=${encodeURIComponent(area.name)}`}
                      className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                    >
                      Reservar ahora
                    </Link>
                  ) : (
                    <div className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-400">
                      Sin disponibilidad inmediata
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
