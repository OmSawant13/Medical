"use client";
import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonialsTop = [
    {
        text: "Scanlytics reduced our diagnostic turnaround time by 40%. It's a game-changer for our radiology department.",
        name: "Dr. Sarah Chen",
        role: "Chief Radiologist",
    },
    {
        text: "The AI accuracy is impressive. It catches subtle anomalies that are easy to miss during long shifts.",
        name: "Dr. James Wilson",
        role: "Neurologist",
    },
    {
        text: "Seamless integration with our existing PACS. The transition was smooth and the training minimal.",
        name: "Emily Rodriguez",
        role: "Hospital Administrator",
    },
    {
        text: "Finally, a tool that actually helps us prioritize critical cases effectively. Highly recommended.",
        name: "Dr. Michael Chang",
        role: "Emergency Physician",
    },
];

const testimonialsBottom = [
    {
        text: "The automated reporting feature saves me hours of paperwork every week. I can focus more on patients.",
        name: "Dr. Lisa Thompson",
        role: "Cardiologist",
    },
    {
        text: "Scanlytics' multi-modal support means we don't need different tools for X-rays and MRIs anymore.",
        name: "Robert Fox",
        role: "Clinical Director",
    },
    {
        text: "The real-time analytics dashboard gives us unprecedented visibility into our department's performance.",
        name: "David Park",
        role: "Operations Manager",
    },
    {
        text: "Security and compliance were our top concerns, and Scanlytics exceeded our expectations.",
        name: "Jennifer Wu",
        role: "IT Director",
    },
];

const TestimonialCard = ({ data }: { data: typeof testimonialsTop[0] }) => (
    <div className="flex w-[350px] p-[24px] flex-col gap-[24px] shrink-0 bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] relative overflow-hidden">
        <div className="flex justify-between items-start">
            <div className="flex gap-[4px]">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-[16px] h-[16px] fill-[#1B44FE] text-[#1B44FE]" />
                ))}
            </div>
            <Quote className="w-[40px] h-[40px] text-[#f0f0f0] fill-[#f0f0f0]" />
        </div>

        <p className="font-Inter text-[16px] font-normal leading-[24px] text-[#7a7a7a]">
            "{data.text}"
        </p>

        <div className="flex gap-[12px] items-center">
            <div className="w-[40px] h-[40px] rounded-full bg-gray-200 overflow-hidden relative flex items-center justify-center text-[#1B44FE] font-bold text-lg">
                {/* Placeholder for avatar using initials */}
                {data.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div className="flex flex-col">
                <span className="font-Inter text-[14px] font-semibold text-[#0a0b10]">
                    {data.name}
                </span>
                <span className="font-Inter text-[12px] font-medium text-[#7a7a7a]">
                    {data.role}
                </span>
            </div>
        </div>
    </div>
);

export default function Testimonials() {
    return (
        <div className="w-full max-w-[1920px] py-[80px] flex flex-col gap-[60px] items-center overflow-hidden mx-auto bg-[#f0f0f0]">

            {/* Header */}
            <div className="flex flex-col gap-[16px] items-center px-[20px] text-center z-10">
                <div className="flex pt-[3px] pr-[12px] pb-[3px] pl-[12px] gap-[10px] justify-center items-center bg-[#fff] rounded-[40px] shadow-[0_0_0_0_#f8f8fa]">
                    <div className="w-[8px] h-[8px] rounded-full bg-[#1B44FE]" />
                    <span className="font-Inter text-[14px] font-semibold text-[#0a0b10]">
                        Testimonials
                    </span>
                </div>
                <h2 className="font-Inter text-[40px] md:text-[52px] font-semibold leading-[1.2] text-[#151621] tracking-[-2.6px]">
                    Trusted by leading <br /> medical professionals.
                </h2>
            </div>

            {/* Marquee Container */}
            <div className="flex flex-col gap-[24px] w-full relative">
                {/* Top Row - Moves Left */}
                <div className="flex w-full overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[100px] bg-gradient-to-r from-[#f0f0f0] to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-[100px] bg-gradient-to-l from-[#f0f0f0] to-transparent z-10" />

                    <motion.div
                        className="flex gap-[24px] shrink-0"
                        animate={{ x: "-50%" }}
                        transition={{
                            duration: 40,
                            ease: "linear",
                            repeat: Infinity
                        }}
                        style={{ width: "fit-content" }}
                    >
                        {[...testimonialsTop, ...testimonialsTop, ...testimonialsTop].map((item, index) => (
                            <TestimonialCard key={index} data={item} />
                        ))}
                    </motion.div>
                </div>

                {/* Bottom Row - Moves Right */}
                <div className="flex w-full overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[100px] bg-gradient-to-r from-[#f0f0f0] to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-[100px] bg-gradient-to-l from-[#f0f0f0] to-transparent z-10" />

                    <motion.div
                        className="flex gap-[24px] shrink-0"
                        initial={{ x: "-50%" }}
                        animate={{ x: "0%" }}
                        transition={{
                            duration: 40,
                            ease: "linear",
                            repeat: Infinity
                        }}
                        style={{ width: "fit-content" }}
                    >
                        {[...testimonialsBottom, ...testimonialsBottom, ...testimonialsBottom].map((item, index) => (
                            <TestimonialCard key={index} data={item} />
                        ))}
                    </motion.div>
                </div>
            </div>

        </div>
    );
}
