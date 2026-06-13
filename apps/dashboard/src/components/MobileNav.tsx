'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Star, Ticket, Users, Send } from 'lucide-react';

interface Props {
  restaurantId: string;
}

const items = [
  { icon: LayoutDashboard, label: 'Início',     href: '' },
  { icon: Star,            label: 'Avaliações', href: '/avaliacoes' },
  { icon: Ticket,          label: 'Fidelidade', href: '/wallet' },
  { icon: Users,           label: 'Clientes',   href: '/clientes' },
  { icon: Send,            label: 'Campanhas',  href: '/campanhas' },
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
