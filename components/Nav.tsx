'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/calculadora', label: 'Calculadora' },
  { href: '/presupuestos', label: 'Presupuestos' },
  { href: '/prendas', label: 'Prendas' },
  { href: '/dtf', label: 'DTF' },
  { href: '/packaging', label: 'Packaging' },
  { href: '/configuracion', label: 'Configuración' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <span className="brand">Finol&apos;s</span>
        <nav className="nav-links">
          {LINKS.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={`nav-link${active ? ' active' : ''}`}>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}