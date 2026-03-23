import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSafeServerUser } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canManageResidents, canViewResidents } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function ResidentesPage() {
  const user = await getSafeServerUser()
  if (!user) redirect('/login')

  const supabase = createSupabaseAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !canViewResidents(profile as any)) redirect('/hub')

  const isManager = canManageResidents(profile as any)

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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link href="/hub" className="hover:text-white transition-colors">Hub</Link>
            <span>/</span>
            <span className="text-white">Residentes</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Gestión de Residentes</h1>
          <p className="text-slate-400 mt-1">Directorio, unidades y administración de la comunidad</p>
        </div>
        {isManager && (
          <Link
            href="/residentes/nuevo"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Residente
          </Link>
        )}
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Unidades', value: '0', icon: '🏠', color: 'text-blue-400' },
          { label: 'Residentes Activos', value: '0', icon: '👥', color: 'text-emerald-400' },
          { label: 'Cuentas Morosas', value: '0', icon: '⚠️', color: 'text-amber-400' },
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

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Opciones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleModules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`group bg-slate-800/40 border ${mod.color} rounded-xl p-6 transition-all duration-200 hover:bg-slate-800/70 hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{mod.icon}</span>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">{mod.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{mod.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-violet-950/40 border border-violet-800/40 rounded-xl p-6 text-center">
        <p className="text-violet-400 font-medium">🚀 Módulo en construcción</p>
        <p className="text-slate-400 text-sm mt-1">
          Las funciones de gestión de residentes estarán disponibles tras aplicar la migración SQL.
        </p>
      </div>
    </div>
  )
}
