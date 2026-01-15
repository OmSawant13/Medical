import React from 'react';

interface HeaderProps {
    title: string;
    user: any;
    notifications: any[];
}

const Header: React.FC<HeaderProps> = ({ title, user, notifications }) => {
    const [showNotifications, setShowNotifications] = React.useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Sort notifications: unread first, then by date
    const sortedNotifications = [...notifications].sort((a, b) => {
        if (a.isRead === b.isRead) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.isRead ? 1 : -1;
    });

    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between">
            {/* Page Title */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h2>
                <p className="text-sm text-gray-400 font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-6">
                {/* Search Bar (Visual Only for now) */}
                <div className="hidden md:flex items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-100 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                    <span className="text-gray-400 mr-2">🔍</span>
                    <input
                        type="text"
                        placeholder="Search docs, dates..."
                        className="bg-transparent border-none outline-none text-sm text-gray-600 placeholder-gray-400 w-48"
                    />
                </div>

                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <span className="text-xl">🔔</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                            <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-700 text-sm">Notifications</h3>
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">{unreadCount} New</span>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {sortedNotifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">
                                        No new notifications
                                    </div>
                                ) : (
                                    sortedNotifications.map((notif: any) => (
                                        <div
                                            key={notif._id}
                                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 h-2 w-2 rounded-full ${notif.type === 'emergency_appointment' ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`}></div>
                                                <div>
                                                    <p className={`text-sm ${notif.type === 'emergency_appointment' ? 'text-red-600 font-bold' : 'text-gray-800 font-medium'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-2">
                                                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="flex items-center space-x-3 pl-2 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors">
                    <div className="h-10 w-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm text-lg">
                        {user?.name?.charAt(0) || 'P'}
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-bold text-gray-700 leading-tight">{user?.name || 'Patient'}</p>
                        <p className="text-xs text-primary-500 font-medium">View Profile</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
