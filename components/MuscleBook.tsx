import React, { useState, useEffect } from 'react';
import { MuscleBookContext, TrainingEnvironment, TrainingSplit, MuscleData, MuscleChapter } from '../types';
import { saveMuscleBookContext, getMusclesForSplit, getMuscleChapter } from '../services/storageService';

// --- SUB-COMPONENT: REALISTIC 3D ANATOMY MAP ---
interface AnatomyMapProps {
    muscles: MuscleData[];
    onSelect: (muscleId: string) => void;
    selectedId: string | null;
}

const AnatomyMap: React.FC<AnatomyMapProps> = ({ muscles, onSelect, selectedId }) => {
    const [view, setView] = useState<'front' | 'back'>('front');

    const getMuscleData = (id: string) => muscles.find(m => m.id === id);

    // Helper for interactive paths
    const MusclePath = ({ id, d, opacity = 1, label }: { id: string, d: string, opacity?: number, label?: string }) => {
        const muscle = getMuscleData(id);
        const isSelected = selectedId === id;
        const isRelevant = !!muscle;
        
        // Complex gradient logic for realism
        const fill = isSelected 
            ? "url(#activeMuscleGradient)" 
            : isRelevant 
                ? `url(#skinMuscleGradient)` 
                : "#e5e5e5";

        return (
            <g className={`transition-all duration-300 ease-out ${
                isRelevant 
                ? 'cursor-pointer hover:filter hover:brightness-110 hover:drop-shadow-lg group' 
                : 'cursor-default'
            } ${isSelected ? 'z-20 relative' : 'z-10'}`}
            onClick={(e) => {
                e.stopPropagation();
                if (isRelevant) onSelect(id);
            }}>
                <path 
                    d={d}
                    fill={fill}
                    stroke={isSelected ? "#000" : isRelevant ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)"}
                    strokeWidth={isSelected ? 1.5 : 0.5}
                    filter={isRelevant ? "url(#muscleVolume)" : "none"}
                    style={{ fillOpacity: isRelevant ? 1 : 0.4 }}
                />
                {/* Texture Overlay */}
                {isRelevant && (
                    <path d={d} fill="url(#fiberPattern)" fillOpacity="0.3" pointerEvents="none" />
                )}
            </g>
        );
    };

    return (
        <div className="relative h-[800px] w-full flex flex-col items-center justify-center select-none p-4 overflow-hidden rounded-[2.5rem] bg-[#F8F9FA] border border-[#E2E8F0] shadow-inner">
            
            {/* View Switcher */}
            <div className="absolute top-6 right-6 z-30 flex bg-white rounded-full p-1 shadow-lg border border-black/5">
                <button 
                    onClick={() => setView('front')}
                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${view === 'front' ? 'bg-black text-white shadow-md' : 'text-slate-400 hover:text-black'}`}
                >
                    Anterior
                </button>
                <button 
                    onClick={() => setView('back')}
                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${view === 'back' ? 'bg-black text-white shadow-md' : 'text-slate-400 hover:text-black'}`}
                >
                    Posterior
                </button>
            </div>

            {/* 3D Model SVG - Medical Grade Paths */}
            <svg viewBox="0 0 400 900" className="h-full w-full max-w-[400px] z-10 drop-shadow-2xl">
                <defs>
                    {/* Active State - Glowing Fiber */}
                    <radialGradient id="activeMuscleGradient" cx="50%" cy="30%" r="80%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#991b1b" />
                    </radialGradient>

                    {/* Realistic Skin/Muscle Tone */}
                    <linearGradient id="skinMuscleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#eec0a5" /> 
                        <stop offset="50%" stopColor="#dcb095" />
                        <stop offset="100%" stopColor="#cfa38d" />
                    </linearGradient>

                    {/* Muscle Fiber Texture Pattern */}
                    <pattern id="fiberPattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="4" x2="4" y2="0" stroke="#8B4513" strokeWidth="0.5" strokeOpacity="0.2" />
                    </pattern>

                    {/* 3D Volume Filter (Specular Lighting) */}
                    <filter id="muscleVolume">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
                        <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.8" specularExponent="15" lightingColor="#ffffff" result="specOut">
                            <fePointLight x="-5000" y="-10000" z="20000" />
                        </feSpecularLighting>
                        <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
                        <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                    </filter>
                </defs>

                {/* --- ANTERIOR VIEW (FRONT) --- */}
                {view === 'front' && (
                    <g transform="translate(0, 20)">
                        {/* HEAD BASE */}
                        <path d="M170,20 C150,30 150,70 160,90 L175,110 L225,110 L240,90 C250,70 250,30 230,20 C215,5 185,5 170,20" fill="#e2dccf" stroke="#d6d3ce" strokeWidth="1" />

                        {/* NECK */}
                        <MusclePath id="neck" d="M175,110 Q185,125 195,140 L185,145 L165,120 Z" />
                        <MusclePath id="neck" d="M225,110 Q215,125 205,140 L215,145 L235,120 Z" />

                        {/* TRAPS */}
                        <MusclePath id="traps" d="M165,120 L130,135 Q145,145 160,140 Z" />
                        <MusclePath id="traps" d="M235,120 L270,135 Q255,145 240,140 Z" />

                        {/* SHOULDERS */}
                        <MusclePath id="delts_side" d="M130,135 C115,145 110,165 115,190 Q125,185 135,175 Z" />
                        <MusclePath id="delts_front" d="M135,175 Q130,150 160,145 L145,195 Q130,185 135,175 Z" />
                        
                        <MusclePath id="delts_side" d="M270,135 C285,145 290,165 285,190 Q275,185 265,175 Z" />
                        <MusclePath id="delts_front" d="M265,175 Q270,150 240,145 L255,195 Q270,185 265,175 Z" />

                        {/* CHEST */}
                        {/* Upper */}
                        <MusclePath id="chest_upper" d="M200,145 L160,145 Q155,160 160,170 L200,165 Z" />
                        <MusclePath id="chest_upper" d="M200,145 L240,145 Q245,160 240,170 L200,165 Z" />
                        {/* Mid */}
                        <MusclePath id="chest_mid" d="M200,165 L160,170 Q155,190 165,200 L200,195 Z" />
                        <MusclePath id="chest_mid" d="M200,165 L240,170 Q245,190 235,200 L200,195 Z" />
                        {/* Lower */}
                        <MusclePath id="chest_lower" d="M200,195 L165,200 Q170,215 185,220 L200,215 Z" />
                        <MusclePath id="chest_lower" d="M200,195 L235,200 Q230,215 215,220 L200,215 Z" />

                        {/* ARMS: Biceps */}
                        <MusclePath id="biceps" d="M145,195 Q135,215 140,240 L160,235 Q165,210 160,195 Z" />
                        <MusclePath id="biceps" d="M255,195 Q265,215 260,240 L240,235 Q235,210 240,195 Z" />

                        {/* ARMS: Forearms */}
                        <MusclePath id="forearms" d="M140,240 Q120,260 125,300 L145,295 Q150,260 155,240 Z" />
                        <MusclePath id="forearms" d="M260,240 Q280,260 275,300 L255,295 Q250,260 245,240 Z" />

                        {/* ABS - Defined Six Pack */}
                        {/* Upper */}
                        <MusclePath id="abs" d="M185,220 L215,220 L213,245 L187,245 Z" />
                        {/* Mid 1 */}
                        <MusclePath id="abs" d="M187,247 L213,247 L212,270 L188,270 Z" />
                        {/* Mid 2 */}
                        <MusclePath id="abs" d="M189,272 L211,272 L210,295 L190,295 Z" />
                        {/* Lower */}
                        <MusclePath id="abs" d="M190,297 L210,297 L208,325 L192,325 Z" />

                        {/* Obliques */}
                        <MusclePath id="abs" d="M185,220 Q170,240 175,280 L188,285 L185,220 Z" />
                        <MusclePath id="abs" d="M175,280 Q178,310 192,325 L188,270 Z" />
                        
                        <MusclePath id="abs" d="M215,220 Q230,240 225,280 L212,285 L215,220 Z" />
                        <MusclePath id="abs" d="M225,280 Q222,310 208,325 L212,270 Z" />

                        {/* LEGS: Quads - Anatomically Separated & Detailed */}
                        
                        {/* --- LEFT LEG (Viewer's Left) --- */}
                        {/* Gap Fix: Ensure X coords stay < 195 */}
                        {/* Rectus Femoris (Center) */}
                        <MusclePath id="quads" d="M165,330 L185,330 L180,450 Q175,460 170,450 Z" />
                        {/* Vastus Lateralis (Outer Sweep) */}
                        <MusclePath id="quads" d="M165,330 Q130,380 145,450 L160,460 L170,450 L165,330 Z" />
                        {/* Vastus Medialis (Teardrop) */}
                        <MusclePath id="quads" d="M180,420 Q195,440 180,460 L170,450 L180,420 Z" />
                        {/* Sartorius/Adductors (Inner Filler - Skin Color BG) */}
                        <path d="M185,330 L195,350 L180,420 L180,330 Z" fill="#dcb095" fillOpacity="0.5" />

                        {/* --- RIGHT LEG (Viewer's Right) --- */}
                        {/* Gap Fix: Ensure X coords stay > 205 */}
                        {/* Rectus Femoris (Center) */}
                        <MusclePath id="quads" d="M235,330 L215,330 L220,450 Q225,460 230,450 Z" />
                        {/* Vastus Lateralis (Outer Sweep) */}
                        <MusclePath id="quads" d="M235,330 Q270,380 255,450 L240,460 L230,450 L235,330 Z" />
                        {/* Vastus Medialis (Teardrop) */}
                        <MusclePath id="quads" d="M220,420 Q205,440 220,460 L230,450 L220,420 Z" />
                        {/* Sartorius/Adductors (Inner Filler - Skin Color BG) */}
                        <path d="M215,330 L205,350 L220,420 L220,330 Z" fill="#dcb095" fillOpacity="0.5" />

                        {/* LEGS: Calves */}
                        <MusclePath id="calves" d="M150,490 Q140,530 150,580 L170,590 L175,490 Z" />
                        <MusclePath id="calves" d="M250,490 Q260,530 250,580 L230,590 L225,490 Z" />
                    </g>
                )}

                {/* --- POSTERIOR VIEW (BACK) --- */}
                {view === 'back' && (
                    <g transform="translate(0, 20)">
                        {/* Base Body Silhouette (for arms to sit on) */}
                        <path d="M130,135 L120,180 L115,250 L125,260 L140,250 L155,200 L160,140 Z" fill="#dcb095" stroke="none" opacity="0.8" />
                        <path d="M270,135 L280,180 L285,250 L275,260 L260,250 L245,200 L240,140 Z" fill="#dcb095" stroke="none" opacity="0.8" />

                        {/* Head */}
                        <path d="M170,20 C150,30 150,70 160,90 L175,110 L225,110 L240,90 C250,70 250,30 230,20 C215,5 185,5 170,20" fill="#e2dccf" stroke="#d6d3ce" strokeWidth="1" />

                        {/* TRAPS */}
                        <MusclePath id="traps" d="M175,110 L140,125 L160,150 L200,200 L240,150 L260,125 L225,110 L200,120 Z" />

                        {/* SHOULDERS (Rear Delt) */}
                        <MusclePath id="delts_rear" d="M140,125 Q120,140 130,165 L155,150 Z" />
                        <MusclePath id="delts_rear" d="M260,125 Q280,140 270,165 L245,150 Z" />

                        {/* BACK */}
                        <MusclePath id="mid_back" d="M160,150 L145,185 L200,200 L190,160 Z" />
                        <MusclePath id="mid_back" d="M240,150 L255,185 L200,200 L210,160 Z" />
                        <MusclePath id="lats" d="M145,185 L135,250 Q150,300 200,310 L200,200 Z" />
                        <MusclePath id="lats" d="M255,185 L265,250 Q250,300 200,310 L200,200 Z" />

                        {/* ARMS: TRICEPS - Detailed Horseshoe */}
                        {/* LEFT ARM */}
                        {/* Lateral Head (Outer) */}
                        <MusclePath id="triceps" d="M130,165 Q125,190 135,210 L145,215 L150,180 Z" />
                        {/* Long Head (Inner) */}
                        <MusclePath id="triceps" d="M150,180 L145,215 L155,220 L160,180 Z" />
                        {/* Tendon Plate (Connection) */}
                        <path d="M135,210 L145,215 L155,220 L145,230 Z" fill="#e5e5e5" opacity="0.8" />

                        {/* RIGHT ARM */}
                        {/* Lateral Head (Outer) */}
                        <MusclePath id="triceps" d="M270,165 Q275,190 265,210 L255,215 L250,180 Z" />
                        {/* Long Head (Inner) */}
                        <MusclePath id="triceps" d="M250,180 L255,215 L245,220 L240,180 Z" />
                        {/* Tendon Plate */}
                        <path d="M265,210 L255,215 L245,220 L255,230 Z" fill="#e5e5e5" opacity="0.8" />

                        {/* LOWER BACK */}
                        <MusclePath id="lower_back" d="M190,310 L180,340 L200,350 L220,340 L210,310 Z" />

                        {/* GLUTES */}
                        <MusclePath id="glutes" d="M160,310 Q130,340 160,390 L200,390 L200,330 Z" />
                        <MusclePath id="glutes" d="M240,310 Q270,340 240,390 L200,390 L200,330 Z" />

                        {/* HAMSTRINGS */}
                        <MusclePath id="hamstrings" d="M160,390 Q150,450 170,480 L195,470 L190,400 Z" />
                        <MusclePath id="hamstrings" d="M240,390 Q250,450 230,480 L205,470 L210,400 Z" />

                        {/* CALVES */}
                        <MusclePath id="calves" d="M170,490 Q150,520 165,560 L185,570 Q190,530 185,500 Z" />
                        <MusclePath id="calves" d="M230,490 Q250,520 235,560 L215,570 Q210,530 215,500 Z" />
                    </g>
                )}
            </svg>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const MuscleBook: React.FC = () => {
    const [context, setContext] = useState<MuscleBookContext | null>(null);
    const [activeMuscleId, setActiveMuscleId] = useState<string | null>(null);
    const [chapterData, setChapterData] = useState<MuscleChapter | null>(null);
    const [muscleMetadata, setMuscleMetadata] = useState<MuscleData | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [showDetails, setShowDetails] = useState(false);

    // Auto-open details when a muscle is selected
    useEffect(() => {
        if (activeMuscleId && context) {
            const meta = getMusclesForSplit(context.split).find(m => m.id === activeMuscleId);
            const chapter = getMuscleChapter(activeMuscleId);
            setMuscleMetadata(meta || null);
            setChapterData(chapter);
            setPageNumber(Math.floor(Math.random() * 50) + 10);
            
            // Trigger animation
            setShowDetails(false);
            setTimeout(() => setShowDetails(true), 100);
        }
    }, [activeMuscleId, context]);

    const handleSaveContext = (split: TrainingSplit, environment: TrainingEnvironment) => {
        const newCtx = { split, environment };
        saveMuscleBookContext(newCtx);
        setContext(newCtx);
        setActiveMuscleId(null);
    };

    const toggleEnvironment = () => {
        if (!context) return;
        const newEnv = context.environment === 'Gym' ? 'Home' : 'Gym';
        handleSaveContext(context.split, newEnv);
    };

    const openVideo = (url: string) => {
        if (url) {
            // Direct open to bypass embed restrictions
            window.open(url, '_blank');
        } else {
            alert('Video guide unavailable for this exercise.');
        }
    };

    if (!context) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] font-serif p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-700 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
                <div className="max-w-md w-full border-8 double-border border-[#8B7E66] p-12 bg-[#FDFBF7] shadow-2xl relative">
                    <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#B89E68]"></div>
                    <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#B89E68]"></div>
                    <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#B89E68]"></div>
                    <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#B89E68]"></div>

                    <h1 className="text-5xl font-serif font-black text-[#2C2C2C] mb-4 tracking-widest uppercase">Anatomia</h1>
                    <div className="h-px w-32 bg-[#8B7E66] mx-auto mb-4"></div>
                    <p className="text-[#8B7E66] text-xs font-bold uppercase tracking-[0.4em] mb-12">Atlas of Strength</p>

                    <div className="space-y-8">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-[#B89E68] mb-6">Choose Your Path</p>
                            <div className="grid grid-cols-2 gap-4">
                                {['Push', 'Pull', 'Legs', 'Full Body'].map(split => (
                                    <button 
                                        key={split}
                                        onClick={() => handleSaveContext(split as TrainingSplit, 'Gym')}
                                        className="border border-[#D4C5A9] py-4 px-2 hover:bg-[#E5E0D6] transition-colors font-serif text-lg font-bold text-[#4A4A4A] uppercase bg-[#FDFBF7] shadow-sm hover:shadow-md"
                                    >
                                        {split}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const availableMuscles = getMusclesForSplit(context.split);

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] pb-20 animate-in fade-in duration-500 font-serif bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
            {/* Ancient Header */}
            <div className="sticky top-0 z-50 bg-[#FDFBF7]/95 backdrop-blur-sm border-b-4 border-double border-[#D4C5A9] px-6 py-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setContext(null)}
                        className="text-[#8B7E66] hover:text-[#5C5343] transition-colors"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    </button>
                    <div>
                        <h2 className="font-serif font-bold text-2xl leading-none tracking-wide">Tome of {context.split}</h2>
                        <p className="text-[10px] uppercase tracking-widest text-[#B89E68] mt-1 italic">Page {pageNumber} • Edition I</p>
                    </div>
                </div>
                
                {/* Environment Toggle - Ink Style */}
                <div 
                    onClick={toggleEnvironment}
                    className="flex items-center bg-[#E5E0D6] rounded-sm px-1 cursor-pointer border border-[#8B7E66] w-36 relative h-10 shadow-inner"
                >
                    <div className={`absolute top-1 bottom-1 w-[48%] bg-[#FDFBF7] shadow-md transition-all duration-300 border border-[#D4C5A9] ${context.environment === 'Gym' ? 'left-[50%]' : 'left-1'}`}></div>
                    <span className={`flex-1 text-center text-xs font-bold z-10 uppercase transition-colors tracking-wider ${context.environment === 'Home' ? 'text-black' : 'text-[#A09580]'}`}>Home</span>
                    <span className={`flex-1 text-center text-xs font-bold z-10 uppercase transition-colors tracking-wider ${context.environment === 'Gym' ? 'text-black' : 'text-[#A09580]'}`}>Gym</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 min-h-[calc(100vh-100px)] p-4 md:p-8">
                
                {/* LEFT PAGE: ANATOMY */}
                <div className="relative border-r-0 lg:border-r border-[#D4C5A9] pr-0 lg:pr-12">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center opacity-50 mb-4 pointer-events-none">
                        <span className="font-serif text-4xl text-[#D4C5A9] font-bold block">FIG. I</span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-[#8B7E66]">Musculature</span>
                    </div>
                    
                    <AnatomyMap 
                        muscles={availableMuscles} 
                        onSelect={(id) => setActiveMuscleId(id)}
                        selectedId={activeMuscleId}
                    />
                    
                    <p className="text-center text-xs text-[#8B7E66] italic mt-4 font-serif">"Touch the fibers to reveal their secrets"</p>
                </div>

                {/* RIGHT PAGE: CONTENT */}
                <div className="relative pl-0 lg:pl-4">
                    {activeMuscleId && muscleMetadata && chapterData ? (
                        <div className="relative z-10 animate-in slide-in-from-right-8 duration-700 key={activeMuscleId} flex flex-col h-full">
                            {/* Ink Header */}
                            <div className="mb-4 border-b-2 border-[#2C2C2C] pb-6">
                                <h1 className="text-6xl font-serif font-black text-[#2C2C2C] mb-2 leading-none uppercase tracking-tighter">{muscleMetadata.name}</h1>
                                <p className="text-[#8B7E66] font-serif italic text-xl">{muscleMetadata.scientificName}</p>
                            </div>

                            {/* Exercises Section */}
                            <div className="flex-1">
                                <div className="mb-6 bg-[#E5E0D6] p-4 border-l-4 border-[#8B7E66] rounded-r-sm shadow-sm">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#8B0000] mb-2">Training Logic</h4>
                                    <p className="text-sm font-serif italic leading-relaxed text-[#4A4A4A]">
                                        "Exercises marked as <strong className='text-black not-italic'>Compound</strong> are primary mass builders and are often interchangeable. Select <span className="underline decoration-1 decoration-[#8B7E66]">one Compound</span> and <span className="underline decoration-1 decoration-[#8B7E66]">one Isolation</span> movement per session for optimal hypertrophy without redundancy."
                                    </p>
                                </div>

                                <div className="flex justify-between items-end mb-8">
                                    <h3 className="font-serif text-3xl font-bold italic">The Regimen</h3>
                                    <span className="bg-[#2C2C2C] text-[#FDFBF7] px-4 py-1 text-xs font-bold uppercase tracking-widest">
                                        {context.environment} Protocol
                                    </span>
                                </div>

                                <div className="space-y-8">
                                    {(context.environment === 'Gym' ? chapterData.gymExercises : chapterData.homeExercises).map((ex, idx) => (
                                        <div key={ex.id} className="border-2 border-[#D4C5A9] p-6 bg-[#FDFBF7] shadow-[5px_5px_0px_rgba(212,197,169,0.5)] relative group hover:border-[#8B7E66] transition-colors">
                                            {/* Category Badge */}
                                            <div className="absolute top-0 right-0">
                                                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-b border-l border-[#D4C5A9] ${ex.category === 'Compound' ? 'bg-[#2C2C2C] text-[#FDFBF7]' : 'bg-[#E5E0D6] text-[#5C5343]'}`}>
                                                    {ex.category}
                                                </span>
                                            </div>

                                            {/* Roman Numeral */}
                                            <div className="absolute -left-4 -top-4 w-10 h-10 bg-[#2C2C2C] text-[#FDFBF7] flex items-center justify-center font-serif font-bold text-xl border-4 border-[#FDFBF7]">
                                                {idx === 0 ? 'I' : idx === 1 ? 'II' : 'III'}
                                            </div>

                                            <div className="flex justify-between items-start mb-6 pl-4 pt-2">
                                                <div>
                                                    <h4 className="font-bold text-2xl text-[#2C2C2C] mb-2">{ex.name}</h4>
                                                    <div className="flex gap-2">
                                                        {ex.equipment.map(eq => (
                                                            <span key={eq} className="text-[10px] uppercase tracking-wider border border-[#8B7E66] px-2 py-0.5 text-[#5C5343]">{eq}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-right mt-6">
                                                    <p className="text-3xl font-serif font-bold text-[#8B7E66]">{ex.sets} x {ex.reps}</p>
                                                </div>
                                            </div>

                                            {/* Cues */}
                                            <div className="mb-4 font-serif text-sm italic text-[#5C5343] border-t border-[#E5E0D6] pt-3">
                                                <p><strong>Technique:</strong> {ex.cues.join('. ')}.</p>
                                            </div>

                                            {/* Direct Video Link */}
                                            {ex.videoUrl && (
                                                <button 
                                                    onClick={() => openVideo(ex.videoUrl!)}
                                                    className="w-full py-3 border border-[#2C2C2C] text-[#2C2C2C] font-bold uppercase tracking-widest text-xs hover:bg-[#2C2C2C] hover:text-[#FDFBF7] transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                                                    Watch Tutorial
                                                </button>
                                            )}

                                            {/* --- SMART ALTERNATIVES (GYM ONLY) --- */}
                                            {context.environment === 'Gym' && chapterData.homeExercises[idx] && (
                                                <div className="mt-6 bg-[#E5E0D6] p-4 border-l-4 border-[#8B7E66] animate-in fade-in duration-500">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#8B7E66] flex items-center gap-1">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                                            Machine Busy / No Equipment?
                                                        </h5>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-[#2C2C2C] text-sm">Try: {chapterData.homeExercises[idx].name}</p>
                                                            <p className="text-[10px] text-[#5C5343]">Requires: {chapterData.homeExercises[idx].equipment.join(', ')}</p>
                                                        </div>
                                                        {chapterData.homeExercises[idx].videoUrl && (
                                                            <button 
                                                                onClick={() => openVideo(chapterData.homeExercises[idx].videoUrl!)}
                                                                className="bg-white border border-[#D4C5A9] px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide hover:bg-[#FDFBF7] flex items-center gap-1 text-[#5C5343]"
                                                            >
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                                Watch How-To
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Collapsible Clinical Notes (Below Exercises) - ANIMATED */}
                            <div className={`mt-8 border-t-2 border-[#D4C5A9] overflow-hidden transition-all duration-700 ease-in-out ${showDetails ? 'max-h-[600px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-10'}`}>
                                <div className="pt-8 pb-4">
                                    <h4 className="text-xl font-serif font-bold text-[#8B0000] italic mb-6 flex items-center gap-2">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        Clinical Notes & Biomechanics
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-serif text-sm leading-relaxed text-[#4A4A4A]">
                                        <div className="bg-[#F5F0E6] p-6 rounded-lg border border-[#D4C5A9] shadow-sm">
                                            <h5 className="text-xs font-bold uppercase tracking-widest text-[#2C2C2C] mb-3 border-b border-[#D4C5A9] pb-1">Primary Function</h5>
                                            <p className="italic">"{muscleMetadata.function}."</p>
                                            <div className="mt-4 pt-4 border-t border-[#D4C5A9]">
                                                <h5 className="text-xs font-bold uppercase tracking-widest text-[#2C2C2C] mb-2">Target Specifics</h5>
                                                <p>{muscleMetadata.targetDetails}</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#F5F0E6] p-6 rounded-lg border border-[#D4C5A9] shadow-sm">
                                            <h5 className="text-xs font-bold uppercase tracking-widest text-[#8B0000] mb-3 border-b border-[#D4C5A9] pb-1">Common Pathology</h5>
                                            <ul className="list-disc list-inside space-y-1">
                                                {muscleMetadata.mistakes.map((m, i) => <li key={i}>{m}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        // Empty State
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-12 border-4 border-dashed border-[#D4C5A9]">
                            <h3 className="font-serif text-4xl font-bold text-[#8B7E66] mb-4">Awaiting Input</h3>
                            <p className="text-lg font-serif italic">Select a muscle group from the anatomical chart to begin your study.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
