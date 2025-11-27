import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { feedbackService } from '../services/firebase';
import Features from "../components/Features";
import UserInfo from "../components/UserInfo";
import Benefits from "../components/Benefits";
import Comparison from "../components/Comparison";
import Testimonials from "../components/Testimonials";
import Desktop from "../components/Desktop";
import Pricing from "../components/Pricing";
import FAQ from "../components/FAQ";
import Blog from "../components/Blog";
import Footer from "../components/Footer";
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    rating: 5,
    feedback: '',
    category: 'general'
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackForm.name || !feedbackForm.email || !feedbackForm.feedback) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      console.log('🚀 Submitting feedback from home page...');
      const docId = await feedbackService.submitFeedback({
        ...feedbackForm,
        source: 'home_page',
        timestamp: new Date().toISOString()
      });

      console.log('✅ Home page feedback submitted successfully! ID:', docId);
      setFeedbackSubmitted(true);

      setTimeout(() => {
        setFeedbackSubmitted(false);
        setFeedbackForm({ name: '', email: '', rating: 5, feedback: '', category: 'general' });
      }, 4000);
    } catch (error) {
      console.error('❌ Error submitting home page feedback:', error);
      setSubmitError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header - RevMax Style */}
      <div className="w-full h-[82px] flex flex-col items-start flex-nowrap fixed top-0 left-0 z-[100] bg-white">
        <div className="flex pt-[20px] pr-[64px] pb-[20px] pl-[64px] justify-center items-center self-stretch shrink-0 flex-nowrap bg-[#fff] relative overflow-hidden shadow-[0_-7px_21px_0_rgba(0,0,0,0.03)]">
          <div className="flex w-full max-w-[1920px] gap-[20px] justify-between items-center shrink-0 flex-nowrap relative z-[1]">
            {/* Logo Section */}
            <div className="flex items-center shrink-0 flex-nowrap relative z-[2]">
              <div className="flex gap-[6px] items-center shrink-0 flex-nowrap relative">
                <div className="flex w-[30px] h-[30px] items-center justify-center shrink-0 flex-nowrap relative rounded-[6px]" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 256 256"
                    className="h-5 w-5 fill-white"
                  >
                    <path d="M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z" />
                  </svg>
                </div>
                <span className="font-Inter text-[22px] font-semibold leading-[30.8px] text-[#0a0b10] tracking-[-1.1px] whitespace-nowrap">
                  Scanlytics
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex gap-[16px] justify-center items-center flex-nowrap relative">
              <button
                onClick={() => scrollToSection('features')}
                className="flex pt-[8px] pr-[8px] pb-[8px] pl-[8px] justify-center items-center flex-nowrap"
              >
                <span className="font-Inter text-[16px] font-medium leading-[22.4px] text-[#7a7a7a] tracking-[-0.48px] whitespace-nowrap hover:text-[#0a0b10] transition-colors">
                  Features
                </span>
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="flex pt-[8px] pr-[8px] pb-[8px] pl-[8px] justify-center items-center flex-nowrap"
              >
                <span className="font-Inter text-[16px] font-medium leading-[22.4px] text-[#7a7a7a] tracking-[-0.48px] whitespace-nowrap hover:text-[#0a0b10] transition-colors">
                  About
                </span>
              </button>
              <button
                onClick={() => scrollToSection('developer')}
                className="flex pt-[8px] pr-[8px] pb-[8px] pl-[8px] justify-center items-center flex-nowrap"
              >
                <span className="font-Inter text-[16px] font-medium leading-[22.4px] text-[#7a7a7a] tracking-[-0.48px] whitespace-nowrap hover:text-[#0a0b10] transition-colors">
                  Developer
                </span>
              </button>
              <Link
                to="/presentation"
                className="flex pt-[8px] pr-[8px] pb-[8px] pl-[8px] justify-center items-center flex-nowrap"
              >
                <span className="font-Inter text-[16px] font-medium leading-[22.4px] text-[#7a7a7a] tracking-[-0.48px] whitespace-nowrap hover:text-[#0a0b10] transition-colors">
                  Presentation
                </span>
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-[10px] justify-end items-center shrink-0 flex-nowrap relative">
              {/* Feedback Button */}
              <button
                onClick={() => scrollToSection('feedback')}
                className="flex h-[42px] pt-0 pr-[16px] pb-0 pl-[16px] gap-[8px] justify-center items-center shrink-0 flex-nowrap bg-[#fff] rounded-[12px] relative overflow-hidden border-2 border-[rgba(232,232,233,0.75)] hover:border-[#08CB00] transition-colors"
              >
                <span className="font-Inter text-[15px] font-semibold leading-[18px] text-[#0a0b10] tracking-[-0.3px] whitespace-nowrap">
                  Feedback
                </span>
                <svg className="w-[16px] h-[16px]" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Login Button - Green Gradient */}
              <Link
                to="/login"
                className="flex h-[42px] pt-0 pr-[16px] pb-0 pl-[16px] gap-[8px] justify-center items-center shrink-0 flex-nowrap rounded-[12px] relative overflow-hidden shadow-[0_4px_4px_0_rgba(27,68,254,0.3)] border-2 border-[rgba(248,248,250,0.12)] hover:shadow-[0_6px_8px_0_rgba(27,68,254,0.4)] transition-all"
                style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
              >
                <span className="font-Inter text-[15px] font-semibold leading-[18px] text-[#fff] tracking-[-0.3px] whitespace-nowrap">
                  Login
                </span>
                <svg className="w-[16px] h-[16px] text-white" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>




      {/* Hero Section - RevMax Style */}
      <section className="relative w-full min-h-screen bg-[#f0f0f0] py-24 px-6">
        <div className="mx-auto flex max-w-7xl flex-row items-stretch gap-12 min-h-screen">
          {/* Left Content */}
          <div className="flex w-1/2 flex-col items-start justify-center gap-6 py-12">
            {/* Kicker Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white px-3.5 py-1.5 shadow-[0_0_0_3px_rgb(248,248,250)]">
              <div className="rounded-full px-2.5 py-0.5" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                <span className="text-xs font-semibold text-white">AI-Powered</span>
              </div>
              <h6 className="text-[13px] font-semibold text-gray-900">Medical Analytics</h6>
            </div>

            {/* Main Heading */}
            <header className="flex flex-wrap items-center gap-3 text-[72px] font-bold leading-[1.1] tracking-tight text-gray-900">
              <h1>Transform</h1>
              <div className="inline-flex rotate-[8deg] items-center justify-center rounded-xl bg-gray-100 p-1.5 shadow-[0_0.4px_1.3px_-0.4px_rgba(27,68,254,0.09),0_1.6px_4.8px_-0.8px_rgba(27,68,254,0.12),0_7px_21px_-1.25px_rgba(27,68,254,0.24)]">
                <div className="rounded-lg p-1.5" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 256 256"
                    className="h-12 w-12 fill-white"
                  >
                    <path d="M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z" />
                  </svg>
                </div>
              </div>
              <h1 className="w-full">diagnostics</h1>
              <h1>with AI</h1>
              <h1>scans.</h1>
            </header>

            {/* Subtitle */}
            <p className="max-w-md text-base leading-relaxed text-gray-600">
              Analyze medical scans instantly, automate diagnostics, and get real-time AI insights for patient care—all in one platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 rounded-xl border-2 border-gray-100 px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_0.4px_0.9px_-0.4px_rgba(27,68,254,0.13),0_1.6px_3.5px_-0.8px_rgba(27,68,254,0.17),0_7px_15.4px_-1.25px_rgba(27,68,254,0.36)] transition-all hover:scale-105"
                style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
              >
                <span>Get started</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 256 256"
                  className="h-4 w-4 fill-white transition-transform group-hover:translate-x-1"
                >
                  <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z" />
                </svg>
              </Link>

              <Link
                to="/presentation"
                className="group inline-flex items-center gap-2 px-5 py-2.5 text-[15px] font-semibold text-gray-900 transition-all hover:gap-3"
              >
                <span>View demo</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 256 256"
                  className="h-4 w-4 fill-gray-900 transition-transform group-hover:translate-x-1"
                >
                  <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z" />
                </svg>
              </Link>
            </div>

            {/* Logo Carousel */}
            <div className="mt-6 w-full overflow-hidden opacity-50 mask-[linear-gradient(to_right,transparent_0%,black_25%,black_75%,transparent_100%)]">
              <div className="flex animate-scroll items-center gap-16">
                {/* Logos - repeat twice for seamless infinite loop */}
                {[...Array(2)].map((_, setIndex) => (
                  <div key={setIndex} className="flex shrink-0 items-center gap-16">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 22" className="h-6 w-auto shrink-0" aria-hidden="true">
                      <path d="M 11.182 22 C 17.358 22 22.364 17.075 22.364 11 L 22.364 3.3 C 22.364 1.477 20.862 0 19.009 0 L 11.741 0 L 11.741 4.826 C 11.741 5.927 11.809 7.067 12.396 8.005 C 13.247 9.364 14.655 10.292 16.256 10.55 L 16.47 10.584 C 16.651 10.645 16.773 10.812 16.773 11 C 16.773 11.188 16.651 11.355 16.47 11.416 L 16.256 11.45 C 13.885 11.831 12.027 13.66 11.64 15.992 L 11.605 16.202 C 11.543 16.38 11.373 16.5 11.182 16.5 C 10.991 16.5 10.82 16.38 10.759 16.202 L 10.724 15.992 C 10.462 14.417 9.518 13.031 8.137 12.195 C 7.184 11.617 6.025 11.55 4.905 11.55 L 0.013 11.55 C 0.306 17.37 5.194 22 11.182 22 Z M 0 10.45 L 4.905 10.45 C 6.025 10.45 7.184 10.383 8.137 9.805 C 8.882 9.354 9.509 8.737 9.967 8.005 C 10.555 7.067 10.623 5.927 10.623 4.826 L 10.623 0 L 3.355 0 C 1.502 0 0 1.477 0 3.3 Z M 25.973 1.1 C 25.973 1.708 25.472 2.2 24.854 2.2 C 24.237 2.2 23.736 1.708 23.736 1.1 C 23.736 0.492 24.237 0 24.854 0 C 25.472 0 25.973 0.492 25.973 1.1 Z M 118.366 6.657 C 121.492 6.657 123 8.805 123 11.293 L 123 15.965 L 119.729 15.965 L 119.729 11.847 C 119.729 10.72 119.311 9.789 118.111 9.789 C 116.912 9.789 116.512 10.72 116.512 11.847 L 116.512 15.964 L 113.241 15.964 L 113.241 11.847 C 113.241 10.72 112.841 9.789 111.642 9.789 C 110.442 9.789 110.024 10.72 110.024 11.847 L 110.024 15.964 L 106.753 15.964 L 106.753 11.292 C 106.753 8.804 108.261 6.657 111.387 6.657 C 113.096 6.657 114.331 7.319 114.895 8.411 C 115.494 7.319 116.803 6.656 118.366 6.656 Z M 100.875 13.101 C 101.929 13.101 102.384 12.152 102.384 11.024 L 102.384 7.015 L 105.654 7.015 L 105.654 11.418 C 105.654 14.049 104.092 16.233 100.875 16.233 C 97.658 16.233 96.095 14.05 96.095 11.418 L 96.095 7.015 L 99.367 7.015 L 99.367 11.024 C 99.367 12.152 99.821 13.101 100.875 13.101 Z" fill="currentColor" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 61 25" className="h-6 w-auto shrink-0" aria-hidden="true">
                      <path d="M 3.862 2.541 C 4.018 1.801 4.756 1.2 5.508 1.2 L 9.595 1.2 L 6.196 17.294 L 2.109 17.294 C 1.356 17.294 0.873 16.694 1.029 15.953 Z M 17.486 2.541 C 17.643 1.801 18.38 1.2 19.132 1.2 L 23.219 1.2 L 19.82 17.294 L 15.733 17.294 C 14.981 17.294 14.497 16.694 14.654 15.953 Z" fill="currentColor" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 21" className="h-6 w-auto shrink-0" aria-hidden="true">
                      <path d="M 12.818 0 C 10.709 0 8.687 0.847 7.195 2.355 L 2.329 7.275 C 0.838 8.783 0 10.828 0 12.96 C 0 17.401 3.56 21 7.951 21 C 10.06 21 12.083 20.153 13.574 18.645 L 16.94 15.242 L 26.748 5.325 C 27.46 4.605 28.426 4.2 29.433 4.2 C 31.119 4.2 32.549 5.311 33.045 6.849 L 36.14 3.719 C 34.728 1.483 32.252 0 29.433 0 C 27.324 0 25.302 0.847 23.811 2.355 L 10.637 15.675 C 9.924 16.395 8.959 16.8 7.951 16.8 C 5.854 16.8 4.154 15.081 4.154 12.96 C 4.154 11.942 4.554 10.965 5.266 10.245 L 10.133 5.325 C 10.845 4.605 11.811 4.2 12.818 4.2 C 14.504 4.2 15.934 5.311 16.429 6.849 L 19.525 3.719 C 18.113 1.483 15.637 0 12.818 0 Z" fill="currentColor" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 77 35" className="h-6 w-auto shrink-0" aria-hidden="true">
                      <path d="M 45.454 6.485 C 45.59 6.622 45.766 6.714 45.965 6.667 C 47.695 6.258 49.391 5.702 50.96 4.852 C 51.149 4.749 51.294 4.516 51.365 4.322 C 51.446 4.1 51.479 3.795 51.414 3.563 C 51.36 3.371 51.266 3.146 51.076 3.052 C 50.895 2.962 50.715 2.968 50.535 3.066 C 50.032 3.339 49.514 3.583 48.985 3.8 C 47.982 4.195 46.945 4.49 45.896 4.738 C 45.442 4.845 45.201 5.425 45.232 5.855 C 45.247 6.073 45.295 6.324 45.454 6.485 Z" fill="currentColor" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 129 23" className="h-6 w-auto shrink-0" aria-hidden="true">
                      <path d="M 49.391 7.175 C 49.391 11.365 49.391 13.02 43.873 13.02 C 49.391 13.02 49.391 14.674 49.391 18.865 C 49.391 14.699 49.391 13.02 54.823 13.02 C 49.391 13.02 49.391 11.34 49.391 7.175 Z" fill="currentColor" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Dashboard Preview */}
          <div className="relative flex w-1/2 flex-col items-center overflow-visible py-12">
            <div
              className="relative w-full h-full flex items-center"
              style={{
                transform: 'perspective(1200px) rotateY(-24deg) rotateX(8deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Dashboard Container with white border */}
              <div className="relative h-full w-full rounded-[32px] bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                <div className="relative h-full overflow-hidden rounded-[24px] bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 fill-white">
                          <path d="M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Medical Scan Analysis</h3>
                        <p className="text-xs text-gray-500">AI-Powered Diagnostics</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="text-2xl font-bold text-green-600">96.8%</div>
                      <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">2.3s</div>
                      <div className="text-xs text-gray-600">Analysis</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="text-2xl font-bold text-purple-600">50K+</div>
                      <div className="text-xs text-gray-600">Scans</div>
                    </div>
                  </div>

                  {/* Scan Preview */}
                  <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900">Current Scan</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Processing</span>
                    </div>
                    <div className="relative h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden">
                      {/* Simulated scan visualization */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="grid grid-cols-8 gap-1 opacity-30">
                          {[...Array(64)].map((_, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 bg-blue-500 rounded-sm"
                              style={{
                                opacity: Math.random() * 0.8 + 0.2,
                                animationDelay: `${i * 0.05}s`
                              }}
                            ></div>
                          ))}
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-4xl">🫁</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-900">AI Insights</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">92%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">87%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">95%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Growth Section - RevMax Style */}
        <div className="main-container flex w-full max-w-[1920px] mt-[40px] pt-[60px] pr-0 pb-[80px] pl-0 flex-col items-center flex-nowrap bg-[#f0f0f0] relative mx-auto my-0">
          <div className="flex flex-col gap-[32px] justify-center items-center self-stretch shrink-0 flex-nowrap relative overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center items-center self-stretch shrink-0 flex-nowrap relative z-[1]"
            >
              <div className="w-full flex flex-col items-center shrink-0 relative z-[2]">
                {/* First line */}
                <div className="flex justify-center items-center mb-1">
                  <span className="font-Inter text-[52px] font-semibold leading-[62.4px] text-[#151621] tracking-[-1px] text-center whitespace-nowrap">
                    Analyze every scan.
                  </span>
                </div>

                {/* Second line with icon */}
                <div className="flex justify-center items-center gap-3">
                  <span className="font-Inter text-[52px] font-semibold leading-[62.4px] text-[#151621] tracking-[-1px] text-center whitespace-nowrap">
                    Maximize
                  </span>

                  <div className="inline-flex rotate-[8deg] items-center justify-center rounded-xl bg-gray-100 p-1.5 shadow-[0_0.4px_1.3px_-0.4px_rgba(27,68,254,0.09),0_1.6px_4.8px_-0.8px_rgba(27,68,254,0.12),0_7px_21px_-1.25px_rgba(27,68,254,0.24)]">
                    <div className="rounded-lg p-1.5" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 256 256"
                        className="h-12 w-12 fill-white"
                      >
                        <path d="M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z" />
                      </svg>
                    </div>
                  </div>

                  <span className="font-Inter text-[52px] font-semibold leading-[62.4px] tracking-[-1px] text-center whitespace-nowrap" style={{ color: 'rgb(27, 68, 254)' }}>
                    accuracy.
                  </span>
                </div>
              </div>
            </motion.div>
            <div className="flex flex-col items-center self-stretch shrink-0 flex-nowrap relative z-[19]">
              <div className="flex gap-[24px] justify-center items-start self-stretch shrink-0 flex-wrap relative z-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex w-[350.67px] flex-col items-start shrink-0 flex-nowrap relative z-[21]"
                >
                  <div className="flex w-[350px] flex-col gap-[24px] justify-center items-center shrink-0 flex-nowrap relative z-[22]">
                    <div className="flex w-[300px] h-[300px] flex-col justify-center items-center shrink-0 flex-nowrap bg-[#f0f0f0] rounded-[15px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[23] border-4 border-white">
                      <img
                        src="/Growth section/Growth-img-1.avif"
                        alt="AI-Powered Diagnostics"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-[6px] justify-center items-center self-stretch shrink-0 flex-nowrap relative z-[25]">
                      <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[26]">
                        <div className="flex flex-col items-center self-stretch shrink-0 flex-nowrap relative z-[27]">
                          <span className="h-[26px] self-stretch shrink-0 basis-auto font-Inter text-[18px] font-semibold leading-[25.2px] text-[#0a0b10] tracking-[-0.54px] relative text-center whitespace-nowrap z-[28]">
                            AI-Powered Diagnostics
                          </span>
                        </div>
                      </div>
                      <div className="flex w-[260px] flex-col items-start shrink-0 flex-nowrap relative z-[29]">
                        <div className="h-[72px] self-stretch shrink-0 relative z-30">
                          <p className="w-[257.6px] font-Inter text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] text-center z-[31] mx-auto">
                            Automated analysis for medical scans. Track accuracy down to each diagnosis, scan type, or patient case.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="flex w-[350.67px] flex-col items-start shrink-0 flex-nowrap relative z-[33]"
                >
                  <div className="flex w-[350px] flex-col gap-[24px] justify-center items-center shrink-0 flex-nowrap relative z-[34]">
                    <div className="flex w-[300px] h-[300px] flex-col justify-center items-center shrink-0 flex-nowrap bg-[#f0f0f0] rounded-[15px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[35] border-4 border-white">
                      <img
                        src="/Gemini_Generated_Image_y79zroy79zroy79z.png"
                        alt="Real-Time Analysis"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-[6px] justify-center items-center self-stretch shrink-0 flex-nowrap relative z-[37]">
                      <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[38]">
                        <div className="flex flex-col items-center self-stretch shrink-0 flex-nowrap relative z-[39]">
                          <span className="h-[26px] self-stretch shrink-0 basis-auto font-Inter text-[18px] font-semibold leading-[25.2px] text-[#0a0b10] tracking-[-0.54px] relative text-center whitespace-nowrap z-40">
                            Real-Time Analysis
                          </span>
                        </div>
                      </div>
                      <div className="flex w-[260px] flex-col items-start shrink-0 flex-nowrap relative z-[41]">
                        <div className="h-[72px] self-stretch shrink-0 relative z-[42]">
                          <p className="w-[263.4px] font-Inter text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] text-center z-[43] mx-auto">
                            Monitor scan processing, AI predictions, and diagnostic accuracy in real-time. Get detailed insights per patient.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                  className="flex w-[350.67px] flex-col items-start shrink-0 flex-nowrap relative z-[45]"
                >
                  <div className="flex w-[350px] flex-col gap-[24px] justify-center items-center shrink-0 flex-nowrap relative z-[46]">
                    <div className="flex w-[300px] h-[300px] flex-col justify-center items-center shrink-0 flex-nowrap bg-[#f0f0f0] rounded-[15px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[47] border-4 border-white">
                      <img
                        src="/Growth section/Growth-img-3.avif"
                        alt="Multi-Modal Support"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-[6px] justify-center items-center self-stretch shrink-0 flex-nowrap relative z-[49]">
                      <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-50">
                        <div className="flex flex-col items-center self-stretch shrink-0 flex-nowrap relative z-[51]">
                          <span className="h-[26px] self-stretch shrink-0 basis-auto font-Inter text-[18px] font-semibold leading-[25.2px] text-[#0a0b10] tracking-[-0.54px] relative text-center whitespace-nowrap z-[52]">
                            Multi-Modal Support
                          </span>
                        </div>
                      </div>
                      <div className="flex w-[260px] flex-col items-start shrink-0 flex-nowrap relative z-[53]">
                        <div className="h-[72px] self-stretch shrink-0 relative z-[54]">
                          <p className="w-[218.86px] font-Inter text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] text-center z-[55] mx-auto">
                            Analyze X-rays, MRIs, CT scans, and more within a unified medical imaging platform.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-[#f0f0f0] flex w-full max-w-[1920px] px-[20px] md:px-[100px] xl:px-[410px] pb-[80px] flex-col items-center flex-nowrap relative overflow-hidden mx-auto my-0">
        <div className="flex flex-col gap-[80px] items-center self-stretch shrink-0 flex-nowrap rounded-[30px] relative">
          {/* Feature 1: Patient Care */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-[48px] justify-center items-center self-stretch shrink-0 flex-nowrap relative z-[1]"
          >
            <div className="flex w-[526px] flex-col items-start shrink-0 flex-nowrap relative z-[2]">
              <div className="h-[360px] self-stretch shrink-0 bg-[#f0f0f0] rounded-[20px] border-solid border-4 border-white relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[3]">
                <div className="w-[800px] h-[512.05px] bg-white rounded-[15px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[4] mt-[57.96px] mr-0 mb-0 ml-[-322px] p-6">
                  {/* Patient Dashboard Preview */}
                  <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5">
                    {/* Dashboard Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          JD
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">John Doe</h3>
                          <p className="text-xs text-gray-500">Patient ID: #12345</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Active
                      </div>
                    </div>

                    {/* Patient Info Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">Age</div>
                        <div className="text-lg font-bold text-gray-900">45</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">Blood Type</div>
                        <div className="text-lg font-bold text-red-600">O+</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">Scans</div>
                        <div className="text-lg font-bold text-blue-600">12</div>
                      </div>
                    </div>

                    {/* Recent Scans */}
                    <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900">Recent Scans</span>
                        <span className="text-xs text-blue-600 font-medium cursor-pointer">View All</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-xs">🫁</div>
                            <div>
                              <div className="text-xs font-medium text-gray-900">Chest X-Ray</div>
                              <div className="text-xs text-gray-500">2 days ago</div>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Normal</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center text-xs">🧠</div>
                            <div>
                              <div className="text-xs font-medium text-gray-900">Brain MRI</div>
                              <div className="text-xs text-gray-500">1 week ago</div>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Normal</span>
                        </div>
                      </div>
                    </div>

                    {/* Health Metrics */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-sm font-semibold text-gray-900 mb-3">Health Metrics</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Heart Rate</span>
                          <span className="text-xs font-semibold text-gray-900">72 bpm</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '72%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-[24.01px] items-start grow shrink-0 basis-0 flex-nowrap relative z-[7]">
              <div className="self-stretch shrink-0 relative z-[8]">
                <div className="flex w-[236px] pt-[3px] pr-[15px] pb-[3px] pl-[3px] gap-[8px] justify-center items-center flex-nowrap bg-[#fff] rounded-[40px] relative overflow-hidden shadow-[0_0_0_0_#f8f8fa] z-[9] mt-0 mr-0 mb-0 ml-0">
                  <div className="flex w-[83px] pt-[3px] pr-[8px] pb-[4px] pl-[8px] justify-center items-center self-stretch shrink-0 flex-nowrap rounded-[30px] relative overflow-hidden z-10" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                    <div className="flex w-[67px] flex-col items-start shrink-0 flex-nowrap relative z-[11]">
                      <div className="flex pt-0 pr-0 pb-[0.8px] pl-0 flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[12]">
                        <span className="h-[17px] shrink-0 basis-auto font-Inter text-[12px] font-semibold leading-[16.8px] text-[#fff] tracking-[-0.36px] relative text-left whitespace-nowrap z-[13]">
                          Patient Care
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-[127px] flex-col items-start shrink-0 flex-nowrap relative z-[14]">
                    <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[15]">
                      <span className="h-[19px] shrink-0 basis-auto font-Inter text-[13px] font-semibold leading-[18.2px] text-[#0a0b10] tracking-[-0.39px] relative text-left whitespace-nowrap z-[16]">
                        All-in-one platform
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex w-[440px] flex-col items-start flex-nowrap relative z-[17] mt-[15.295px] mr-0 mb-0 ml-0">
                  <span className="flex w-[420px] h-[116px] justify-start items-center shrink-0 font-Inter text-[48px] font-semibold leading-[57.6px] text-[#0a0b10] tracking-[-2.4px] relative text-left overflow-hidden z-[18]">
                    Manage patients <br />
                    in one place.
                  </span>
                </div>
                <div className="flex w-[400px] flex-col items-start flex-nowrap relative z-[19] mt-[15.895px] mr-0 mb-0 ml-0">
                  <span className="flex w-[401px] h-[72px] justify-start items-center self-stretch shrink-0 font-Inter text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] relative text-left overflow-hidden z-20">
                    Keep scans, diagnostics, and patient data together in a <br />
                    single, organized dashboard — so decisions are faster <br />
                    and care is better.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Doctor Suite */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex gap-[48px] justify-center items-center self-stretch shrink-0 flex-nowrap relative z-[21]"
          >
            <div className="flex flex-col gap-[24.01px] items-start grow shrink-0 basis-0 flex-nowrap relative z-[22]">
              <div className="self-stretch shrink-0 relative z-[23]">
                <div className="flex w-[236px] pt-[3px] pr-[15px] pb-[3px] pl-[3px] gap-[8px] justify-center items-center flex-nowrap bg-[#fff] rounded-[40px] relative overflow-hidden shadow-[0_0_0_0_#f8f8fa] z-[24] mt-0 mr-0 mb-0 ml-0">
                  <div className="flex w-[83px] pt-[3px] pr-[8px] pb-[4px] pl-[8px] justify-center items-center self-stretch shrink-0 flex-nowrap rounded-[30px] relative overflow-hidden z-25" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                    <div className="flex w-[67px] flex-col items-start shrink-0 flex-nowrap relative z-[26]">
                      <div className="flex pt-0 pr-0 pb-[0.8px] pl-0 flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[27]">
                        <span className="h-[17px] shrink-0 basis-auto font-Inter text-[12px] font-semibold leading-[16.8px] text-[#fff] tracking-[-0.36px] relative text-left whitespace-nowrap z-[28]">
                          Doctor Suite
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-[127px] flex-col items-start shrink-0 flex-nowrap relative z-[29]">
                    <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-30">
                      <span className="h-[19px] shrink-0 basis-auto font-Inter text-[13px] font-semibold leading-[18.2px] text-[#0a0b10] tracking-[-0.39px] relative text-left whitespace-nowrap z-[31]">
                        Professional tools
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex w-[440px] flex-col items-start flex-nowrap relative z-[32] mt-[15.295px] mr-0 mb-0 ml-0">
                  <span className="flex w-[420px] h-[116px] justify-start items-center shrink-0 font-Inter text-[48px] font-semibold leading-[57.6px] text-[#0a0b10] tracking-[-2.4px] relative text-left overflow-hidden z-[33]">
                    AI-powered <br />
                    diagnostics.
                  </span>
                </div>
                <div className="flex w-[400px] flex-col items-start flex-nowrap relative z-[34] mt-[15.895px] mr-0 mb-0 ml-0">
                  <span className="flex w-[401px] h-[72px] justify-start items-center self-stretch shrink-0 font-Inter text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] relative text-left overflow-hidden z-[35]">
                    Leverage advanced AI to assist with scan analysis, <br />
                    patient prioritization, and automated reporting for <br />
                    faster, more accurate diagnoses.
                  </span>
                </div>
              </div>
            </div>
            <div className="flex w-[526px] flex-col items-start shrink-0 flex-nowrap relative z-[36]">
              <div className="h-[360px] self-stretch shrink-0 bg-[#f0f0f0] rounded-[20px] border-solid border-4 border-white relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[37]">
                <div className="w-[800px] h-[512.05px] bg-white rounded-[15px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[38] mt-[57.96px] mr-0 mb-0 ml-[-322px] p-6">
                  {/* Doctor Dashboard Preview */}
                  <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-bold text-gray-900">Patient Queue</div>
                      <div className="text-sm text-blue-600 font-semibold">5 waiting</div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">A</div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-900">Alex Johnson</div>
                            <div className="text-xs text-gray-500">X-Ray Review</div>
                          </div>
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Urgent</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg">View Scan</button>
                          <button className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg">Details</button>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">M</div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-900">Maria Garcia</div>
                            <div className="text-xs text-gray-500">MRI Analysis</div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Normal</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg">View Scan</button>
                          <button className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg">Details</button>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs font-semibold text-gray-900 mb-2">AI Insights</div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Diagnostic Accuracy</span>
                          <span className="text-xs font-bold text-green-600">96.8%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '96.8%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 3: Hospital Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex gap-[48px] justify-center items-center self-stretch shrink-0 flex-nowrap relative z-[39]"
          >
            <div className="flex w-[526px] flex-col items-start shrink-0 flex-nowrap relative z-40">
              <div className="h-[360px] self-stretch shrink-0 bg-[#f0f0f0] rounded-[20px] border-solid border-4 border-white relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[41]">
                <div className="w-[800px] h-[512.05px] bg-white rounded-[15px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[42] mt-[57.96px] mr-0 mb-0 ml-[-322px] p-6">
                  {/* Hospital Dashboard Preview */}
                  <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5">
                    <div className="text-lg font-bold text-gray-900 mb-4">System Analytics</div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">247</div>
                        <div className="text-xs text-gray-600">Scans Today</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-2xl font-bold text-green-600">96.8%</div>
                        <div className="text-xs text-gray-600">AI Accuracy</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-2xl font-bold text-purple-600">24/30</div>
                        <div className="text-xs text-gray-600">Active Doctors</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
                      <div className="text-sm font-semibold text-gray-900 mb-3">Department Performance</div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Radiology</span>
                            <span className="text-xs font-bold text-gray-900">92%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Cardiology</span>
                            <span className="text-xs font-bold text-gray-900">88%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Neurology</span>
                            <span className="text-xs font-bold text-gray-900">95%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-900">System Status</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">All Systems Operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-[24.01px] items-start grow shrink-0 basis-0 flex-nowrap relative z-[43]">
              <div className="self-stretch shrink-0 relative z-[44]">
                <div className="flex w-[236px] pt-[3px] pr-[15px] pb-[3px] pl-[3px] gap-[8px] justify-center items-center flex-nowrap bg-[#fff] rounded-[40px] relative overflow-hidden shadow-[0_0_0_0_#f8f8fa] z-[45] mt-0 mr-0 mb-0 ml-0">
                  <div className="flex w-[83px] pt-[3px] pr-[8px] pb-[4px] pl-[8px] justify-center items-center self-stretch shrink-0 flex-nowrap rounded-[30px] relative overflow-hidden z-[46]" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                    <div className="flex w-[67px] flex-col items-start shrink-0 flex-nowrap relative z-[47]">
                      <div className="flex pt-0 pr-0 pb-[0.8px] pl-0 flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[48]">
                        <span className="h-[17px] shrink-0 basis-auto font-Inter text-[12px] font-semibold leading-[16.8px] text-[#fff] tracking-[-0.36px] relative text-left whitespace-nowrap z-[49]">
                          Enterprise
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-[127px] flex-col items-start shrink-0 flex-nowrap relative z-50">
                    <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[51]">
                      <span className="h-[19px] shrink-0 basis-auto font-Inter text-[13px] font-semibold leading-[18.2px] text-[#0a0b10] tracking-[-0.39px] relative text-left whitespace-nowrap z-[52]">
                        System-wide control
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex w-[440px] flex-col items-start flex-nowrap relative z-[53] mt-[15.295px] mr-0 mb-0 ml-0">
                  <span className="flex w-[420px] h-[116px] justify-start items-center shrink-0 font-Inter text-[48px] font-semibold leading-[57.6px] text-[#0a0b10] tracking-[-2.4px] relative text-left overflow-hidden z-[54]">
                    Monitor your <br />
                    entire hospital.
                  </span>
                </div>
                <div className="flex w-[400px] flex-col items-start flex-nowrap relative z-[55] mt-[15.895px] mr-0 mb-0 ml-0">
                  <span className="flex w-[401px] h-[72px] justify-start items-center self-stretch shrink-0 font-Inter text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] relative text-left overflow-hidden z-[56]">
                    Get real-time insights across all departments, track <br />
                    system performance, and manage resources with <br />
                    comprehensive analytics and reporting.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* How It Works Section */}
      < section className="flex w-full max-w-[1920px] pt-[80px] px-[20px] md:px-[100px] xl:px-[410px] pb-[80px] justify-center items-start flex-nowrap relative overflow-hidden mx-auto my-0 bg-[#f0f0f0]" >
        <div className="flex w-full max-w-[1100px] flex-col gap-[32px] items-center shrink-0 flex-nowrap relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-[16px] items-center self-stretch shrink-0 flex-nowrap relative z-[1]"
          >
            <div className="flex w-[125px] flex-col items-start shrink-0 flex-nowrap relative z-[2]">
              <div className="flex w-[125px] pt-[3px] pr-[12px] pb-[3px] pl-[12px] gap-[10px] justify-center items-center shrink-0 flex-nowrap bg-[#fff] rounded-[40px] relative overflow-hidden shadow-[0_0_0_0_#f8f8fa] z-[3]">
                <div className="w-[8px] h-[8px] shrink-0 rounded-[40px] relative overflow-hidden z-[4]" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }} />
                <div className="flex w-[83px] flex-col items-start shrink-0 flex-nowrap relative z-[5]">
                  <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[6]">
                    <span className="h-[20px] shrink-0 basis-auto font-Inter text-[14px] font-semibold leading-[19.6px] text-[#0a0b10] tracking-[-0.42px] relative text-left whitespace-nowrap z-[7]">
                      How it works
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full max-w-[600px] shrink-0 text-[0px] relative z-[8] text-center">
              <span className="font-Inter text-[40px] md:text-[52px] font-semibold leading-[1.2] text-[#151621] tracking-[-2.6px] relative z-[9]">
                Get started in <br />
              </span>
              <span className="font-Inter text-[40px] md:text-[52px] font-semibold leading-[1.2] text-[#151621] tracking-[-2.6px] relative z-10">
                three simple steps.
              </span>
            </div>
            <div className="w-full max-w-[640px] shrink-0 text-[0px] relative z-[11] text-center">
              <span className="font-Inter text-[16px] md:text-[18px] font-medium leading-[1.5] text-[#7a7a7a] tracking-[-0.36px] relative z-[12]">
                Upload medical scans, let AI analyze them instantly, <br />
              </span>
              <span className="font-Inter text-[16px] md:text-[18px] font-medium leading-[1.5] text-[#7a7a7a] tracking-[-0.36px] relative z-[13]">
                and get comprehensive diagnostic insights in seconds.
              </span>
            </div>
          </motion.div>
          <div className="flex flex-row gap-[26px] justify-center items-start self-stretch shrink-0 flex-nowrap relative z-[14]">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex w-full md:w-[349.33px] flex-col items-start shrink-0 flex-nowrap relative z-[15]"
            >
              <div className="flex pt-[32px] pr-[32px] pb-[32px] pl-[32px] flex-col gap-[32px] items-start self-stretch shrink-0 flex-nowrap bg-[#fff] rounded-[20px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[16]">
                <div className="h-[200px] self-stretch shrink-0 relative z-[17]">
                  <div className="flex h-[200px] justify-center items-center flex-nowrap rounded-[15px] absolute top-0 left-0 right-0 z-[18] overflow-hidden">
                    <img src="/How section/How-img-1.png" className="w-full h-full object-cover" alt="Step 1" />
                  </div>
                </div>
                <div className="flex pt-0 pr-[24px] pb-0 pl-0 flex-col gap-[15px] items-start self-stretch shrink-0 flex-nowrap relative z-20">
                  <div className="flex w-[57px] pt-[5px] pr-[10px] pb-[5px] pl-[10px] justify-center items-center shrink-0 flex-nowrap rounded-[10px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.24)] z-[21]" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                    <div className="flex w-[37px] flex-col items-start shrink-0 flex-nowrap relative z-[22]">
                      <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[23]">
                        <span className="h-[19px] shrink-0 basis-auto font-Inter text-[13px] font-semibold leading-[18.2px] text-[#fff] tracking-[-0.39px] relative text-left whitespace-nowrap z-[24]">
                          Step 1
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[6px] justify-center items-start self-stretch shrink-0 flex-nowrap relative z-[25]">
                    <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[26]">
                      <div className="flex pt-0 pr-0 pb-[0.8px] pl-0 flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[27]">
                        <span className="h-[29px] self-stretch shrink-0 basis-auto font-Inter text-[24px] font-semibold leading-[28.8px] text-[#0a0b10] tracking-[-1.2px] relative text-left whitespace-nowrap z-[28]">
                          Upload Medical Scans
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[29]">
                      <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-30">
                        <span className="flex w-full h-[72px] justify-start items-center self-stretch shrink-0 font-Inter text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] relative text-left overflow-hidden z-[31]">
                          Upload X-rays, MRIs, CT scans, or <br />
                          any medical imaging files. Supports <br />
                          all standard DICOM formats.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex w-full md:w-[349.33px] flex-col items-start shrink-0 flex-nowrap relative z-[32]"
            >
              <div className="flex pt-[32px] pr-[32px] pb-[32px] pl-[32px] flex-col gap-[32px] items-start self-stretch shrink-0 flex-nowrap bg-[#fff] rounded-[20px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-[33]">
                <div className="h-[200px] self-stretch shrink-0 relative z-[34]">
                  <div className="flex h-[200px] justify-center items-center flex-nowrap rounded-[15px] absolute top-0 left-0 right-0 z-[35] overflow-hidden">
                    <img src="/How section/How-img-2.png" className="w-full h-full object-cover" alt="Step 2" />
                  </div>
                </div>
                <div className="flex pt-0 pr-[24px] pb-0 pl-0 flex-col gap-[15px] items-start self-stretch shrink-0 flex-nowrap relative z-[37]">
                  <div className="flex w-[59px] pt-[5px] pr-[10px] pb-[5px] pl-[10px] justify-center items-center shrink-0 flex-nowrap rounded-[10px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.24)] z-[38]" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                    <div className="flex w-[39px] flex-col items-start shrink-0 flex-nowrap relative z-[39]">
                      <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-40">
                        <span className="h-[19px] shrink-0 basis-auto font-Inter text-[13px] font-semibold leading-[18.2px] text-[#fff] tracking-[-0.39px] relative text-left whitespace-nowrap z-[41]">
                          Step 2
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[6px] justify-center items-start self-stretch shrink-0 flex-nowrap relative z-[42]">
                    <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[43]">
                      <div className="flex pt-0 pr-0 pb-[0.8px] pl-0 flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[44]">
                        <span className="h-[29px] self-stretch shrink-0 basis-auto font-Inter text-[24px] font-semibold leading-[28.8px] text-[#0a0b10] tracking-[-1.2px] relative text-left whitespace-nowrap z-[45]">
                          AI Analysis
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[46]">
                      <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[47]">
                        <span className="flex w-full h-[72px] justify-start items-center self-stretch shrink-0 font-Inter text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] relative text-left overflow-hidden z-[48]">
                          Our AI instantly analyzes scans with <br />
                          80% accuracy, detecting anomalies <br />
                          and patterns in real-time.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex w-full md:w-[349.33px] flex-col items-start shrink-0 flex-nowrap relative z-[49]"
            >
              <div className="flex pt-[32px] pr-[32px] pb-[32px] pl-[32px] flex-col gap-[32px] items-start self-stretch shrink-0 flex-nowrap bg-[#fff] rounded-[20px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] z-50">
                <div className="h-[200px] self-stretch shrink-0 relative z-[51]">
                  <div className="flex h-[200px] justify-center items-center flex-nowrap rounded-[15px] absolute top-0 left-0 right-0 z-[52] overflow-hidden">
                    <img src="/How section/How-img-3.png" className="w-full h-full object-cover" alt="Step 3" />
                  </div>
                </div>
                <div className="flex pt-0 pr-[24px] pb-0 pl-0 flex-col gap-[15px] items-start self-stretch shrink-0 flex-nowrap relative z-[54]">
                  <div className="flex w-[59px] pt-[5px] pr-[10px] pb-[5px] pl-[10px] justify-center items-center shrink-0 flex-nowrap rounded-[10px] relative overflow-hidden shadow-[0_7px_21px_0_rgba(27,68,254,0.24)] z-[55]" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                    <div className="flex w-[39px] flex-col items-start shrink-0 flex-nowrap relative z-[56]">
                      <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[57]">
                        <span className="h-[19px] shrink-0 basis-auto font-Inter text-[13px] font-semibold leading-[18.2px] text-[#fff] tracking-[-0.39px] relative text-left whitespace-nowrap z-[58]">
                          Step 3
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[6px] justify-center items-start self-stretch shrink-0 flex-nowrap relative z-[59]">
                    <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[60]">
                      <div className="flex pt-0 pr-0 pb-[0.8px] pl-0 flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[61]">
                        <span className="h-[29px] self-stretch shrink-0 basis-auto font-Inter text-[24px] font-semibold leading-[28.8px] text-[#0a0b10] tracking-[-1.2px] relative text-left whitespace-nowrap z-[62]">
                          Get Insights & Reports
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[63]">
                      <div className="flex flex-col items-start self-stretch shrink-0 flex-nowrap relative z-[64]">
                        <span className="flex w-full h-[72px] justify-start items-center self-stretch shrink-0 font-Inter text-[16px] font-medium leading-[24px] text-[#7a7a7a] tracking-[-0.32px] relative text-left overflow-hidden z-[65]">
                          Receive comprehensive diagnostic <br />
                          reports, actionable insights, and <br />
                          treatment recommendations instantly.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* User Interface Section */}
      <UserInfo />

      {/* Benefits Section */}
      <Benefits />

      {/* Comparison Section */}
      <Comparison />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Desktop Section */}
      <Desktop />

      {/* Pricing Section */}
      <Pricing />

      {/* FAQ Section */}
      <FAQ />

      {/* Blog Section */}
      <Blog />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
{/* Growth Section - RevMax Style - ADD THIS AFTER HERO SECTION */ }
{/*
<div className="main-container flex w-full max-w-[1920px] pt-[80px] pr-0 pb-[80px] pl-0 flex-col items-center flex-nowrap bg-[#f0f0f0] relative mx-auto my-0">
  Growth section code here...
</div>
*/}
