'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';

interface Props {
  restaurantId: string;
}

// As demais seções viram redirect('/') (PLAN.md 2.0c) — removidas do menu
// até serem reconstruídas (spec-010/2.9).
const items = [
  { icon: LayoutDashboard, label: 'Início', href: '' },
];

export default function MobileNav({ restaurantId }: Props) {
  const pathname = usePathname();
  const base = `/restaurante/${restaurantId}`;

  return (
    <nav className="mobile-nav">
      {items.map(({ icon: Icon, label, href }) => {
        const fullPath = `${base}${href}`;
        const isActive = href === '' ? pathname === fullPath : pathname.startsWith(fullPath);
        return (
          <Link key={href} href={fullPath} className={`mobile-nav-item${isActive ? ' active' : ''}`}>
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
