"use client";
import React from "react";
import { motion } from "framer-motion";
import {
    Activity,
    Zap,
    ShieldCheck,
    Stethoscope,
    Clock,
    Check,
    X,
    ArrowRight
} from "lucide-react";

const features = [
    {
        icon: <Activity className="w-[18px] h-[18px] text-[#0a0b10]" />,
        text: "99% AI Accuracy",
    },
    {
        icon: <Zap className="w-[18px] h-[18px] text-[#0a0b10]" />,
        text: "Instant Reports",
    },
    {
        icon: <ShieldCheck className="w-[18px] h-[18px] text-[#0a0b10]" />,
        text: "HIPAA Compliant",
    },
    {
        icon: <Stethoscope className="w-[18px] h-[18px] text-[#0a0b10]" />,
        text: "Full Integration",
    },
    {
        icon: <Clock className="w-[18px] h-[18px] text-[#0a0b10]" />,
        text: "24/7 Support",
    },
];

export default function Comparison() {
    return (
        <div className="main-container flex w-full max-w-[1920px] pt-[80px] px-[20px] md:px-[100px] xl:px-[410px] pb-[80px] justify-center items-start flex-nowrap relative overflow-hidden mx-auto my-0 bg-[#f0f0f0]">
            <div className="flex w-full max-w-[1100px] flex-col xl:flex-row gap-[32px] justify-center items-center shrink-0 flex-nowrap relative">

                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex w-full xl:w-[534px] flex-col gap-[15.2px] items-start shrink-0 flex-nowrap relative z-[1]"
                >
                    {/* Badge */}
                    <div className="flex pt-[3px] pr-[12px] pb-[3px] pl-[12px] gap-[10px] justify-center items-center shrink-0 flex-nowrap bg-[#fff] rounded-[40px] relative overflow-hidden shadow-[0_0_0_0_#f8f8fa] z-[2]">
                        <div className="w-[8px] h-[8px] shrink-0 rounded-[40px] relative overflow-hidden z-[3] bg-[#1B44FE]" />
                        <span className="font-Inter text-[14px] font-semibold leading-[19.6px] text-[#0a0b10] tracking-[-0.42px] relative text-left whitespace-nowrap z-[6]">
                            Why Scanlytics stands out
                        </span>
                    </div>

                    {/* Title & Description */}
                    <div className="flex flex-col gap-[8px] items-start self-stretch shrink-0 flex-nowrap relative z-[7]">
                        <span className="font-Inter text-[40px] md:text-[52px] font-semibold leading-[1.2] text-[#151621] tracking-[-2.6px] relative text-left z-10">
                            The smarter way to <br />
                            diagnose and treat.
                        </span>
                        <span className="font-Inter text-[16px] md:text-[18px] font-medium leading-[1.5] text-[#7a7a7a] tracking-[-0.36px] relative text-left z-[13]">
                            Unmatched accuracy, seamless integration, and <br />
                            complete compliance — everything you need for modern care.
                        </span>
                    </div>

                    {/* Button */}
                    <div className="flex h-[44px] px-[16px] gap-[8px] justify-center items-center shrink-0 flex-nowrap rounded-[12px] relative overflow-hidden shadow-[0_7px_15.4px_0_rgba(27,68,254,0.36)] bg-[#1B44FE] cursor-pointer hover:bg-[#1536cb] transition-colors z-[14]">
                        <span className="font-Inter text-[15px] font-semibold leading-[18px] text-[#fff] tracking-[-0.3px] relative text-left whitespace-nowrap z-[18]">
                            Switch to Scanlytics
                        </span>
                        <ArrowRight className="w-[16px] h-[16px] text-white" />
                    </div>
                </motion.div>

                {/* Right Comparison Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex w-full xl:w-[534px] flex-col items-start shrink-0 flex-nowrap relative z-20"
                >
                    <div className="flex p-[12px] gap-[16px] justify-center items-center self-stretch shrink-0 flex-nowrap bg-[#fff] rounded-[20px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[21]">
                        <div className="flex grow shrink-0 basis-0 py-[30px] flex-col gap-[12px] items-center flex-nowrap rounded-[27px] relative z-[22]">

                            {/* Header Row Spacer */}
                            <div className="h-[24px] self-stretch shrink-0 relative z-[23]" />

                            {/* Feature Rows */}
                            <div className="flex pl-[12px] flex-col gap-[6px] justify-center items-start self-stretch shrink-0 flex-nowrap relative overflow-hidden z-[24]">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex h-[40px] flex-col justify-center items-start self-stretch shrink-0 flex-nowrap relative">
                                        <div className="flex p-[10px] gap-[10px] items-center self-stretch grow shrink-0 basis-0 flex-nowrap relative">
                                            {feature.icon}
                                            <span className="font-Inter text-[16px] font-normal leading-[25.2px] text-[#0a0b10] tracking-[-0.54px] relative text-left whitespace-nowrap">
                                                {feature.text}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comparison Columns */}
                        <div className="flex gap-0 justify-center items-center shrink-0 flex-nowrap relative z-[55]">

                            {/* Scanlytics Column */}
                            <div className="flex py-[30px] px-[20px] flex-col gap-[12px] items-center grow shrink-0 basis-0 flex-nowrap rounded-[20px] relative overflow-hidden shadow-[0_19px_38px_rgba(27,68,254,0.44)] bg-gradient-to-br from-blue-600 to-blue-500 z-[56]">
                                {/* Header */}
                                <div className="flex gap-[5px] justify-center items-center shrink-0 flex-nowrap relative z-[57] mb-[6px]">
                                    {/* Logo Placeholder */}
                                    <div className="w-[20px] h-[20px] bg-white rounded-full flex items-center justify-center">
                                        <div className="w-[10px] h-[10px] bg-[#1B44FE] rounded-full" />
                                    </div>
                                    <span className="font-Inter text-[18px] font-medium leading-[26px] text-[#fff] tracking-[-0.6px] relative text-left whitespace-nowrap">
                                        Scanlytics
                                    </span>
                                </div>

                                {/* Checks */}
                                <div className="flex flex-col gap-[6px] justify-center items-center self-stretch shrink-0 flex-nowrap relative z-[64]">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex w-[24px] h-[40px] justify-center items-center shrink-0 flex-nowrap relative">
                                            <div className="w-[24px] h-[24px] bg-white rounded-full flex items-center justify-center shadow-sm">
                                                <Check className="w-[14px] h-[14px] text-[#1B44FE] stroke-[3px]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Others Column */}
                            <div className="flex py-[30px] px-[20px] flex-col gap-[12px] items-center grow shrink-0 basis-0 flex-nowrap rounded-[27px] relative z-[80]">
                                {/* Header */}
                                <div className="flex flex-col items-center self-stretch shrink-0 flex-nowrap relative z-[81] mb-[6px]">
                                    <span className="h-[26px] self-stretch shrink-0 basis-auto font-Inter text-[18px] font-medium leading-[26px] text-[#0a0b10] tracking-[-0.6px] relative text-center whitespace-nowrap">
                                        Others
                                    </span>
                                </div>

                                {/* Crosses */}
                                <div className="flex flex-col gap-[6px] justify-center items-center self-stretch shrink-0 flex-nowrap relative z-[83]">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex w-[24px] h-[40px] justify-center items-center shrink-0 flex-nowrap relative">
                                            <div className="w-[24px] h-[24px] bg-[#0a0b10] rounded-full flex items-center justify-center">
                                                <X className="w-[14px] h-[14px] text-white stroke-[3px]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
