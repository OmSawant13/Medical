"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const blogPosts = [
    {
        category: "Technology",
        title: "Next-Generation AI: The Future of Medical Diagnostics",
        excerpt: "Powered by cutting-edge machine learning algorithms, our advanced neural networks achieve 96.8% accuracy in medical imaging with sub-second scan processing.",
        author: "Dr. Sarah Chen",
        role: "Chief AI Officer",
        image: "/Blog Section/Blog-img-1.png",
        featured: true,
    },
    {
        category: "Efficiency",
        title: "Improving Radiologist Efficiency with AI Workflows",
        image: "/Blog Section/Blog-img-2.png",
    },
    {
        category: "Security",
        title: "Data Security in Cloud-Based PACS: What You Need to Know",
        image: "/Blog Section/Blog-img-3.png",
    },
    {
        category: "Economics",
        title: "The ROI of AI in Healthcare: A Comprehensive Guide",
        image: "/Blog Section/Blog-img-4.png",
    },
];

export default function Blog() {
    const featuredPost = blogPosts[0];
    const regularPosts = blogPosts.slice(1);

    return (
        <div className="flex w-full max-w-[1920px] pt-[80px] px-[20px] md:px-[100px] xl:px-[180px] pb-[80px] flex-col items-center flex-nowrap bg-[#f0f0f0] relative overflow-hidden mx-auto my-0">
            <div className="flex w-full max-w-[1100px] flex-col gap-[32px] items-center shrink-0 flex-nowrap relative">

                {/* Header */}
                <div className="flex flex-col gap-[16px] items-center self-stretch shrink-0 flex-nowrap relative">
                    {/* Badge */}
                    <div className="flex pt-[3px] pr-[12px] pb-[3px] pl-[12px] gap-[10px] justify-center items-center shrink-0 flex-nowrap bg-[#fff] rounded-[40px] relative overflow-hidden shadow-[0_0_0_0_#f8f8fa]">
                        <div className="w-[8px] h-[8px] shrink-0 rounded-[40px] bg-[#1B44FE] relative overflow-hidden" />
                        <span className="font-['Inter'] text-[14px] font-semibold leading-[19.6px] text-[#0a0b10] tracking-[-0.42px] relative text-left whitespace-nowrap">
                            Blog
                        </span>
                    </div>

                    {/* Title and Description Row */}
                    <div className="flex flex-col lg:flex-row gap-[16px] lg:gap-[48px] justify-between items-start lg:items-end self-stretch shrink-0 flex-nowrap relative">
                        {/* Left - Title */}
                        <div className="flex flex-col items-start shrink-0 flex-nowrap relative">
                            <h2 className="font-['Inter'] text-[40px] md:text-[52px] font-semibold leading-[1.2] text-[#151621] tracking-[-2.6px] relative text-left">
                                Insights to help your <br />
                                practice grow.
                            </h2>
                        </div>

                        {/* Right - Description and CTA */}
                        <div className="flex flex-col gap-[16px] items-start shrink-0 flex-nowrap relative">
                            <p className="font-['Inter'] text-[18px] font-medium leading-[27px] text-[#7a7a7a] tracking-[-0.36px] relative text-left max-w-[320px]">
                                Powerful analytics, seamless integrations to keep work moving.
                            </p>

                            <button className="flex pt-[8px] pr-[12px] pb-[8px] pl-0 gap-[8px] items-center shrink-0 flex-nowrap bg-transparent relative overflow-hidden group hover:gap-[12px] transition-all">
                                <span className="font-['Inter'] text-[15px] font-semibold leading-[18px] text-[#0a0b10] tracking-[-0.3px] relative text-left whitespace-nowrap">
                                    View all posts
                                </span>
                                <ArrowRight className="w-[16px] h-[16px] text-[#0a0b10] group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Blog Posts */}
                <div className="flex flex-col gap-[26px] items-start self-stretch shrink-0 flex-nowrap relative">

                    {/* Featured Post */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="flex w-full flex-col lg:flex-row gap-[24px] items-start shrink-0 flex-nowrap bg-[#fff] rounded-[20px] pt-[20px] pr-[20px] pb-[20px] pl-[20px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)]"
                    >
                        {/* Featured Image */}
                        <div className="flex w-full lg:w-[480px] h-[280px] lg:h-[360px] justify-center items-center shrink-0 flex-nowrap rounded-[12px] relative overflow-hidden">
                            <motion.img
                                src={featuredPost.image}
                                alt={featuredPost.title}
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                                className="w-full h-full object-cover relative overflow-hidden"
                            />
                        </div>

                        {/* Featured Content */}
                        <div className="flex flex-col gap-[20px] justify-between items-start flex-1 shrink-0 flex-nowrap relative">
                            {/* Category Badge */}
                            <div className="flex pt-[5px] pr-[15px] pb-[5px] pl-[15px] justify-center items-center shrink-0 flex-nowrap rounded-[64px] bg-[#1B44FE] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)]">
                                <span className="font-['Inter'] text-[14px] font-semibold leading-[19.6px] text-[#fff] tracking-[-0.42px] relative text-left whitespace-nowrap">
                                    {featuredPost.category}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="font-['Inter'] text-[28px] md:text-[34px] font-semibold leading-[1.3] text-[#0a0b10] tracking-[-1.7px] relative text-left">
                                {featuredPost.title}
                            </h3>

                            {/* Excerpt */}
                            <p className="font-['Inter'] text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] relative text-left">
                                {featuredPost.excerpt}
                            </p>

                            {/* Author Info */}
                            <div className="flex gap-[10px] items-center shrink-0 flex-nowrap relative mt-auto">
                                <div className="w-[40px] h-[40px] shrink-0 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden" />
                                <div className="flex flex-col gap-[2px] justify-center items-start shrink-0 flex-nowrap relative">
                                    <span className="font-['Inter'] text-[14px] font-medium leading-[19.6px] text-[#0a0b10] tracking-[-0.42px] relative text-left whitespace-nowrap">
                                        Written by {featuredPost.author}
                                    </span>
                                    <span className="font-['Inter'] text-[14px] font-medium leading-[19.6px] text-[#7a7a7a] tracking-[-0.42px] relative text-left whitespace-nowrap">
                                        {featuredPost.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Regular Posts Grid */}
                    <div className="flex gap-[26px] justify-start items-start self-stretch shrink-0 flex-wrap relative">
                        {regularPosts.map((post, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="flex w-full md:w-[calc(50%-13px)] lg:w-[349px] flex-col gap-[20px] items-start shrink-0 flex-nowrap bg-[#fff] rounded-[20px] pt-[20px] pr-[20px] pb-[20px] pl-[20px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-shadow cursor-pointer"
                            >
                                {/* Image */}
                                <div className="flex w-full h-[200px] justify-center items-center shrink-0 flex-nowrap rounded-[12px] relative overflow-hidden">
                                    <motion.img
                                        src={post.image}
                                        alt={post.title}
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ duration: 0.3 }}
                                        className="w-full h-full object-cover relative overflow-hidden"
                                    />
                                </div>

                                {/* Category Badge */}
                                <div className="flex pt-[3px] pr-[12px] pb-[4px] pl-[12px] justify-center items-center shrink-0 flex-nowrap rounded-[64px] bg-[#1B44FE] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)]">
                                    <span className="font-['Inter'] text-[12px] font-semibold leading-[16.8px] text-[#fff] tracking-[-0.36px] relative text-left whitespace-nowrap">
                                        {post.category}
                                    </span>
                                </div>

                                {/* Title */}
                                <h4 className="font-['Inter'] text-[18px] font-semibold leading-[25.2px] text-[#0a0b10] tracking-[-0.54px] relative text-left">
                                    {post.title}
                                </h4>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
