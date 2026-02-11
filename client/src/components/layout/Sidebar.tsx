import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  FileText,
  Users,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Shell,
  BarChart3,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  external?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders/new', icon: ShoppingCart, label: 'New Order' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Header */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b border-sidebar-border",
        isCollapsed && !isMobile ? "justify-center" : "justify-start"
      )}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden bg-white"
        >
          <img src="/logo.jpeg" alt=" Oysterponds" className="w-full h-full object-cover" />
        </motion.div>
        <AnimatePresence>
          {(!isCollapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <span className="font-semibold text-sidebar-foreground text-sm leading-tight">
                Oysterponds
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                Shellfish Co.
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <NavLink
                to={item.to}
                onClick={() => isMobile && setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent group",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
                  isCollapsed && !isMobile ? "justify-center" : "justify-start"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                  "group-hover:scale-110",
                  isActive && "text-sidebar-primary-foreground"
                )} />
                <AnimatePresence>
                  {(!isCollapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Customer Portal Link */}
      {/* <div className="p-2 border-t border-sidebar-border">
        <motion.a
          href="/order/bluefin"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            isCollapsed && !isMobile ? "justify-center" : "justify-start"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-xs whitespace-nowrap overflow-hidden"
              >
                Customer Portal
              </motion.span>
            )}
          </AnimatePresence>
        </motion.a>
      </div> */}

      {/* User Info & Logout */}
      <div className="p-2 border-t border-sidebar-border">
        {(!isCollapsed || isMobile) && user?.name && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-sidebar-foreground/90 truncate">{user.name}</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10",
            isCollapsed && !isMobile ? "justify-center" : "justify-start gap-3"
          )}
        >
          <LogOut className="w-4 h-4" />
          {(!isCollapsed || isMobile) && <span className="text-xs">Sign Out</span>}
        </Button>
      </div>

      {/* Collapse Toggle (Desktop only) */}
      {!isMobile && (
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className={cn(
              "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            {!isCollapsed && <span className="text-xs">Collapse</span>}
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile View
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-sidebar-border"
          style={{ backgroundColor: 'hsl(197 25% 18%)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white">
              <img src="/logo.jpeg" alt="Oysterponds" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-sidebar-foreground text-sm">
              Oysterponds
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobile}
            className="text-sidebar-foreground"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={toggleMobile}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-64"
                style={{ backgroundColor: 'hsl(197 25% 18%)' }}
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop View
  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 z-40 border-r border-sidebar-border"
      style={{ backgroundColor: 'hsl(197 25% 18%)' }}
    >
      {sidebarContent}
    </motion.aside>
  );
}
