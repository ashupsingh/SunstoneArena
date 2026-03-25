"use client";
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
    const pathname = usePathname();
    const hideNavbar = ['/login', '/signup', '/forgot-password', '/superadmin', '/dashboard'].includes(pathname);

    if (hideNavbar) return null;
    return <Navbar />;
}
