import React from 'react';
import { Plus, Edit, Trash2, Home, RefreshCw, Zap, Video, Trophy, Settings, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router';

function Admin() {
  const adminOptions = [
    {
      id: 'create',
      title: 'Create Problem',
      description: 'Add a new coding problem to the platform',
      icon: Plus,
      gradient: 'from-emerald-500 to-teal-500',
      route: '/admin/create'
    },
    {
      id: 'update',
      title: 'Update Problem',
      description: 'Edit existing problems and their details',
      icon: Edit,
      gradient: 'from-amber-500 to-orange-500',
      route: '/admin/update'
    },
    {
      id: 'delete',
      title: 'Delete Problem',
      description: 'Remove problems from the platform',
      icon: Trash2,
      gradient: 'from-rose-500 to-pink-500',
      route: '/admin/delete'
    },
    {
      id: 'video',
      title: 'Video Problem',
      description: 'Upload and delete video tutorials',
      icon: Video,
      gradient: 'from-purple-500 to-indigo-500',
      route: '/admin/video'
    },
    {
      id: 'create-contest',
      title: 'Create Contest',
      description: 'Create a new coding contest with 3-4 problems',
      icon: Trophy,
      gradient: 'from-blue-500 to-cyan-500',
      route: '/admin/contests/create'
    },
    {
      id: 'manage-contests',
      title: 'Manage Contests',
      description: 'View and manage all contests',
      icon: Settings,
      gradient: 'from-violet-500 to-purple-500',
      route: '/admin/contests'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      {/* Wave Animation Background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wave-gradient-admin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path className="wave-path-1" fill="url(#wave-gradient-admin)" d="M0,160 C320,300,420,300,740,160 L740,00 L0,0 Z" />
          <path className="wave-path-2" fill="url(#wave-gradient-admin)" d="M0,200 C240,340,520,340,740,200 L740,00 L0,0 Z" opacity="0.5" />
          <path className="wave-path-3" fill="url(#wave-gradient-admin)" d="M0,240 C180,380,560,380,740,240 L740,00 L0,0 Z" opacity="0.3" />
        </svg>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
              opacity: 0.3
            }}
          ></div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-60 animate-pulse-slow"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-2xl">
                <Shield className="w-12 h-12 text-white" strokeWidth={2} />
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-black text-white mb-4 bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-slate-300 text-xl font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            Manage your coding platform with power and ease
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          </p>
        </div>

        {/* Admin Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {adminOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <NavLink
                key={option.id}
                to={option.route}
                className="group relative animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${option.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-all duration-500`}></div>

                {/* Card */}
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 hover:border-slate-600 transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="relative inline-block">
                      <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-all duration-500`}></div>
                      <div className={`relative bg-gradient-to-br ${option.gradient} p-4 rounded-xl group-hover:scale-110 transition-all duration-500`}>
                        <IconComponent className="w-8 h-8 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-black text-white mb-3 group-hover:text-blue-300 transition-colors">
                    {option.title}
                  </h2>

                  {/* Description */}
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    {option.description}
                  </p>

                  {/* Action Button */}
                  <div className="flex items-center gap-2 text-blue-400 font-bold group-hover:gap-4 transition-all duration-300">
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <NavLink
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700 hover:bg-slate-700/50 hover:border-slate-600 transition-all group"
          >
            <Home className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            <span className="text-slate-300 group-hover:text-white font-medium transition-colors">Back to Home</span>
          </NavLink>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-15px) translateX(5px); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-fade-in-up { 
          animation: fade-in-up 0.6s ease-out;
          animation-fill-mode: both;
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        
        .wave-path-1 { animation: wave 8s ease-in-out infinite; }
        .wave-path-2 { animation: wave 10s ease-in-out infinite reverse; }
        .wave-path-3 { animation: wave 12s ease-in-out infinite; }
        
        @keyframes wave {
          0%, 100% { d: path("M0,160 C320,300,420,300,740,160 L740,00 L0,0 Z"); }
          50% { d: path("M0,200 C320,100,420,100,740,200 L740,00 L0,0 Z"); }
        }
      `}</style>
    </div>
  );
}

export default Admin;