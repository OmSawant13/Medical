import React from 'react';

interface AppointmentCardProps {
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
    type: string;
    status: string;
    meetingLink?: string;
    onJoinCheck?: () => void;
    onQrCode?: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
    doctorName,
    specialty,
    date,
    time,
    type,
    status,
    meetingLink,
    onJoinCheck,
    onQrCode
}) => {
    return (
        <div className="group flex items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-100 shadow-sm hover:shadow-md transition-all duration-200">
            {/* Date Box */}
            <div className="flex-shrink-0 w-16 h-16 bg-primary-50 rounded-xl flex flex-col items-center justify-center text-primary-600 mr-5">
                <span className="text-xs font-bold uppercase">{new Date(date).toLocaleDateString('en-US', { month: 'short' })}</span>
                <span className="text-xl font-bold">{new Date(date).getDate()}</span>
            </div>

            {/* Info */}
            <div className="flex-grow">
                <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{doctorName}</h4>
                <p className="text-sm text-gray-500 mb-1">{specialty} • {type === 'video' ? 'Video Call' : 'In-Person'}</p>
                <div className="flex items-center text-xs text-gray-400 font-medium">
                    <span className="mr-3">🕒 {time}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {status}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {meetingLink && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onJoinCheck?.(); }}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        title="Join Video Call"
                    >
                        📹
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onQrCode?.(); }}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title="View QR Code"
                >
                    📱
                </button>
            </div>
        </div>
    );
};

export default AppointmentCard;
