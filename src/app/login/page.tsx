import Image from 'next/image'
import { Suspense } from 'react'
import LoginForm from './ui/LoginForm'

export default async function LoginPage() {
  return (
    <main className="min-h-screen flex bg-slate-950">
      {/* Panel izquierdo - Mensaje */}
      <section className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="absolute -top-48 -left-48 w-[520px] h-[520px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <Image
              src="/ziii-logo.png"
              alt="ZIII Living"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-semibold tracking-wider text-emerald-200 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              COMMUNITY OPERATIONS
            </span>
          </div>

          <h1 className="mt-10 text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Plataforma integral
            <br />
            <span className="text-cyan-300">para comunidades residenciales</span>
          </h1>
          <p className="mt-6 max-w-xl text-base xl:text-lg leading-relaxed text-slate-300">
            Opera administración, residentes, accesos, mantenimiento, finanzas y soporte desde una sola capa de control,
            con trazabilidad completa para propiedades y equipos operativos.
          </p>

          <div className="mt-10 space-y-6 max-w-xl">
            <div className="flex gap-4">
              <div className="mt-1 h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Operación residencial centralizada</div>
                <div className="mt-1 text-sm text-slate-300">
                  Administración de propiedades, residentes, activos, usuarios y operación multisede en una sola vista.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M4 11h16M7 15h2m-2 4h2m6-4h2m-2 4h2" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Calendarios, reservas y seguimiento</div>
                <div className="mt-1 text-sm text-slate-300">
                  Mantenimientos, amenidades, visitas e inspecciones con reglas claras, evidencia y visibilidad para administración.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 h-10 w-10 rounded-xl bg-slate-50/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Seguridad, control y transparencia</div>
                <div className="mt-1 text-sm text-slate-300">
                  Bitácoras, auditoría, roles y contexto operativo para cada sesión, movimiento y módulo del ecosistema Living.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-10 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Propiedades y comunidades</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Permisos por rol</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Trazabilidad completa</span>
          </div>
        </div>
      </section>

      {/* Panel derecho - Formulario */}
      <section className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center">
            <Image src="/ziii-logo.png" alt="ZIII Living" width={64} height={64} className="h-16 w-16 object-contain" />
            <h2 className="mt-6 text-xl font-bold text-slate-900">Bienvenido a ZIII Living</h2>
            <p className="mt-1 text-sm text-slate-500">Plataforma integral para gestión comunitaria y residencial</p>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-7">
            <Suspense fallback={<div className="text-sm text-slate-500">Cargando…</div>}>
              <LoginForm />
            </Suspense>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Administración • Residentes • Finanzas • Accesos • Mantenimiento • Service Desk
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Operación segura, multirol y lista para comunidades</span>
          </div>
        </div>
      </section>
    </main>
  )
}
