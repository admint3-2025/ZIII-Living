import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSafeServerUser } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isResident } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function MiPortalPage() {
  const user = await getSafeServerUser()
  if (!user) redirect('/login')

  const supabase = createSupabaseAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Solo residentes y admins acceden al portal de residente
  const allowed = ['resident', 'admin', 'corporate_admin'].includes(profile.role)
  if (!allowed) redirect('/hub')

  const resident = isResident(profile as any)

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6 text-slate-900">
      <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_34%),linear-gradient(135deg,#fbfeff_0%,#f1f9ff_44%,#ffffff_100%)] p-6 shadow-[0_18px_42px_-30px_rgba(56,189,248,0.18)] lg:p-7">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="relative grid gap-4 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/hub" className="font-medium transition-colors hover:text-sky-700">Hub</Link>
              <span>/</span>
              <span className="font-semibold text-sky-700">Mi Portal</span>
            </div>
            <span className="inline-flex rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
              Portal del residente
            </span>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Un portal residencial sobrio, claro y mucho más útil para el día a día.</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {resident
                ? `Bienvenido, ${profile.full_name || 'Residente'}. Consulta tu unidad, movimientos, reglas, invitaciones y trámites cotidianos desde una sola vista.`
                : 'Vista administrativa del portal del residente para revisar la experiencia y sus accesos principales.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Unidad asignada</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{(profile as any).unit_number || '—'}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Saldo pendiente</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">$0.00</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Estado</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">Sin adeudos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Estado de cuenta', value: '$0.00', note: 'Sin saldo vencido', accent: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Próxima cuota', value: '$0.00', note: 'Se mostrará al generar cargos', accent: 'bg-sky-50 text-sky-700 border-sky-100' },
          { label: 'Multas activas', value: '0', note: 'No hay incidencias registradas', accent: 'bg-amber-50 text-amber-700 border-amber-100' },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)]">
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${item.accent}`}>{item.label}</div>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">{item.value}</p>
            <p className="mt-1 text-sm text-slate-500">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.20)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Accesos prioritarios</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Servicios del residente</h2>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            {
              href: '/finanzas',
              title: 'Estado de cuenta',
              desc: 'Consulta tus movimientos, pagos e historial financiero.',
              icon: '📊',
              tone: 'from-emerald-500/12 to-teal-500/5 border-emerald-200 hover:border-emerald-300',
            },
            {
              href: '/reservas',
              title: 'Reservar amenidades',
              desc: 'Agenda salón, alberca, gimnasio y otras áreas comunes.',
              icon: '📅',
              tone: 'from-amber-500/12 to-orange-500/5 border-amber-200 hover:border-amber-300',
            },
            {
              href: '/votaciones',
              title: 'Votaciones activas',
              desc: 'Participa en acuerdos y decisiones importantes de la comunidad.',
              icon: '🗳️',
              tone: 'from-sky-500/12 to-cyan-500/5 border-sky-200 hover:border-sky-300',
            },
            {
              href: '/tickets?view=mine',
              title: 'Mis solicitudes',
              desc: 'Levanta incidencias de mantenimiento o soporte sin salir del portal.',
              icon: '🎫',
              tone: 'from-violet-500/12 to-fuchsia-500/5 border-violet-200 hover:border-violet-300',
            },
            {
              href: '/politicas',
              title: 'Reglamento',
              desc: 'Consulta lineamientos, políticas y normas internas del desarrollo.',
              icon: '📋',
              tone: 'from-indigo-500/12 to-blue-500/5 border-indigo-200 hover:border-indigo-300',
            },
            {
              href: '/control-acceso/invitaciones',
              title: 'Invitar visitantes',
              desc: 'Genera accesos QR para visitas esperadas y controla su vigencia.',
              icon: '🎟️',
              tone: 'from-pink-500/12 to-rose-500/5 border-pink-200 hover:border-pink-300',
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group rounded-2xl border bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] bg-gradient-to-br ${item.tone} p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_28px_-22px_rgba(15,23,42,0.16)]`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-3xl">{item.icon}</span>
                <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Portal</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900 transition-colors group-hover:text-sky-700">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.20)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Comunicación reciente</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Notificaciones</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bandeja vacía</span>
        </div>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">🔔</div>
          <p className="mt-4 text-lg font-semibold text-slate-900">No hay notificaciones recientes.</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Aquí se concentrarán avisos de administración, pagos, reservas y accesos autorizados.</p>
        </div>
      </section>
    </div>
  )
}
