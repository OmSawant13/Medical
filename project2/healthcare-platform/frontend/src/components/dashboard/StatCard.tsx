import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    color: 'blue' | 'green' | 'purple' | 'yellow' | 'teal';
    trend?: string;
    trendUp?: boolean;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, trend, trendUp, onClick }) => {
    const colorMap = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        teal: 'bg-teal-50 text-teal-600',
    };

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group relative overflow-hidden`}
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${colorMap[color]}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{value}</h3>
            </div>

            {/* Decorative background element */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 ${colorMap[color].split(' ')[0].replace('50', '200')}`} />
        </div>
    );
};

export default StatCard;
