import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

type StoryStep = {
  key: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  // We keep the 3D character constant (doctor) and animate the UI workflow panels instead.
  // If you want, we can later swap this to a real GLB character (three.js) – bigger change.
  doctorSplineUrl: string;
};

const DOCTOR_SPLINE_URL =
  // CC0 doctor scene (Spline Community): https://community.spline.design/file/e9ae05b6-6e63-4ca7-bf02-ba185a9ae2fc
  'https://app.spline.design/file/f8491507-029e-4af4-8dee-f5ff76fe963a?view=preview';

const steps: StoryStep[] = [
  {
    key: 'discover',
    eyebrow: 'DISCOVER',
    title: 'Find nearby hospitals instantly',
    subtitle: 'Search by location, filters, and availability — in seconds.',
    doctorSplineUrl: DOCTOR_SPLINE_URL
  },
  {
    key: 'book',
    eyebrow: 'BOOK',
    title: 'Book in 3 taps',
    subtitle: 'Symptoms, time, and confirmation — smooth experience.',
    doctorSplineUrl: DOCTOR_SPLINE_URL
  },
  {
    key: 'consult',
    eyebrow: 'CONSULT',
    title: 'Doctor sees full history on one screen',
    subtitle: 'Past visits, prescriptions, scans — all in one place.',
    doctorSplineUrl: DOCTOR_SPLINE_URL
  },
  {
    key: 'report',
    eyebrow: 'REPORT',
    title: 'View and download clean PDF reports',
    subtitle: 'Per-visit PDF with typed + image prescription, structured and readable.',
    doctorSplineUrl: DOCTOR_SPLINE_URL
  }
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function LandingPageV2() {
  const [activeIdx, setActiveIdx] = useState(0);

  // Scroll progress for the whole page – we’ll map it to “steps”
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25, mass: 0.2 });

  // Convert progress [0..1] into a step index [0..3]
  useEffect(() => {
    const unsub = progress.on('change', v => {
      const idx = clamp(Math.floor(v * steps.length), 0, steps.length - 1);
      setActiveIdx(idx);
    });
    return () => unsub();
  }, [progress]);

  // Cinematic transforms (SonicLamb-ish)
  const heroGlowY = useTransform(progress, [0, 1], [0, 120]);
  const heroGlowOpacity = useTransform(progress, [0, 0.25, 1], [1, 0.7, 0.4]);
  const sidebarY = useTransform(progress, [0, 1], [0, -40]);

  // Animated “workflow cards” inside the sticky panel
  const card1Y = useTransform(progress, [0, 0.35], [40, 0]);
  const card1Opacity = useTransform(progress, [0, 0.15], [0, 1]);

  const card2Y = useTransform(progress, [0.15, 0.55], [40, 0]);
  const card2Opacity = useTransform(progress, [0.25, 0.4], [0, 1]);

  const card3Y = useTransform(progress, [0.4, 0.75], [40, 0]);
  const card3Opacity = useTransform(progress, [0.5, 0.65], [0, 1]);

  const card4Y = useTransform(progress, [0.65, 1], [40, 0]);
  const card4Opacity = useTransform(progress, [0.75, 0.9], [0, 1]);

  const active = useMemo(() => steps[activeIdx], [activeIdx]);

  return (
    <div className="min-h-screen bg-[#070B18] text-white">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070B18]/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="font-extrabold tracking-tight text-xl">
            Health<span className="text-blue-400">Link</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <a className="hover:text-white transition" href="#story">
              How it works
            </a>
            <a className="hover:text-white transition" href="#features">
              Features
            </a>
            <Link className="hover:text-white transition" to="/login">
              Login
            </Link>
            <Link
              className="bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-white/90 transition"
              to="/login?role=patient"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + Scroll Story */}
      <section id="story" className="relative">
        {/* Big glow background */}
        <motion.div
          style={{ y: heroGlowY, opacity: heroGlowOpacity }}
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute left-1/2 top-20 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute left-1/3 top-72 h-[420px] w-[420px] rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute right-1/4 top-48 h-[380px] w-[380px] rounded-full bg-cyan-400/10 blur-3xl" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left: text that feels like SonicLamb */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                AI-WRAPPED HEALTHCARE EXPERIENCE
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.02] tracking-tight">
                A platform that
                <span className="text-blue-400"> shows</span>
                <br />
                how it works
                <br />
                while you scroll.
              </h1>

              <p className="mt-5 text-white/70 text-lg leading-relaxed max-w-xl">
                Not a boring landing page. A guided story: discovery → booking → consultation → medical report. Built for
                patients and doctors.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login?role=patient"
                  className="bg-blue-500 hover:bg-blue-600 transition text-white font-semibold px-6 py-3 rounded-xl text-center"
                >
                  I’m a Patient
                </Link>
                <Link
                  to="/login?role=doctor"
                  className="bg-emerald-500 hover:bg-emerald-600 transition text-white font-semibold px-6 py-3 rounded-xl text-center"
                >
                  I’m a Doctor
                </Link>
                <Link
                  to="/find-hospitals"
                  className="border border-white/20 hover:border-white/35 transition text-white font-semibold px-6 py-3 rounded-xl text-center"
                >
                  Find Hospitals
                </Link>
              </div>

              {/* Active step label */}
              <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs font-semibold tracking-widest text-white/50">{active.eyebrow}</div>
                <div className="mt-2 text-2xl font-bold">{active.title}</div>
                <div className="mt-2 text-white/70">{active.subtitle}</div>
              </div>

              {/* Spacer to create scroll length like SonicLamb */}
              <div className="h-[140vh]" />
            </div>

            {/* Right: sticky “product visual” area */}
            <motion.div style={{ y: sidebarY }} className="lg:sticky lg:top-24">
              <div className="relative rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent" />

                {/* Doctor */}
                <div className="relative w-full" style={{ aspectRatio: '16 / 11' }}>
                  <iframe
                    title="3D Doctor"
                    src={active.doctorSplineUrl}
                    loading="lazy"
                    style={{ border: 0 }}
                    className="absolute inset-0 h-full w-full"
                    allow="fullscreen"
                  />
                </div>

                {/* Overlay: animated UI workflow panels */}
                <div className="relative p-5 border-t border-white/10">
                  <div className="text-xs font-semibold text-white/60 tracking-widest">WORKFLOW PREVIEW</div>

                  <div className="mt-4 space-y-3">
                    <motion.div
                      style={{ y: card1Y, opacity: card1Opacity }}
                      className="rounded-2xl bg-black/40 border border-white/10 p-4"
                    >
                      <div className="text-sm font-bold">🔎 Discover</div>
                      <div className="text-xs text-white/70 mt-1">Find hospitals, filters, distance, doctors.</div>
                    </motion.div>

                    <motion.div
                      style={{ y: card2Y, opacity: card2Opacity }}
                      className="rounded-2xl bg-black/40 border border-white/10 p-4"
                    >
                      <div className="text-sm font-bold">📅 Book</div>
                      <div className="text-xs text-white/70 mt-1">Schedule, add symptoms, QR appointment.</div>
                    </motion.div>

                    <motion.div
                      style={{ y: card3Y, opacity: card3Opacity }}
                      className="rounded-2xl bg-black/40 border border-white/10 p-4"
                    >
                      <div className="text-sm font-bold">🩺 Consult</div>
                      <div className="text-xs text-white/70 mt-1">Doctor sees history + writes prescription.</div>
                    </motion.div>

                    <motion.div
                      style={{ y: card4Y, opacity: card4Opacity }}
                      className="rounded-2xl bg-black/40 border border-white/10 p-4"
                    >
                      <div className="text-sm font-bold">📄 Report</div>
                      <div className="text-xs text-white/70 mt-1">View instantly + download structured PDF.</div>
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-white/50">
                3D character source (CC0):{' '}
                <a
                  className="underline hover:text-white"
                  href="https://community.spline.design/file/e9ae05b6-6e63-4ca7-bf02-ba185a9ae2fc"
                  target="_blank"
                  rel="noreferrer"
                >
                  Wizard Cubic Doctor
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Keep your existing sections below; we can later re-theme them to match this style */}
      <section id="features" className="border-t border-white/10 bg-[#060914]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Features</h2>
            <p className="mt-3 text-white/70 max-w-2xl mx-auto">
              We’ll re-skin the full landing in this premium style once the story section matches your expectation.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-bold">Patient</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>• Medical history view (no forced download)</li>
                <li>• Individual visit PDF</li>
                <li>• Secure record access</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-bold">Doctor</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>• Full-page consultation</li>
                <li>• Past history with dates</li>
                <li>• Structured prescription output</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-bold">Hospitals</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>• Location-based discovery</li>
                <li>• Doctor listings</li>
                <li>• Better UX for booking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


