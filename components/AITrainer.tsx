import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, WidgetData, CoachSettings } from '../types';
import { chatWithTrainer, analyzeWorkoutVideo } from '../services/geminiService';
import { getDailyLog } from '../services/storageService';
import ReactMarkdown from 'react-markdown';

interface AITrainerProps {
  user: UserProfile;
}

// --- Widget Components ---

const NutrientHighlightWidget: React.FC<{ data: any }> = ({ data }) => {
    const { label, current, target, unit, percentage, color } = data;
    
    const getColor = (c: string) => {
        switch(c) {
            case 'blue': return 'bg-blue-500 text-blue-500';
            case 'green': return 'bg-green-500 text-green-500';
            case 'yellow': return 'bg-yellow-500 text-yellow-500';
            case 'orange': return 'bg-orange-500 text-orange-500';
            default: return 'bg-brand-500 text-brand-500';
        }
    };
    
    const colorClass = getColor(color);
    const bgClass = colorClass.split(' ')[0];
    const textClass = colorClass.split(' ')[1];

    return (
        <div className="mt-3 mb-1 bg-dark-800/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 w-full max-w-xs animate-in slide-in-from-bottom-2 duration-500 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${bgClass} bg-opacity-20 flex items-center justify-center border border-white/5`}>
                    <div className={`w-4 h-4 rounded-full ${bgClass}`}></div>
                </div>
                <div>
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest leading-none mb-1">Target</p>
                    <p className="text-white font-bold text-lg leading-none">{label}</p>
                </div>
                <div className="ml-auto text-right">
                    <span className={`text-2xl font-black ${textClass} tracking-tight`}>{current}</span>
                    <span className="text-slate-500 text-[10px] font-bold uppercase ml-1">/ {target}{unit}</span>
                </div>
            </div>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <div className={`h-full ${bgClass} transition-all duration-1000 ease-out`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            </div>
        </div>
    );
};

const DailySummaryWidget: React.FC<{ data: any }> = ({ data }) => {
    const MacroRow = ({ label, current, max, color }: any) => (
        <div className="mb-3 last:mb-0">
            <div className="flex justify-between text-[10px] mb-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <span className="text-white font-bold">{current} / {max}</span>
            </div>
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${Math.min((current/max)*100, 100)}%` }}></div>
            </div>
        </div>
    );

    return (
        <div className="mt-3 mb-1 bg-dark-800/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 w-full max-w-xs animate-in zoom-in-95 duration-300 shadow-xl">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">Daily Fuel Status</h4>
            <MacroRow label="Calories" current={data.calories.current} max={data.calories.max} color="bg-orange-500" />
            <MacroRow label="Protein" current={data.protein.current} max={data.protein.max} color="bg-blue-500" />
            <MacroRow label="Carbs" current={data.carbs.current} max={data.carbs.max} color="bg-green-500" />
            <MacroRow label="Fats" current={data.fats.current} max={data.fats.max} color="bg-yellow-500" />
        </div>
    );
};

const MealCardWidget: React.FC<{ data: any }> = ({ data }) => {
    return (
        <div className="mt-3 mb-1 bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-4 w-full max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                 <h4 className="font-bold text-white text-base">{data.mealName}</h4>
                 <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-slate-300 uppercase">{data.time || 'LOGGED'}</span>
             </div>
             <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-black/30 p-2 rounded-lg text-center border border-white/5">
                    <span className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Cals</span>
                    <span className="text-white font-bold text-sm">{data.macros.calories}</span>
                </div>
                <div className="bg-blue-500/10 p-2 rounded-lg text-center border border-blue-500/10">
                    <span className="block text-[8px] text-blue-400 font-bold uppercase mb-0.5">Pro</span>
                    <span className="text-white font-bold text-sm">{data.macros.protein}</span>
                </div>
                <div className="bg-black/30 p-2 rounded-lg text-center border border-white/5">
                    <span className="block text-[8px] text-green-500 font-bold uppercase mb-0.5">Carb</span>
                    <span className="text-white font-bold text-sm">{data.macros.carbs}</span>
                </div>
                 <div className="bg-black/30 p-2 rounded-lg text-center border border-white/5">
                    <span className="block text-[8px] text-yellow-500 font-bold uppercase mb-0.5">Fat</span>
                    <span className="text-white font-bold text-sm">{data.macros.fats}</span>
                </div>
             </div>
             {data.items && (
                 <div className="space-y-1.5 bg-black/20 p-2.5 rounded-lg">
                     {data.items.map((item: string, idx: number) => (
                         <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                             <div className="w-1 h-1 bg-brand-500 rounded-full"></div>
                             {item}
                         </div>
                     ))}
                 </div>
             )}
        </div>
    );
};

// --- Main Component ---

export const AITrainer: React.FC<AITrainerProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', content: `Hello ${user.name}. I'm synced with your latest logs. How can I help you optimize today?`, type: 'text', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Settings State
  const [coachSettings, setCoachSettings] = useState<CoachSettings>({
      personality: 'Data Analyst',
      focus: 'General Wellness'
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, type: 'text', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const todayLog = getDailyLog(new Date().toISOString().split('T')[0]);
    
    // Prepare history without UI data for the LLM context
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const responseText = await chatWithTrainer(input, history, user, todayLog, coachSettings);

    // Parse Response for Widgets
    const widgetRegex = /\|\|\|WIDGET_START\|\|\|([\s\S]*?)\|\|\|WIDGET_END\|\|\|/;
    const match = responseText.match(widgetRegex);
    
    let cleanText = responseText;
    let widgetData: WidgetData | undefined = undefined;

    if (match && match[1]) {
        try {
            widgetData = JSON.parse(match[1]);
            cleanText = responseText.replace(match[0], '').trim();
        } catch (e) {
            console.error("Failed to parse widget JSON", e);
        }
    }

    const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: cleanText, 
        type: 'text', 
        widget: widgetData,
        timestamp: Date.now() 
    };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: "Analyze this workout video.", type: 'video', timestamp: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const analysis = await analyzeWorkoutVideo(base64);
          
          const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', content: analysis, type: 'text', timestamp: Date.now() };
          setMessages(prev => [...prev, aiMsg]);
          setIsTyping(false);
      };
      reader.readAsDataURL(file);
  };

  return (
    // Fixed layout container that fits in the layout slot
    // h-[calc(100vh-120px)] ensures it fits on mobile between header and bottom nav
    // md:h-[80vh] gives a nice distinct card look on desktop
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[80vh] w-full max-w-4xl mx-auto bg-dark-950 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand-500/5 blur-[80px] pointer-events-none z-0"></div>

        {/* Header Section */}
        <div className="flex-none px-6 py-4 border-b border-white/5 bg-dark-950/90 backdrop-blur-xl z-20 flex justify-between items-center relative">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-dark-800 to-black rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5.73C6.4 5.39 6 4.74 6 4a2 2 0 0 1 2-2h4z"></path><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path><line x1="12" y1="22" x2="12" y2="18"></line></svg>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-brand-500 border-2 border-black rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">Evolve Coach</h3>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest flex items-center gap-1">
                        {coachSettings.personality} • {coachSettings.focus}
                    </p>
                </div>
            </div>
            
            {/* Settings Toggle */}
            <div className="relative">
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${isSettingsOpen ? 'bg-white text-black border-white' : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white hover:border-white/10'}`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                </button>
                
                {/* Settings Dropdown */}
                {isSettingsOpen && (
                    <div className="absolute top-10 right-0 w-60 bg-dark-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Config</h4>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-brand-500 font-bold uppercase block mb-1.5">Personality</label>
                                <div className="space-y-1">
                                    {['Strict Sergeant', 'Empathetic Friend', 'Data Analyst'].map(mode => (
                                        <button 
                                            key={mode}
                                            onClick={() => setCoachSettings(prev => ({ ...prev, personality: mode as any }))}
                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${coachSettings.personality === mode ? 'bg-brand-500 text-black' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-blue-500 font-bold uppercase block mb-1.5">Focus Area</label>
                                <div className="space-y-1">
                                    {['Nutrition', 'Workouts', 'General Wellness'].map(focus => (
                                        <button 
                                            key={focus}
                                            onClick={() => setCoachSettings(prev => ({ ...prev, focus: focus as any }))}
                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${coachSettings.focus === focus ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            {focus}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6 relative z-10 scroll-smooth">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                    
                    {/* Role Label */}
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60 ${msg.role === 'user' ? 'mr-1 text-slate-400' : 'ml-1 text-brand-500'}`}>
                        {msg.role === 'user' ? 'You' : 'Coach'}
                    </span>

                    {/* Bubble */}
                    <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-md ${
                        msg.role === 'user' 
                        ? 'bg-gradient-to-br from-brand-600 to-brand-500 text-white rounded-tr-sm shadow-brand-500/10' 
                        : 'bg-dark-800 border border-white/5 text-slate-200 rounded-tl-sm shadow-black/20'
                    }`}>
                        {msg.type === 'video' && (
                            <div className="mb-3 flex items-center gap-3 bg-black/20 p-2.5 rounded-xl border border-white/5">
                                <span className="text-lg">📹</span> 
                                <span className="text-xs font-bold opacity-90">Video Analysis Uploaded</span>
                            </div>
                        )}
                        <ReactMarkdown className="prose prose-invert prose-sm max-w-none break-words">
                            {msg.content}
                        </ReactMarkdown>
                    </div>

                    {/* Widgets */}
                    {msg.widget && (
                        <div className="w-full flex justify-start pl-1 mt-1">
                            {msg.widget.type === 'nutrient_highlight' && <NutrientHighlightWidget data={msg.widget.data} />}
                            {msg.widget.type === 'daily_summary' && <DailySummaryWidget data={msg.widget.data} />}
                            {msg.widget.type === 'meal_card' && <MealCardWidget data={msg.widget.data} />}
                        </div>
                    )}
                    
                    {/* Timestamp */}
                    <span className={`text-[9px] text-slate-600 font-medium mt-1 mx-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="ml-1 bg-dark-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-white/5 flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-200"></span>
                    </div>
                </div>
            )}
            
            {/* Scroll Anchor */}
            <div ref={scrollRef} className="h-2"></div>
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 md:p-6 bg-dark-950 z-20">
            {/* Quick Chips */}
            {messages.length < 3 && (
                <div className="flex justify-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                     {["🥩 Protein Check", "🥗 Analyze Lunch", "📉 Progress Update"].map((text) => (
                        <button key={text} onClick={() => setInput(text)} className="flex-shrink-0 whitespace-nowrap text-[10px] font-bold bg-dark-800 border border-white/10 px-3 py-1.5 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors hover:border-white/20">
                            {text}
                        </button>
                     ))}
                </div>
            )}

            <div className="flex items-center gap-3 bg-dark-900 border border-white/10 rounded-full p-1.5 pl-4 shadow-xl focus-within:border-brand-500/50 focus-within:ring-1 focus-within:ring-brand-500/10 transition-all duration-300">
                <button onClick={() => fileRef.current?.click()} className="text-slate-500 hover:text-brand-500 transition-colors p-1.5 hover:bg-white/5 rounded-full" title="Upload Video">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask your coach..." 
                    className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm font-medium h-10"
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${input.trim() ? 'bg-brand-500 text-black hover:bg-brand-400 hover:scale-105' : 'bg-dark-800 text-slate-600 cursor-not-allowed'}`}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
            <input type="file" ref={fileRef} accept="video/*" className="hidden" onChange={handleVideoUpload} />
        </div>
    </div>
  );
};
