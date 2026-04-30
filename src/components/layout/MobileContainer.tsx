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
    className = "bg-white",
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
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#EAF6FD] via-[#F0F8FF] to-[#E8F4F8] p-4">
                <div className={cn(
                    "w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col",
                    className
                )}>
                    {children}
                </div>
            </div>
        );
    }

    // App pages: full sidebar layout
    // Key: NO overflow-y-auto / h-screen on inner containers — the browser window scrolls naturally
    // so the scrollbar appears at the far right edge of the viewport (like Instagram).
    // RightSidebar uses sticky top-0 so it follows the scroll.
    return (
        <div className="min-h-screen w-full bg-white lg:bg-[#F8F9FA] flex lg:flex-row">
            {/* Desktop Sidebar (Left) — fixed, doesn't participate in flex flow */}
            <Sidebar />

            {/* Main scrollable area — offset by sidebar width */}
            <div
                className={cn(
                    "w-full lg:ml-[72px] flex justify-center",
                    className
                )}
            >
                <div className="flex w-full max-w-full xl:max-w-[1200px] justify-center xl:gap-8 2xl:gap-16 px-0 lg:px-4 items-start">
                    {/* Page Content */}
                    <main className={cn(
                        "flex-1 w-full flex flex-col items-center",
                        hideRightSidebar
                            ? 'max-w-[700px] lg:max-w-[750px] xl:max-w-[800px]'
                            : 'max-w-[600px] lg:max-w-none',
                        justifyCenter ? 'justify-center min-h-screen' : 'justify-start'
                    )}>
                        {children}
                    </main>

                    {/* Desktop Right Sidebar — sticky, hidden on profile pages */}
                    {!hideRightSidebar && <RightSidebar />}
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
