'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, FileText, Settings, Users } from 'lucide-react';

export function MembersNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/members',
      icon: Home,
    },
    {
      name: 'Grants',
      href: '/members/grants',
      icon: FileText,
    },
    {
      name: 'Team',
      href: '/members/team',
      icon: Users,
    },
    {
      name: 'Settings',
      href: '/members/settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              isActive ? 'bg-accent' : 'transparent',
              'transition-colors'
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
