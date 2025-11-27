"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export default function Desktop() {
    return (
        <div className="main-container flex w-full max-w-[1920px] pt-[80px] px-[20px] md:px-[100px] xl:px-[410px] pb-[80px] justify-center items-center flex-nowrap bg-[#fff] relative overflow-hidden mx-auto my-0">
            <div className="flex w-full max-w-[1100px] flex-col xl:flex-row gap-[48px] justify-center items-center shrink-0 flex-nowrap relative">

                {/* Left - Video/Image Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex w-full xl:w-[526px] justify-center items-center shrink-0 flex-nowrap relative z-[1]"
                >
                    <div className="flex w-full xl:w-[526px] h-[300px] md:h-[400px] flex-col justify-center items-start shrink-0 flex-nowrap relative z-[2]">
                        <div className="flex w-full pt-0 pr-0 pb-0 pl-0 flex-col justify-center items-center grow shrink-0 basis-0 flex-nowrap bg-[rgba(255,255,255,0)] rounded-[20px] relative overflow-hidden shadow-[0_0_0_0_#f8f8fa] z-[3]">
                            {/* Background Image - Replace with actual image */}
                            <div className="shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 bg-cover bg-no-repeat rounded-[20px] absolute top-0 bottom-0 left-0 right-0 overflow-hidden z-[4]">
                                {/* Placeholder pattern */}
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#1B44FE 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            </div>

                            {/* Dark Overlay */}
                            <div className="shrink-0 bg-[#0a0b10] opacity-10 absolute top-0 bottom-0 left-0 right-0 z-[5]" />

                            {/* Bottom Gradient */}
                            <div className="h-[100px] shrink-0 bg-gradient-to-t from-black/50 to-transparent absolute bottom-0 left-0 right-0 z-[6]" />

                            {/* Play Button */}
                            <div className="flex w-[72px] pt-[20px] pr-[20px] pb-[20px] pl-[20px] justify-center items-center shrink-0 flex-nowrap bg-[rgba(10,11,16,0.15)] rounded-[50px] relative z-[7] cursor-pointer hover:bg-[rgba(10,11,16,0.25)] transition-colors backdrop-blur-sm">
                                <Play className="w-[32px] h-[32px] text-white fill-white ml-1" />
                            </div>
                        </div>
                    </div>

                    {/* User Info Overlay */}
                    <div className="flex w-[248px] h-[40px] flex-col gap-0 justify-center items-center shrink-0 flex-nowrap absolute bottom-[24px] left-[24px] overflow-hidden z-[9]">
                        <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-10">
                            <span className="h-[20px] self-stretch shrink-0 basis-auto font-Inter text-[14px] font-medium leading-[19.6px] text-[#fff] tracking-[-0.42px] relative text-left whitespace-nowrap z-[12]">
                                Dr. Emily Carter
                            </span>
                        </div>
                        <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[13]">
                            <span className="h-[20px] self-stretch shrink-0 basis-auto font-Inter text-[14px] font-medium leading-[19.6px] text-[#d1d0d2] tracking-[-0.42px] relative text-left whitespace-nowrap z-[15]">
                                Head of Radiology, St. Mary's
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Right - Content Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex w-full xl:w-[526px] flex-col gap-[15.3px] justify-center items-start shrink-0 flex-nowrap relative z-[16]"
                >
                    {/* Badge */}
                    <div className="flex pt-[5px] pr-[15px] pb-[5px] pl-[15px] justify-center items-center shrink-0 flex-nowrap rounded-[64px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] bg-[#1B44FE] z-[18]">
                        <span className="font-Inter text-[14px] font-semibold leading-[19.6px] text-[#fff] tracking-[-0.42px] relative text-left whitespace-nowrap">
                            Success Stories
                        </span>
                    </div>

                    {/* Quote */}
                    <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[22]">
                        <span className="font-Inter text-[28px] md:text-[34px] font-semibold leading-[1.3] text-[#0a0b10] tracking-[-1.7px] relative text-left z-[24]">
                            "Scanlytics revolutionized our workflow. We're diagnosing patients 40% faster with higher accuracy, and our team can finally focus on what matters most—patient care."
                        </span>
                    </div>

                    {/* Read Story Link */}
                    <div className="flex pt-[8px] pr-[12px] pb-[8px] pl-0 gap-[8px] justify-start items-center shrink-0 flex-nowrap bg-[rgba(255,255,255,0)] relative overflow-hidden z-[26] cursor-pointer group">
                        <span className="font-Inter text-[15px] font-semibold leading-[18px] text-[#0a0b10] tracking-[-0.3px] relative text-left whitespace-nowrap group-hover:text-[#1B44FE] transition-colors">
                            Read the full case study
                        </span>
                        <ArrowRight className="w-[16px] h-[16px] text-[#0a0b10] group-hover:text-[#1B44FE] group-hover:translate-x-1 transition-all" />
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
