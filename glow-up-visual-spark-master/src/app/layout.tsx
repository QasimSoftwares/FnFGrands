import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { GrantProvider } from '@/contexts/grant-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Grant Tracker',
  description: 'Family and Fellows Foundation Grant Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${inter.className} min-h-full bg-white dark:bg-[#0a0a0a] transition-colors`}>
        <AuthProvider>
          <GrantProvider>
            <div className="min-h-screen">
              {children}
            </div>
          </GrantProvider>
        </AuthProvider>
      </body>
    </html>
  )
}