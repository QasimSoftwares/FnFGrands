'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import { UserRole } from '@/types';

type RoleSwitcherProps = {
  roles: UserRole[];
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
};

export function RoleSwitcher({ roles, currentRole, onRoleChange }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (roles.length <= 1) {
    return (
      <div className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700">
        {currentRole}
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 border-gray-300 bg-white hover:bg-gray-50"
        >
          <span className="capitalize">{currentRole}</span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen ? 'rotate-180' : '')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <div className="px-2 py-1.5 text-xs font-medium text-gray-500">Switch Role</div>
        {roles.map((role) => (
          <DropdownMenuItem
            key={role}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              currentRole === role ? 'bg-gray-100' : ''
            )}
            onClick={() => {
              onRoleChange(role);
              setIsOpen(false);
            }}
          >
            <span className="capitalize">{role}</span>
            {currentRole === role && <Check className="h-4 w-4 text-blue-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
