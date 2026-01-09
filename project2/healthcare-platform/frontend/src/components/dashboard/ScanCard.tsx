import React from 'react';

interface ScanCardProps {
    type: string;
    date: string;
    status: string;
    confidence?: number;
    onClick?: () => void;
}

const ScanCard: React.FC<ScanCardProps> = ({ type, date, status, confidence, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-primary-100 transition-all cursor-pointer"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xl group-hover:scale-110 transition-transform">
                    📄
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${status === 'analysis_complete' ? 'bg-indigo-50 text-indigo-600' :
                        status === 'processing' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-500'
                    }`}>
                    {status.replace('_', ' ')}
                </span>
            </div>

            <h4 className="font-bold text-gray-800 text-sm mb-1 truncate">{type}</h4>
            <p className="text-xs text-gray-400 mb-3">{new Date(date).toLocaleDateString()}</p>

            {confidence && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${confidence * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default ScanCard;
