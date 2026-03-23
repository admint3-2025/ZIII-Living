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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link href="/hub" className="hover:text-white transition-colors">Hub</Link>
            <span>/</span>
            <span className="text-white">Votaciones</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Votaciones y Encuestas</h1>
          <p className="text-slate-400 mt-1">Toma de decisiones comunitarias de forma transparente y democrática</p>
        </div>
        {isManager && (
          <Link
            href="/votaciones/nueva"
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Votación
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Votaciones Activas', value: '1', icon: '🗳️', color: 'text-cyan-400' },
          { label: 'Participación Promedio', value: '0%', icon: '📊', color: 'text-blue-400' },
          { label: 'Votaciones Completadas', value: '0', icon: '✅', color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex items-center gap-4">
            <span className="text-3xl">{stat.icon}</span>
            <div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Votaciones activas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Votaciones Activas</h2>
        </div>
        <div className="space-y-4">
          {surveysExample.filter(s => s.status === 'active').map((survey) => (
            <div key={survey.id} className="bg-slate-800/50 border border-cyan-500/30 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-flex items-center gap-1 text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Activa
                  </span>
                  <h3 className="font-semibold text-white text-lg">{survey.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Cierra: {survey.endDate} · {survey.totalVotes} votos</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {survey.options.map((option, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3 cursor-pointer hover:bg-slate-700/50 transition-colors group">
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-500 group-hover:bg-cyan-500/30 transition-colors flex-shrink-0" />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{option}</span>
                    <div className="flex-1 h-1 bg-slate-700 rounded-full ml-2">
                      <div className="h-full bg-cyan-500/30 rounded-full w-0" />
                    </div>
                    <span className="text-xs text-slate-500">0%</span>
                  </div>
                ))}
              </div>
              <Link
                href={`/votaciones/${survey.id}`}
                className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Votar ahora →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Borradores (solo admin) */}
      {isManager && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Borradores</h2>
          <div className="space-y-3">
            {surveysExample.filter(s => s.status === 'draft').map((survey) => (
              <div key={survey.id} className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="inline-flex text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full mb-1">Borrador</span>
                  <h3 className="font-medium text-white">{survey.title}</h3>
                </div>
                <div className="flex gap-2">
                  <Link href={`/votaciones/${survey.id}/editar`} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors">Editar</Link>
                  <Link href={`/votaciones/${survey.id}/publicar`} className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg transition-colors">Publicar</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-cyan-950/40 border border-cyan-800/40 rounded-xl p-6 text-center">
        <p className="text-cyan-400 font-medium">🚀 Módulo en construcción</p>
        <p className="text-slate-400 text-sm mt-1">
          El sistema de votaciones con resultados en tiempo real estará disponible tras aplicar la migración SQL.
        </p>
      </div>
    </div>
  )
}
