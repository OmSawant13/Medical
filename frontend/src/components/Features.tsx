import React from "react";

export default function Features() {
    return (
        <div className="main-container bg-[#f0f0f0] flex w-full max-w-[1920px] pt-[80px] px-[20px] md:px-[100px] xl:px-[410px] pb-[80px] flex-col items-center flex-nowrap relative overflow-hidden mx-auto my-0">
            <div className="flex flex-col gap-[80px] items-center self-stretch shrink-0 flex-nowrap rounded-[30px] relative">
                <div className="flex gap-[48px] justify-center items-center self-stretch shrink-0 flex-nowrap relative z-[1]">
                    <div className="flex w-[526px] flex-col items-start shrink-0 flex-nowrap relative z-[2]">
                        <div className="h-[360px] self-stretch shrink-0 bg-[#f0f0f0] rounded-[20px] border-solid border-4 border-white relative overflow-hidden shadow-[0_7px_21px_0_rgba(8,203,0,0.03)] z-[3]">
                            <div className="w-[800px] h-[512.05px] bg-[rgba(255,255,255,0)] rounded-[15px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(8,203,0,0.03)] z-[4] mt-[57.96px] mr-0 mb-0 ml-[-322px]">
                                <img src="/Features Section/Features-img-1.png" className="w-full h-full object-cover z-[5]" alt="Patient Dashboard" />
                                <div className="w-[800px] h-[512.04px] rounded-[15px] absolute top-0 left-0 z-[6]" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-[24.01px] items-start grow shrink-0 basis-0 flex-nowrap relative z-[7]">
                        <div className="h-[249.98px] self-stretch shrink-0 relative z-[8]">
                            <div className="flex w-[236px] pt-[3px] pr-[15px] pb-[3px] pl-[3px] gap-[8px] justify-center items-center flex-nowrap bg-[#fff] rounded-[40px] relative overflow-hidden shadow-[0_0_0_0_#f8f8fa] z-[9] mt-0 mr-0 mb-0 ml-0">
                                <div className="flex w-[83px] pt-[3px] pr-[8px] pb-[4px] pl-[8px] justify-center items-center self-stretch shrink-0 flex-nowrap rounded-[30px] relative overflow-hidden z-10 bg-linear-to-br from-green-600 to-green-500">
                                    <div className="flex w-[67px] flex-col items-start shrink-0 flex-nowrap relative z-[11]">
                                        <div className="flex pt-0 pr-0 pb-[0.8px] pl-0 flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[12]">
                                            <span className="h-[17px] shrink-0 basis-auto font-['Inter'] text-[12px] font-semibold leading-[16.8px] text-[#fff] tracking-[-0.36px] relative text-left whitespace-nowrap z-[13]">
                                                Patient Care
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex w-[127px] flex-col items-start shrink-0 flex-nowrap relative z-[14]">
                                    <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[15]">
                                        <span className="h-[19px] shrink-0 basis-auto font-['Inter'] text-[13px] font-semibold leading-[18.2px] text-[#0a0b10] tracking-[-0.39px] relative text-left whitespace-nowrap z-[16]">
                                            All-in-one platform
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex w-[440px] flex-col items-start flex-nowrap relative z-[17] mt-[15.295px] mr-0 mb-0 ml-0">
                                <span className="flex w-[420px] h-[116px] justify-start items-center shrink-0 font-['Inter'] text-[48px] font-semibold leading-[57.6px] text-[#0a0b10] tracking-[-2.4px] relative text-left overflow-hidden z-[18]">
                                    Manage patients <br />
                                    in one place.
                                </span>
                            </div>
                            <div className="flex w-[400px] flex-col items-start flex-nowrap relative z-[19] mt-[15.895px] mr-0 mb-0 ml-0">
                                <span className="flex w-[401px] h-[72px] justify-start items-center self-stretch shrink-0 font-['Inter'] text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] relative text-left overflow-hidden z-20">
                                    Keep scans, diagnostics, and patient data together in a <br />
                                    single, organized dashboard — so decisions are faster <br />
                                    and care is better.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
