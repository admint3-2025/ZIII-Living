import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSafeServerUser } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canManageSurveys, canVoteSurveys } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function VotacionesPage() {
  const user = await getSafeServerUser()
  if (!user) redirect('/login')

  const supabase = createSupabaseAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !canVoteSurveys(profile as any)) redirect('/hub')

  const isManager = canManageSurveys(profile as any)

  // Encuestas de ejemplo (vendrán de la BD)
  const surveysExample = [
    {
      id: '1',
      title: '¿Aprobar presupuesto de remodelación de alberca 2026?',
      status: 'active',
      endDate: '2026-04-01',
      totalVotes: 0,
      options: ['Sí, aprobado', 'No, rechazado', 'Requiere más información'],
    },
    {
      id: '2',
      title: 'Horario de uso del gimnasio los fines de semana',
      status: 'draft',
      endDate: '2026-03-31',
      totalVotes: 0,
      options: ['6am - 10pm', '7am - 9pm', '8am - 8pm'],
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_34%),linear-gradient(135deg,#fbfeff_0%,#f0f9ff_45%,#ffffff_100%)] p-6 shadow-[0_18px_42px_-30px_rgba(14,165,233,0.20)] lg:p-7">
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="relative grid gap-4 xl:grid-cols-[1.35fr,0.95fr] xl:items-end">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/hub" className="font-medium transition-colors hover:text-sky-700">Hub</Link>
              <span>/</span>
              <span className="font-semibold text-sky-700">Votaciones</span>
            </div>
            <span className="inline-flex rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
              Decisión colectiva
            </span>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Votaciones comunitarias con más legitimidad visual y menos sensación de plantilla.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Presenta propuestas, periodos de cierre, participación y resultados de forma más seria para asambleas, decisiones de
              presupuesto y consultas internas del condominio.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Participación actual</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">0%</p>
              <p className="mt-1 text-sm text-slate-500">La métrica se enriquecerá con votos reales y quórum requerido.</p>
            </div>
            {isManager && (
              <Link href="/votaciones/nueva" className="rounded-2xl border border-sky-200 bg-sky-600 p-4 text-white shadow-sm transition-colors hover:bg-sky-700">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">Acción principal</p>
                <p className="mt-2 text-2xl font-semibold">Nueva votación</p>
                <p className="mt-1 text-sm text-sky-100">Configura una propuesta, define plazo y publícala a la comunidad.</p>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Votaciones Activas', value: '1', icon: '🗳️', accent: 'bg-sky-50 text-sky-700 border-sky-100' },
          { label: 'Participación Promedio', value: '0%', icon: '📊', accent: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Votaciones Completadas', value: '0', icon: '✅', accent: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        ].map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)]">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${stat.accent}`}>
              <span>{stat.icon}</span>
              {stat.label}
            </div>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">Estos datos reflejarán el pulso real de participación de la comunidad.</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr,0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.20)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Proceso activo</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Consultas abiertas</h2>
          </div>
          <div className="mt-6 space-y-4">
            {surveysExample.filter((s) => s.status === 'active').map((survey) => (
              <article key={survey.id} className="rounded-2xl border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7fdff_100%)] p-6 shadow-[0_14px_28px_-22px_rgba(14,165,233,0.16)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      Activa
                    </span>
                    <h3 className="mt-3 text-xl font-semibold text-slate-950">{survey.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">Cierre programado: {survey.endDate} · {survey.totalVotes} votos emitidos</p>
                  </div>
                  <Link href={`/votaciones/${survey.id}`} className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700">
                    Votar ahora
                  </Link>
                </div>
                <div className="mt-6 space-y-3">
                  {survey.options.map((option, i) => (
                    <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full border-2 border-sky-500" />
                        <span className="text-sm font-medium text-slate-700">{option}</span>
                        <span className="ml-auto text-xs font-semibold text-slate-400">0%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-0 rounded-full bg-sky-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          {isManager && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.20)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Backoffice</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Borradores</h2>
              <div className="mt-5 space-y-3">
                {surveysExample.filter((s) => s.status === 'draft').map((survey) => (
                  <div key={survey.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Borrador</span>
                    <h3 className="mt-3 font-semibold text-slate-900">{survey.title}</h3>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/votaciones/${survey.id}/editar`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-700">Editar</Link>
                      <Link href={`/votaciones/${survey.id}/publicar`} className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700">Publicar</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-3xl border border-sky-100 bg-[linear-gradient(180deg,#f4fbff_0%,#ffffff_100%)] p-6 shadow-[0_18px_42px_-30px_rgba(14,165,233,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Buenas prácticas</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Cómo debe leerse una consulta</h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-500">
              <p>Define con claridad el objetivo, el periodo de cierre y si requiere quórum mínimo.</p>
              <p>Evita preguntas ambiguas: la formulación impacta la legitimidad del resultado.</p>
              <p>Publica resultados con transparencia y conserva el histórico para la asamblea.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
