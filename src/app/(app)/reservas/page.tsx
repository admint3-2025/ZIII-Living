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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link href="/hub" className="hover:text-white transition-colors">Hub</Link>
            <span>/</span>
            <span className="text-white">Reservas</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Reservas de Áreas Comunes</h1>
          <p className="text-slate-400 mt-1">Consulta disponibilidad y reserva los espacios compartidos del condominio</p>
        </div>
        {isManager && (
          <Link
            href="/reservas/areas/gestionar"
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35" />
            </svg>
            Gestionar Áreas
          </Link>
        )}
      </div>

      {/* Calendario rápido / resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Mis Reservas Activas', value: '0', icon: '📅', color: 'text-amber-400' },
          { label: 'Reservas Hoy (Total)', value: '0', icon: '📌', color: 'text-blue-400' },
          { label: 'Áreas Disponibles', value: String(areas.filter(a => a.available).length), icon: '✅', color: 'text-emerald-400' },
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

      {/* Mis reservas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Mis Reservas</h2>
          <Link href="/reservas/historial" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
            Ver historial →
          </Link>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-slate-400">No tienes reservas activas.</p>
          <p className="text-slate-500 text-sm mt-1">Selecciona un área abajo para hacer tu primera reserva.</p>
        </div>
      </div>

      {/* Áreas comunes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Áreas Disponibles</h2>
          {isManager && (
            <Link href="/reservas/areas/nueva" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
              + Agregar área
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area, i) => (
            <div
              key={i}
              className={`group bg-slate-800/40 border ${area.available ? 'border-slate-600/50 hover:border-amber-500/50 cursor-pointer hover:scale-[1.02]' : 'border-slate-700/30 opacity-60'} rounded-xl overflow-hidden transition-all duration-200`}
            >
              <div className={`h-2 bg-gradient-to-r ${area.color}`} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{area.icon}</span>
                    <div>
                      <h3 className="font-semibold text-white">{area.name}</h3>
                      <p className="text-xs text-slate-500">Capacidad: {area.capacity} personas</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${area.available ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {area.available ? 'Disponible' : 'Ocupada'}
                  </span>
                </div>
                {area.available && (
                  <Link
                    href={`/reservas/nueva?area=${encodeURIComponent(area.name)}`}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-600/30 rounded-lg py-2 text-sm font-medium transition-colors"
                  >
                    Reservar
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-6 text-center">
        <p className="text-amber-400 font-medium">🚀 Módulo en construcción</p>
        <p className="text-slate-400 text-sm mt-1">
          El sistema de reservas con calendario interactivo estará disponible tras aplicar la migración SQL.
        </p>
      </div>
    </div>
  )
}
