import React, { useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/storageService';
import { AuthUser } from '../types';

interface AuthPageProps {
    onAuthSuccess: (user: AuthUser) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Verifying...');
    const [error, setError] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between Login and Signup
    const [bgIndex, setBgIndex] = useState(0);

    const backgrounds = [
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=1600&q=80"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex(prev => (prev + 1) % backgrounds.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setLoadingText(isLoginMode ? "Secure Access..." : "Creating Account...");

        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Delay for realism
            
            let user;
            if (isLoginMode) {
                user = loginUser(email, password);
            } else {
                user = registerUser(email, password);
            }
            onAuthSuccess(user);
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setError('');
        setPassword(''); // Clear password for security when switching
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                {backgrounds.map((bg, idx) => (
                    <div 
                        key={bg}
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${idx === bgIndex ? 'opacity-40 scale-110' : 'opacity-0 scale-100'}`}
                        style={{ 
                            backgroundImage: `url(${bg})`,
                            transition: 'opacity 2s ease-in-out, transform 10s linear' 
                        }}
                    ></div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
            </div>

            {/* Main Auth Card */}
            <div className="relative z-10 w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-pulse-slow">
                        <span className="text-black font-black text-2xl tracking-tighter">EF</span>
                    </div>
                    <h1 className="text-4xl font-black text-white italic tracking-tight mb-2">
                        EVOLVEFIT <span className="text-brand-500">AI</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">Elite Performance Access</p>
                </div>

                <div className="bg-dark-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 bg-dark-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-in fade-in duration-200">
                            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-white font-bold text-sm tracking-widest uppercase animate-pulse">{loadingText}</p>
                        </div>
                    )}

                    {/* Mode Toggle Tabs */}
                    <div className="flex bg-black/40 p-1 rounded-xl mb-6 border border-white/5">
                        <button 
                            onClick={() => setIsLoginMode(true)}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isLoginMode ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Sign In
                        </button>
                        <button 
                            onClick={() => setIsLoginMode(false)}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${!isLoginMode ? 'bg-brand-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-500 uppercase tracking-widest ml-1">Email Address</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                placeholder="name@example.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-500 uppercase tracking-widest ml-1">Password</label>
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col items-center animate-in shake">
                                <p className="text-red-500 text-xs font-bold text-center">{error}</p>
                                {/* Smart Error Recovery Actions */}
                                {error === "No account found." && (
                                    <button 
                                        type="button" 
                                        onClick={toggleMode}
                                        className="text-brand-500 text-xs font-bold underline mt-1 hover:text-brand-400"
                                    >
                                        Create Account Now
                                    </button>
                                )}
                                {error === "This email is already in use." && (
                                    <button 
                                        type="button" 
                                        onClick={toggleMode}
                                        className="text-brand-500 text-xs font-bold underline mt-1 hover:text-brand-400"
                                    >
                                        Switch to Login
                                    </button>
                                )}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full font-black uppercase tracking-widest py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 
                                ${!isLoginMode 
                                    ? 'bg-brand-500 hover:bg-brand-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                                    : 'bg-white hover:bg-slate-200 text-black shadow-lg'}`}
                        >
                            {isLoginMode ? "Log In" : "Create Account"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button onClick={toggleMode} className="text-xs text-slate-500 hover:text-white transition-colors">
                            {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
