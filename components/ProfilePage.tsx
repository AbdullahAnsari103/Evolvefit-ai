import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Goal, ActivityLevel, DietPreference, Gender } from '../types';
import { calculateTargets, saveUserProfile } from '../services/storageService';

interface ProfilePageProps {
  user: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
  onAdminEnter?: () => void;
  onLogout?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate, onAdminEnter, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(user);
  
  // Default Settings if not present
  const [settings, setSettings] = useState({
      notifications: user.settings?.notifications ?? true,
      publicProfile: user.settings?.publicProfile ?? false,
      dataSharing: user.settings?.dataSharing ?? true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync settings changes to formData immediately when they change
  useEffect(() => {
      setFormData(prev => ({
          ...prev,
          settings: settings
      }));
  }, [settings]);

  // Persist settings changes immediately
  useEffect(() => {
      if (!isEditing) {
          const updatedProfile = { ...user, settings: settings };
          saveUserProfile(updatedProfile);
      }
  }, [settings, isEditing, user]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result as string;
        setFormData(prev => ({ ...prev, avatar: newAvatar }));
        
        // Immediate save for avatar
        const updated = { ...user, avatar: newAvatar };
        saveUserProfile(updated);
        onUpdate(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSetting = (key: keyof typeof settings) => {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // Recalculate targets based on new data
    const newTargets = calculateTargets(
        formData.age,
        formData.gender,
        formData.height,
        formData.currentWeight,
        formData.activity,
        formData.goal
    );

    const updatedProfile: UserProfile = {
        ...formData,
        settings: settings, // Ensure latest settings are included
        targets: newTargets
    };

    saveUserProfile(updatedProfile);
    onUpdate(updatedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
      setFormData(user);
      setIsEditing(false);
  };

  // UI Helpers
  const StatInput = ({ label, field, unit, type = "number" }: any) => (
      <div className="bg-dark-800 border border-white/10 rounded-2xl p-4 relative group focus-within:border-brand-500 transition-colors">
          <label className="text-[10px] uppercase text-slate-500 font-bold block mb-2">{label}</label>
          <div className="flex items-baseline gap-2">
              <input 
                type={type} 
                value={(formData as any)[field]} 
                onChange={e => handleChange(field, type === 'number' ? Number(e.target.value) : e.target.value)} 
                className="w-full bg-transparent text-white font-black text-xl outline-none"
              />
              <span className="text-xs font-bold text-slate-600">{unit}</span>
          </div>
          <div className="absolute top-2 right-2 text-brand-500 opacity-0 group-focus-within:opacity-100 transition-opacity">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
      </div>
  );

  const StatDisplay = ({ label, value, icon, unit }: any) => (
    <div className="bg-dark-800 border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-brand-500/30 transition-colors group">
        <div className="flex justify-between items-start">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${icon ? 'bg-brand-500/10 text-brand-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {icon || '⚡'}
            </div>
        </div>
        <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className="text-white font-black text-2xl group-hover:text-brand-500 transition-colors">
                {value} <span className="text-sm font-medium text-slate-500">{unit}</span>
            </p>
        </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        
        {/* Profile Header */}
        <div className="relative flex flex-col items-center">
             {/* Glow Effect */}
             <div className="absolute top-0 w-64 h-64 bg-brand-500/20 blur-[80px] rounded-full pointer-events-none"></div>

             {/* Avatar */}
             <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-32 h-32 rounded-full border-4 border-dark-800 shadow-2xl overflow-hidden relative z-10">
                     <img 
                        src={formData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200"} 
                        className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" 
                     />
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                     </div>
                 </div>
                 {user.targets.calories > 0 && (
                     <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-500 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full z-20 shadow-lg border-2 border-dark-900 whitespace-nowrap">
                        {user.experience} Athlete
                     </div>
                 )}
                 <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
             </div>

             {/* Name & Identity */}
             <div className="mt-6 text-center w-full max-w-sm">
                 {isEditing ? (
                     <div className="space-y-4">
                        <input 
                            type="text" 
                            value={formData.name} 
                            onChange={e => handleChange('name', e.target.value)}
                            className="w-full bg-transparent text-center text-2xl font-bold text-white border-b border-white/20 focus:border-brand-500 outline-none pb-1"
                            placeholder="Your Name"
                        />
                     </div>
                 ) : (
                    <h1 className="text-2xl font-bold text-white mb-1">{formData.name}</h1>
                 )}
                 <p className="text-slate-500 text-sm">@{formData.name.toLowerCase().replace(/\s/g, '_')} • Joined {new Date(user.createdAt).getFullYear()}</p>
             </div>
             
             {isEditing ? (
                 <div className="w-full max-w-lg mt-6 animate-in slide-in-from-top-2">
                     <label className="text-[10px] uppercase text-slate-500 font-bold block mb-2 text-center">Specific Descriptions & Bio</label>
                     <textarea 
                        value={formData.bio || ''}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Tell your AI coach about specific injuries, food allergies, schedule constraints, or equipment availability..."
                        className="w-full bg-dark-800 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 min-h-[120px] resize-none"
                     />
                 </div>
             ) : (
                 <div className="mt-4 max-w-md text-center">
                    <p className="text-slate-300 text-sm leading-relaxed italic bg-white/5 px-6 py-3 rounded-2xl border border-white/5 inline-block">
                        "{formData.bio || "No specific details added. Edit profile to add injuries, preferences, or goals."}"
                    </p>
                 </div>
             )}

             <div className="flex gap-4 mt-6">
                {isEditing && (
                    <button 
                        onClick={handleCancel}
                        className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest bg-dark-800 text-slate-400 border border-white/10 hover:bg-dark-700 transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${isEditing ? 'bg-brand-500 text-black hover:bg-brand-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                >
                    {isEditing ? 'Save Profile' : 'Edit Details'}
                </button>
             </div>
        </div>

        {/* Physical Stats Grid */}
        <div>
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-lg font-bold text-white">Vitals & Measurements</h3>
                {isEditing && <span className="text-xs text-brand-500 animate-pulse bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">Editing Mode</span>}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {isEditing ? (
                    <>
                         <StatInput label="Current Weight" field="currentWeight" unit="kg" />
                         <StatInput label="Goal Weight" field="goalWeight" unit="kg" />
                         <StatInput label="Height" field="height" unit="cm" />
                         <StatInput label="Age" field="age" unit="yrs" />
                         <div className="col-span-2 md:col-span-4 bg-dark-800 border border-white/10 rounded-2xl p-4">
                             <label className="text-[10px] uppercase text-slate-500 font-bold block mb-2">Biological Sex</label>
                             <div className="flex gap-2">
                                 {[Gender.Male, Gender.Female].map(g => (
                                     <button 
                                        key={g} 
                                        onClick={() => handleChange('gender', g)}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${formData.gender === g ? 'bg-brand-500 text-black border-brand-500' : 'bg-dark-900 text-slate-400 border-white/5 hover:bg-dark-700'}`}
                                     >
                                         {g}
                                     </button>
                                 ))}
                             </div>
                         </div>
                    </>
                ) : (
                    <>
                        <StatDisplay label="Current Weight" value={formData.currentWeight} unit="kg" icon="⚖️" />
                        <StatDisplay label="Goal Weight" value={formData.goalWeight} unit="kg" icon="🎯" />
                        <StatDisplay label="Height" value={formData.height} unit="cm" icon="📏" />
                        <StatDisplay label="BMI" value={(formData.currentWeight / ((formData.height/100) ** 2)).toFixed(1)} unit="" icon="🩺" />
                    </>
                )}
            </div>
        </div>
        
        {/* Calculated Targets Preview (Non-Editable) */}
        {!isEditing && (
            <div className="bg-gradient-to-r from-dark-800 to-dark-900 border border-white/10 rounded-3xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Your AI Macro Split</h3>
                    <span className="text-[10px] text-brand-500 font-bold bg-brand-500/10 px-2 py-1 rounded uppercase">Daily Targets</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-black/20 rounded-2xl p-4 text-center border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Calories</p>
                        <p className="text-3xl font-black text-white">{user.targets.calories}</p>
                    </div>
                    <div className="bg-blue-500/10 rounded-2xl p-4 text-center border border-blue-500/10">
                        <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Protein</p>
                        <p className="text-2xl font-black text-white">{user.targets.protein}<span className="text-sm font-medium text-slate-400">g</span></p>
                    </div>
                    <div className="bg-green-500/10 rounded-2xl p-4 text-center border border-green-500/10">
                        <p className="text-[10px] text-green-400 uppercase font-bold mb-1">Carbs</p>
                        <p className="text-2xl font-black text-white">{user.targets.carbs}<span className="text-sm font-medium text-slate-400">g</span></p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-2xl p-4 text-center border border-yellow-500/10">
                        <p className="text-[10px] text-yellow-400 uppercase font-bold mb-1">Fats</p>
                        <p className="text-2xl font-black text-white">{user.targets.fats}<span className="text-sm font-medium text-slate-400">g</span></p>
                    </div>
                </div>
                <div className="mt-4 text-center">
                    <p className="text-xs text-slate-500 italic">Daily Step Target: <span className="font-bold text-white">{user.targets.steps.toLocaleString()} steps</span></p>
                </div>
            </div>
        )}

        {/* Strategy & Preferences */}
        <div className="bg-dark-900 border border-white/5 rounded-3xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-6">Strategy & Preferences</h3>
            
            <div className="space-y-4">
                {/* Diet */}
                <div className="flex items-center justify-between p-4 bg-dark-800 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                           {formData.diet === 'Vegetarian' ? '🥦' : formData.diet === 'Eggitarian' ? '🥚' : '🍗'}
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Dietary Preference</p>
                            <p className="text-slate-500 text-xs">{isEditing ? 'Select your type' : formData.diet}</p>
                        </div>
                    </div>
                    {isEditing ? (
                        <select value={formData.diet} onChange={e => handleChange('diet', e.target.value)} className="bg-dark-900 text-white text-xs p-2 rounded-lg border border-white/10 focus:border-brand-500 outline-none">
                             {Object.values(DietPreference).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    ) : (
                         <span className="text-slate-400">›</span>
                    )}
                </div>

                {/* Goal */}
                <div className="flex items-center justify-between p-4 bg-dark-800 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                           🎯
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Primary Goal</p>
                            <p className="text-slate-500 text-xs">{isEditing ? 'What are we aiming for?' : formData.goal}</p>
                        </div>
                    </div>
                    {isEditing ? (
                        <select value={formData.goal} onChange={e => handleChange('goal', e.target.value)} className="bg-dark-900 text-white text-xs p-2 rounded-lg border border-white/10 focus:border-brand-500 outline-none">
                             {Object.values(Goal).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    ) : (
                         <span className="text-slate-400">›</span>
                    )}
                </div>

                {/* Experience */}
                <div className="flex items-center justify-between p-4 bg-dark-800 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                           🏋️
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Experience Level</p>
                            <p className="text-slate-500 text-xs">{isEditing ? 'How experienced are you?' : formData.experience || 'Beginner'}</p>
                        </div>
                    </div>
                    {isEditing ? (
                        <select value={formData.experience} onChange={e => handleChange('experience', e.target.value)} className="bg-dark-900 text-white text-xs p-2 rounded-lg border border-white/10 focus:border-brand-500 outline-none">
                             {['Beginner', 'Intermediate', 'Advanced'].map(exp => <option key={exp} value={exp}>{exp}</option>)}
                        </select>
                    ) : (
                         <span className="text-slate-400">›</span>
                    )}
                </div>

                {/* Activity */}
                <div className="flex items-center justify-between p-4 bg-dark-800 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                           🔥
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Activity Level</p>
                            <p className="text-slate-500 text-xs">{isEditing ? 'How active are you?' : formData.activity}</p>
                        </div>
                    </div>
                     {isEditing ? (
                        <select value={formData.activity} onChange={e => handleChange('activity', e.target.value)} className="bg-dark-900 text-white text-xs p-2 rounded-lg border border-white/10 focus:border-brand-500 outline-none max-w-[150px]">
                             {Object.values(ActivityLevel).map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    ) : (
                         <span className="text-slate-400">›</span>
                    )}
                </div>
            </div>
        </div>

        {/* Account & Settings */}
        <div>
            <h3 className="text-lg font-bold text-white mb-4 px-2">Account & Privacy</h3>
            <div className="bg-dark-900 border border-white/5 rounded-3xl overflow-hidden">
                
                {/* Notifications */}
                <div className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleSetting('notifications')}>
                    <div className="flex items-center gap-3">
                         <span className="text-slate-400">🔔</span>
                         <div>
                            <span className="text-white font-medium text-sm block">Notifications</span>
                            <span className="text-[10px] text-slate-500">Receive daily reminders and goal alerts</span>
                         </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.notifications ? 'bg-brand-500' : 'bg-dark-600'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.notifications ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                </div>

                {/* Public Profile */}
                <div className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleSetting('publicProfile')}>
                    <div className="flex items-center gap-3">
                         <span className="text-slate-400">🌎</span>
                         <div>
                            <span className="text-white font-medium text-sm block">Public Profile</span>
                            <span className="text-[10px] text-slate-500">Visible on community leaderboards</span>
                         </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.publicProfile ? 'bg-brand-500' : 'bg-dark-600'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.publicProfile ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                </div>

                 {/* Privacy & Security */}
                 <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                         <span className="text-slate-400">🔒</span>
                         <div>
                            <span className="text-white font-medium text-sm block">Password & Security</span>
                            <span className="text-[10px] text-slate-500">Manage your account access</span>
                         </div>
                    </div>
                    <button className="text-[10px] font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 group-hover:text-white group-hover:bg-white/10 transition-colors">
                        Change Password
                    </button>
                </div>
            </div>
            
            {/* Admin Entry Point - ONLY VISIBLE IF IS_ADMIN FLAG IS TRUE */}
            {onAdminEnter && user.isAdmin && (
                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={onAdminEnter}
                        className="bg-dark-800 border border-brand-500/30 text-brand-500 hover:bg-brand-500 hover:text-black font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.1)] flex items-center gap-2"
                    >
                        <span className="text-lg">🛡️</span>
                        Enter Admin Portal
                    </button>
                </div>
            )}
        </div>

        <div className="text-center pt-8">
             <button 
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
             >
                Log Out
             </button>
             <p className="text-[10px] text-slate-600 mt-4">Version 1.2.0 • EvolveFit AI</p>
        </div>

    </div>
  );
};
