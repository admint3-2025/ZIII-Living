import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/ziii-logo.png"
              alt="ZIII Living"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
            <div className="text-xs text-slate-400">
              <span className="font-medium text-slate-200">ZIII Living</span>
              <span className="mx-2 text-slate-700">•</span>
              <span>Gestión comunitaria</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/profile" className="text-slate-500 transition-colors hover:text-slate-300">
              Mi Perfil
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/admin/knowledge-base" className="text-slate-500 transition-colors hover:text-slate-300">
              Centro de ayuda
            </Link>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span>v2.1.0</span>
            <span className="text-slate-700">•</span>
            <span>© {new Date().getFullYear()} ZIII Living</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="uppercase tracking-wider">Activo</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

