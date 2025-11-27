"use client";
import React from "react";
import { ArrowRight, Twitter, Linkedin, Facebook, Instagram } from "lucide-react";

export default function Footer() {
    return (
        <div className="flex w-full max-w-[1920px] pt-[120px] px-[20px] md:px-[100px] xl:px-[180px] pb-[24px] justify-center items-start flex-nowrap bg-[#fff] relative overflow-hidden shadow-[0_-7px_21px_0_rgba(0,0,0,0.03)] mx-auto my-0">
            <div className="flex w-full max-w-[1100px] flex-col gap-[80px] justify-center items-center flex-nowrap relative">

                {/* CTA Section */}
                <div className="flex flex-col gap-[16px] items-center self-stretch shrink-0 flex-nowrap relative">
                    {/* Title */}
                    <div className="flex flex-col items-center justify-center relative">
                        <h2 className="font-['Inter'] text-[48px] md:text-[64px] font-semibold leading-[64px] text-[#0a0b10] tracking-[-3.2px] relative text-center">
                            <span className="text-[#0a0b10]">Unlock the </span>
                            <span className="inline-flex items-center justify-center w-[63px] h-[65px] rounded-[8px] mx-[8px] align-middle bg-gradient-to-br from-blue-600 to-blue-500">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 256 256"
                                    className="h-12 w-12 fill-white"
                                >
                                    <path d="M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z" />
                                </svg>
                            </span>
                            <span className="text-[#1B44FE]"> power</span>
                            <br />
                            <span className="text-[#0a0b10]">of medical AI.</span>
                        </h2>
                    </div>

                    {/* Subtitle */}
                    <p className="font-['Inter'] text-[16px] md:text-[18px] font-medium leading-[27px] text-[#7a7a7a] tracking-[-0.36px] relative text-center max-w-[500px]">
                        Streamline diagnostics, improve patient outcomes, and maximize efficiency with Scanlytics.
                    </p>

                    {/* CTA Button */}
                    <button className="flex h-[42px] pt-0 pr-[16px] pb-0 pl-[16px] gap-[8px] justify-center items-center shrink-0 flex-nowrap rounded-[12px] relative overflow-hidden shadow-[0_7px_15.4px_0_rgba(27,68,254,0.36)] bg-[#1B44FE] hover:bg-[#1534c0] transition-colors group mt-[8px] border-2 border-[rgba(248,248,250,0.12)]">
                        <span className="font-['Inter'] text-[15px] font-semibold leading-[18px] text-[#fff] tracking-[-0.3px] relative text-left whitespace-nowrap">
                            Book a call now
                        </span>
                        <ArrowRight className="w-[16px] h-[16px] text-white group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Footer Content */}
                <div className="flex flex-col gap-[12px] justify-center items-center self-stretch shrink-0 flex-nowrap relative overflow-hidden">

                    {/* Main Footer Row */}
                    <div className="flex flex-col lg:flex-row pt-[24px] pr-0 pb-[24px] pl-0 justify-between items-start lg:items-end self-stretch shrink-0 flex-nowrap relative border-b border-b-[#f0f0f0] gap-[32px]">

                        {/* Left - Brand */}
                        <div className="flex w-full lg:w-[300px] flex-col gap-[32px] justify-center items-start shrink-0 flex-nowrap relative">
                            <div className="flex flex-col gap-[16px] items-start self-stretch shrink-0 flex-nowrap relative">
                                {/* Logo */}
                                <div className="flex gap-[5px] items-center shrink-0 flex-nowrap relative">
                                    <div className="flex w-[24px] h-[24px] flex-col items-start shrink-0 flex-nowrap relative">
                                        <div className="w-[24px] h-[24px] shrink-0 bg-[#1B44FE] rounded-[4px] relative overflow-hidden" />
                                    </div>
                                    <span className="font-['Poppins'] text-[20px] font-semibold leading-[28px] text-[#0a0b10] tracking-[-1px] relative text-left whitespace-nowrap">
                                        Scanlytics
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="font-['Inter'] text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] relative text-left max-w-[300px]">
                                    Revolutionary AI-powered medical analytics platform for the modern healthcare ecosystem.
                                </p>
                            </div>

                            {/* Social Icons */}
                            <div className="flex gap-[12px] items-center shrink-0 flex-nowrap relative">
                                <button className="flex w-[32px] h-[32px] pt-[8px] pr-[8px] pb-[8px] pl-[8px] justify-center items-center shrink-0 flex-nowrap bg-[#f0f0f0] rounded-[8px] hover:bg-[#e0e0e0] transition-colors">
                                    <Twitter className="w-[16px] h-[16px] text-[#0a0b10]" />
                                </button>
                                <button className="flex w-[32px] h-[32px] pt-[8px] pr-[8px] pb-[8px] pl-[8px] justify-center items-center shrink-0 flex-nowrap bg-[#f0f0f0] rounded-[8px] hover:bg-[#e0e0e0] transition-colors">
                                    <Linkedin className="w-[16px] h-[16px] text-[#0a0b10]" />
                                </button>
                                <button className="flex w-[32px] h-[32px] pt-[8px] pr-[8px] pb-[8px] pl-[8px] justify-center items-center shrink-0 flex-nowrap bg-[#f0f0f0] rounded-[8px] hover:bg-[#e0e0e0] transition-colors">
                                    <Facebook className="w-[16px] h-[16px] text-[#0a0b10]" />
                                </button>
                                <button className="flex w-[32px] h-[32px] pt-[8px] pr-[8px] pb-[8px] pl-[8px] justify-center items-center shrink-0 flex-nowrap bg-[#f0f0f0] rounded-[8px] hover:bg-[#e0e0e0] transition-colors">
                                    <Instagram className="w-[16px] h-[16px] text-[#0a0b10]" />
                                </button>
                            </div>
                        </div>

                        {/* Right - Links */}
                        <div className="flex gap-[48px] items-start shrink-0 flex-wrap lg:flex-nowrap relative overflow-hidden">
                            {/* Pages Column */}
                            <div className="flex flex-col gap-[12px] items-start shrink-0 flex-nowrap relative overflow-hidden">
                                <span className="font-['Inter'] text-[15px] font-semibold leading-[18px] text-[#0a0b10] tracking-[-0.3px] relative text-left whitespace-nowrap">
                                    Platform
                                </span>
                                <div className="flex flex-col gap-[12px] items-start shrink-0 flex-nowrap relative">
                                    <a href="#" className="font-['Inter'] text-[14px] font-medium leading-[20px] text-[#7a7a7a] tracking-[-0.28px] hover:text-[#0a0b10] transition-colors relative text-left whitespace-nowrap">
                                        Features
                                    </a>
                                    <a href="#" className="font-['Inter'] text-[14px] font-medium leading-[20px] text-[#7a7a7a] tracking-[-0.28px] hover:text-[#0a0b10] transition-colors relative text-left whitespace-nowrap">
                                        Pricing
                                    </a>
                                    <a href="#" className="font-['Inter'] text-[14px] font-medium leading-[20px] text-[#7a7a7a] tracking-[-0.28px] hover:text-[#0a0b10] transition-colors relative text-left whitespace-nowrap">
                                        Updates
                                    </a>
                                    <a href="#" className="font-['Inter'] text-[14px] font-medium leading-[20px] text-[#7a7a7a] tracking-[-0.28px] hover:text-[#0a0b10] transition-colors relative text-left whitespace-nowrap">
                                        Blog
                                    </a>
                                </div>
                            </div>

                            {/* Information Column */}
                            <div className="flex flex-col gap-[12px] items-start shrink-0 flex-nowrap relative overflow-hidden">
                                <span className="font-['Inter'] text-[15px] font-semibold leading-[18px] text-[#0a0b10] tracking-[-0.3px] relative text-left whitespace-nowrap">
                                    Resources
                                </span>
                                <div className="flex flex-col gap-[12px] items-start shrink-0 flex-nowrap relative">
                                    <a href="#" className="font-['Inter'] text-[14px] font-medium leading-[20px] text-[#7a7a7a] tracking-[-0.28px] hover:text-[#0a0b10] transition-colors relative text-left whitespace-nowrap">
                                        About Us
                                    </a>
                                    <a href="#" className="font-['Inter'] text-[14px] font-medium leading-[20px] text-[#7a7a7a] tracking-[-0.28px] hover:text-[#0a0b10] transition-colors relative text-left whitespace-nowrap">
                                        Developer
                                    </a>
                                    <a href="#" className="font-['Inter'] text-[14px] font-medium leading-[20px] text-[#7a7a7a] tracking-[-0.28px] hover:text-[#0a0b10] transition-colors relative text-left whitespace-nowrap">
                                        Privacy Policy
                                    </a>
                                    <a href="#" className="font-['Inter'] text-[14px] font-medium leading-[20px] text-[#7a7a7a] tracking-[-0.28px] hover:text-[#0a0b10] transition-colors relative text-left whitespace-nowrap">
                                        Terms of Service
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex flex-col md:flex-row pt-[24px] pr-0 pb-0 pl-0 justify-between items-start md:items-center self-stretch shrink-0 flex-nowrap relative border-b border-b-[#f0f0f0] pb-[24px] gap-[16px]">
                        {/* Copyright */}
                        <p className="font-['Inter'] text-[14px] font-medium leading-[19.6px] text-[#7a7a7a] tracking-[-0.42px] relative text-left whitespace-nowrap">
                            ©2025 Scanlytics. All rights reserved.
                        </p>

                        {/* Creator Badge */}
                        <div className="flex pt-[8px] pr-[8px] pb-[8px] pl-[8px] gap-[2px] items-center shrink-0 flex-nowrap bg-[#f8f8fa] rounded-[8px] relative">
                            <span className="font-['Inter'] text-[14px] font-medium leading-[19.6px] text-[#7a7a7a] tracking-[-0.42px] relative text-left whitespace-nowrap">
                                Created by{" "}
                                <span className="text-[#1b44fe]">Utkarsh</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
