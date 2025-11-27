import React from "react";

export default function HowItWorks() {
    return (
        <div className="main-container flex w-full max-w-[1920px] pt-[80px] px-[20px] md:px-[100px] xl:px-[410px] pb-[80px] justify-center items-start flex-nowrap relative overflow-hidden mx-auto my-0 bg-[#f0f0f0]">
            <div className="flex w-full max-w-[1100px] flex-col gap-[32px] items-center shrink-0 flex-nowrap relative">
                <div className="flex flex-col gap-[16px] items-center self-stretch shrink-0 flex-nowrap relative z-[1]">
                    <div className="w-full max-w-[600px] shrink-0 text-[0px] relative z-[8] text-center">
                        <span className="font-['Inter'] text-[40px] md:text-[52px] font-semibold leading-[1.2] text-[#151621] tracking-[-2.6px] relative z-[9]">
                            Get started in <br />
                            three simple steps.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
