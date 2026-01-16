import React, { useEffect, useState } from 'react';
import { UserProfile, DailyLog, WorkoutPlan } from '../types';
import { getDailyLog, getRecentLogs, getLocalDateKey } from '../services/storageService';

interface DashboardProps {
  user: UserProfile;
}

const QUOTES = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "David Goggins" },
  { text: "Your body can stand almost anything. It’s your mind that you have to convince.", author: "Unknown" },
  { text: "Fitness is not about being better than someone else. It’s about being better than you were yesterday.", author: "Khloe Kardashian" },
  { text: "Discipline is doing what needs to be done, even if you don't want to do it.", author: "Unknown" },
];

const SUCCESS_STORIES = [
    {
        id: 1,
        name: "Arjun K.",
        result: "-12kg Fat Loss",
        time: "3 Months",
        image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80",
        quote: "The AI meal plans made calorie deficits actually feel doable. Loving the new me!"
    },
    {
        id: 2,
        name: "Priya Sharma",
        result: "Muscle Gain",
        time: "5 Months",
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
        quote: "EvolveFit's PPL split is intense. Finally seeing definition in my arms."
    },
    {
        id: 3,
        name: "Rohan D.",
        result: "Recomp",
        time: "4 Months",
        image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80",
        quote: "SnapMeal makes tracking indian food so easy. No more guessing calories."
    },
     {
        id: 4,
        name: "Sneha P.",
        result: "-8kg Fat Loss",
        time: "2 Months",
        image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80",
        quote: "Consistent tracking and the community challenges kept me going."
    }
];

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [workoutFocus, setWorkoutFocus] = useState<string>('Rest & Recovery');
  const [workoutName, setWorkoutName] = useState<string>('No Plan Active');
  const [quote, setQuote] = useState(QUOTES[0]);
  
  // History Modal State
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateKey());
  const [historyLog, setHistoryLog] = useState<DailyLog | null>(null);

  useEffect(() => {
    // 1. Load Today's Data using consistent Local Date Key
    const today = getLocalDateKey();
    const updateLog = () => setTodayLog(getDailyLog(today));
    
    updateLog();
    const interval = setInterval(updateLog, 2000); // Live update for macro ring

    // 2. Load Dynamic Workout Focus from Cache
    try {
        const cachedPlan = localStorage.getItem('evolvefit_cached_workout');
        if (cachedPlan) {
            const plan: WorkoutPlan = JSON.parse(cachedPlan);
            setWorkoutName(plan.splitName);
            
            // Simple mapping: Day index % plan length
            // In a real app, this would be tied to specific dates or a "current day" pointer
            const dayIndex = new Date().getDay(); // 0 (Sun) - 6 (Sat)
            // Adjust so Monday is 0 if needed, or just map loosely for demo
            const scheduleIndex = dayIndex % plan.schedule.length;
            const todayWorkout = plan.schedule[scheduleIndex];
            
            setWorkoutFocus(todayWorkout.focus);
        }
    } catch (e) {
        console.warn("Could not load workout focus");
    }

    // 3. Random Quote
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(randomQuote);

    return () => clearInterval(interval);
  }, []);

  // Update history view when date changes
  useEffect(() => {
    if (showHistory) {
        setHistoryLog(getDailyLog(selectedDate));
    }
  }, [selectedDate, showHistory]);

  if (!todayLog) return null;

  const { calories, protein, carbs, fats } = user.targets;
  const consumed = todayLog.totalMacros;
  const remainingCals = calories - consumed.calories;
  
  // Progress calculations
  const calPercentage = Math.min((consumed.calories / calories) * 100, 100);
  const proPercentage = Math.min((consumed.protein / protein) * 100, 100);
  const carbPercentage = Math.min((consumed.carbs / carbs) * 100, 100);
  const fatPercentage = Math.min((consumed.fats / fats) * 100, 100);

  // SVG Ring Calculation
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (calPercentage / 100) * circumference;

  // Date Generator for History
  const getLast30Days = () => {
      const dates = [];
      for (let i = 0; i < 30; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          dates.push(getLocalDateKey(d));
      }
      return dates;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">Welcome Back, {user.name}</h2>
          <h1 className="text-3xl font-extrabold text-white">Daily Intelligence</h1>
        </div>
        <div className="flex items-center gap-3">
             <div className="bg-dark-800/50 backdrop-blur border border-white/5 px-4 py-2 rounded-full text-xs font-bold text-slate-300 flex items-center gap-2 shadow-lg">
                <span>📅</span> 
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Stats Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-dark-800 to-black border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
             {/* Background Effects */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20 group-hover:bg-brand-500/20 transition-colors duration-1000"></div>

             <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                {/* Calorie Ring */}
                <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 128 128">
                        <circle cx="64" cy="64" r={radius} fill="none" stroke="#222" strokeWidth="8" />
                        <circle 
                            cx="64" cy="64" r={radius} 
                            fill="none" 
                            stroke="#22c55e" 
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-white tracking-tighter">{remainingCals}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Remaining</span>
                    </div>
                </div>

                {/* Macros */}
                <div className="flex-1 w-full grid grid-cols-1 gap-6">
                    {/* Protein */}
                    <div className="relative group/macro">
                        <div className="flex justify-between text-sm font-bold mb-2">
                            <span className="text-slate-300">Protein</span>
                            <span className="text-blue-400 group-hover/macro:scale-110 transition-transform">{consumed.protein} <span className="text-slate-600">/</span> {protein}g</span>
                        </div>
                        <div className="w-full bg-dark-700/50 h-3 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${proPercentage}%` }}></div>
                        </div>
                    </div>
                    {/* Carbs */}
                    <div className="relative group/macro">
                        <div className="flex justify-between text-sm font-bold mb-2">
                            <span className="text-slate-300">Carbs</span>
                            <span className="text-green-400 group-hover/macro:scale-110 transition-transform">{consumed.carbs} <span className="text-slate-600">/</span> {carbs}g</span>
                        </div>
                        <div className="w-full bg-dark-700/50 h-3 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-1000" style={{ width: `${carbPercentage}%` }}></div>
                        </div>
                    </div>
                    {/* Fats */}
                    <div className="relative group/macro">
                        <div className="flex justify-between text-sm font-bold mb-2">
                            <span className="text-slate-300">Fats</span>
                            <span className="text-yellow-400 group-hover/macro:scale-110 transition-transform">{consumed.fats} <span className="text-slate-600">/</span> {fats}g</span>
                        </div>
                        <div className="w-full bg-dark-700/50 h-3 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all duration-1000" style={{ width: `${fatPercentage}%` }}></div>
                        </div>
                    </div>
                </div>
             </div>
          </div>

          {/* Quick Actions / Focus */}
          <div className="space-y-4">
               {/* Workout Card */}
              <div className="h-48 rounded-[2rem] overflow-hidden relative group cursor-pointer border border-white/5 shadow-xl">
                 <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                 
                 <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                    <span className="bg-brand-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide shadow-lg">Today's Focus</span>
                 </div>
                 
                 <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">{workoutName}</p>
                    <h3 className="text-2xl font-black text-white leading-tight uppercase italic">{workoutFocus}</h3>
                 </div>
              </div>

              {/* Message of the Day */}
              <div className="bg-dark-800 rounded-[2rem] border border-white/5 p-5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 text-6xl text-white/5 font-serif font-black -mt-2 -mr-2">"</div>
                 <h3 className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-2">Daily Motivation</h3>
                 <p className="text-slate-300 text-sm font-medium italic leading-relaxed">"{quote.text}"</p>
                 <p className="text-slate-500 text-[10px] mt-2 font-bold">— {quote.author}</p>
              </div>
          </div>
      </div>

      {/* Logged Meals List */}
      <div>
         <div className="flex justify-between items-end mb-6">
             <div>
                 <h3 className="text-xl font-bold text-white">Today's Fuel</h3>
                 <p className="text-xs text-slate-500">Track your daily intake breakdown.</p>
             </div>
             <button 
                onClick={() => setShowHistory(true)}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center gap-2"
             >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                View Full Log
             </button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {todayLog.meals.length === 0 ? (
                 <div className="col-span-full p-10 rounded-[2rem] border border-dashed border-dark-700 text-center bg-dark-800/30">
                     <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl border border-white/5">🍽️</div>
                     <p className="text-sm text-slate-400 font-medium">No meals logged yet.</p>
                     <p className="text-xs text-slate-600 mt-1">Use SnapMeal to track your intake instantly.</p>
                 </div>
             ) : (
                 todayLog.meals.map((meal, idx) => (
                    <div key={idx} className="bg-dark-800 border border-white/5 p-4 rounded-3xl flex items-center gap-4 hover:border-brand-500/30 transition-all group hover:bg-dark-700/50">
                        <div className="w-20 h-20 rounded-2xl bg-dark-700 overflow-hidden flex-shrink-0 relative border border-white/5">
                            {meal.imageUrl ? (
                                <img src={meal.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-dark-800 text-2xl">🍛</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                            <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold text-white truncate group-hover:text-brand-500 transition-colors">{meal.name}</h4>
                                <span className="text-[10px] text-slate-500 font-mono">{new Date(meal.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5 mb-2">{meal.description || 'Quick Log'}</p>
                            
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">{meal.macros.protein}g P</span>
                                <span className="text-[9px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">{meal.macros.carbs}g C</span>
                                <span className="text-[9px] font-bold bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20">{meal.macros.fats}g F</span>
                                <span className="text-[9px] font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">{meal.macros.calories} kcal</span>
                            </div>
                        </div>
                    </div>
                 ))
             )}
         </div>
      </div>

      {/* Community Wins Section */}
      <div className="pt-4">
          <div className="flex justify-between items-end mb-6">
              <div>
                  <h3 className="text-xl font-bold text-white">Community Wins</h3>
                  <p className="text-xs text-slate-500">Real people, real results. Trusted by 50,000+ Indians.</p>
              </div>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 snap-x">
              {SUCCESS_STORIES.map(story => (
                  <div key={story.id} className="snap-start min-w-[280px] w-[280px] bg-dark-800 border border-white/5 rounded-3xl p-4 relative group hover:border-brand-500/30 transition-all flex-shrink-0">
                      <div className="h-48 rounded-2xl overflow-hidden mb-4 relative">
                           <img src={story.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                           <div className="absolute bottom-3 left-3 bg-brand-500 text-black px-2 py-0.5 rounded-lg border border-white/10 shadow-lg">
                               <span className="font-bold text-xs">⚡ {story.result}</span>
                           </div>
                           <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                               <span className="text-white font-medium text-[10px]">{story.time}</span>
                           </div>
                      </div>
                      <p className="text-slate-300 text-xs italic mb-4 leading-relaxed opacity-80">"{story.quote}"</p>
                      <div className="flex justify-between items-center border-t border-white/5 pt-3">
                          <span className="text-white font-bold text-sm">{story.name}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-brand-500">Verified</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* === HISTORY MODAL === */}
      {showHistory && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 flex items-center justify-center p-4">
              <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
                  
                  {/* Close Button */}
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="absolute top-6 right-6 w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-dark-700 transition-colors z-20"
                  >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>

                  <div className="p-8 pb-0 flex-none">
                      <h2 className="text-2xl font-black text-white uppercase italic">Log Archives</h2>
                      <p className="text-slate-500 text-sm">Review your nutrition history.</p>
                      
                      {/* Date Scroller */}
                      <div className="flex gap-3 overflow-x-auto py-6 no-scrollbar mask-linear-fade">
                          {getLast30Days().map(date => {
                              const d = new Date(date);
                              const isSelected = date === selectedDate;
                              return (
                                  <button 
                                    key={date}
                                    onClick={() => setSelectedDate(date)}
                                    className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                                        isSelected 
                                        ? 'bg-brand-500 text-black border-brand-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-110' 
                                        : 'bg-dark-800 text-slate-500 border-white/5 hover:bg-dark-700 hover:text-slate-300'
                                    }`}
                                  >
                                      <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                      <span className="text-xl font-black">{d.getDate()}</span>
                                  </button>
                              )
                          })}
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-0">
                      {historyLog ? (
                          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 key={selectedDate}">
                              
                              {/* Daily Summary Card */}
                              <div className="bg-dark-800 rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row gap-6 items-center">
                                  <div className="text-center md:text-left">
                                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Total Intake</p>
                                      <div className="flex items-baseline gap-1 justify-center md:justify-start">
                                          <span className="text-4xl font-black text-white">{historyLog.totalMacros.calories}</span>
                                          <span className="text-sm font-bold text-slate-500">kcal</span>
                                      </div>
                                  </div>
                                  <div className="flex-1 w-full grid grid-cols-3 gap-4">
                                      <div className="bg-black/30 rounded-2xl p-3 text-center border border-white/5">
                                          <div className="text-[10px] font-black text-blue-500 uppercase mb-1">Protein</div>
                                          <div className="text-xl font-bold text-white">{historyLog.totalMacros.protein}g</div>
                                      </div>
                                      <div className="bg-black/30 rounded-2xl p-3 text-center border border-white/5">
                                          <div className="text-[10px] font-black text-green-500 uppercase mb-1">Carbs</div>
                                          <div className="text-xl font-bold text-white">{historyLog.totalMacros.carbs}g</div>
                                      </div>
                                      <div className="bg-black/30 rounded-2xl p-3 text-center border border-white/5">
                                          <div className="text-[10px] font-black text-yellow-500 uppercase mb-1">Fats</div>
                                          <div className="text-xl font-bold text-white">{historyLog.totalMacros.fats}g</div>
                                      </div>
                                  </div>
                              </div>

                              {/* Meals List */}
                              <div>
                                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Logged Items</h3>
                                  <div className="space-y-3">
                                      {historyLog.meals.length > 0 ? historyLog.meals.map((meal, idx) => (
                                          <div key={idx} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                                              <div className="flex items-center gap-4">
                                                  <div className="w-12 h-12 rounded-xl bg-dark-700 overflow-hidden">
                                                      {meal.imageUrl ? (
                                                          <img src={meal.imageUrl} className="w-full h-full object-cover" />
                                                      ) : (
                                                          <div className="w-full h-full flex items-center justify-center text-lg">🍛</div>
                                                      )}
                                                  </div>
                                                  <div>
                                                      <h4 className="font-bold text-white text-sm">{meal.name}</h4>
                                                      <p className="text-xs text-slate-500">{meal.description || 'No description'}</p>
                                                  </div>
                                              </div>
                                              <div className="text-right">
                                                  <span className="block font-black text-white">{meal.macros.calories}</span>
                                                  <span className="text-[10px] text-slate-500 font-bold uppercase">kcal</span>
                                              </div>
                                          </div>
                                      )) : (
                                          <div className="text-center py-12 text-slate-500 border border-dashed border-white/10 rounded-3xl">
                                              No data logged for this date.
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="flex items-center justify-center h-64 text-slate-500">
                              Select a date to view history.
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
