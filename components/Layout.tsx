import React from 'react';
import { UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: UserProfile;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, user }) => {
  const tabs = [
    { id: 'dashboard', icon: 'home', label: 'Home' },
    { id: 'musclebook', icon: 'book', label: 'MuscleBook' },
    { id: 'snapmeal', icon: 'camera', label: 'SnapMeal' },
    { id: 'trainer', icon: 'chat', label: 'Coach' },
    { id: 'meal-plan', icon: 'meal', label: 'Meal AI' },
    { id: 'workout-plan', icon: 'dumbbell', label: 'Train AI' },
    { id: 'contests', icon: 'trophy', label: 'Contests' },
    { id: 'community', icon: 'users', label: 'Community' },
  ];

  // Helper for icons - Updated to support contrast on active state
  const getIcon = (name: string, isActive: boolean) => {
    // If active, we use black because the background is green (brand-500). 
    // If inactive, we use slate-400.
    const color = isActive ? "#000000" : "#94a3b8";
    
    switch(name) {
        case 'home': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
        case 'book': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>;
        case 'chart': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path></svg>;
        case 'camera': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
        case 'chat': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
        case 'meal': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"></path><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"></path><path d="M12 2v10"></path><path d="M2 7.35l2 4.65"></path><path d="M22 7.35l-2 4.65"></path></svg>;
        case 'dumbbell': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11"></path><path d="M6.5 17.5h11"></path><path d="M6 5v14"></path><path d="M18 5v14"></path><path d="M9 12h6"></path></svg>;
        case 'trophy': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>;
        case 'users': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
        default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans flex flex-col selection:bg-brand-500/30">
      
      {/* Desktop/Tablet Header - Premium Glass */}
      <header className="hidden md:flex items-center justify-between px-6 xl:px-8 py-4 fixed top-0 left-0 right-0 z-[100] h-24 pointer-events-none">
         {/* Glass Background Layer */}
         <div className="absolute inset-0 bg-black/90 backdrop-blur-xl border-b border-white/5 pointer-events-auto shadow-2xl"></div>

         {/* Content Container */}
         <div className="relative w-full h-full flex items-center justify-between max-w-7xl mx-auto pointer-events-auto">
             
             {/* Left: Brand */}
             <div 
                className="flex items-center gap-4 w-60 group cursor-pointer"
                onClick={() => onTabChange('dashboard')}
             >
                 <div className="w-10 h-10 bg-gradient-to-tr from-brand-500 to-emerald-600 rounded-xl flex items-center justify-center text-black font-extrabold text-sm shadow-[0_0_25px_rgba(34,197,94,0.4)] group-hover:scale-105 transition-transform">
                     EF
                 </div>
                 <div className="block">
                    <h1 className="text-xl font-bold tracking-tight text-white leading-none">EvolveFit</h1>
                    <p className="text-[10px] text-brand-500 font-bold tracking-[0.2em] uppercase mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">AI Performance</p>
                 </div>
             </div>

             {/* Center: Navigation Pills */}
             <nav className="flex-1 flex justify-center px-4 min-w-0">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex items-center shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 flex-shrink-0 group ${
                        activeTab === tab.id 
                          ? 'text-black' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {/* Active Pill Background */}
                      {activeTab === tab.id && (
                          <div className="absolute inset-0 bg-brand-500 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-in zoom-in-95 duration-200" />
                      )}
                      
                      {/* Content */}
                      <span className="relative z-10 flex items-center gap-2.5">
                          {getIcon(tab.icon, activeTab === tab.id)}
                          <span className={`text-xs font-bold tracking-wide hidden lg:inline ${activeTab === tab.id ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                            {tab.label}
                          </span>
                      </span>
                    </button>
                  ))}
                </div>
             </nav>

             {/* Right: Profile */}
             <div className="flex items-center justify-end gap-5 w-60">
                <div className="text-right block">
                    <p className="text-sm font-bold text-white truncate max-w-[140px]">{user.name}</p>
                    <div className="flex items-center justify-end gap-1.5">
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] text-slate-400 font-mono font-medium">{user.targets.calories} kcal</p>
                    </div>
                </div>
                <button 
                    onClick={() => onTabChange('profile')}
                    className="w-11 h-11 rounded-full p-[2px] border border-white/20 hover:border-brand-500 transition-colors relative group shadow-lg"
                >
                   <img 
                     src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100"} 
                     alt="User" 
                     className="w-full h-full object-cover rounded-full group-hover:scale-95 transition-transform"
                   />
                </button>
             </div>
         </div>
      </header>

      {/* Mobile Header - Sleek Glass */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-black/95 backdrop-blur-xl px-4 border-b border-white/5 flex justify-between items-center h-16 shadow-2xl transition-all">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-black font-bold text-xs shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                EF
            </div>
            <span className="text-lg font-bold text-white tracking-tight">EvolveFit</span>
        </div>
        
        {/* Right side: User Info + Avatar */}
        <div className="flex items-center gap-3" onClick={() => onTabChange('profile')}>
            <div className="text-right">
                <p className="text-xs font-bold text-white max-w-[100px] truncate">{user.name}</p>
                <p className="text-[10px] text-brand-500 font-mono">{user.targets.calories} kcal</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-dark-800 p-0.5 border border-white/10 overflow-hidden">
                <img 
                    src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100"} 
                    className="w-full h-full object-cover rounded-full" 
                />
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      {/* Padded to prevent nav overlap on all screen sizes */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-24 md:pt-32 pb-32 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Nav - Scrollable Horizontal List */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-[100]">
          {/* Changed justify-between to overflow-x-auto to allow scrolling for many items */}
          <div className="bg-black/90 backdrop-blur-2xl border border-white/15 rounded-[2rem] px-2 py-2 flex items-center overflow-x-auto no-scrollbar gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative snap-x snap-mandatory">
             {/* Gradient Border Glow */}
             <div className="absolute inset-0 rounded-[2rem] border border-white/5 pointer-events-none sticky left-0"></div>

             {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`relative flex flex-col items-center justify-center w-14 h-14 flex-shrink-0 snap-center transition-all duration-300 ${
                        isActive ? '-translate-y-4' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border ${
                          isActive 
                          ? 'bg-brand-500 text-black border-brand-400 shadow-[0_0_25px_rgba(34,197,94,0.6)] scale-110' 
                          : 'bg-transparent border-transparent text-white'
                      }`}>
                          {getIcon(tab.icon, isActive)}
                      </div>
                      
                      {/* Floating Label */}
                      <span className={`absolute -bottom-5 text-[9px] font-bold text-brand-500 uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                          isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                      }`}>
                          {tab.label}
                      </span>
                    </button>
              )})}
          </div>
      </div>
    </div>
  );
};
