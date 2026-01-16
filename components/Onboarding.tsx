import React, { useState } from 'react';
import { UserProfile, Gender, Goal, ActivityLevel, DietPreference } from '../types';
import { calculateTargets, saveUserProfile } from '../services/storageService';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

// Visual Assets Mapping
const STEP_IMAGES: Record<number, string> = {
    1: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80", // Identity/Gym
    2: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1000&q=80", // Measurements
    3: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1000&q=80", // Activity
    4: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1000&q=80"  // Nutrition
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: undefined,
    height: 175,
    currentWeight: undefined,
    goalWeight: undefined,
    gender: undefined,
    activity: undefined,
    experience: undefined,
    goal: undefined,
    diet: undefined
  });

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = () => {
    if (!formData.name || !formData.age || !formData.gender || !formData.goal) return;
    const targets = calculateTargets(
      formData.age!,
      formData.gender!,
      formData.height!,
      formData.currentWeight!,
      formData.activity!,
      formData.goal!
    );
    const fullProfile: UserProfile = {
      ...(formData as UserProfile),
      createdAt: new Date().toISOString(),
      targets
    };
    saveUserProfile(fullProfile);
    onComplete(fullProfile);
  };

  // Styles
  const labelClass = "text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-2 block";
  const inputClass = "w-full bg-dark-800/80 backdrop-blur-sm border border-white/10 text-white p-4 rounded-xl text-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none placeholder-slate-600 transition-all";
  const btnClass = "w-full py-4 bg-brand-500 hover:bg-brand-400 text-black font-bold text-lg rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.2)]";

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">
       
       {/* MOBILE/TABLET BACKGROUND: Visible only on screens < lg */}
       <div className="absolute inset-0 lg:hidden z-0">
           {/* Dark Overlay for Readability */}
           <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-10"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10"></div>
           
           {/* Background Image with Key for Animation */}
           <img 
               key={step} 
               src={STEP_IMAGES[step]} 
               className="w-full h-full object-cover animate-in fade-in duration-1000" 
               alt="Background"
           />
       </div>

       {/* LEFT SIDE: Form & Interaction */}
       <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 relative z-10 lg:bg-black">
          
          {/* Progress Header */}
          <div className="mb-12">
              <div className="flex gap-2 mb-6">
                 {[1,2,3,4].map(i => (
                     <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-700 ${step >= i ? 'bg-brand-500' : 'bg-dark-800'}`}></div>
                 ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2 animate-in slide-in-from-bottom-2 duration-500">
                 {step === 1 && "The Genesis."}
                 {step === 2 && "The Blueprint."}
                 {step === 3 && "The Engine."}
                 {step === 4 && "The Strategy."}
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-sm leading-relaxed">
                 {step === 1 && "Identity is the first step to transformation. Let's start with who you are."}
                 {step === 2 && "Precision inputs lead to precision outputs. We need your exact metrics."}
                 {step === 3 && "How much fuel does your engine burn? Accuracy here defines your deficit."}
                 {step === 4 && "Nutrition is 80% of the game. Let's design your nutritional protocol."}
              </p>
          </div>

          <div className="w-full max-w-md mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-4 duration-500 key={step}">
              {step === 1 && (
                 <div className="space-y-6">
                     <div>
                         <label className={labelClass}>First Name</label>
                         <input type="text" className={inputClass} value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="Enter your name" autoFocus />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className={labelClass}>Gender</label>
                             <div className="flex gap-2">
                                 {[Gender.Male, Gender.Female].map(g => (
                                     <button key={g} onClick={() => handleChange('gender', g)} 
                                        className={`flex-1 py-4 rounded-xl font-bold border transition-colors ${formData.gender === g ? 'bg-brand-500 text-black border-brand-500' : 'bg-dark-800/50 text-slate-400 border-white/10 hover:border-white/30'}`}>
                                         {g}
                                     </button>
                                 ))}
                             </div>
                         </div>
                         <div>
                             <label className={labelClass}>Age</label>
                             <input type="number" className={inputClass} value={formData.age || ''} onChange={e => handleChange('age', Number(e.target.value))} placeholder="25" />
                         </div>
                     </div>
                     <button disabled={!formData.name || !formData.age || !formData.gender} onClick={handleNext} className={btnClass}>Initialize Profile →</button>
                 </div>
              )}

              {step === 2 && (
                 <div className="space-y-8">
                     <div>
                         <label className={labelClass}>Height: <span className="text-white text-lg">{formData.height} cm</span></label>
                         <input type="range" min="140" max="220" value={formData.height} onChange={e => handleChange('height', Number(e.target.value))} className="w-full accent-brand-500 h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer" />
                         <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                             <span>140cm</span>
                             <span>220cm</span>
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                         <div>
                             <label className={labelClass}>Current (kg)</label>
                             <div className="relative">
                                 <input type="number" className={inputClass} value={formData.currentWeight || ''} onChange={e => handleChange('currentWeight', Number(e.target.value))} placeholder="0" />
                                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">KG</span>
                             </div>
                         </div>
                         <div>
                             <label className={labelClass}>Goal (kg)</label>
                             <div className="relative">
                                 <input type="number" className={inputClass} value={formData.goalWeight || ''} onChange={e => handleChange('goalWeight', Number(e.target.value))} placeholder="0" />
                                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">KG</span>
                             </div>
                         </div>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={handleBack} className="w-1/3 text-slate-500 font-bold hover:text-white transition-colors">Back</button>
                        <button disabled={!formData.currentWeight || !formData.goalWeight} onClick={handleNext} className={btnClass}>Next Step →</button>
                     </div>
                 </div>
              )}

              {step === 3 && (
                 <div className="space-y-4">
                     <div>
                         <label className={labelClass}>Activity Level</label>
                         <div className="space-y-2">
                             {Object.values(ActivityLevel).map(level => {
                                let desc = '';
                                switch(level) {
                                    case ActivityLevel.Sedentary: desc = 'Desk job, no intentional exercise.'; break;
                                    case ActivityLevel.LightlyActive: desc = 'Walking or light exercise 1-3 days/week.'; break;
                                    case ActivityLevel.ModeratelyActive: desc = 'Gym/Sports 3-5 days/week (Most Common).'; break;
                                    case ActivityLevel.VeryActive: desc = 'Physical job + training OR 2x daily training.'; break;
                                }
                                return (
                                 <button key={level} onClick={() => handleChange('activity', level)}
                                     className={`w-full p-4 rounded-xl text-left border transition-all flex justify-between items-center group ${formData.activity === level ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-white/5 bg-dark-800/50 text-slate-400 hover:bg-dark-800'}`}>
                                     <div>
                                         <div className="font-bold text-sm">{level}</div>
                                         <div className="text-xs opacity-60 mt-0.5 font-medium">{desc}</div>
                                     </div>
                                     <div className={`w-4 h-4 rounded-full border-2 ${formData.activity === level ? 'border-brand-500 bg-brand-500' : 'border-slate-600'}`}></div>
                                 </button>
                                )
                             })}
                         </div>
                     </div>
                     <div className="flex gap-4 mt-6">
                        <button onClick={handleBack} className="w-1/3 text-slate-500 font-bold hover:text-white transition-colors">Back</button>
                        <button disabled={!formData.activity} onClick={handleNext} className={btnClass}>Next Step →</button>
                     </div>
                 </div>
              )}

              {step === 4 && (
                 <div className="space-y-6">
                     <div>
                         <label className={labelClass}>Primary Goal</label>
                         <div className="grid grid-cols-1 gap-2">
                             {Object.values(Goal).map(g => (
                                 <button key={g} onClick={() => handleChange('goal', g)}
                                     className={`p-4 rounded-xl border font-bold text-sm text-left transition-all flex justify-between items-center ${formData.goal === g ? 'border-brand-500 bg-brand-500/10 text-brand-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-white/5 bg-dark-800/50 text-slate-400 hover:bg-dark-800'}`}>
                                     {g}
                                     {formData.goal === g && <span className="text-lg">✓</span>}
                                 </button>
                             ))}
                         </div>
                     </div>
                     <div>
                         <label className={labelClass}>Diet Preference</label>
                         <div className="grid grid-cols-3 gap-2">
                             {Object.values(DietPreference).map(d => (
                                 <button key={d} onClick={() => handleChange('diet', d)}
                                     className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.diet === d ? 'border-brand-500 bg-brand-500/10 text-white scale-105 shadow-lg' : 'border-white/5 bg-dark-800/50 text-slate-400 hover:bg-dark-800'}`}>
                                     <span className="text-2xl">{d === 'Vegetarian' ? '🥦' : d === 'Eggitarian' ? '🥚' : '🍗'}</span>
                                     <span className="text-[9px] font-bold uppercase tracking-wide">{d}</span>
                                 </button>
                             ))}
                         </div>
                     </div>
                     <div className="flex gap-4 pt-4">
                        <button onClick={handleBack} className="w-1/3 text-slate-500 font-bold hover:text-white transition-colors">Back</button>
                        <button disabled={!formData.goal || !formData.diet} onClick={handleSubmit} className={btnClass}>Build My Plan</button>
                     </div>
                 </div>
              )}
          </div>
          
          {/* Trusted By Footer (Visible on Left) */}
          <div className="mt-12 flex items-center gap-4 opacity-60 max-w-md mx-auto lg:mx-0">
                <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-slate-700 overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} className="w-full h-full object-cover grayscale" />
                        </div>
                    ))}
                </div>
                <div>
                    <p className="text-white font-bold text-xs">Trusted by 50,000+ Members</p>
                    <p className="text-[10px] text-slate-500">Join the fastest growing fitness AI.</p>
                </div>
          </div>
       </div>

       {/* RIGHT SIDE: Dynamic Image Showcase (Desktop Only) */}
       <div className="hidden lg:block w-1/2 relative bg-dark-900 overflow-hidden">
           <div className="absolute inset-0">
                <img 
                   key={step} 
                   src={STEP_IMAGES[step]} 
                   className="w-full h-full object-cover opacity-60 animate-in fade-in zoom-in-105 duration-1000" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                
                <div className="absolute bottom-20 left-12 max-w-lg z-10">
                    <h2 className="text-5xl font-black text-white italic mb-4 leading-tight drop-shadow-2xl">
                       {step === 1 && "BEGIN YOUR LEGACY."}
                       {step === 2 && "PRECISION IS POWER."}
                       {step === 3 && "DEFINE YOUR PACE."}
                       {step === 4 && "FUEL WITH PURPOSE."}
                    </h2>
                    <p className="text-xl text-slate-200 font-light border-l-4 border-brand-500 pl-6 bg-black/40 backdrop-blur-md py-4 pr-4 rounded-r-xl">
                       "EvolveFit AI doesn't just track numbers. It understands your biology and adapts to your lifestyle."
                    </p>
                </div>
           </div>
       </div>

    </div>
  );
};
