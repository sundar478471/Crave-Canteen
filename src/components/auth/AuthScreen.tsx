import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { api } from '../../services/api/apiClient';
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle, 
  CheckCircle2, Loader2, GraduationCap, UserCheck, ChefHat, 
  Utensils, CreditCard, Users, Leaf, Activity, Sparkles, X, ArrowLeft
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeSelector } from '../common/ThemeSelector';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export type SelectedRoleType = 'STUDENT' | 'FACULTY' | 'KITCHEN';

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const { effectiveTheme } = useTheme();
  
  // Exactly three login roles: Student, Faculty, Kitchen
  const [selectedRole, setSelectedRole] = useState<SelectedRoleType>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsProcessing(true);
    const loginStartTime = performance.now();

    try {
      // Authenticate with system backend
      const user = await api.loginUser(cleanEmail, password);
      const authEndTime = performance.now();

      if (!user) {
        setError("Invalid ID/password");
        setIsProcessing(false);
        return;
      }

      // Validate account role against selected portal role
      let isRoleMatching = false;

      if (selectedRole === 'STUDENT') {
        isRoleMatching = user.role === UserRole.STUDENT || user.role === UserRole.CUSTOMER;
      } else if (selectedRole === 'FACULTY') {
        isRoleMatching = user.role === UserRole.FACULTY;
      } else if (selectedRole === 'KITCHEN') {
        isRoleMatching = user.role === UserRole.STAFF || 
                         user.role === UserRole.KITCHEN_STAFF || 
                         user.role === UserRole.CANTEEN_MANAGER || 
                         user.role === UserRole.VENDOR_ADMIN ||
                         user.role === UserRole.ADMIN;
      }

      if (!isRoleMatching) {
        setError("Invalid ID/password");
        setIsProcessing(false);
        return;
      }

      const roleVerifyEndTime = performance.now();
      onLogin(user);
      const navEndTime = performance.now();

      if (process.env.NODE_ENV !== 'production') {
        console.info(`[Auth Performance] Total login verification + navigation: ${Math.round(navEndTime - loginStartTime)}ms (Auth: ${Math.round(authEndTime - loginStartTime)}ms, Role: ${Math.round(roleVerifyEndTime - authEndTime)}ms)`);
      }
    } catch (err: any) {
      setError("Invalid ID/password");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmail.trim() || !validateEmail(resetEmail.trim())) {
      setResetError("Please enter a valid email address for password reset.");
      return;
    }

    setIsResetting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResetSuccess(`Password reset instructions have been sent to ${resetEmail.trim()}`);
    } catch (err: any) {
      setResetError("Failed to initiate password reset. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans relative overflow-x-hidden lg:overflow-hidden transition-colors duration-300">
      
      {/* Top Header Theme Selector (Floating Top Right) */}
      <div className="absolute top-4 right-4 z-40">
        <ThemeSelector variant="dropdown" />
      </div>

      {/* ========================================================================= */}
      {/* 1. LEFT PANEL — CRAVECANTEEN INTRODUCTION (~55% Width on Desktop) */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[55%] relative min-h-[400px] lg:h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 overflow-hidden">
        
        {/* Background Image with Soft Warm White Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
          style={{ backgroundImage: "url('/canteen_bg.jpg')" }}
        />
        
        {/* Gradient Overlay for Optimum Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/40 dark:from-[#070b14]/95 dark:via-[#070b14]/85 dark:to-[#070b14]/40" />

        {/* Content Overlay Container */}
        <div className="relative z-10 flex flex-col justify-between h-full max-w-xl">
          
          {/* Top CraveCanteen Brand Logo */}
          <div className="flex items-center space-x-3 mb-4 lg:mb-6">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Utensils className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center">
                <span>Crave</span>
                <span className="text-orange-600 dark:text-orange-500">Canteen</span>
              </h1>
              <p className="text-[9px] lg:text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                GOOD FOOD • BRIGHTER DAYS
              </p>
            </div>
          </div>

          {/* Main Hero Headings & Intro */}
          <div className="space-y-4 lg:space-y-5 my-auto">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Fresh Food <br />
                Happier Students <br />
                <span className="text-orange-600 dark:text-orange-500">Brighter Campus</span>
              </h2>
              <p className="mt-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
                CraveCanteen connects students, faculty and kitchen staff with a seamless, convenient campus dining experience. Enjoy delicious meals, real-time menu updates and a smarter campus canteen experience.
              </p>
            </div>

            {/* Feature Highlights Pill List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 pt-1">
              <div className="flex items-center space-x-2.5 group p-1.5 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-xs border border-slate-200/50 dark:border-white/5">
                <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Utensils className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Easy Ordering</h4>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">Browse & order in seconds.</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 group p-1.5 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-xs border border-slate-200/50 dark:border-white/5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Cashless & Fast</h4>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">Secure online payments.</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 group p-1.5 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-xs border border-slate-200/50 dark:border-white/5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white truncate">For Everyone</h4>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">Students, faculty & staff.</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 group p-1.5 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-xs border border-slate-200/50 dark:border-white/5">
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Leaf className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Fresh & Hygienic</h4>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">Quality cooked food.</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 group p-1.5 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-xs border border-slate-200/50 dark:border-white/5 sm:col-span-2 xl:col-span-1">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Live Updates</h4>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">Real-time order tracking.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Left Decorative Cursive Slogan */}
          <div className="pt-3 lg:pt-4">
            <p className="font-serif italic text-xl lg:text-2xl font-bold text-orange-600 dark:text-orange-400 leading-tight tracking-wide">
              Good Food <span className="text-slate-800 dark:text-slate-200 font-sans not-italic text-sm">• Brighter Minds</span>
            </p>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT PANEL — LOGIN CARD (~45% Width on Desktop) */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[45%] lg:h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-20 overflow-y-auto lg:overflow-hidden">
        
        {/* Main Glassmorphism Login Card */}
        <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl lg:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-7 relative transition-all duration-300">
          
          {/* Small Green Leaf Decoration (Upper-Right Corner) */}
          <div className="absolute top-5 right-5 text-emerald-500/80 pointer-events-none transform rotate-12 hover:rotate-45 transition-transform">
            <Leaf className="w-6 h-6 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
          </div>

          {/* Header Block */}
          <div className="text-center mb-5">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
              Welcome to
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              Crave<span className="text-orange-600 dark:text-orange-500">Canteen</span>
            </h2>
            <p className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em] mt-0.5">
              GOOD FOOD • BRIGHTER DAYS
            </p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2">
              Login to continue
            </p>
          </div>

          {/* ======================================================================= */}
          {/* 3. USER ROLE SELECTION (EXACTLY THREE ROLES) */}
          {/* ======================================================================= */}
          <div className="mb-4">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 text-center">
              Select Your Portal Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              
              {/* STUDENT ROLE CARD */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('STUDENT');
                  setError(null);
                }}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all duration-200 ${
                  selectedRole === 'STUDENT'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs scale-[1.02]'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {selectedRole === 'STUDENT' && (
                  <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                )}
                <GraduationCap className={`w-6 h-6 mb-1 ${selectedRole === 'STUDENT' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold">Student</span>
              </button>

              {/* FACULTY ROLE CARD */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('FACULTY');
                  setError(null);
                }}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all duration-200 ${
                  selectedRole === 'FACULTY'
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs scale-[1.02]'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {selectedRole === 'FACULTY' && (
                  <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                )}
                <UserCheck className={`w-6 h-6 mb-1 ${selectedRole === 'FACULTY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold">Faculty</span>
              </button>

              {/* KITCHEN ROLE CARD */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('KITCHEN');
                  setError(null);
                }}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all duration-200 ${
                  selectedRole === 'KITCHEN'
                    ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 shadow-xs scale-[1.02]'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {selectedRole === 'KITCHEN' && (
                  <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-orange-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                )}
                <ChefHat className={`w-6 h-6 mb-1 ${selectedRole === 'KITCHEN' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold">Kitchen</span>
              </button>

            </div>
          </div>

          {/* Error & Success Feedback Alerts */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {/* ======================================================================= */}
          {/* 4. LOGIN FORM */}
          {/* ======================================================================= */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-medium rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm font-medium rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 transition-all cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setResetEmail(email);
                  setResetError(null);
                  setResetSuccess(null);
                }}
                className="text-orange-600 dark:text-orange-400 font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Primary Login Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Login</span>
              )}
            </button>

          </form>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL FLOW */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            
            <button 
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Reset Password
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your registered CraveCanteen account email to receive reset instructions.
              </p>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="student@campus.edu"
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center transition-all disabled:opacity-50"
              >
                {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Password Reset Link"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AuthScreen;
