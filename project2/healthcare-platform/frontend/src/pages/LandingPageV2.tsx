import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

export default function LandingPageV2() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Navigation */}
      {/* Premium Floating Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4">
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-full shadow-lg shadow-black/5 p-2 px-6 flex items-center justify-between transition-all duration-300">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group mr-8">
            <img
              src="/imgs/Gemini_Generated_Image_lv0l8xlv0l8xlv0l.png"
              alt="HealthLink Logo"
              className="w-10 h-10 rounded-full object-cover shadow-md group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
              Health<span className="text-orange-600">Link</span>
            </span>
          </Link>

          {/* Desktop Nav with Floating Pill Animation */}
          <nav className="hidden md:flex items-center gap-1">
            {['Features', 'About'].map((item, index) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-full"
              >
                {hoveredIndex === index && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 bg-gray-100 rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {item}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:block text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/login?role=patient"
              className="group relative inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white transition-all bg-gray-900 rounded-full overflow-hidden hover:shadow-lg hover:shadow-orange-500/20"
            >
              <span className="relative z-10 flex items-center gap-2">
                Book Now
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Shimmer Effect */}
              <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shimmer" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown (Floating Style) */}
        {/* @ts-expect-error AnimatePresence type mismatch */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-2 mx-4 p-4 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl flex flex-col gap-2"
            >
              {['Features', 'About'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <hr className="border-gray-100 my-1" />
              <Link
                to="/login"
                className="px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-xl text-center"
              >
                Sign In
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Premium Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-white">
        {/* Animated Aurora Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[50%] -left-[20%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-100/40 via-white to-white blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-gray-200/20 to-orange-100/20 rounded-full blur-[100px] mix-blend-multiply animate-blob"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-tr from-orange-200/20 to-gray-200/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] bg-gradient-to-tr from-gray-200/20 to-orange-100/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000"></div>
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-100"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >


                <h1 className="text-6xl sm:text-7xl lg:text-[5.5rem] font-extrabold text-gray-900 leading-[1] mb-8 tracking-tight">
                  Healthcare, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 border-b-4 border-orange-500/20 pb-2">Reinforced.</span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-500 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                  The complete operating system for modern clinics. From <span className="text-gray-900 font-medium">AI diagnostics</span> to <span className="text-gray-900 font-medium">secure patient vaults</span>, experience the future of medical care today.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                  <Link
                    to="/find-hospitals"
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all bg-gray-900 rounded-2xl hover:bg-gray-800 hover:shadow-2xl hover:shadow-gray-900/20 hover:-translate-y-1 overflow-hidden"
                  >
                    <span className="relative z-10">Find a Doctor</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  <Link
                    to="/how-it-works"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-gray-700 transition-all bg-white border border-gray-200/60 rounded-2xl hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md hover:-translate-y-1 backdrop-blur-sm"
                  >
                    How it works
                  </Link>
                </div>

                {/* Generic Trust Indicators (Replaces Hospital Names) */}
                <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-70">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏥</span>
                    <span className="font-bold text-gray-700">500+ Verified Clinics</span>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👨‍⚕️</span>
                    <span className="font-bold text-gray-700">10k+ Specialists</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Graphic: Premium Glass Card Composition */}
            <div className="flex-1 w-full max-w-[600px] lg:max-w-none relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative z-10"
              >
                {/* Main Image Container with 'Squircle' and Glass Effect */}
                <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-[6px] border-white ring-1 ring-gray-900/5 aspect-[4/4] lg:aspect-[4/3.5]">
                  <img
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop"
                    alt="Doctor and Patient Relationship"
                    className="w-full h-full object-cover scale-105"
                  />
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Floating UI Elements inside the image - for 'Advanced' feel */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl flex items-center gap-4 text-white">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center backdrop-blur-md">
                        <span className="text-2xl">🩺</span>
                      </div>
                      <div>
                        <div className="font-bold text-lg">Dr. Sarah Smith</div>
                        <div className="text-sm text-gray-300">Top Rated Cardiologist</div>
                      </div>
                      <div className="ml-auto flex gap-1">
                        {'★★★★★'.split('').map((s, i) => <span key={i} className="text-orange-400 text-xs">{s}</span>)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Glass Cards around main image */}

              </motion.div>

              {/* Background Decorative Blobs for Image */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-orange-200/30 to-purple-200/30 rounded-full blur-3xl -z-10 animate-spin-slow"></div>
            </div>

          </div>
        </div>
      </section>

      {/* Animated User Journey Section */}
      <UserJourneySection />

      {/* Premium Bento Grid Features Section */}
      <section id="features" className="py-24 lg:py-32 bg-gray-50 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-100/50 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block"
            >
              <h2 className="text-sm font-bold text-orange-600 tracking-widest uppercase mb-3">Our Ecosystem</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                Complete Care, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Reimagined.</span>
              </h3>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                We've dismantled the old healthcare bureaucracy and rebuilt it with speed, transparency, and intelligence at its core.
              </p>
            </motion.div>
          </div>

          {/* BENTO GRID LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[250px]">

            {/* CARD 1: Large Span - Smart Booking (From Left) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="md:col-span-2 group relative bg-white rounded-3xl p-6 overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gray-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-gray-100 transition-colors"></div>

              <div className="relative z-10 h-full flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 text-xl">📍</div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Smart Location & Booking</h4>
                <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto line-clamp-2">Instant usage. Zero friction. Book appointments at top-rated clinics in under 30 seconds.</p>

                {/* Micro-Interaction Visualization */}
                <div className="mt-auto relative rounded-lg border border-gray-200 bg-gray-50/50 p-3 backdrop-blur-sm overflow-hidden group-hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src="https://i.pravatar.cc/100?img=33" className="w-8 h-8 rounded-full border-2 border-white" alt="Doctor" />
                    <div className="flex-1">
                      <div className="h-1.5 w-20 bg-gray-200 rounded mb-1 group-hover:bg-blue-200 transition-colors"></div>
                      <div className="h-1.5 w-12 bg-gray-200 rounded group-hover:bg-blue-100 transition-colors"></div>
                    </div>
                    <div className="px-2 py-0.5 bg-gray-100 text-gray-900 text-[10px] font-bold rounded-full">Available</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CARD 2: Tall - AI Copilot (From Right) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="md:row-span-2 group relative bg-gray-900 rounded-3xl p-6 overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
              {/* Animated mesh grid */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/30 rounded-full blur-[80px] animate-pulse-slow"></div>

              <div className="relative z-10 h-full flex flex-col text-white">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 mb-4 text-xl">🧠</div>
                <h4 className="text-lg font-bold mb-1">AI Copilot</h4>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">Assisting doctors with comprehensive data analysis for accurate diagnosis.</p>

                {/* AI Chat Visualization */}
                <div className="mt-auto space-y-2">
                  <div className="bg-white/5 backdrop-blur-md p-2.5 rounded-xl rounded-bf-none border border-white/10 text-[10px] text-gray-300">
                    Patient reports recurring migraines...
                  </div>
                  <div className="bg-gray-800/50 backdrop-blur-md p-2.5 rounded-xl rounded-br-none border border-gray-700/50 text-[10px] ml-4">
                    <span className="text-gray-400 font-bold block mb-0.5">AI INSIGHT</span>
                    History suggests checking IOP levels.
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CARD 3: Digitized Prescriptions (From Bottom) */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="group relative bg-white rounded-3xl p-6 overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100/50 rounded-bl-full transition-all group-hover:scale-150"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mb-4 px-3">
                  <span className="text-2xl">⚡️</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Smart RX</h4>
                <p className="text-gray-500 text-sm">We decipher the undecipherable. Our AI instantly converts handwritten prescriptions into clear, digital records.</p>
              </div>
            </motion.div>

            {/* CARD 4: Privacy Shield (From Bottom - Delayed) */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="group relative bg-white rounded-3xl p-6 overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Session Privacy</h4>
                <p className="text-gray-500 text-sm">Zero-Trust Architecture. Patient data is physically inaccessible to doctors once the consultation ends.</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Premium About Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
            {/* Left Column: Mission Text */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 mb-6">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Our Mission</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Empowering the World with <span className="text-orange-600">Better Healthcare.</span>
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                We started HealthLink with a simple goal: remove the friction from healthcare. No more waiting on hold, no more lost records, and no more confusion. Just seamless, intelligent care that works for everyone.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-900">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Verified Specialists</h4>
                    <p className="text-sm text-gray-500">Every doctor is manually vetted.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-900">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Bank-Grade Security</h4>
                    <p className="text-sm text-gray-500">256-bit encryption for all records.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Key Stats Grid */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <div className="text-4xl font-bold text-gray-900 mb-1">10k+</div>
                  <div className="text-sm text-gray-500 font-medium">Doctors</div>
                </div>
                <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 text-white">
                  <div className="text-4xl font-bold mb-1">2M+</div>
                  <div className="text-sm text-gray-400 font-medium">Patients Served</div>
                </div>
                <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                  <div className="text-4xl font-bold text-orange-600 mb-1">99.9%</div>
                  <div className="text-sm text-orange-800/70 font-medium">Uptime</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="text-4xl font-bold text-gray-900 mb-1">50+</div>
                  <div className="text-sm text-gray-500 font-medium">Major Cities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-900"></div>
        {/* Abstract waves */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-500/40 via-transparent to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Ready to transform your healthcare experience?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join over 10,000+ users who are managing their health smarter, faster, and better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login?role=patient"
              className="px-8 py-4 bg-orange-600 text-white text-lg font-bold rounded-xl hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/20 hover:shadow-orange-500/40 transform hover:-translate-y-1"
            >
              Get Started for Free
            </Link>
            <Link
              to="/login?role=doctor"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-lg font-bold rounded-xl hover:bg-white/20 transition-all"
            >
              Are you a Doctor?
            </Link>
          </div>
        </div>
      </section >

      {/* Modern Footer */}
      < footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">H</div>
                <span className="text-xl font-bold text-gray-900">HealthLink</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Building the future of healthcare accessibility. Simple, secure, and available for everyone.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-600 transition-colors">Find Hospitals</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Book Appointments</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Consult Doctors</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2024 HealthLink. All rights reserved.</p>
            <div className="flex gap-4">
              {/* Social Icon Placeholders */}
              <div className="w-8 h-8 rounded-full bg-gray-200/50 hover:bg-orange-100 hover:text-orange-600 transition-colors flex items-center justify-center cursor-pointer">
                <span className="sr-only">Twitter</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
}

// --- Tabbed Journey Component (Replaced Sticky Scroll) ---

// --- Animation Components (Solo Hero Device) ---

const features = [
  {
    id: "search",
    label: "Search",
    title: "Instant Verification",
    color: "from-blue-500 to-cyan-500",
    icon: "🔍",
    ui: (
      <div className="w-full h-full bg-white flex flex-col font-sans relative">
        {/* Browser Toolbar */}
        <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0 z-20 relative">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
          </div>
          <div className="flex-1 max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg h-8 flex items-center px-3 shadow-sm text-xs text-gray-500">
            <span className="opacity-50 mr-2">🔒</span> healthlink.com/find-care
          </div>
        </div>

        {/* Scene 1: Hospital Search */}
        <motion.div
          className="absolute inset-x-0 bottom-0 top-12 bg-gray-50/50 p-8 flex flex-col items-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 1.5, duration: 0.3 }}
        >
          <div className="w-full max-w-2xl">
            {/* Search Bar - Typing "Heart Hospital" */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 mb-8">
              <div className="flex items-center gap-4 px-4 py-3">
                <span className="text-2xl text-gray-400">🔍</span>
                <motion.div
                  className="text-xl text-gray-800 font-medium whitespace-nowrap overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  transition={{ duration: 0.8, ease: "linear" }}
                >
                  Heart Hospital near me
                </motion.div>
                <motion.div
                  className="w-[2px] h-6 bg-black"
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                />
              </div>
            </div>

            {/* Hospital Results */}
            <div className="space-y-4">
              {[1, 2].map(i => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 relative"
                >
                  <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center text-2xl">🏥</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">{i === 1 ? 'City Heart Institute' : 'General Medical Center'}</h4>
                    <p className="text-gray-500 text-sm">2.5 km away • Open 24/7</p>
                  </div>
                  {i === 1 && (
                    <motion.div
                      className="absolute inset-0 bg-blue-500/10 rounded-xl border-2 border-blue-500 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.2 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Cursor Click on Hospital */}
            <motion.div
              className="absolute z-50 pointer-events-none"
              initial={{ x: 400, y: 400, opacity: 0 }}
              animate={{ x: 200, y: 200, opacity: [0, 1, 1, 0] }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <svg className="w-8 h-8 text-black drop-shadow-xl" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4.6V2z" /></svg>
            </motion.div>
          </div>
        </motion.div>

        {/* Scene 2: Doctor Search (Appears after click) */}
        <motion.div
          className="absolute inset-x-0 bottom-0 top-12 bg-gray-50/50 p-8 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.3 }}
        >
          <div className="w-full max-w-2xl">
            {/* Context Header */}
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
              <span>Hospital</span> <span className="text-gray-300">/</span> <span className="font-bold text-gray-900">City Heart Institute</span> <span className="text-gray-300">/</span> <span className="text-blue-600">Doctors</span>
            </div>

            {/* Doctor Results */}
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.0 + (i * 0.1) }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow relative"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-2xl">
                    {i === 1 ? '👨‍⚕️' : '👩‍⚕️'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">{i === 1 ? 'Dr. Robert Fox' : 'Dr. Esther Howard'}</h4>
                    <p className="text-blue-500 text-sm font-medium">Cardiology • 15 years exp</p>
                  </div>
                  <div className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg">Book</div>

                  {/* Click Highlight */}
                  {i === 1 && (
                    <motion.div
                      className="absolute inset-0 bg-blue-500/10 rounded-xl border-2 border-blue-500 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ delay: 2.8, duration: 0.3 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Cursor Click on Doctor */}
            <motion.div
              className="absolute z-50 pointer-events-none"
              initial={{ x: 400, y: 300, opacity: 0 }}
              animate={{ x: 300, y: 150, opacity: [0, 1, 1, 0] }}
              transition={{ delay: 2.2, duration: 0.6 }}
            >
              <svg className="w-8 h-8 text-black drop-shadow-xl" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4.6V2z" /></svg>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  },
  {
    id: "select",
    label: "Select",
    title: "Detailed Profiles",
    color: "from-orange-500 to-amber-500",
    icon: "📋",
    ui: (
      <div className="w-full h-full bg-gray-50 flex flex-col font-sans relative overflow-hidden">
        {/* Mock Browser Window Interface */}
        <div className="w-full bg-white border-b border-gray-200 flex items-center px-4 py-3 gap-4 flex-shrink-0 z-20">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
          </div>
          <div className="flex-1 bg-gray-100 rounded-md h-8 flex items-center px-3 text-xs text-gray-500 font-medium">
            healthlink.com/doctors/dr-robert-fox
          </div>
        </div>

        {/* Desktop Page Content */}
        <div className="flex-1 p-8 overflow-hidden relative">
          <div className="max-w-4xl mx-auto w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row h-full max-h-[400px]">

            {/* Left Panel: Doctor Profile */}
            <div className="flex-1 p-8 pr-12 relative">
              <div className="flex items-start gap-6 mb-8">
                <div className="relative">
                  <img src="https://i.pravatar.cc/150?img=11" className="w-24 h-24 rounded-2xl object-cover shadow-md" alt="Dr. Robert Fox" />
                  <div className="absolute -bottom-3 -right-3 bg-white p-1 rounded-lg shadow-sm">
                    <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">Active</div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-3xl font-bold text-gray-900">Dr. Robert Fox</h2>
                    <span className="text-blue-500 bg-blue-50 p-1 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </span>
                  </div>
                  <p className="text-orange-600 font-bold text-sm uppercase tracking-wide mb-4">Chief of Cardiology</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">⭐ 4.9 (2.1k)</span>
                    <span className="flex items-center gap-1">📍 Harvard Med</span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-100">
                <div>
                  <div className="text-2xl font-bold text-gray-900">15+</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Years</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">20k+</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Patients</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">Top 1%</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Ranking</div>
                </div>
              </div>
            </div>

            {/* Right Panel: Booking Sidebar */}
            <div className="w-80 bg-gray-50 border-l border-gray-100 p-8 flex flex-col justify-center">
              <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-500 uppercase">Next Slot</span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">AI Optimized</span>
                </div>
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">10:00 AM</div>
                  <div className="text-xs text-gray-500">Today, Dec 14</div>
                </div>
              </div>

              <motion.button
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-black transition-colors relative overflow-hidden group"
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Instant Book Visit</span>
                <div className="absolute inset-0 bg-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              </motion.button>
              <div className="text-center mt-4 text-[10px] text-gray-400 font-medium">
                No payment required upfront
              </div>
            </div>
          </div>

          {/* Cursor Interaction */}
          <motion.div
            className="absolute z-50 pointer-events-none"
            initial={{ x: 600, y: 300, opacity: 0 }}
            animate={{ x: 500, y: 250, opacity: [0, 1, 1, 0] }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <svg className="w-8 h-8 text-black drop-shadow-xl" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4.6V2z" /></svg>
          </motion.div>
        </div>
      </div>
    )
  },
  {
    id: "book",
    label: "Book",
    title: "Smart Scheduling",
    color: "from-green-500 to-emerald-500",
    icon: "📅",
    ui: (
      <div className="w-full h-full bg-gray-50 flex flex-col font-sans relative overflow-hidden">
        {/* Mock Browser Window Interface */}
        <div className="w-full bg-white border-b border-gray-200 flex items-center px-4 py-3 gap-4 flex-shrink-0 z-20">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
          </div>
          <div className="flex-1 bg-gray-100 rounded-md h-8 flex items-center px-3 text-xs text-gray-500 font-medium">
            healthlink.com/booking/confirmed
          </div>
        </div>

        {/* Desktop Page Content */}
        <div className="flex-1 p-8 flex items-center justify-center relative overflow-hidden">
          {/* Background Confetti/Decor */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-3 h-3 rounded-full ${['bg-gray-200', 'bg-orange-200', 'bg-gray-300'][i % 3]}`}
                initial={{ y: -20, x: Math.random() * 800, opacity: 0 }}
                animate={{ y: 500, opacity: [0, 1, 0] }}
                transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
              />
            ))}
          </div>

          <motion.div
            className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl overflow-hidden relative z-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            <div className="bg-gray-50/50 p-8 text-center border-b border-gray-100">
              <motion.div
                className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-900 shadow-inner"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-500">Your appointment has been successfully scheduled.</p>
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                {/* Date/Time Block */}
                <div className="flex-1 w-full bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center min-w-[60px]">
                    <div className="text-xs font-bold text-red-500 uppercase">DEC</div>
                    <div className="text-xl font-bold text-gray-900">14</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Saturday</p>
                    <p className="text-lg font-bold text-gray-900">10:00 AM</p>
                  </div>
                </div>

                {/* Doctor Block */}
                <div className="flex-1 w-full bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center gap-4">
                  <img src="https://i.pravatar.cc/150?img=11" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="Dr." />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Cardiologist</p>
                    <p className="text-lg font-bold text-gray-900">Dr. Robert Fox</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4 text-sm font-bold justify-center">
                <button className="flex-1 bg-gray-900 text-white py-3 rounded-lg hover:bg-black transition-colors shadow-lg shadow-gray-200">
                  Go to Dashboard
                </button>
                <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                  Add to Calendar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  },
  {
    id: "ai",
    label: "AI",
    title: "Health Intelligence",
    color: "from-purple-500 to-indigo-500",
    icon: "✨",
    ui: (
      <div className="w-full h-full bg-[#0F172A] text-white p-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-[#1E293B] rounded-2xl p-6 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Summary</h3>
                <p className="text-xs text-gray-400">Structuring your consultation</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-bold">Active</div>
          </div>

          {/* Diagnosis Block */}
          <motion.div
            className="bg-black/20 rounded-xl p-4 border border-white/5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Diagnosis</div>
            <div className="text-indigo-300 font-medium">Mild Hypertension (Stage 1)</div>
          </motion.div>

          {/* Rx Typing Animation */}
          <motion.div
            className="bg-black/20 rounded-xl p-4 border border-white/5 flex-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Prescription</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                  className="text-sm overflow-hidden whitespace-nowrap"
                >
                  Amlodipine 5mg - Once daily
                </motion.div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  transition={{ delay: 2.0, duration: 0.8 }}
                  className="text-sm overflow-hidden whitespace-nowrap"
                >
                  Reduce Sodium Intake
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Animated Waveform at bottom */}
          <div className="h-12 flex items-end justify-between gap-1">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="w-full bg-indigo-500/40 rounded-t-sm"
                animate={{ height: ["20%", "80%", "40%"] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, repeatType: "reverse" }}
              />
            ))}
          </div>

          {/* AI Highlight */}
          <motion.div
            className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 2.0, duration: 0.4 }}
          />
        </div>
      </div>
    )
  },
  {
    id: "vault",
    label: "Vault",
    title: "Secure Storage",
    color: "from-teal-500 to-cyan-500",
    icon: "🛡️",
    ui: (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center p-8">
        <div className="relative w-full max-w-sm">
          <motion.div
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative overflow-hidden z-10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-2xl">📁</div>
              <div>
                <h3 className="font-bold text-gray-900">Medical History</h3>
                <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Encrypted & Secure
                </p>
              </div>
            </div>

            {/* File List Animation */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.3 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-red-400">📄</div>
                    <div className="text-sm font-medium text-gray-700">Report_Dec_2024.pdf</div>
                  </div>
                  <div className="text-teal-500 text-xs font-bold">Encrypted</div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="absolute top-0 right-0 p-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            </motion.div>
          </motion.div>

          {/* Background Elements */}
          <motion.div
            className="absolute top-4 -right-4 w-full h-full bg-gray-200 rounded-2xl -z-10"
            animate={{ rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          ></motion.div>
          <motion.div
            className="absolute top-8 -right-8 w-full h-full bg-gray-100 rounded-2xl -z-20"
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          ></motion.div>
        </div>
      </div>
    )
  }
];

function UserJourneySection() {
  const [activeTab, setActiveTab] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Text - Centered */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={`text-transparent bg-clip-text bg-gradient-to-r ${features[activeTab].color} font-bold tracking-wide uppercase text-sm mb-3 transition-all duration-500`}>
              {features[activeTab].title}
            </h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
              Experience healthcare, reimagined.
            </h3>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Watch how HealthLink transforms the entire patient journey into a seamless, digital experience.
            </p>
          </motion.div>
        </div>

        {/* Solo Hero Device */}
        <div className="max-w-4xl mx-auto relative perspective-1000">
          <motion.div
            className="relative bg-gray-900 rounded-[2rem] p-[10px] md:p-[16px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-gray-800"
            initial={{ opacity: 0, y: 40, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Device Bezel & Camera */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-black rounded-b-xl z-50"></div>

            {/* Screen Content */}
            <div className="bg-white rounded-[1.5rem] overflow-hidden aspect-[16/10] relative w-full h-full min-h-[300px] md:min-h-[500px]">
              {/* @ts-expect-error AnimatePresence type mismatch */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {features[activeTab].ui}
                </motion.div>
              </AnimatePresence>

              {/* Screen Reflection overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none"></div>
            </div>
          </motion.div>


        </div>
      </div>
    </section>
  );
}
