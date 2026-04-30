import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import NotificationsDrawer from '@/components/home/NotificationsDrawer';
import { cn } from '@/lib/utils';

interface MobileContainerProps {
    children: React.ReactNode;
    className?: string;
    justifyCenter?: boolean;
    showSidebars?: boolean;
    hideRightSidebar?: boolean;
}

export default function MobileContainer({
    children,
    className,
    justifyCenter = true,
    showSidebars = true,
    hideRightSidebar = false,
}: MobileContainerProps) {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Global listener for the Sidebar notification toggle
    useEffect(() => {
        if (!showSidebars) return;
        const handleToggle = () => setIsNotificationsOpen(prev => !prev);
        window.addEventListener('toggleNotifications', handleToggle);
        return () => window.removeEventListener('toggleNotifications', handleToggle);
    }, [showSidebars]);

    // Auth/onboarding pages: card layout centered on gradient background
    if (!showSidebars) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#EAF6FD] via-[#F0F8FF] to-[#E8F4F8] dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] p-4">
                <div className={cn(
                    "w-full max-w-[440px] bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col transition-colors duration-300",
                    className
                )}>
                    {children}
                </div>
            </div>
        );
    }

    // App pages: full sidebar layout
    return (
        <div className="min-h-screen w-full bg-white dark:bg-black transition-colors duration-300 flex lg:flex-row">
            {/* Desktop Sidebar (Left) — fixed */}
            <Sidebar />

            {/* Main Content Area */}
            <div
                className={cn(
                    "w-full lg:ml-[72px] flex justify-center text-black dark:text-white",
                    className
                )}
            >
                {/* 
                   Centered unit consisting of Feed + RightSidebar.
                   We use max-w-7xl to keep it reasonably centered on large screens.
                */}
                <div className="flex w-full max-w-[1010px] justify-center lg:justify-between gap-0 lg:gap-8 xl:gap-16 px-0 lg:px-4 items-start">
                    
                    {/* Page Content (Feed) */}
                    <main className={cn(
                        "w-full flex flex-col items-center",
                        hideRightSidebar
                            ? 'max-w-[700px] lg:max-w-[800px]'
                            : 'max-w-full lg:max-w-[630px]', // Instagram post size is ~630px
                        justifyCenter ? 'justify-center min-h-screen' : 'justify-start'
                    )}>
                        {children}
                    </main>

                    {/* Desktop Right Sidebar — sticky, hidden on profile/specific pages */}
                    {!hideRightSidebar && (
                        <div className="hidden lg:block w-[320px] flex-shrink-0">
                            <RightSidebar />
                        </div>
                    )}
                </div>
            </div>

            {/* Global Notifications Drawer */}
            <NotificationsDrawer
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
            />
        </div>
    );
}
