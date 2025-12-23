import React, { useRef } from 'react';
import { motion, useScroll } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Added import
import { 
  LayoutDashboard, Database, Wifi, Shield, 
  Users, Activity, CreditCard, MessageSquare, 
  Smartphone, Trophy, Target, Calendar, Zap, 
  CheckCircle2, ChevronRight, ArrowUpRight,
  Clock
} from 'lucide-react';

// --- HELPER COMPONENTS ---

// 1. Background Pattern
const GridPattern = () => (
  <div className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none">
    <div 
      className="absolute inset-0" 
      style={{ 
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
        backgroundSize: '32px 32px' 
      }} 
    />
    <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white/80" />
  </div>
);

// 2. Optimized Mockup Window
const MockupWindow = ({ children }) => (
  <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden relative transform transition-transform hover:scale-[1.01] duration-500 flex flex-col backface-hidden">
    {/* Window Controls */}
    <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2 flex-shrink-0">
      <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
    </div>
    <div className="relative flex-1 overflow-hidden bg-white">
       {children}
    </div>
  </div>
);

// 3. Helper for Colors
const getColorClasses = (color) => ({
  bg: {
    blue: "bg-blue-500", green: "bg-green-500", indigo: "bg-indigo-500", purple: "bg-purple-500", orange: "bg-orange-500",
  }[color],
  lightBg: {
    blue: "bg-blue-50", green: "bg-green-50", indigo: "bg-indigo-50", purple: "bg-purple-50", orange: "bg-orange-50",
  }[color],
  text: {
    blue: "text-blue-600", green: "text-green-600", indigo: "text-indigo-600", purple: "text-purple-600", orange: "text-orange-600",
  }[color],
});

// --- VISUALIZATION COMPONENTS ---

