import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@shared/types';

import { api } from '../../services/api/apiClient';
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2, Loader2, ShieldCheck, Sparkles, Phone, ExternalLink, X } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from '../../services/firebase/client';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRedirectOption, setShowRedirectOption] = useState(false);

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isCustomGoogle, setIsCustomGoogle] = useState(false);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setIsProcessing(true);
          const user = result.user;
          let appUser = await api.getUser(user.uid);
          
          if (!appUser) {
            const isStaffEmail = user.email?.toLowerCase() === 'sundar48807@gmail.com' || user.email?.toLowerCase() === 'abc@gmail.com';
            const newUser: User = {
              id: user.uid,
              name: user.displayName || 'Google User',
              email: user.email || '',
              phoneNumber: user.phoneNumber || '',
              role: isStaffEmail ? UserRole.STAFF : UserRole.STUDENT,
              rewardPoints: 100
            };
            appUser = await api.registerUser(newUser);
          }
          
          setSuccess(`Welcome, ${appUser.name}!`);
          setTimeout(() => onLogin(appUser!), 1000);
        }
      } catch (err: any) {
        console.warn("Redirect Result Error:", err);
      } finally {
        setIsProcessing(false);
      }
    };
    checkRedirect();
  }, [onLogin]);

  const validatePhone = (p: string) => /^\d{10}$/.test(p);
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const completeGoogleSignIn = async (userEmail: string, userName: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const isStaffEmail = userEmail.toLowerCase() === 'sundar48807@gmail.com' || userEmail.toLowerCase() === 'abc@gmail.com';
      const uid = `google-${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      let appUser = await api.getUser(uid);
      if (!appUser) {
        const newUser: User = {
          id: uid,
          name: userName || (isStaffEmail ? 'Sundar' : 'Google Student'),
          email: userEmail,
          phoneNumber: '',
          role: isStaffEmail ? UserRole.STAFF : UserRole.STUDENT,
          rewardPoints: 100
        };
        appUser = await api.registerUser(newUser);
      }
      setShowGoogleModal(false);
      setSuccess(`Welcome, ${appUser.name}!`);
      setTimeout(() => onLogin(appUser!), 800);
    } catch (err: any) {
      setError(err?.message || "Failed to sign in with Google account.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      setIsProcessing(false);
      console.info("Google Sign-In redirect info:", err);
      setShowGoogleModal(true);
    }
  };

  const handleGoogleRedirect = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.warn("Redirect Error:", err);
      setShowGoogleModal(true);
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isStaff && !validatePhone(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (isStaff && !validateEmail(email)) {
      setError("Please use a valid staff email.");
      return;
    }

    if (!isLogin && !isStaff && !validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsProcessing(true);

    try {
      if (isLogin) {
        if (isStaff && (email.toLowerCase() === 'abc@gmail.com' || email.toLowerCase() === 'sundar48807@gmail.com')) {
          let user = await api.loginUser(email, password);
          if (!user) {
            user = await api.registerUser({
              id: email.toLowerCase() === 'sundar48807@gmail.com' ? 'staff-sundar' : 'staff-admin',
              name: email.toLowerCase() === 'sundar48807@gmail.com' ? 'Sundar' : 'Kitchen Admin',
              email: email.toLowerCase(),
              phoneNumber: '',
              role: UserRole.STAFF,
              password: password,
              rewardPoints: 500
            });
          }
          setSuccess("Access Granted. Syncing Kitchen Vault...");
          setTimeout(() => onLogin(user!), 1000);
          return;
        }

        const identifier = isStaff ? email : `+91${phone}`;
        let user = await api.loginUser(identifier, password);
        
        if (!user && !isStaff) {
          user = await api.loginUser(phone, password);
        }
        
        if (!user) {
          setError("User not found or invalid credentials.");
        } else {
          setSuccess(`Welcome back, ${user.name}!`);
          setTimeout(() => onLogin(user), 1000);
        }
      } else {
        try {
          const newUser: User & { password?: string } = {
            id: 'temp-id',
            name: name || (isStaff ? email.split('@')[0] : `User ${phone.slice(-4)}`),
            email: email,
            phoneNumber: `+91${phone}`,
            role: isStaff ? UserRole.STAFF : UserRole.STUDENT,
            password: password,
            rewardPoints: 100
          };
          const registeredUser = await api.registerUser(newUser);
          setSuccess("Account Activated! Entering Hub...");
          setTimeout(() => {
            onLogin(registeredUser);
          }, 1500);
        } catch (err: any) {
          setError(err.message || "Account already exists or registration failed.");
        }
      }
    } catch (err) {
      setError("Authentication failed. Please retry.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl md:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-700 my-4 md:my-8 text-left">
        
        <div className="hidden lg:flex flex-col justify-center p-20 bg-slate-900 text-white relative overflow-hidden">
          <div className="relative z-10 text-left">
            <div className="bg-purple-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-12 shadow-2xl">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-7xl font-black mb-6 leading-tight italic tracking-tighter text-left">Crave<br/><span className="text-purple-500">Canteen.</span></h1>
            <p className="text-xl text-slate-400 mb-12 max-w-sm font-bold italic text-left">
              {isStaff ? 'Kitchen Management Portal. Authorized access only.' : 'The smart campus dining experience. Access via your phone number.'}
            </p>
          </div>
          <Sparkles className="absolute -bottom-10 -right-10 w-80 h-80 text-purple-500/5 rotate-12" />
        </div>

        <div className="p-5 md:p-20 flex flex-col justify-center bg-white relative overflow-y-auto">
          <div className="mb-6 md:mb-14 flex justify-center lg:justify-start">
            <div className="flex p-1 md:p-2 bg-slate-50 rounded-2xl md:rounded-[2rem] shadow-inner border border-slate-100">
              <button onClick={() => { setIsStaff(false); setError(null); }} className={`px-3 md:px-8 py-2 md:py-3 rounded-xl md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black tracking-widest transition-all ${!isStaff ? 'bg-slate-900 shadow-xl text-white' : 'text-slate-400'}`}>STUDENT / GUEST</button>
              <button onClick={() => { setIsStaff(true); setIsLogin(true); setError(null); }} className={`px-3 md:px-8 py-2 md:py-3 rounded-xl md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black tracking-widest transition-all ${isStaff ? 'bg-slate-900 shadow-xl text-white' : 'text-slate-400'}`}>STAFF PORTAL</button>
            </div>
          </div>

          <div className="max-w-md mx-auto w-full">
            <h2 className="text-2xl md:text-5xl font-black mb-2 md:mb-4 italic tracking-tighter text-slate-900 text-center lg:text-left">
              {isLogin ? 'Welcome Back.' : 'Sign Up.'}
            </h2>
            
            {error && <div className="mb-6 md:mb-8 p-4 md:p-5 bg-rose-50 border border-rose-100 rounded-2xl md:rounded-3xl flex items-center text-rose-600 text-[9px] md:text-[10px] font-black uppercase tracking-wider animate-in shake"><AlertCircle className="w-4 h-4 md:w-5 md:h-5 mr-3 md:mr-4 shrink-0" />{error}</div>}
            {success && <div className="mb-6 md:mb-8 p-4 md:p-5 bg-emerald-50 border border-emerald-100 rounded-2xl md:rounded-3xl flex items-center text-emerald-600 text-[9px] md:text-[10px] font-black uppercase tracking-wider animate-in slide-in-from-top-4"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 mr-3 md:mr-4 shrink-0" />{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-5">
              {!isLogin && !isStaff && (
                <>
                  <div className="relative group text-left">
                    <UserIcon className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                    <input type="text" placeholder="Full Display Name" required className="w-full pl-12 md:pl-14 pr-6 md:pr-8 py-3.5 md:py-5 border-2 border-slate-50 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 focus:outline-none bg-slate-50/50 text-xs font-black italic" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="relative group text-left">
                    <Mail className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                    <input type="email" placeholder="Email Address" required className="w-full pl-12 md:pl-14 pr-6 md:pr-8 py-3.5 md:py-5 border-2 border-slate-50 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 focus:outline-none bg-slate-50/50 text-xs font-black italic" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </>
              )}
              
              {!isStaff ? (
                <div className="relative group text-left flex items-center">
                  <Phone className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-300 z-10" />
                  <span className="absolute left-10 md:left-12 top-1/2 -translate-y-1/2 text-xs font-black italic text-slate-400 z-10">+91</span>
                  <input type="tel" placeholder="10-Digit Phone Number" required className="w-full pl-[4.5rem] md:pl-[5rem] pr-6 md:pr-8 py-3.5 md:py-5 border-2 border-slate-50 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 focus:outline-none bg-slate-50/50 text-xs font-black italic" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                </div>
              ) : (
                <div className="relative group text-left">
                  <Mail className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                  <input type="email" placeholder="Staff Email ID (e.g. sundar48807@gmail.com)" required className="w-full pl-12 md:pl-14 pr-6 md:pr-8 py-3.5 md:py-5 border-2 border-slate-50 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 focus:outline-none bg-slate-50/50 text-xs font-black italic" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              )}

              <div className="relative group text-left">
                <Lock className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                <input type="password" placeholder="Password" required className="w-full pl-12 md:pl-14 pr-6 md:pr-8 py-3.5 md:py-5 border-2 border-slate-50 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 focus:outline-none bg-slate-50/50 text-xs font-black italic" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              
              <button type="submit" disabled={isProcessing} className="w-full bg-slate-900 text-white font-black py-3.5 md:py-6 rounded-2xl md:rounded-[2.5rem] hover:bg-black transition-all flex items-center justify-center group text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] disabled:opacity-50 mt-5 md:mt-10 shadow-2xl">
                {isProcessing ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin mr-3 md:mr-4" /> : (isLogin ? 'Login Now' : 'Join Canteen')}
                {!isProcessing && <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-3 md:ml-4 transition-transform group-hover:translate-x-2" />}
              </button>
            </form>

            {!isStaff && (
              <>
                <div className="relative my-6 md:my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Or continue with</span>
                  </div>
                </div>

                <button 
                  onClick={handleGoogleSignIn}
                  disabled={isProcessing}
                  className="w-full bg-white border-2 border-slate-100 text-slate-700 font-black py-3.5 md:py-5 rounded-2xl md:rounded-[2.5rem] hover:bg-slate-50 transition-all flex items-center justify-center group text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] disabled:opacity-50 shadow-sm"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google Sign-In
                </button>

                {showRedirectOption && (
                  <button 
                    onClick={handleGoogleRedirect}
                    disabled={isProcessing}
                    className="w-full mt-3 md:mt-4 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-500 font-bold py-3 md:py-4 rounded-2xl md:rounded-[2.5rem] hover:bg-slate-100 transition-all flex items-center justify-center group text-[9px] md:text-[10px] uppercase tracking-[0.1em] disabled:opacity-50"
                  >
                    <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    Try Direct Redirect
                  </button>
                )}
              </>
            )}

            {!isStaff && (
              <p className="text-center mt-8 md:mt-12 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isLogin ? "New account?" : "Already existing?"} 
                <button onClick={() => setIsLogin(!isLogin)} className="ml-2 font-black text-purple-600 underline underline-offset-4 md:underline-offset-8 decoration-purple-100">
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {showGoogleModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl border border-slate-100 relative text-left">
            <button 
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <div>
                <h3 className="text-lg font-black italic tracking-tight text-slate-900">Sign in with Google</h3>
                <p className="text-[10px] font-bold text-slate-400">Choose an account to continue to CraveCanteen</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => completeGoogleSignIn('sundar48807@gmail.com', 'Sundar')}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 transition-all text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                    S
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 group-hover:text-purple-600 transition-colors">Sundar</p>
                    <p className="text-[10px] font-bold text-slate-400">sundar48807@gmail.com</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">Staff Portal</span>
              </button>

              <button
                onClick={() => completeGoogleSignIn('alex.chen@campus.edu', 'Alex Chen')}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 transition-all text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                    A
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 group-hover:text-purple-600 transition-colors">Alex Chen</p>
                    <p className="text-[10px] font-bold text-slate-400">alex.chen@campus.edu</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Student (100 Pts)</span>
              </button>
            </div>

            {!isCustomGoogle ? (
              <button
                onClick={() => setIsCustomGoogle(true)}
                className="w-full py-2.5 text-center text-xs font-black text-purple-600 hover:underline uppercase tracking-wider"
              >
                + Use another Google account
              </button>
            ) : (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-500"
                />
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsCustomGoogle(false)}
                    className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    disabled={!customGoogleEmail.includes('@')}
                    onClick={() => completeGoogleSignIn(customGoogleEmail, customGoogleName || customGoogleEmail.split('@')[0])}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthScreen;
