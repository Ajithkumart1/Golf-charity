// client/src/pages/HomePage.jsx
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Heart, Trophy, Target, ArrowRight, Sparkles, Users, ChevronDown, Star } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};

function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  );
}

const steps = [
  { number: '01', title: 'Choose a Charity', desc: 'Pick from our curated list of verified charities. A portion of every subscription goes directly to your chosen cause.', icon: Heart, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
  { number: '02', title: 'Enter Your Scores', desc: 'Log your last 5 Stableford scores (1–45). These become your lucky numbers for the monthly draw.', icon: Target, color: 'text-gold-400', bg: 'bg-gold-500/10 border-gold-500/20' },
  { number: '03', title: 'Win Prize Money', desc: 'Each month, 5 numbers are drawn. Match 3, 4, or all 5 to win your share of the prize pool.', icon: Trophy, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
];

const stats = [
  { value: '£48K+', label: 'Donated to Charities' },
  { value: '2,400+', label: 'Active Subscribers' },
  { value: '38', label: 'Supported Charities' },
  { value: '£12K', label: 'Paid Out in Prizes' },
];

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-700/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-900/20 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Golf that gives back
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6"
          >
            Play Golf.{' '}
            <span className="text-brand-400">Win Prizes.</span>
            <br />
            Change Lives.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="show"
            className="text-lg sm:text-xl text-brand-200/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Enter your Stableford scores, participate in our monthly draw, and enjoy knowing a portion of your subscription goes to a charity close to your heart.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="btn-primary text-base py-4 px-8 flex items-center gap-2 group">
              Start for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/how-it-works" className="btn-secondary text-base py-4 px-8">
              How It Works
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="show"
            className="mt-12 flex items-center justify-center gap-2 text-sm text-brand-300/50"
          >
            <div className="flex -space-x-2">
              {['A', 'B', 'C', 'D'].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-brand-700 border-2 border-dark-900 flex items-center justify-center text-xs text-brand-400 font-semibold">{l}</div>
              ))}
            </div>
            <span>Join <strong className="text-brand-400">2,400+</strong> golfers already making a difference</span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-brand-500/40"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 bg-dark-800 border-y border-dark-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }, i) => (
              <AnimatedSection key={label}>
                <motion.div variants={fadeUp} custom={i} className="text-center">
                  <p className="font-display text-3xl sm:text-4xl font-bold text-brand-400">{value}</p>
                  <p className="text-sm text-brand-300/50 mt-1">{label}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-3">Simple &amp; Meaningful</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="section-heading">How GreenGive Works</motion.h2>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ number, title, desc, icon: Icon, color, bg }, i) => (
            <AnimatedSection key={number}>
              <motion.div variants={fadeUp} custom={i} className={`card border ${bg} h-full flex flex-col`}>
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl ${bg} border flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <span className="font-mono text-4xl font-bold text-dark-600">{number}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-brand-300/60 text-sm leading-relaxed flex-1">{desc}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── Prize Pool breakdown ── */}
      <section className="py-20 bg-dark-800 border-y border-dark-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12">
              <motion.h2 variants={fadeUp} className="section-heading">Prize Pool Breakdown</motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-brand-300/60 mt-3">Every subscription builds the monthly prize pot</motion.p>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <motion.div variants={fadeUp} className="grid sm:grid-cols-3 gap-4">
              {[
                { label: '5 Numbers Matched', pct: '40%', note: 'Jackpot — rolls over if no winner', tier: 'gold' },
                { label: '4 Numbers Matched', pct: '35%', note: 'Split equally among all 4-match winners', tier: 'brand' },
                { label: '3 Numbers Matched', pct: '25%', note: 'Split equally among all 3-match winners', tier: 'brand' },
              ].map(({ label, pct, note, tier }) => (
                <div key={label} className={`card border ${tier === 'gold' ? 'border-gold-500/30 bg-gold-500/5' : 'border-brand-700/30'} text-center flex flex-col items-center gap-3`}>
                  <span className={`font-display text-5xl font-bold ${tier === 'gold' ? 'text-gold-400' : 'text-brand-400'}`}>{pct}</span>
                  <span className="font-semibold text-white">{label}</span>
                  <span className="text-xs text-brand-300/50">{note}</span>
                </div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Featured Charities ── */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-2">Giving Back</p>
              <h2 className="section-heading">Charities We Support</h2>
            </div>
            <Link to="/charities" className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <motion.div variants={fadeUp} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Cancer Research UK', 'British Heart Foundation', 'Mind', 'Oxfam', 'WWF', 'RNLI'].map((name, i) => (
              <div key={name} className="card-hover flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-lg flex-shrink-0">
                  {name[0]}
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 text-gold-400 fill-gold-400" />)}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient opacity-60" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp}>
              <Heart className="w-12 h-12 text-brand-400 mx-auto mb-6 animate-float" />
              <h2 className="section-heading mb-4">Ready to Play With Purpose?</h2>
              <p className="text-brand-300/60 mb-10 text-lg">
                From as little as £9.99/month, play golf, enter monthly draws, and automatically support a charity of your choice.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="btn-primary text-base py-4 px-8 flex items-center gap-2 group">
                  Subscribe Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/pricing" className="btn-secondary text-base py-4 px-8">View Plans</Link>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}