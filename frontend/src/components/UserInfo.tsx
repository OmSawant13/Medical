"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence as AnimatePresenceFrame } from "framer-motion";
const AnimatePresence = AnimatePresenceFrame as any;

const tabs = [
    {
        id: 0,
        title: "Advanced Diagnostics",
        subtext: "AI-powered analysis for faster, more accurate detection",
        image: "/User-info Section/User-img-1.avif",
    },
    {
        id: 1,
        title: "Secure Patient Data",
        subtext: "HIPAA-compliant storage with end-to-end encryption",
        image: "/User-info Section/User-img-2.avif",
    },
    {
        id: 2,
        title: "Seamless Integration",
        subtext: "Connects with existing hospital management systems",
        image: "/User-info Section/User-img-3.avif",
    },
];

export default function UserInfo() {
    const [activeTab, setActiveTab] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setActiveTab((prev) => (prev + 1) % tabs.length);
        }, 3000);
    };

    useEffect(() => {
        startInterval();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const handleTabClick = (id: number) => {
        setActiveTab(id);
        startInterval(); // Reset timer on manual interaction
    };

    return (
        <div className="main-container flex w-full max-w-[1920px] pt-[80px] px-[20px] md:px-[100px] xl:px-[410px] pb-[80px] flex-col items-center flex-nowrap relative overflow-hidden mx-auto my-0 bg-[#f0f0f0]">
            <div className="flex flex-col gap-[32px] justify-center items-start self-stretch shrink-0 flex-nowrap relative">
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row gap-[12px] justify-center items-start xl:items-end self-stretch shrink-0 flex-nowrap relative z-[1]">
                    <div className="flex w-full xl:w-[768px] flex-col items-start shrink-0 flex-nowrap relative z-[2]">
                        <div className="flex w-full max-w-[540px] pt-0 pr-0 pb-[0.61px] pl-0 flex-col items-start shrink-0 flex-nowrap relative z-[3]">
                            <span className="flex w-full justify-start items-center shrink-0 font-Inter text-[40px] md:text-[52px] font-semibold leading-[1.2] text-[#151621] tracking-[-2.6px] relative text-left overflow-hidden z-[4]">
                                Complete medical imaging solution for modern care.
                            </span>
                        </div>
                    </div>
                    <div className="flex w-full xl:w-[320px] flex-col items-start shrink-0 flex-nowrap relative z-[5]">
                        <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[6]">
                            <span className="flex w-full justify-start items-center self-stretch shrink-0 font-Inter text-[16px] md:text-[18px] font-medium leading-[1.5] text-[#7a7a7a] tracking-[-0.36px] relative text-left overflow-hidden z-[7]">
                                Streamline workflows, enhance diagnostic <br />
                                accuracy, and improve patient outcomes — all <br />
                                from a single, intelligent platform.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col xl:flex-row w-full gap-[32px] justify-center items-center shrink-0 flex-nowrap relative z-[8]">
                    {/* Left Side: Buttons */}
                    <div className="flex w-full xl:w-[384px] flex-col gap-[24px] items-start shrink-0 flex-nowrap relative z-10">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`flex w-full cursor-pointer flex-col items-start flex-nowrap relative transition-all duration-300 ${activeTab === tab.id ? "z-[11]" : "z-[10]"
                                    }`}
                            >
                                <div
                                    className={`flex p-[20px] flex-col justify-center items-start self-stretch shrink-0 flex-nowrap bg-[#fff] rounded-[10px] relative overflow-hidden transition-all duration-300 ${activeTab === tab.id
                                        ? "shadow-[0_7px_21px_0_rgba(27,68,254,0.1)]"
                                        : "shadow-none hover:bg-gray-50"
                                        }`}
                                >
                                    <div className="flex flex-col justify-center items-start self-stretch shrink-0 flex-nowrap relative">
                                        <div className="flex gap-[10px] items-center self-stretch shrink-0 flex-nowrap relative">
                                            <div
                                                className={`flex w-[28px] h-[28px] justify-center items-center shrink-0 flex-nowrap rounded-[10px] transition-colors duration-300 ${activeTab === tab.id ? "bg-blue-50" : "bg-gray-100"
                                                    }`}
                                            >
                                                <div
                                                    className={`w-[12px] h-[12px] shrink-0 rounded-[40px] relative overflow-hidden transition-colors duration-300 ${activeTab === tab.id ? "bg-[#1B44FE]" : "bg-gray-400"
                                                        }`}
                                                />
                                            </div>
                                            <span className="font-Inter text-[18px] font-semibold leading-[25.2px] text-[#0a0b10] tracking-[-0.54px] relative text-left whitespace-nowrap">
                                                {tab.title}
                                            </span>
                                        </div>

                                        <motion.div
                                            initial={false}
                                            animate={{
                                                height: activeTab === tab.id ? "auto" : 0,
                                                opacity: activeTab === tab.id ? 1 : 0,
                                                marginTop: activeTab === tab.id ? 16 : 0,
                                            }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden w-full"
                                        >
                                            <span className="block font-Inter text-[16px] font-medium leading-[24px] text-[#737373] tracking-[-0.32px] text-left">
                                                {tab.subtext}
                                            </span>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Side: Dashboard Preview */}
                    <div className="w-full xl:w-[684px] h-[350px] md:h-[500px] shrink-0 relative z-[48]">
                        <div className="flex w-full h-full p-[12px] flex-col items-start flex-nowrap bg-[#f8f8fa] rounded-[31.31px] relative z-[49]">
                            <div className="w-full h-full self-stretch shrink-0 rounded-[20px] bg-white relative z-50 overflow-hidden shadow-sm border border-gray-100">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                        className="w-full h-full absolute top-0 left-0 p-6"
                                    >
                                        {activeTab === 0 && (
                                            // Advanced Diagnostics Dashboard
                                            <div className="flex flex-col gap-4 h-full">
                                                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                                    <div>
                                                        <h4 className="font-Inter font-semibold text-gray-900">AI Analysis Results</h4>
                                                        <p className="text-sm text-gray-500">Scan ID: #SC-2024-892</p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">Processing Complete</span>
                                                </div>
                                                <div className="flex gap-4 h-full">
                                                    <div className="w-1/2 bg-gray-100 rounded-lg relative overflow-hidden group">
                                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        {/* Scan Overlay Effect */}
                                                        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-red-400 rounded-lg opacity-60 animate-pulse"></div>
                                                        <div className="absolute top-1/4 right-1/4 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">Anomaly Detected</div>
                                                    </div>
                                                    <div className="w-1/2 flex flex-col gap-3">
                                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                            <div className="flex justify-between mb-1">
                                                                <span className="text-xs font-medium text-gray-700">Confidence Score</span>
                                                                <span className="text-xs font-bold text-green-600">98.2%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '98.2%' }}></div>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                            <span className="text-xs font-medium text-gray-700 block mb-2">Detected Findings</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                <span className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] text-gray-600">Nodule (3mm)</span>
                                                                <span className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] text-gray-600">Opacity</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 1 && (
                                            // Secure Patient Data Dashboard
                                            <div className="flex flex-col gap-4 h-full">
                                                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                                    <div>
                                                        <h4 className="font-Inter font-semibold text-gray-900">Security Audit Log</h4>
                                                        <p className="text-sm text-gray-500">Real-time encryption monitoring</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                        <span className="text-xs font-medium text-green-600">System Secure</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-medium text-gray-900">Data Access Request</p>
                                                                    <p className="text-[10px] text-gray-500">User ID: DR-442 • Encrypted (AES-256)</p>
                                                                </div>
                                                            </div>
                                                            <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-medium rounded border border-green-100">Authorized</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-auto p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-xs text-blue-800 font-medium">HIPAA Compliance Verification Active</p>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 2 && (
                                            // Seamless Integration Dashboard
                                            <div className="flex flex-col gap-4 h-full">
                                                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                                    <div>
                                                        <h4 className="font-Inter font-semibold text-gray-900">Integration Hub</h4>
                                                        <p className="text-sm text-gray-500">Connected Systems Status</p>
                                                    </div>
                                                    <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                                        + Add Integration
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col gap-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xs">EPIC</div>
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">Epic EMR</p>
                                                            <p className="text-xs text-gray-500">Last sync: Just now</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col gap-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">CER</div>
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">Cerner</p>
                                                            <p className="text-xs text-gray-500">Last sync: 2m ago</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col gap-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-bold text-xs">PACS</div>
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">PACS Server</p>
                                                            <p className="text-xs text-gray-500">Connected</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
                                                        <span className="text-xs font-medium">Connect New</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
