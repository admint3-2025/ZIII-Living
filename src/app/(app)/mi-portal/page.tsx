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
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
          <Link href="/hub" className="hover:text-white transition-colors">Hub</Link>
          <span>/</span>
          <span className="text-white">Mi Portal</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Mi Portal</h1>
        <p className="text-slate-400 mt-1">
          {resident
            ? `Bienvenido, ${profile.full_name || 'Residente'}. Aquí puedes consultar tu información financiera y más.`
            : 'Vista del portal de residente (modo administrador)'}
        </p>
      </div>

      {/* Estado de cuenta */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Unidad</p>
              <p className="text-2xl font-bold text-white">{(profile as any).unit_number || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-amber-400">$0.00</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-700/50">
          {[
            { label: 'Al Corriente', icon: '✅', color: 'text-emerald-400' },
            { label: 'Cuota Mensual', icon: '📅', color: 'text-blue-400' },
            { label: 'Multas Activas', icon: '⚠️', color: 'text-amber-400' },
          ].map((item, i) => (
            <div key={i} className="p-4 text-center">
              <span className="text-2xl">{item.icon}</span>
              <p className={`text-sm font-medium mt-1 ${item.color}`}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            href: '/finanzas',
            title: 'Estado de Cuenta',
            desc: 'Consulta tus movimientos, pagos e historial financiero',
            icon: '📊',
            color: 'border-emerald-500/40 hover:border-emerald-400',
          },
          {
            href: '/reservas',
            title: 'Reservar Área Común',
            desc: 'Salón, alberca, gimnasio y más espacios disponibles',
            icon: '📅',
            color: 'border-amber-500/40 hover:border-amber-400',
          },
          {
            href: '/votaciones',
            title: 'Votaciones Activas',
            desc: 'Participa en decisiones importantes de la comunidad',
            icon: '🗳️',
            color: 'border-cyan-500/40 hover:border-cyan-400',
          },
          {
            href: '/tickets?view=mine',
            title: 'Mis Solicitudes',
            desc: 'Reporta problemas de mantenimiento o soporte técnico',
            icon: '🎫',
            color: 'border-violet-500/40 hover:border-violet-400',
          },
          {
            href: '/politicas',
            title: 'Reglamento',
            desc: 'Consulta las normas y políticas del condominio',
            icon: '📋',
            color: 'border-indigo-500/40 hover:border-indigo-400',
          },
          {
            href: '/control-acceso/invitaciones',
            title: 'Invitar Visitantes',
            desc: 'Genera un código QR de acceso para tus visitas',
            icon: '🎫',
            color: 'border-pink-500/40 hover:border-pink-400',
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group bg-slate-800/40 border ${item.color} rounded-xl p-5 transition-all duration-200 hover:bg-slate-800/70 hover:scale-[1.01]`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <h3 className="font-semibold text-white group-hover:text-sky-300 transition-colors">{item.title}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Últimas notificaciones */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Últimas Notificaciones</h2>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-slate-400">No hay notificaciones recientes.</p>
        </div>
      </div>
    </div>
  )
}
