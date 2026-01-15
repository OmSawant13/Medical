
import React, { useEffect, useState, useRef } from 'react';

interface InteractiveDoctorsProps {
    isPasswordFocused: boolean;
    isEmailFocused?: boolean;
}

const InteractiveDoctors: React.FC<InteractiveDoctorsProps> = ({ isPasswordFocused, isEmailFocused }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // Use refs for smooth animation loop values
    const targetPos = useRef({ x: 0, y: 0 });
    const currentPos = useRef({ x: 0, y: 0 });
    const [renderPos, setRenderPos] = useState({ x: 0, y: 0 }); // Trigger re-render
    const [isBlinking, setIsBlinking] = useState(false);
    const requestRef = useRef<number>();

    // Lerp helper
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    useEffect(() => {
        // Simplified Animation Loop (Focus on smoothness)
        const animate = () => {
            currentPos.current.x = lerp(currentPos.current.x, targetPos.current.x, 0.08);
            currentPos.current.y = lerp(currentPos.current.y, targetPos.current.y, 0.08);
            setRenderPos({ ...currentPos.current });
            requestRef.current = requestAnimationFrame(animate);
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            targetPos.current = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        };

        window.addEventListener('mousemove', handleMouseMove);
        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    useEffect(() => {
        const blinkLoop = () => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
            setTimeout(blinkLoop, Math.random() * 3000 + 2000);
        };
        const timeoutId = setTimeout(blinkLoop, 2000);
        return () => clearTimeout(timeoutId);
    }, []);

    const getPupilStyle = (eyeCenterX: number, eyeCenterY: number, limit = 5) => {
        if (isPasswordFocused) {
            return { transform: `translate(0px, -${limit * 1.5}px)`, transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' };
        }
        const dx = renderPos.x - eyeCenterX;
        const dy = renderPos.y - eyeCenterY;
        const angle = Math.atan2(dy, dx);
        const distance = Math.min(limit, Math.hypot(dx, dy) / 15);
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        return { transform: `translate(${x}px, ${y}px)` };
    };

    const Eye = ({ cx, cy, r = 8, pupilR = 3.5, limit = 4, blinking = false }: any) => {
        if (isPasswordFocused || blinking) {
            return (
                <path
                    d={`M${cx - r},${cy} Q${cx},${cy + 4} ${cx + r},${cy}`}
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
            );
        }
        return (
            <g>
                <circle cx={cx} cy={cy} r={r} fill="white" />
                <circle cx={cx} cy={cy} r={pupilR} fill="#1E293B" style={getPupilStyle(cx, cy, limit)} />
            </g>
        );
    };

    // Eyebrow Component for expression
    const Eyebrow = ({ cx, cy, isAngry = false, isHappy = false }: any) => {
        const yOffset = isHappy ? -5 : isAngry ? 2 : 0;
        const rotate = isAngry ? 15 : isHappy ? -10 : 0;

        return (
            <path
                d={`M${cx - 8},${cy} Q${cx},${cy - 3} ${cx + 8},${cy}`}
                stroke="#1E293B"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                style={{
                    transform: `translateY(${yOffset}px) rotate(${rotate}deg)`,
                    transformOrigin: `${cx}px ${cy}px`,
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            />
        );
    };

    const getAnimationClass = (baseDelay = 0) => {
        if (isEmailFocused) return `animate-happy-bounce`;
        if (isPasswordFocused) return ``;
        return `animate-breathe`;
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center relative overflow-hidden bg-transparent"
        >
            <style>{`
        @keyframes happy-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); } 
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-happy-bounce {
          animation: happy-bounce 0.6s infinite cubic-bezier(0.45, 0.05, 0.55, 0.95); 
        }
        .animate-breathe {
          animation: breathe 3s infinite ease-in-out;
        }
      `}</style>

            <svg width="400" height="400" viewBox="0 0 400 400" className="transform scale-125 lg:scale-150 transition-transform duration-500 drop-shadow-xl">

                {/* 1. Tall Guy (Professional Slate) */}
                <g transform="translate(80, 100)">
                    <g className={getAnimationClass(0)} style={{ animationDelay: '0s' }}>
                        <rect x="0" y="0" width="90" height="200" rx="40" fill="#475569" />
                        <rect x="0" y="0" width="90" height="190" rx="40" fill="#64748B" />

                        <g transform="translate(45, 60)">
                            <Eyebrow cx={-20} cy={-12} isHappy={isEmailFocused} isAngry={isPasswordFocused} />
                            <Eyebrow cx={20} cy={-12} isHappy={isEmailFocused} isAngry={isPasswordFocused} />

                            <Eye cx={-20} cy={0} r={12} pupilR={5} blinking={isBlinking} />
                            <Eye cx={20} cy={0} r={12} pupilR={5} blinking={isBlinking} />



                            {/* Simple Mouth */}
                            {isPasswordFocused ? (
                                <circle cx="0" cy="18" r="3" fill="#1E293B" />
                            ) : isEmailFocused ? (
                                <path d="M-15,12 Q0,32 15,12" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            ) : (
                                <path d="M-5,20 Q0,22 5,20" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            )}
                        </g>
                    </g>
                </g>

                {/* 2. Black Box (Sleek Dark) */}
                <g transform="translate(180, 140)">
                    <g className={getAnimationClass(0.1)} style={{ animationDelay: '0.1s' }}>
                        <rect x="0" y="0" width="70" height="160" rx="24" fill="#0F172A" />
                        <rect x="6" y="6" width="58" height="148" rx="18" fill="#1E293B" />

                        <g transform="translate(35, 40)">
                            {/* No eyebrows for box? Maybe subtle ones, or keep him stoic. Let's give him small ones. */}
                            <path d="M22,-12 L32,-12" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={isEmailFocused ? 1 : 0} style={{ transition: 'opacity 0.2s' }} />
                            <path d="M-32,-12 L-22,-12" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={isEmailFocused ? 1 : 0} style={{ transition: 'opacity 0.2s' }} />

                            <Eye cx={-15} cy={0} r={10} pupilR={4} blinking={isBlinking} />
                            <Eye cx={15} cy={0} r={10} pupilR={4} blinking={isBlinking} />

                            {/* Mouth (White on Dark) */}
                            {isEmailFocused ? (
                                <path d="M-8,16 Q0,26 8,16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                            ) : (
                                <line x1="-5" y1="18" x2="5" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            )}
                        </g>
                    </g>
                </g>

                {/* 3. Round Guy (Clean White) */}
                <g transform="translate(240, 180)">
                    <g className={getAnimationClass(0.2)} style={{ animationDelay: '0.2s' }}>
                        <path d="M0,40 Q0,0 40,0 L40,0 Q80,0 80,40 L80,120 L0,120 Z" fill="#E2E8F0" />
                        <path d="M4,40 Q4,4 40,4 L40,4 Q76,4 76,40 L76,116 L4,116 Z" fill="#FFFFFF" />

                        <g transform="translate(40, 40)">
                            <Eyebrow cx={-18} cy={-12} isHappy={isEmailFocused} isAngry={isPasswordFocused} />
                            <Eyebrow cx={18} cy={-12} isHappy={isEmailFocused} isAngry={isPasswordFocused} />

                            <Eye cx={-18} cy={0} r={11} pupilR={4.5} blinking={isBlinking} />
                            <Eye cx={18} cy={0} r={11} pupilR={4.5} blinking={isBlinking} />



                            {/* Mouth */}
                            {isEmailFocused ? (
                                <path d="M-12,18 Q0,35 12,18" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            ) : (
                                <path d="M-8,18 Q0,22 8,18" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            )}
                        </g>
                    </g>
                </g>

                {/* 4. Orange Half-Circle (Pops against dark bg) */}
                <g transform="translate(50, 220)">
                    <g className={isEmailFocused ? 'animate-happy-bounce' : ''} style={{ animationDelay: '0.3s' }}>
                        <path d="M0,80 A65,65 0 0,1 130,80" fill="#EA580C" />
                        <path d="M8,80 A57,57 0 0,1 122,80" fill="#F97316" />

                        {/* Face */}
                        <g transform="translate(65, 30)">
                            {isEmailFocused ? (
                                // Wakes up
                                <g>
                                    <Eyebrow cx={-20} cy={-12} isHappy={true} />
                                    <Eyebrow cx={20} cy={-12} isHappy={true} />
                                    <Eye cx={-20} cy={0} r={10} pupilR={4} blinking={false} />
                                    <Eye cx={20} cy={0} r={10} pupilR={4} blinking={false} />
                                    <path d="M-15,15 Q0,35 15,15" stroke="#7C2D12" strokeWidth="3" fill="none" strokeLinecap="round" />
                                </g>
                            ) : (
                                <>
                                    {/* Sleeping (Simple) */}
                                    <path d="M-22,0 Q-15,-6 -8,0" fill="none" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />
                                    <path d="M8,0 Q15,-6 22,0" fill="none" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />

                                    {/* Simple Zzz */}
                                    <text x="35" y="-15" fontSize="18" fill="#FFFFFF" opacity="0.6" className="font-bold animate-pulse">z</text>

                                    {/* Mouth */}
                                    <circle cx="0" cy="15" r="2.5" fill="#7C2D12" opacity="0.6" />
                                </>
                            )}
                        </g>
                    </g>
                </g>
            </svg>

            {isPasswordFocused && (
                <div className="absolute top-12 left-0 right-0 text-center animate-fade-in-up pointer-events-none">
                    <span className="inline-block bg-white/95 backdrop-blur shadow-lg px-6 py-2 rounded-full text-gray-600 font-bold text-sm border border-gray-100 transform -rotate-1">
                        🙈 Password Mode Enabled
                    </span>
                </div>
            )}
        </div>
    );
};

export default InteractiveDoctors;