const ManagementVisual = ({ color }) => {
  const colors = getColorClasses(color);
  return (
    <MockupWindow>
      <div className="p-4 space-y-4 h-full">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-gray-700 text-sm">Active Students</h4>
          <div className={`px-2 py-1 rounded text-[10px] font-bold ${colors.lightBg} ${colors.text}`}>Total: 142</div>
        </div>
        {[1, 2, 3].map((i) => (
          <motion.div 
            key={i}
            initial={{ x: -10, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
          >
            <div className={`w-8 h-8 rounded-full ${colors.lightBg} flex items-center justify-center text-xs font-bold ${colors.text}`}>
              {String.fromCharCode(64 + i)}
            </div>
            <div className="flex-1">
              <div className="h-2 w-20 bg-gray-200 rounded mb-1.5"></div>
              <div className="h-1.5 w-12 bg-gray-100 rounded"></div>
            </div>
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${i === 1 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              {i === 1 ? 'Absent' : 'Present'}
            </div>
          </motion.div>
        ))}
        
        <div className="absolute bottom-10 right-6 pointer-events-none">
           <motion.svg 
             viewBox="0 0 24 24" 
             className="w-6 h-6 text-gray-800 fill-current"
             animate={{ x: [0, -40, -40, 0], y: [0, -60, -60, 0] }}
             transition={{ duration: 4, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
             style={{ willChange: 'transform' }} 
           >
             <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z"/>
           </motion.svg>
        </div>
      </div>
    </MockupWindow>
  );
};

const AnalyticsVisual = ({ color }) => {
  const colors = getColorClasses(color);
  const heights = [0.3, 0.5, 0.45, 0.7, 0.6, 0.85, 0.95]; 
  
  return (
    <MockupWindow>
      <div className="p-5 h-full flex flex-col justify-end">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Performance Score</div>
            <div className="text-3xl font-bold text-gray-800">94.2</div>
          </div>
          <div className={`text-xs font-bold ${colors.text} flex items-center gap-1`}>
            <ArrowUpRight className="w-3 h-3" /> +12.5%
          </div>
        </div>
        <div className="h-32 w-full flex items-end gap-1 relative">
          {heights.map((h, i) => (
            <div key={i} className="flex-1 h-full flex items-end">
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: h }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                style={{ originY: 1 }} 
                className={`w-full rounded-t-sm ${colors.bg} opacity-80`}
              />
            </div>
          ))}
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.2 }}
            className="absolute top-4 right-4 bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-xl"
          >
            Peak: 95
          </motion.div>
        </div>
      </div>
    </MockupWindow>
  );
};

const FinanceVisual = ({ color }) => {
  const colors = getColorClasses(color);
  return (
    <MockupWindow>
      <div className="relative h-full p-4 overflow-hidden flex flex-col justify-center items-center">
        {/* Credit Card */}
        <motion.div 
          initial={{ rotateY: 90, opacity: 0 }}
          whileInView={{ rotateY: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className={`relative z-10 w-full max-w-[280px] aspect-[1.58/1] rounded-xl bg-gradient-to-br ${color === 'indigo' ? 'from-indigo-500 to-purple-600' : 'from-blue-500 to-blue-600'} p-5 text-white shadow-2xl flex flex-col justify-between`}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="flex justify-between items-start">
            <div className="w-8 h-5 bg-white/30 rounded-sm"></div>
            <Wifi className="w-5 h-5 rotate-90 opacity-70" />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] opacity-70 uppercase tracking-widest">Balance</div>
            <div className="text-xl font-bold tracking-widest">₹ 1,24,500</div>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-xs font-medium tracking-widest">**** 4242</div>
            <div className="w-6 h-6 rounded-full bg-white/20"></div>
          </div>
        </motion.div>
        
        <div className="mt-6 w-full max-w-[280px] space-y-3 px-2 opacity-50 grayscale blur-[0.5px]">
          {[1, 2].map(i => (
            <div key={i} className="flex justify-between items-center text-xs">
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="h-2 w-16 bg-gray-200 rounded mt-2"></div>
              </div>
              <div className="h-4 w-4 bg-gray-100 rounded-full flex items-center justify-center">
                 <Clock size={10} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockupWindow>
  );
};

const IOTVisual = ({ color }) => {
  const colors = getColorClasses(color);
  return (
    <MockupWindow>
      <div className="p-4 h-full flex flex-col items-center justify-center relative">
        {/* Radar Animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className={`w-24 h-24 rounded-full border border-purple-200`}
            style={{ willChange: 'transform, opacity' }}
          />
          <motion.div 
            animate={{ scale: [1, 2], opacity: [0.4, 0] }}
            transition={{ duration: 3, delay: 1.5, repeat: Infinity, ease: "linear" }}
            className={`absolute w-24 h-24 rounded-full border border-purple-300`}
            style={{ willChange: 'transform, opacity' }}
          />
        </div>

        {/* Central Hub */}
        <div className={`relative z-10 w-16 h-16 ${colors.lightBg} rounded-full flex items-center justify-center shadow-lg border-4 border-white`}>
          <Wifi className={`w-6 h-6 ${colors.text}`} />
        </div>

        {/* Orbiting Satellites */}
        <motion.div 
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ willChange: 'transform' }} 
        >
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white p-1.5 rounded-full shadow-md border border-gray-100">
             <Smartphone className={`w-4 h-4 ${colors.text}`} />
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white p-1.5 rounded-full shadow-md border border-gray-100">
             <Activity className={`w-4 h-4 ${colors.text}`} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="absolute top-8 left-4 bg-white p-2 rounded-lg shadow-md border border-gray-100 flex items-center gap-2 z-20"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-[10px] font-bold text-gray-600">Smart Ball Connected</span>
        </motion.div>
      </div>
    </MockupWindow>
  );
};

const ChatVisual = ({ color }) => {
  const colors = getColorClasses(color);
  return (
    <MockupWindow>
      <div className="p-0 h-full flex flex-col">
        <div className="p-3 border-b border-gray-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-400"></div>
          <div>
            <div className="h-2 w-20 bg-gray-200 rounded mb-1"></div>
            <div className="h-1.5 w-12 bg-gray-100 rounded"></div>
          </div>
        </div>
        
        <div className="flex-1 p-4 space-y-4 bg-gray-50/50 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="self-start bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-gray-600 max-w-[80%]"
          >
            Coach, is the training schedule updated?
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className={`self-end ml-auto ${colors.bg} p-3 rounded-2xl rounded-tr-none shadow-md text-xs text-white max-w-[80%]`}
          >
            Yes! Check the calendar. We start at 7 AM sharp. ⚽️
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.5 }}
            className="bg-gray-200 w-12 h-6 rounded-full flex items-center justify-center gap-1"
          >
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-75"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-150"></div>
          </motion.div>
        </div>
      </div>
    </MockupWindow>
  );
};

// --- MAIN COMPONENT ---

const Features = () => {
  const navigate = useNavigate(); // Initialize navigation
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const coreFeatures = [
    { title: "Centralized Operations", desc: "Manage multiple academies, coaches, and hundreds of players from a single glass-pane dashboard.", icon: <LayoutDashboard className="w-6 h-6 text-white" />, color: "from-blue-500 to-blue-600" },
    { title: "Data-Driven Growth", desc: "Transform raw training data into actionable insights to improve player retention and performance.", icon: <Database className="w-6 h-6 text-white" />, color: "from-indigo-500 to-purple-600" },
    { title: "Smart Ecosystem", desc: "First-in-India IoT integration connecting smart equipment directly to your management software.", icon: <Wifi className="w-6 h-6 text-white" />, color: "from-green-500 to-emerald-600" },
    { title: "Enterprise Security", desc: "Role-based access control, encrypted data storage, and automated backups for total peace of mind.", icon: <Shield className="w-6 h-6 text-white" />, color: "from-slate-700 to-slate-900" }
  ];

  const deepDives = [
    { id: "management", category: "ACADEMY MANAGEMENT", title: "Command Your Empire", description: "Stop juggling spreadsheets. Our comprehensive management suite handles the boring stuff so you can focus on coaching.", color: "blue", features: ["Automated Attendance Tracking", "Multi-branch Support", "Staff & Payroll Management", "Digital Onboarding"], icon: <Users className="w-12 h-12 text-blue-600" />, visual: "management_ui", impact: "📉 40% Less Admin Time" },
    { id: "performance", category: "PERFORMANCE ANALYTICS", title: "Turn Potential into Podium", description: "Give your players the pro-level treatment with detailed statistical analysis, health monitoring, and growth tracking.", color: "green", features: ["Skill-specific Rating Systems", "Visual Progress Charts", "Injury & Recovery Logs", "Match Reports"], icon: <Activity className="w-12 h-12 text-green-600" />, visual: "analytics_ui", impact: "📈 25% Higher Retention" },
    { id: "finance", category: "FINANCE & BILLING", title: "Never Miss a Payment", description: "Secure your revenue stream with automated billing reminders, invoice generation, and expense tracking.", color: "indigo", features: ["Automated Fee Reminders", "Custom Subscription Plans", "Expense Dashboards", "Salary Management"], icon: <CreditCard className="w-12 h-12 text-indigo-600" />, visual: "finance_ui", impact: "💰 Zero Revenue Leakage" },
    { id: "iot", category: "SMART ECOSYSTEM", title: "The Future of Training", description: "Seamlessly integrate with our IoT smart sports equipment and wearables for real-time data collection.", color: "purple", features: ["Real-time Sensor Sync", "Automated Session Logging", "Hardware Health Monitoring", "Global Benchmarks"], icon: <Wifi className="w-12 h-12 text-purple-600" />, visual: "iot_ui", impact: "⚡ Real-time Metrics" },
    { id: "community", category: "COMMUNITY & ENGAGEMENT", title: "Build a Loyal Tribe", description: "Keep parents, players, and coaches connected with a unified communication hub.", color: "orange", features: ["In-app Chat & Announcements", "Tournament Tools", "Parent Portal", "Event Scheduling"], icon: <MessageSquare className="w-12 h-12 text-orange-600" />, visual: "chat_ui", impact: "🤝 3x Engagement" }
  ];

  const secondaryFeatures = [
    { icon: <Smartphone />, title: "Mobile App", desc: "Dedicated apps for Coaches and Players." },
    { icon: <MessageSquare />, title: "Chat System", desc: "Direct communication channels." },
    { icon: <Trophy />, title: "Tournaments", desc: "Organize and manage brackets easily." },
    { icon: <Target />, title: "Goal Setting", desc: "Set and track weekly training targets." },
    { icon: <Calendar />, title: "Scheduling", desc: "Drag-and-drop batch scheduling." },
    { icon: <Zap />, title: "Fast Setup", desc: "Get your academy running in minutes." },
    { icon: <Shield />, title: "Data Privacy", desc: "GDPR compliant data handling." },
    { icon: <Users />, title: "Parent Access", desc: "Dedicated login for parents." },
    { icon: <Activity />, title: "Health Logs", desc: "Track injuries and recovery." },
    { icon: <CreditCard />, title: "Online Payments", desc: "Integrated payment gateway." },
    { icon: <LayoutDashboard />, title: "Custom Reports", desc: "Generate PDF reports instantly." },
    { icon: <Wifi />, title: "Offline Mode", desc: "Works even without internet." },
  ];

  const renderVisual = (type, color) => {
    switch (type) {
      case 'management_ui': return <ManagementVisual color={color} />;
      case 'analytics_ui': return <AnalyticsVisual color={color} />;
      case 'finance_ui': return <FinanceVisual color={color} />;
      case 'iot_ui': return <IOTVisual color={color} />;
      case 'chat_ui': return <ChatVisual color={color} />;
      default: return null;
    }
  };

  return (
    <div ref={containerRef} id="features" className="relative bg-white overflow-hidden">
      <GridPattern />

      {/* --- PART 1: HERO TITLE --- */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-20 px-6 max-w-7xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-blue-600 uppercase bg-blue-50 rounded-full border border-blue-100 shadow-sm">
            Features Overview
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            The Operating System for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Modern Sports Academies
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We combine administrative power, performance analytics, and financial control into one seamless platform.
          </p>
        </motion.div>
      </section>

      {/* --- PART 2: CORE PILLARS (BENTO) --- */}
      <section className="px-6 pb-20 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="group relative p-8 bg-white border border-gray-200/80 rounded-3xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
              
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg mb-6`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- PART 3: DEEP DIVE SECTIONS (ALTERNATING) --- */}
      <div className="relative z-10 space-y-0">
        {/* Central Connecting Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent hidden lg:block -z-10"></div>

        {deepDives.map((item, idx) => (
          <section key={item.id} className={`py-16 relative`}>
            <div className="max-w-7xl mx-auto px-6">
              <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${idx % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                
                {/* Text Side */}
                <motion.div 
                  className="flex-1 relative"
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7 }}
                >
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-100 shadow-sm text-${item.color}-600 text-xs font-bold uppercase tracking-wider mb-6`}>
                    {item.icon} <span className="pt-0.5">{item.category}</span>
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    {item.title}
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    {item.description}
                  </p>
                  
                  {/* Impact Badge */}
                  <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium shadow-lg shadow-slate-500/20">
                    {item.impact}
                  </div>

                  <ul className="space-y-3">
                    {item.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 text-${item.color}-600 flex-shrink-0 mt-0.5`} />
                        <span className="text-gray-700 font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ x: 5 }}
                    className={`mt-8 flex items-center gap-2 text-${item.color}-600 font-bold hover:underline`}
                    onClick={() => navigate('/login')} // ADDED: Redirect to login on click
                  >
                    Learn more <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>

                {/* Visual Side (Static CSS Mockup) */}
                <motion.div 
                  className="flex-1 w-full flex justify-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7 }}
                >
                  <div className="w-full max-w-lg aspect-[4/3] relative">
                    <div className={`absolute -inset-4 bg-gradient-to-tr from-${item.color}-500/10 to-transparent rounded-[2rem] blur-2xl -z-10`}></div>
                    {renderVisual(item.visual, item.color)}
                  </div>
                </motion.div>

              </div>
            </div>
          </section>
        ))}
      </div>

      {/* --- PART 4: EVERYTHING ELSE GRID --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">And So Much More</h3>
          <p className="text-gray-600">Built for scale, designed for details.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {secondaryFeatures.map((feat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="p-6 bg-white rounded-2xl border border-gray-100 text-center hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300"
            >
              <div className="inline-block p-3 bg-blue-50 rounded-xl shadow-sm mb-3 text-blue-600">
                {feat.icon}
              </div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">{feat.title}</h4>
              <p className="text-[10px] text-gray-500 leading-tight">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- PART 5: CTA --- */}
      <section className="py-20 bg-[#0a0e1a] text-center relative overflow-hidden z-10">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Level Up?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Join the fastest-growing network of sports academies in India. 
            Digitize your operations today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.a
              href="#pricing"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-colors"
            >
              View Pricing Plans
            </motion.a>
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold border border-white/10 hover:bg-white/20 transition-colors"
            >
              Contact Sales
            </motion.a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Features;