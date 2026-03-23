import './globals.css'
import type { Metadata } from 'next'
import { Orbitron } from 'next/font/google'

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-orbitron',
})

export const metadata: Metadata = {
  title: 'ZIII HoS',
  description: 'HoS: Operación y Mesa de Ayuda con trazabilidad ITIL.',
  icons: {
    icon: '/ziii-logo.png',
    shortcut: '/ziii-logo.png',
    apple: '/ziii-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`min-h-screen bg-gray-50 text-gray-900 ${orbitron.variable}`}>
        {children}
      </body>
    </html>
  )
}
