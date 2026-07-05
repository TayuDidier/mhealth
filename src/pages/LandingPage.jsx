import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const features = [
  {
    icon: 'calendar_today',
    title: 'Smart Appointments',
    desc: 'Book and manage antenatal visits with ease. Get SMS reminders 3 days before every appointment.',
    bg: 'bg-pink-50',
    iconColor: 'text-primary',
  },
  {
    icon: 'badge',
    title: 'Digital Health Passport',
    desc: 'Your complete pregnancy health record — blood type, vitals, lab results — always in your pocket.',
    bg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    icon: 'menu_book',
    title: 'Knowledge Hub',
    desc: 'Curated health articles by trimester — understand your pregnancy week by week.',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: 'sms',
    title: 'SMS Reminders',
    desc: 'Automatic SMS alerts sent to patients 3 days before every scheduled appointment.',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
]

const steps = [
  {
    number: '01',
    icon: 'person_add',
    title: 'Create Your Account',
    desc: 'Sign up as a patient or healthcare provider in under a minute.',
  },
  {
    number: '02',
    icon: 'edit_note',
    title: 'Complete Your Profile',
    desc: 'Add your health details, gestational week, and connect with your provider.',
  },
  {
    number: '03',
    icon: 'favorite',
    title: 'Stay Connected',
    desc: 'Book appointments, receive reminders, and track your pregnancy journey.',
  },
]

const roles = [
  {
    icon: 'pregnant_woman',
    title: 'For Mothers',
    desc: 'Track your pregnancy, book appointments, read health articles, and stay connected with your provider.',
    gradient: 'gradient-pink',
  },
  {
    icon: 'stethoscope',
    title: 'For Providers',
    desc: 'Manage your patients, view schedules, send reminders, and access complete medical records.',
    gradient: 'bg-gradient-to-br from-purple-500 to-indigo-600',
  },
]

export default function LandingPage() {
  const { user, profile } = useAuth()
  const dashboardLink =
    profile?.role === 'admin' ? '/admin'
      : profile?.role === 'provider' ? '/provider'
        : '/patient'

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-pink flex items-center justify-center">
              <span className="material-symbols-outlined text-white filled" style={{ fontSize: 18 }}>favorite</span>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">MHealth</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how" className="hover:text-primary transition-colors">How it works</a>
            <a href="#roles" className="hover:text-primary transition-colors">Who it's for</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={dashboardLink}
                className="gradient-pink text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="gradient-pink text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="gradient-hero min-h-screen flex items-center relative overflow-hidden pt-16">
        <div className="absolute -top-10 -right-20 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 py-24 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-8">
                <span className="material-symbols-outlined filled text-yellow-300" style={{ fontSize: 16 }}>star</span>
                Designed for antenatal care in Africa
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
                Better pregnancy care,{' '}
                <span className="text-yellow-300">right in your pocket.</span>
              </h1>

              <p className="text-lg text-white/80 mb-10 leading-relaxed max-w-lg">
                MHealth connects pregnant women with healthcare providers for safer pregnancies — appointments, health records, expert articles, and SMS reminders, all in one app.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="bg-white text-primary font-bold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:scale-105 transition-all duration-200 text-center"
                >
                  Start for free
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-white/60 text-white font-bold px-8 py-4 rounded-full text-base hover:bg-white/10 hover:border-white transition-all duration-200 text-center"
                >
                  Sign in
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-10">
                {[
                  { icon: 'verified', label: 'Free to use' },
                  { icon: 'lock', label: 'Secure & private' },
                  { icon: 'smartphone', label: 'Works offline' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-1.5 text-white/70 text-sm">
                    <span className="material-symbols-outlined filled text-white/80" style={{ fontSize: 16 }}>{b.icon}</span>
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — floating UI cards */}
            <div className="hidden lg:flex flex-col gap-4 items-end">
              <div className="bg-white rounded-2xl p-5 shadow-2xl w-64">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary filled" style={{ fontSize: 20 }}>calendar_today</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Next appointment</p>
                    <p className="font-bold text-gray-900 text-sm">In 3 days</p>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1.5 gradient-pink rounded-full w-3/4" />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Gestational week 28 / 40</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-2xl w-64 ml-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-purple-600 filled" style={{ fontSize: 20 }}>sms</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">SMS reminder sent</p>
                    <p className="font-bold text-gray-900 text-sm">Just now ✓</p>
                    <p className="text-xs text-gray-400">To 3 patients</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-2xl w-64">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-emerald-600 filled" style={{ fontSize: 20 }}>favorite_border</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Health passport</p>
                    <p className="font-bold text-gray-900 text-sm">All records synced</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['Blood: O+', 'BP: 110/70', 'Weight: 68kg'].map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-2xl w-64 ml-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-pink flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white filled" style={{ fontSize: 20 }}>chat</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Dr. Ngono</p>
                    <p className="text-sm text-gray-800 font-medium">See you Thursday! 👋</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              Built for every step<br />of your pregnancy
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div
                key={f.title}
                className={`${f.bg} rounded-2xl p-6 hover:shadow-card hover:-translate-y-1.5 transition-all duration-200 cursor-default`}
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm">
                  <span className={`material-symbols-outlined ${f.iconColor} filled`} style={{ fontSize: 24 }}>{f.icon}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats banner ── */}
      <section className="py-16 bg-background-light">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '2 Roles', label: 'Provider · Patient' },
              { value: 'Real-time', label: 'In-app messaging' },
              { value: 'SMS', label: 'Automated reminders' },
              { value: '100%', label: 'Offline-capable PWA' },
            ].map(s => (
              <div key={s.value}>
                <p className="text-3xl md:text-4xl font-extrabold text-primary mb-1">{s.value}</p>
                <p className="text-gray-500 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Simple process</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              Up and running<br />in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary via-purple-400 to-indigo-500" />
            {steps.map(s => (
              <div key={s.number} className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full gradient-pink flex items-center justify-center mb-6 shadow-xl relative z-10 hover:scale-110 transition-transform duration-200">
                  <span className="material-symbols-outlined text-white filled" style={{ fontSize: 36 }}>{s.icon}</span>
                </div>
                <span className="text-xs font-bold text-primary tracking-[0.2em] mb-2">{s.number}</span>
                <h3 className="font-bold text-gray-900 text-xl mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section id="roles" className="py-24 bg-background-light">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Two portals</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              One platform,<br />everyone covered
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {roles.map(r => (
              <div
                key={r.title}
                className={`${r.gradient} rounded-3xl p-8 text-white hover:scale-[1.03] hover:shadow-2xl transition-all duration-200 cursor-default`}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-white filled" style={{ fontSize: 32 }}>{r.icon}</span>
                </div>
                <h3 className="font-bold text-2xl mb-3">{r.title}</h3>
                <p className="text-white/80 leading-relaxed text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 gradient-hero relative overflow-hidden">
        <div className="absolute -top-10 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <span className="material-symbols-outlined text-yellow-300 filled mb-6 block" style={{ fontSize: 52 }}>favorite</span>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Every mother deserves<br />great care.
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join MHealth today and make your pregnancy journey safer, smarter, and more connected.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary font-bold px-10 py-4 rounded-full text-base hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              Create free account
            </Link>
            <Link
              to="/login"
              className="border-2 border-white/60 text-white font-bold px-10 py-4 rounded-full text-base hover:bg-white/10 hover:border-white transition-all duration-200"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-500 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full gradient-pink flex items-center justify-center">
                <span className="material-symbols-outlined text-white filled" style={{ fontSize: 16 }}>favorite</span>
              </div>
              <span className="font-bold text-white text-base tracking-tight">MHealth</span>
            </div>
            <p className="text-sm text-center">Antenatal care for mothers across Africa.</p>
            <p className="text-sm">© 2026 MHealth. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
