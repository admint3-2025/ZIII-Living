import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSafeServerUser } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canManageAccessControl, canViewAccessLog } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function ControlAccesoPage() {
  const user = await getSafeServerUser()
  if (!user) redirect('/login')

  const supabase = createSupabaseAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !canViewAccessLog(profile as any)) redirect('/hub')

  const isGuard = profile.role === 'security_guard'
  const isManager = canManageAccessControl(profile as any)

  const subModules = [
    {
      href: '/control-acceso/scanner',
      title: 'Escanear QR',
      desc: 'Lectura rápida de códigos QR de residentes y visitantes',
      icon: '📷',
      color: 'border-red-500/40 hover:border-red-400',
      highlight: isGuard,
    },
    {
      href: '/control-acceso/visitantes',
      title: 'Registro de Visitantes',
      desc: 'Registrar, buscar y gestionar visitas en tiempo real',
      icon: '👤',
      color: 'border-orange-500/40 hover:border-orange-400',
    },
    {
      href: '/control-acceso/bitacora',
      title: 'Bitácora de Accesos',
      desc: 'Historial completo de entradas y salidas',
      icon: '📒',
      color: 'border-amber-500/40 hover:border-amber-400',
    },
    {
      href: '/control-acceso/invitaciones',
      title: 'Invitaciones / QR',
      desc: 'Generar pases QR de acceso para visitantes esperados',
      icon: '🎫',
      color: 'border-pink-500/40 hover:border-pink-400',
    },
    {
      href: '/control-acceso/proveedores',
      title: 'Proveedores',
      desc: 'Registro y control de acceso de proveedores y contratistas',
      icon: '🔧',
      color: 'border-cyan-500/40 hover:border-cyan-400',
    },
    {
      href: '/control-acceso/alertas',
      title: 'Alertas de Seguridad',
      desc: 'Incidentes, accesos no autorizados y reportes',
      icon: '🚨',
      color: 'border-red-600/40 hover:border-red-500',
      adminOnly: true,
    },
  ]

  const visibleModules = subModules.filter(m => !m.adminOnly || isManager)

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 text-slate-900">
      <section className="relative overflow-hidden rounded-3xl border border-rose-100 bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.14),_transparent_34%),linear-gradient(135deg,#fffdfd_0%,#fff3f5_45%,#ffffff_100%)] p-6 shadow-[0_18px_42px_-30px_rgba(244,63,94,0.22)] lg:p-7">
        <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-rose-200/35 blur-3xl" />
        <div className="relative grid gap-4 xl:grid-cols-[1.35fr,0.95fr] xl:items-end">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/hub" className="font-medium transition-colors hover:text-rose-700">Hub</Link>
              <span>/</span>
              <span className="font-semibold text-rose-700">Control de Acceso</span>
            </div>
            <span className="inline-flex rounded-full border border-rose-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-700">
              Seguridad y operación de acceso
            </span>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Un panel de acceso que sí parece una consola de operación y vigilancia.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Diseñado para guardias y administración: lectura rápida de visitantes, QR, incidencias y bitácora, sin apariencia de
              demo genérica ni tarjetas grises sin intención.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Modo operativo</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{isGuard ? 'Guardia' : 'Administración'}</p>
              <p className="mt-1 text-sm text-slate-500">La interfaz prioriza escaneo, registro en sitio y seguimiento de incidentes.</p>
            </div>
            <Link
              href="/control-acceso/scanner"
              className="rounded-2xl border border-rose-200 bg-rose-600 p-4 text-white shadow-sm transition-colors hover:bg-rose-700"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-100">Acción primaria</p>
              <p className="mt-2 text-2xl font-semibold">Escanear QR</p>
              <p className="mt-1 text-sm text-rose-100">Ingreso inmediato de visitantes, residentes e invitaciones.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Visitantes Activos', value: '0', icon: '👤', accent: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Entradas Hoy', value: '0', icon: '🟢', accent: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Salidas Hoy', value: '0', icon: '🔴', accent: 'bg-slate-50 text-slate-700 border-slate-100' },
          { label: 'Alertas Activas', value: '0', icon: '🚨', accent: 'bg-amber-50 text-amber-700 border-amber-100' },
        ].map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)]">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${stat.accent}`}>
              <span>{stat.icon}</span>
              {stat.label}
            </div>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">Se alimentará con la bitácora real de ingresos y salidas.</p>
          </article>
        ))}
      </section>

      {isGuard && (
        <section className="rounded-3xl border border-rose-100 bg-[linear-gradient(180deg,#fff6f6_0%,#ffffff_100%)] p-6 shadow-[0_18px_42px_-30px_rgba(244,63,94,0.14)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">Panel táctico</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Acciones rápidas para caseta</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Consolida las dos tareas más frecuentes del guardia: validar un pase y registrar una visita en sitio.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
              <Link href="/control-acceso/scanner" className="rounded-xl bg-rose-600 px-5 py-4 text-center text-sm font-semibold text-white transition-colors hover:bg-rose-700">
                Escanear QR
              </Link>
              <Link href="/control-acceso/visitantes/nuevo" className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-semibold text-slate-700 transition-colors hover:border-rose-200 hover:text-rose-700">
                Registrar visita
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.20)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">Herramientas de acceso</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Componentes del centro de vigilancia</h2>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleModules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`group rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fff7f8_100%)] p-5 transition-all duration-200 hover:border-rose-200 hover:shadow-[0_14px_28px_-22px_rgba(244,63,94,0.20)] ${mod.highlight ? 'ring-2 ring-rose-200' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-3xl">{mod.icon}</span>
                {mod.highlight ? <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-700">Prioridad</span> : null}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900 transition-colors group-hover:text-rose-700">{mod.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{mod.desc}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-slate-600 group-hover:text-rose-700">
                <span>Entrar</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
