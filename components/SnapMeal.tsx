"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { analyzeFoodImage } from "../services/geminiService"
import type { MealLog, MacroBreakdown } from "../types"
import { saveMealLog } from "../services/storageService"

export const SnapMeal: React.FC = () => {
  const [image, setImage] = useState<string | null>(null)
  const [voiceContext, setVoiceContext] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysisStep, setAnalysisStep] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [result, setResult] = useState<Partial<MealLog> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Analysis Animation Loop
  useEffect(() => {
    let interval: any
    if (analyzing) {
      setProgress(0)
      const steps = [
        "Calibrating container size...",
        "Mapping ingredient density...",
        "Detecting Indian spices...",
        "Measuring oil saturation...",
        "Finalizing macro count...",
      ]
      let stepIndex = 0
      setAnalysisStep(steps[0])

      interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1.5, 98)) // Slower, detailed progress
        if (Math.random() > 0.85) {
          stepIndex = (stepIndex + 1) % steps.length
          setAnalysisStep(steps[stepIndex])
        }
      }, 100)
    } else {
      setProgress(100)
    }
    return () => clearInterval(interval)
  }, [analyzing])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
        setResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const startVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser. Please use Chrome.")
      return
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = "en-IN"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setVoiceContext((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }

    recognition.start()
  }

  const handleAnalyze = async () => {
    if (!image) return
    setAnalyzing(true)
    try {
      const base64 = image.split(",")[1]
      const data = await analyzeFoodImage(base64, voiceContext)

      setResult({
        name: data.name,
        description: data.description,
        macros: data.macros,
        confirmed: false,
      })
    } catch (e) {
      alert("AI Analysis failed. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = () => {
    if (!result || !result.macros) return

    try {
      const meal: MealLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        name: result.name || "Unknown Meal",
        description: result.description,
        imageUrl: image || undefined,
        macros: result.macros as MacroBreakdown,
        confirmed: true,
      }

      saveMealLog(meal)

      // Success Feedback
      alert(`Successfully logged ${meal.name}! (+${meal.macros.calories} kcal)`)

      // Reset State
      setImage(null)
      setResult(null)
      setVoiceContext("")
    } catch (error) {
      console.error(error)
      alert("Failed to save meal. Please ensure you are logged in.")
    }
  }

  // --- STATE 1: CAMERA SCANNER (Before Image) ---
  if (!image) {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-dark-800 animate-in fade-in duration-700">
        {/* Camera Viewfinder Simulation */}
        <div className="absolute inset-0 bg-dark-900 flex items-center justify-center overflow-hidden">
          {/* Fake Camera Feed Background */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-20 blur-xl"></div>

          {/* Scanning Grid Animation */}
          <div
            className="absolute inset-0 z-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34, 197, 94, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.2) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          ></div>

          <p className="text-brand-500 font-mono text-sm z-10 animate-pulse tracking-widest uppercase font-bold drop-shadow-lg">
            Initializing Neural Vision...
          </p>
        </div>

        {/* Active Scanner Overlay */}
        <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-between pointer-events-none z-10">
          {/* Top Corners */}
          <div className="flex justify-between">
            <div className="w-16 h-16 border-l-4 border-t-4 border-white rounded-tl-3xl shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
            <div className="w-16 h-16 border-r-4 border-t-4 border-white rounded-tr-3xl shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
          </div>

          {/* Central Focus Area & Scanner Line */}
          <div className="flex-1 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-brand-500/50"></div>

            {/* Simulated "Detected" Tags */}
            <div className="absolute top-[25%] left-[15%] bg-black/80 backdrop-blur-md border border-brand-500/70 px-3 py-1 rounded-full flex items-center gap-2 animate-in fade-in zoom-in duration-700 delay-500">
              <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Surface Analysis</span>
            </div>

            <div className="absolute bottom-[25%] right-[15%] bg-black/80 backdrop-blur-md border border-brand-500/70 px-3 py-1 rounded-full flex items-center gap-2 animate-in fade-in zoom-in duration-700 delay-1000">
              <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Depth Map</span>
            </div>

            {/* Scanning Laser Line (Gradient Beam) */}
            <div className="absolute left-0 right-0 h-32 bg-gradient-to-b from-brand-500/0 via-brand-500/30 to-brand-500/0 animate-scan-beam"></div>
            <div className="absolute left-0 right-0 h-0.5 bg-brand-500 shadow-[0_0_20px_rgba(34,197,94,1)] animate-scan-line"></div>
          </div>

          {/* Bottom Corners */}
          <div className="flex justify-between">
            <div className="w-16 h-16 border-l-4 border-b-4 border-white rounded-bl-3xl shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
            <div className="w-16 h-16 border-r-4 border-b-4 border-white rounded-br-3xl shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between z-20 pointer-events-auto">
          <button
            className="w-12 h-12 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            <div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition-transform"></div>
          </button>

          <button className="w-12 h-12 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        <style
          dangerouslySetInnerHTML={{
            __html: `
                @keyframes scan-line {
                    0% { top: 10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
                @keyframes scan-beam {
                     0% { top: 5%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 85%; opacity: 0; }
                }
                .animate-scan-line {
                    animation: scan-line 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .animate-scan-beam {
                    animation: scan-beam 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
            `,
          }}
        />
      </div>
    )
  }

  // --- STATE 2: PROCESSING (Futuristic DNA) ---
  if (analyzing) {
    return (
      <div className="h-[calc(100vh-140px)] bg-black rounded-3xl flex flex-col items-center justify-center relative overflow-hidden border border-brand-500/40">
        {/* Background Radar Effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-[500px] h-[500px] border border-brand-500/10 rounded-full absolute animate-ping opacity-20"
            style={{ animationDuration: "3s" }}
          ></div>
          <div
            className="w-[350px] h-[350px] border border-brand-500/15 rounded-full absolute animate-ping opacity-30"
            style={{ animationDuration: "2s", animationDelay: "0.5s" }}
          ></div>
        </div>

        {/* DNA Double Helix Animation */}
        <div className="relative z-10 mb-12 scale-125">
          <div className="w-40 h-40 rounded-full bg-black border-2 border-brand-500/40 flex items-center justify-center relative shadow-[0_0_60px_rgba(34,197,94,0.25)] backdrop-blur-sm">
            <div
              className="absolute inset-0 border-t-2 border-b-2 border-brand-500/50 rounded-full animate-spin"
              style={{ animationDuration: "4s" }}
            ></div>

            {/* DNA SVG */}
            <svg
              width="60"
              height="100"
              viewBox="0 0 60 100"
              className="text-brand-500 drop-shadow-[0_0_15px_rgba(34,197,94,1)]"
            >
              <path
                d="M10,0 Q50,25 10,50 T10,100"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeOpacity="0.9"
                className="animate-pulse"
              >
                <animate
                  attributeName="d"
                  values="M10,0 Q50,25 10,50 T10,100; M50,0 Q10,25 50,50 T50,100; M10,0 Q50,25 10,50 T10,100"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
              <path
                d="M50,0 Q10,25 50,50 T50,100"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeOpacity="0.6"
              >
                <animate
                  attributeName="d"
                  values="M50,0 Q10,25 50,50 T50,100; M10,0 Q50,25 10,50 T10,100; M50,0 Q10,25 50,50 T50,100"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
              {/* Connecting Lines (Simulated Rungs) */}
              <line x1="10" y1="25" x2="50" y2="25" stroke="currentColor" strokeWidth="2" opacity="0.8">
                <animate attributeName="x1" values="10;50;10" dur="2s" repeatCount="indefinite" />
                <animate attributeName="x2" values="50;10;50" dur="2s" repeatCount="indefinite" />
              </line>
              <line x1="10" y1="75" x2="50" y2="75" stroke="currentColor" strokeWidth="2" opacity="0.8">
                <animate attributeName="x1" values="10;50;10" dur="2s" repeatCount="indefinite" />
                <animate attributeName="x2" values="50;10;50" dur="2s" repeatCount="indefinite" />
              </line>
            </svg>
          </div>
        </div>

        <div className="relative z-10 text-center space-y-4 max-w-xs w-full px-6">
          <h2 className="text-4xl font-black text-white tracking-tight animate-pulse drop-shadow-lg">
            Identifying
            <br />
            Components...
          </h2>

          {/* Dynamic Step Text */}
          <div className="h-6 flex items-center justify-center">
            <span
              className="text-brand-500 text-sm font-bold uppercase tracking-[0.15em] animate-in fade-in slide-in-from-bottom-2 drop-shadow-md"
              key={analysisStep}
            >
              {analysisStep}
            </span>
          </div>

          {/* High Tech Progress Bar */}
          <div className="w-full bg-black h-1.5 rounded-full overflow-hidden border border-white/30 mt-6 relative shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex justify-between w-full text-[10px] text-slate-300 font-bold uppercase tracking-widest px-1">
            <span>Neural Engine</span>
            <span>{Math.round(progress)}%</span>
          </div>

          {/* Pills */}
          <div className="flex justify-center gap-2 mt-4 pt-4">
            {["Texture", "Volume", "Spices"].map((pill, i) => (
              <span
                key={pill}
                className="text-[10px] text-brand-400 border border-brand-500/30 px-2 py-1 rounded bg-brand-500/10"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {pill} OK
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- STATE 3: REVIEW & CONFIRM ---
  return (
    <div className="max-w-xl mx-auto space-y-4 animate-in slide-in-from-bottom duration-500">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-dark-700 bg-dark-800 group h-[400px]">
        <img
          src={image || "/placeholder.svg"}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent"></div>

        {/* AR Overlay Tag */}
        {result && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-4 h-4 bg-brand-500 rounded-full animate-ping absolute opacity-50"></div>
            <div className="w-3 h-3 bg-brand-500 rounded-full border-2 border-white shadow-[0_0_20px_rgba(34,197,94,1)] relative z-10"></div>
            <div className="mt-4 bg-black/60 backdrop-blur-md border border-brand-500/30 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mb-1">Identified</p>
              <p className="text-white font-bold text-sm">{result.name}</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6">
          {!result && (
            <div className="space-y-4">
              {/* Voice Context Input */}
              <div className="relative">
                <div
                  className={`absolute inset-0 bg-brand-500/10 blur-xl rounded-full transition-opacity duration-300 ${isListening ? "opacity-100" : "opacity-0"}`}
                ></div>
                <div className="relative flex items-center bg-dark-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pr-14 shadow-xl">
                  <input
                    type="text"
                    placeholder="Add context (e.g. 'extra ghee', '2 rotis')"
                    value={voiceContext}
                    onChange={(e) => setVoiceContext(e.target.value)}
                    className="w-full bg-transparent text-white text-sm placeholder-slate-400 focus:outline-none px-3"
                  />
                  <button
                    onClick={startVoiceInput}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-dark-800 text-brand-500 hover:bg-brand-500 hover:text-black"}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                className="w-full bg-brand-500 text-black font-black uppercase tracking-wide py-4 rounded-2xl text-sm hover:bg-brand-400 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M2 12h20M2 12c0 5.5 4.5 10 10 10s10-4.5 10-10M2 12C2 6.5 6.5 2 12 2s10 4.5 10 10" />
                </svg>
                Analyze Nutrition
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Card */}
      {result && (
        <div className="bg-dark-800 rounded-3xl p-6 border border-brand-500/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-black text-white italic">{result.name}</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">{result.description}</p>
            </div>
            <div className="bg-brand-500/10 text-brand-500 text-[10px] font-black px-2 py-1 rounded border border-brand-500/20">
              AI CONFIDENCE 98%
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-8">
            {["calories", "protein", "carbs", "fats"].map((macro) => (
              <div
                key={macro}
                className="bg-dark-900 rounded-2xl p-3 text-center border border-white/5 relative group focus-within:border-brand-500 transition-colors"
              >
                <span className="text-[8px] text-slate-500 uppercase font-black block mb-1 tracking-wider">
                  {macro.substr(0, 3)}
                </span>
                <input
                  type="number"
                  value={result.macros?.[macro as keyof MacroBreakdown] || 0}
                  onChange={(e) =>
                    setResult({ ...result, macros: { ...result.macros!, [macro]: Number(e.target.value) } })
                  }
                  className="w-full bg-transparent text-center font-black text-white text-lg focus:outline-none"
                />
                {macro === "calories" && <span className="text-[8px] text-slate-600 block">kcal</span>}
                {macro !== "calories" && <span className="text-[8px] text-slate-600 block">g</span>}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setImage(null)
                setResult(null)
              }}
              className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-colors uppercase text-xs tracking-widest"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] py-4 bg-brand-500 text-black font-black rounded-2xl hover:bg-brand-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] uppercase text-xs tracking-widest flex items-center justify-center gap-2"
            >
              <span>Confirm & Log</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
