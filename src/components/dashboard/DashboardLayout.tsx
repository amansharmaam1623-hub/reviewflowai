import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileNav } from '@/components/dashboard/MobileNav';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-ink-50/50">
      <Sidebar />
      <main className="md:ml-[260px] min-h-screen px-4 md:px-6 py-4 md:py-4 pb-24 md:pb-6">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
