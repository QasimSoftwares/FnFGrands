import { Metadata } from 'next'
import { GrantProvider } from '@/contexts/grant-context'

export const metadata: Metadata = {
  title: 'Grant Management | Family and Fellows Foundation',
  description: 'Manage grant applications for the Family and Fellows Foundation',
}

export default function GrantsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GrantProvider>
      {children}
    </GrantProvider>
  )
}
