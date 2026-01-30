import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, History, Menu, Wallet, Package, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { to: '/', label: 'DSR', icon: FileText },
  { to: '/history', label: 'Sales History', icon: History },
  { to: '/collection-history', label: 'Collection History', icon: Wallet },
  { to: '/extra-area', label: 'Extra Area', icon: MapPin },
];

const NavLinks = ({ onClick }: { onClick?: () => void }) => (
  <>
    {navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive
              ? 'bg-white/20 text-white'
              : 'text-white/80 hover:bg-white/10 hover:text-white'
          )
        }
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </NavLink>
    ))}
  </>
);

export const Sidebar: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 gradient-header min-h-screen p-4 relative z-10">
        <div className="flex items-center gap-3 px-4 py-6 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Sales Monitor</h1>
            <p className="text-xs text-white/70">Tracking System</p>
          </div>
        </div>
        
        <nav className="flex flex-col gap-2">
          <NavLinks />
        </nav>
        
        <div className="mt-auto p-4 rounded-lg bg-white/10 text-white/80 text-xs">
          <p className="font-medium text-white mb-1">Sales Monitoring v1.0</p>
          <p>Track • Analyze • Report</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden gradient-header p-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">Sales Monitor</h1>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="gradient-header border-0 w-64 p-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Sales Monitor</span>
              </div>
            </div>
            <nav className="flex flex-col gap-2">
              <NavLinks onClick={() => setOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
