import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarWidth, setSidebarWidth] = useState(240);

  // Listen for sidebar collapse state via localStorage or context
  // For now, we'll use a simple approach
  useEffect(() => {
    const checkWidth = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        setSidebarWidth(sidebar.offsetWidth);
      }
    };
    
    checkWidth();
    const observer = new ResizeObserver(checkWidth);
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      observer.observe(sidebar);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.main
        initial={false}
        animate={{ 
          marginLeft: isMobile ? 0 : sidebarWidth,
          paddingTop: isMobile ? 60 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "min-h-screen transition-all duration-300",
          "p-4 md:p-6 lg:p-8"
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  );
}
