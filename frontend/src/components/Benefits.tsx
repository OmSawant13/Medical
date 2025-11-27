"use client";
import React from "react";
import { motion } from "framer-motion";

const benefits = [
    {
        title: "Faster Diagnosis",
        description: "AI-assisted analysis reduces interpretation time by up to 40%, allowing for quicker patient care.",
    },
    {
        title: "Enhanced Accuracy",
        description: "Advanced algorithms detect subtle anomalies often missed by the human eye, improving diagnostic confidence.",
    },
    {
        title: "Seamless Integration",
        description: "Works effortlessly with existing PACS, RIS, and EMR systems. No complex infrastructure changes needed.",
    },
    {
        title: "Secure & Compliant",
        description: "Fully HIPAA-compliant with end-to-end encryption to ensure patient data security and privacy.",
    },
    {
        title: "Cost Efficiency",
        description: "Reduce operational costs by automating routine tasks and optimizing workflow efficiency.",
    },
    {
        title: "24/7 Availability",
        description: "Cloud-based platform ensures access to diagnostic tools and reports anytime, anywhere.",
    },
];

export default function Benefits() {
    return (
        <div className="main-container flex w-full max-w-[1920px] pt-[80px] px-[20px] md:px-[100px] xl:px-[200px] pb-[80px] justify-center items-start flex-nowrap relative overflow-hidden mx-auto my-0 bg-[#f0f0f0]">
            <div className="flex w-full max-w-[1280px] flex-col gap-[32px] items-center shrink-0 flex-nowrap relative">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-[16px] items-center self-stretch shrink-0 flex-nowrap relative z-[1]"
                >
                    <div className="flex w-[96px] flex-col items-start shrink-0 flex-nowrap relative z-[3]">
                        <div className="flex w-[96px] pt-[3px] pr-[12px] pb-[3px] pl-[12px] gap-[10px] justify-center items-center shrink-0 flex-nowrap bg-[#fff] rounded-[40px] relative overflow-hidden shadow-[0_0_0_0_#f8f8fa] z-[4]">
                            <div className="w-[8px] h-[8px] shrink-0 rounded-[40px] relative overflow-hidden z-[5] bg-[#1B44FE]" />
                            <div className="flex w-[54px] flex-col items-start shrink-0 flex-nowrap relative z-[6]">
                                <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[7]">
                                    <span className="h-[20px] shrink-0 basis-auto font-Inter text-[14px] font-semibold leading-[19.6px] text-[#0a0b10] tracking-[-0.42px] relative text-left whitespace-nowrap z-[8]">
                                        Benefits
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full max-w-[800px] shrink-0 text-center relative z-[9]">
                        <span className="font-Inter text-[40px] md:text-[52px] font-semibold leading-[1.2] text-[#151621] tracking-[-2.6px] relative z-10">
                            Why choose Scanlytics for <br /> your medical practice?
                        </span>
                    </div>
                </motion.div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[40px] w-full relative z-[12]">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex w-full md:w-[350px] h-[200px] p-[24px] flex-col justify-between items-start shrink-0 flex-nowrap bg-[#fff] rounded-[20px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[13] hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.1)] transition-shadow duration-300 justify-self-center"
                        >
                            <div className="flex w-[36px] pt-[6px] pr-[6px] pb-[6px] pl-[6px] justify-center items-center shrink-0 flex-nowrap rounded-[10px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.24)] z-[14] bg-[#1B44FE]">
                                <div className="w-[24px] h-[24px] shrink-0 relative z-[15]" />
                            </div>
                            <div className="flex flex-col gap-[6px] items-start self-stretch shrink-0 flex-nowrap relative z-[16]">
                                <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[17]">
                                    <span className="h-[26px] self-stretch shrink-0 basis-auto font-Inter text-[18px] font-semibold leading-[25.2px] text-[#0a0b10] tracking-[-0.54px] relative text-left whitespace-nowrap z-[18]">
                                        {benefit.title}
                                    </span>
                                </div>
                                <div className="flex w-full flex-col items-start shrink-0 flex-nowrap relative z-[19]">
                                    <span className="w-full font-Inter text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] relative text-left overflow-hidden z-20">
                                        {benefit.description}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
