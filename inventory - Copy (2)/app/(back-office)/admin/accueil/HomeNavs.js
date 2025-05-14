import { Building2 } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';
export default function HomeNavs() {
  const pathname = usePathname();

  const navLinks = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Getting Started", href: "/dashboard/home/getting-started" },
    { title: "Recent Updates", href: "/dashboard/home/recent-updates" },
    { title: "Announcements", href: "/dashboard/home/announcements" },
  ];
  console.log(pathname);

  return (
    <div className="h-32 border-b p-5 bg-[url('https://res.cloudinary.com/dnkd2ksye/image/upload/v1740219356/altuue8kjeqzeltvthdg.svg')] bg-no-repeat bg-cover bg-center">
      <div className='flex space-x-3'>
        <div className='flex w-12 h-12 items-center justify-center rounded-lg bg-white'>
          <Building2 />
        </div>
        <div className='flex flex-col'>
          <p className='font-bold'>Hello, WebDevelopper</p>
          <span className='text-xs'>BHRhouma</span>
        </div>
      </div>
      <nav className='sticky bottom-0 mt-6 flex space-x-3'>
        {navLinks.map((items, i) => (
          <Link href={items.href} key={i} className={`${pathname===items.href?"py-1 border-b-2 border-blue-700":"py-1"}`}>
            <span className='px-4 text-sm font-medium hover:text-gray-800'>{items.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}