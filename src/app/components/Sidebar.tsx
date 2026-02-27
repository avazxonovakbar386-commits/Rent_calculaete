import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Calculator, User } from 'lucide-react';
import { cn } from './ui/utils';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Uylar',
    href: '/properties',
    icon: Building2,
  },
  {
    title: 'Ijarachilar',
    href: '/tenants',
    icon: Users,
  },
  {
    title: 'Kalkulyator',
    href: '/calculator',
    icon: Calculator,
  },
  {
    title: 'Profil',
    href: '/profile',
    icon: User,
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)]">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
