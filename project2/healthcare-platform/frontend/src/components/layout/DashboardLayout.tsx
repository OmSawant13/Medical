import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    user: any;
    notifications: any[];
    logout: () => void;
    role?: 'patient' | 'doctor';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    activeTab,
    setActiveTab,
    user,
    notifications,
    logout
}) => {
    const getPageTitle = () => {
        switch (activeTab) {
            case 'overview': return 'Dashboard Overview';
            case 'medical-history': return 'Medical History';
            case 'appointments': return 'My Appointments';
            case 'notifications': return 'Notifications';
            case 'settings': return 'Account Settings';
            default: return 'Dashboard';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans pb-16 md:pb-0">
            {/* Sidebar - Desktop Only */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                logout={logout}
            />

            {/* Main Content Wrapper */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Header - Sticky */}
                <Header
                    title={getPageTitle()}
                    user={user}
                    notifications={notifications}
                />

                {/* Content Area with Animation */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
                    {/* @ts-ignore */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Mobile Navigation - Bottom Bar */}
            {/* Mobile Navigation - Bottom Bar */}
            <MobileNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                role={user?.role || 'patient'}
            />
        </div>
    );
};

export default DashboardLayout;
