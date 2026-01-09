import React from 'react';
import { motion } from 'framer-motion';

interface MobileNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    role?: 'patient' | 'doctor';
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, role = 'patient' }) => {
    const patientNavItems = [
        { id: 'overview', label: 'Home', icon: '🏠' },
        { id: 'appointments', label: 'Visits', icon: '📅' },
        { id: 'medical-history', label: 'History', icon: '🩺' },
        { id: 'notifications', label: 'Alerts', icon: '🔔' },
        { id: 'settings', label: 'Profile', icon: '👤' },
    ];

    const doctorNavItems = [
        { id: 'overview', label: 'Home', icon: '🏠' },
        { id: 'appointments', label: 'Queue', icon: '👥' },
        { id: 'patients', label: 'Patients', icon: '📁' },
        { id: 'reports', label: 'Stats', icon: '📊' },
        { id: 'settings', label: 'Profile', icon: '👤' },
    ];

    const navItems = role === 'doctor' ? doctorNavItems : patientNavItems;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${activeTab === item.id
                            ? 'text-medical-600'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="nav-pill"
                                className="absolute -top-[1px] w-12 h-1 bg-medical-500 rounded-b-lg"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className={`text-xl transition-all duration-200 ${activeTab === item.id ? '-translate-y-0.5 scale-110' : ''
                            }`}>
                            {item.icon}
                        </span>
                        <span className="text-[10px] font-medium tracking-wide">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default MobileNav;
