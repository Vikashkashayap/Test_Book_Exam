/** Shared active-state logic for portal sidebars */
export function isSidebarLinkActive(pathname: string, href: string): boolean {
  if (href === '/admin' || href === '/dashboard') {
    return pathname === href;
  }

  if (href === '/history') {
    return pathname === '/history' || pathname.startsWith('/results/');
  }

  if (href === '/tests') {
    return pathname === '/tests' || pathname.startsWith('/tests/');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
