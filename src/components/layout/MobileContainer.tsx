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
}

export default function MobileContainer({ 
    children, 
    className = "bg-white", 
    justifyCenter = true,
    showSidebars = true 
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
    return (
        <div className="min-h-screen w-full bg-white lg:bg-[#F8F9FA] flex lg:flex-row">
            {/* Desktop Sidebar (Left) */}
            <Sidebar />

            {/* Main Content Area */}
            <div
                className={cn(
                    "w-full h-full min-h-screen lg:min-h-0 lg:h-screen lg:flex-1 relative flex justify-center overflow-hidden",
                    className
                )}
            >
                <div className="flex w-full max-w-full xl:max-w-[1200px] justify-center xl:gap-8 2xl:gap-16 px-0 lg:px-4">
                    {/* Page Content */}
                    <main className={cn(
                        "flex-1 w-full max-w-[600px] lg:max-w-none flex flex-col items-center overflow-y-auto no-scrollbar",
                        justifyCenter ? 'justify-center' : 'justify-start'
                    )}>
                        {children}
                    </main>

                    {/* Desktop Right Sidebar */}
                    <RightSidebar />
                </div>
            </div>

            {/* Global Notifications Drawer - accessible from any page */}
            <NotificationsDrawer
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
            />
        </div>
    );
}
