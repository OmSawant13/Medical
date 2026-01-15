import React from 'react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    logout: () => void;
    role?: 'patient' | 'doctor';
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, logout, role = 'patient' }) => {
    const menuItems = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'medical-history', label: role === 'doctor' ? 'Longer Term Patient' : 'Medical History', icon: '🩺' },
        { id: 'appointments', label: 'Appointments', icon: '📅' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen fixed top-0 left-0 z-50 transition-all duration-300">
            {/* Logo Area */}
            <div className="p-6 border-b border-gray-50 flex items-center">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl mr-3 shadow-sm text-primary-600">
                    🏥
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
                        CarePulse
                    </h1>
                    <span className="text-xs font-medium text-gray-400">Patient Portal</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 espacio-y-2 overflow-y-auto">
                <div className="font-semibold text-xs text-gray-400 uppercase tracking-wider mb-4 px-4 pt-2">Menu</div>
                <ul className="space-y-1">
                    {menuItems.map((item) => (
                        <li key={item.id}>
                            <button
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${activeTab === item.id
                                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className={`mr-3 text-lg transition-transform group-hover:scale-110 ${activeTab === item.id ? 'scale-110' : ''}`}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-50">
                <button
                    onClick={logout}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <span className="mr-3 text-lg">🚪</span>
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
