"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { UserProfile, WorkoutPlan, MealPlan } from "../types"
import { generatePlan } from "../services/geminiService"

// --- PERSISTENCE HELPERS ---
const STORAGE_KEYS = {
  WORKOUT: "evolvefit_cached_workout",
  MEAL: "evolvefit_cached_meal",
}

const getCached = (key: string) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

const setCached = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn("Cache failed", e)
  }
}

// --- WORKOUT PLAN COMPONENT ---

export const WorkoutPlanPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [workoutData, setWorkoutData] = useState<WorkoutPlan | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [activeDay, setActiveDay] = useState<number>(0)

  useEffect(() => {
    const cached = getCached(STORAGE_KEYS.WORKOUT)
    if (cached && cached.schedule) {
      setWorkoutData(cached)
    }
  }, [])

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const data = await generatePlan("workout", user)
      if (!data || !data.schedule || data.schedule.length === 0) {
        throw new Error("Invalid plan generated")
      }
      setWorkoutData(data)
      setCached(STORAGE_KEYS.WORKOUT, data)
      setActiveDay(0)
    } catch (e) {
      console.error(e)
      alert("Failed to generate plan. AI server might be busy. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleWatchVideo = (url: string) => {
    if (!url || url.trim() === "") {
      alert("No video tutorial available for this exercise. Please check back later.")
      return
    }

    // Ensure valid YouTube URL format
    let videoUrl = url?.trim() || ""
    if (!videoUrl) {
      alert("No video tutorial available for this exercise. Please check back later.")
      return
    }

    if (!videoUrl.includes("http")) {
      videoUrl = `https://www.youtube.com/watch?v=${videoUrl}`
    }

    // Validate it's a YouTube URL
    if (!videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be")) {
      console.warn("[v0] Invalid YouTube URL:", videoUrl)
      alert("Invalid video link. Please contact support.")
      return
    }

    console.log("[v0] Opening video:", videoUrl)
    window.open(videoUrl, "_blank", "noopener,noreferrer")
  }

  if (!workoutData || !workoutData.schedule) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500 py-20">
        <div className="relative mb-8 group cursor-pointer" onClick={handleGenerate}>
          <div className="absolute inset-0 bg-blue-500/30 blur-[40px] rounded-full group-hover:bg-blue-500/50 transition-all duration-700"></div>
          <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-dark-800 to-black border border-blue-500/30 flex items-center justify-center text-6xl shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-300">
            ⚡
          </div>
        </div>
        <h1 className="text-5xl font-black text-white uppercase italic mb-6 tracking-tight">Plan Training with AI</h1>
        <p className="text-slate-400 max-w-lg mb-10 text-lg leading-relaxed">
          Generate a hyper-personalized <strong>{user.experience}</strong> split (like PPL or Upper/Lower) tailored
          specifically to your <strong>{user.goal}</strong> goal and lifestyle.
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black py-5 px-12 rounded-2xl text-xl transition-all shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-3"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              DESIGNING PROTOCOL...
            </>
          ) : (
            <>
              BUILD MY ROUTINE
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </>
          )}
        </button>
      </div>
    )
  }

  // Safety check for activeDay validity
  const currentDay = workoutData.schedule[activeDay] || workoutData.schedule[0]

  return (
    <div className="animate-in slide-in-from-bottom duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 shadow-lg shadow-blue-500/10">
              {user.goal} Protocol
            </span>
            <span className="bg-white/5 text-slate-300 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10">
              {workoutData.schedule.length} Day Split
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 leading-none mb-4">
            {workoutData.splitName}
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed border-l-4 border-blue-600 pl-6">
            {workoutData.overview}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            className="bg-dark-800 hover:bg-dark-700 border border-white/10 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all hover:border-white/30 flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            REGENERATE
          </button>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex overflow-x-auto gap-4 pb-6 mb-2 no-scrollbar snap-x">
        {workoutData.schedule.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setActiveDay(idx)}
            className={`flex-shrink-0 snap-start px-6 py-5 rounded-3xl border-2 transition-all duration-300 min-w-[160px] text-left relative overflow-hidden group ${
              activeDay === idx
                ? "bg-blue-600 border-blue-600 text-white shadow-[0_10px_40px_rgba(37,99,235,0.3)] scale-105"
                : "bg-dark-800 border-white/5 text-slate-500 hover:bg-dark-700 hover:text-white hover:border-white/20"
            }`}
          >
            <p className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-[0.2em]">{day.day}</p>
            <p className="font-bold text-xl leading-none">{day.focus}</p>
            {activeDay === idx && (
              <div className="absolute top-0 right-0 p-3 text-white/20">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Exercises List */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="bg-gradient-to-r from-blue-900/20 to-transparent p-8 rounded-[2rem] border border-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>
          <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3 relative z-10">
            <span className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-sm text-black shadow-lg">
              🚀
            </span>
            {currentDay.focus} Session
          </h3>
          <p className="text-slate-300 text-sm max-w-2xl relative z-10">{currentDay.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {currentDay.exercises.map((exercise, idx) => (
            <div
              key={idx}
              className="bg-dark-800 p-6 md:p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden hover:bg-dark-800/80"
            >
              {/* Bg Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                {/* Number */}
                <div className="hidden md:flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-dark-900 border border-white/10 text-slate-600 font-black text-2xl group-hover:text-blue-500 group-hover:border-blue-500/30 transition-colors shadow-inner">
                  {idx + 1}
                </div>

                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {exercise.name}
                    </h4>
                    <span className="md:hidden text-4xl font-black text-white/5">{idx + 1}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-black/40 px-4 py-3 rounded-2xl border border-white/10 text-center group-hover:border-white/20 transition-colors">
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Sets</p>
                      <p className="text-white font-black text-xl">{exercise.sets}</p>
                    </div>
                    <div className="bg-black/40 px-4 py-3 rounded-2xl border border-white/10 text-center group-hover:border-white/20 transition-colors">
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Reps</p>
                      <p className="text-white font-black text-xl">{exercise.reps}</p>
                    </div>
                    <div className="bg-black/40 px-4 py-3 rounded-2xl border border-white/10 text-center group-hover:border-white/20 transition-colors">
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Rest</p>
                      <p className="text-white font-black text-xl">{exercise.rest}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-1 bg-white/5 border-l-2 border-blue-500 pl-4 py-3 rounded-r-xl">
                      <p className="text-sm text-slate-300 italic leading-relaxed">
                        <span className="text-blue-400 font-bold not-italic text-xs uppercase tracking-wider block mb-1">
                          Pro Tip
                        </span>
                        "{exercise.tips}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto self-center mt-4 md:mt-0">
                  <button
                    onClick={() => handleWatchVideo(exercise.youtubeUrl)}
                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white px-8 py-5 rounded-2xl font-black text-sm transition-all shadow-xl shadow-red-600/10 hover:shadow-red-600/30 group/btn hover:-translate-y-1"
                  >
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    WATCH TUTORIAL
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- MEAL PLAN COMPONENT ---

export const MealPlanPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [mealData, setMealData] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null)

  useEffect(() => {
    const cached = getCached(STORAGE_KEYS.MEAL)
    if (cached && cached.meals) {
      setMealData(cached)
    }
  }, [])

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const data = await generatePlan("meal", user)
      if (!data || !data.meals || data.meals.length === 0) {
        throw new Error("Invalid meal plan generated")
      }
      const processedData = {
        ...data,
        title: data.title || "Daily Meal Plan",
        totalMacros: {
          calories: data.totalCalories || 0,
          protein: data.totalProtein || 0,
          carbs: data.totalCarbs || 0,
          fats: data.totalFats || 0,
        },
        meals: data.meals.map((meal: any) => ({
          ...meal,
          type: meal.type || "Meal",
          name: meal.name || "Untitled Meal",
          macros: meal.macros || { calories: 0, protein: 0, carbs: 0, fats: 0 },
          ingredients: meal.ingredients || [],
          instructions: meal.instructions || "No instructions available",
          prepTime: meal.prepTime || "15 mins",
        })),
      }
      setMealData(processedData)
      setCached(STORAGE_KEYS.MEAL, processedData)
      setExpandedMeal(null)
    } catch (e) {
      console.error(e)
      alert("Failed to generate plan. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleMeal = (idx: number) => {
    setExpandedMeal(expandedMeal === idx ? null : idx)
  }

  if (!mealData || !mealData.meals) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500 py-20">
        <div className="relative mb-8 group cursor-pointer" onClick={handleGenerate}>
          <div className="absolute inset-0 bg-orange-500/30 blur-[40px] rounded-full group-hover:bg-orange-500/50 transition-all duration-700"></div>
          <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-dark-800 to-black border border-orange-500/30 flex items-center justify-center text-6xl shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-300">
            🥗
          </div>
        </div>
        <h1 className="text-5xl font-black text-white uppercase italic mb-6 tracking-tight">Plan Meal with AI</h1>
        <p className="text-slate-400 max-w-lg mb-10 text-lg leading-relaxed">
          Generate a strictly <strong>Indian Home-Cooked (Ghar ka Khana)</strong> plan. Calorie-matched to your{" "}
          <strong>{user.targets.calories} kcal</strong> target with realistic ingredients and macro breakdown.
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-400 text-black font-black py-5 px-12 rounded-2xl text-xl transition-all shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:shadow-[0_0_60px_rgba(249,115,22,0.6)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-3"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-6 w-6 text-black" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              CALCULATING MACROS...
            </>
          ) : (
            <>
              GENERATE MENU
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </>
          )}
        </button>
      </div>
    )
  }

  const totalMacros = mealData.totalMacros || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  }

  return (
    <div className="animate-in slide-in-from-bottom duration-500 pb-20">
      {/* Top Summary Card */}
      <div className="relative bg-gradient-to-br from-dark-800 to-black rounded-[2.5rem] p-8 md:p-12 mb-12 border border-white/5 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-orange-500/10 text-orange-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-orange-500/20 shadow-lg shadow-orange-500/10">
                Indian Home Style
              </span>
              <span className="bg-white/5 text-slate-300 px-3 py-1.5 rounded-full text-xs font-bold border border-white/10">
                {user.diet}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tight leading-none mb-2">
              {mealData.title || "Daily Meal Plan"}
            </h1>
            <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
              A perfectly balanced nutrition strategy using simple, locally available ingredients. Optimized for{" "}
              {user.goal}.
            </p>
          </div>

          <div className="flex flex-col items-end gap-6 w-full md:w-auto">
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                REGENERATE
              </button>
            </div>

            <div className="flex gap-4 md:gap-8 bg-black/40 p-4 md:p-6 rounded-3xl border border-white/5 backdrop-blur-md">
              <div className="text-center">
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Calories</p>
                <p className="text-white font-black text-3xl">{totalMacros.calories}</p>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="text-center">
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Protein</p>
                <p className="text-blue-400 font-black text-3xl">
                  {totalMacros.protein}
                  <span className="text-sm text-slate-500 font-medium">g</span>
                </p>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="text-center">
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Carbs</p>
                <p className="text-green-400 font-black text-3xl">
                  {totalMacros.carbs}
                  <span className="text-sm text-slate-500 font-medium">g</span>
                </p>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="text-center">
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Fats</p>
                <p className="text-yellow-400 font-black text-3xl">
                  {totalMacros.fats}
                  <span className="text-sm text-slate-500 font-medium">g</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Timeline */}
      <div className="space-y-6 relative max-w-5xl mx-auto">
        {/* Timeline line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-orange-500/30 via-orange-500/10 to-transparent hidden md:block"></div>

        {mealData.meals.map((meal, idx) => {
          const isExpanded = expandedMeal === idx
          return (
            <div key={idx} className="relative md:pl-28 transition-all duration-500 ease-in-out">
              {/* Timeline Dot */}
              <div
                className={`absolute left-6 top-10 w-4 h-4 rounded-full z-10 hidden md:block transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.4)] ${isExpanded ? "bg-orange-500 scale-125" : "bg-dark-900 border-2 border-orange-500"}`}
              ></div>

              <div
                onClick={() => toggleMeal(idx)}
                className={`bg-dark-800 rounded-[2rem] border overflow-hidden transition-all duration-500 cursor-pointer group hover:border-orange-500/30 ${isExpanded ? "border-orange-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5)]" : "border-white/5 hover:bg-dark-700/50"}`}
              >
                {/* Meal Header Card */}
                <div className="p-8 relative">
                  {/* Hover Glow */}
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/5 blur-[80px] group-hover:bg-orange-500/10 transition-colors pointer-events-none"></div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-dark-900 border border-white/5 flex items-center justify-center text-3xl shadow-inner">
                        {(meal.type || "").toLowerCase().includes("breakfast")
                          ? "🍳"
                          : (meal.type || "").toLowerCase().includes("lunch")
                            ? "🍛"
                            : (meal.type || "").toLowerCase().includes("dinner")
                              ? "🥘"
                              : (meal.type || "").toLowerCase().includes("snack")
                                ? "🥜"
                                : "🥣"}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {meal.type?.toUpperCase() || "MEAL"}
                          </span>
                          <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                          <span className="text-[10px] font-bold text-orange-500">{meal.prepTime || "15 mins"}</span>
                        </div>
                        <h3
                          className={`text-2xl font-bold transition-colors ${isExpanded ? "text-orange-400" : "text-white"}`}
                        >
                          {meal.name || "Meal"}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto bg-black/20 p-3 rounded-2xl border border-white/5">
                      <div className="text-center px-2">
                        <span className="block text-[10px] uppercase font-bold text-slate-500">Cals</span>
                        <span className="text-lg font-black text-white">{meal.macros?.calories || 0}</span>
                      </div>
                      <div className="w-px bg-white/10"></div>
                      <div className="text-center px-2 border-l border-white/10">
                        <span className="block text-[10px] uppercase font-bold text-slate-500">Pro</span>
                        <span className="text-lg font-black text-blue-400">{meal.macros?.protein || 0}g</span>
                      </div>
                      <div className="w-px bg-white/10"></div>
                      <div className="text-center px-2 border-l border-white/10">
                        <span className="block text-[10px] uppercase font-bold text-slate-500">Carb</span>
                        <span className="text-lg font-black text-green-400">{meal.macros?.carbs || 0}g</span>
                      </div>
                      <div className="w-px bg-white/10"></div>
                      <div className="text-center px-2 border-l border-white/10">
                        <span className="block text-[10px] uppercase font-bold text-slate-500">Fat</span>
                        <span className="text-lg font-black text-yellow-400">{meal.macros?.fats || 0}g</span>
                      </div>

                      <div
                        className={`ml-2 transition-transform duration-300 text-slate-400 ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <div
                  className={`overflow-hidden transition-all duration-500 ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <div className="border-t border-white/5 bg-black/20 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Ingredients Table */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <span className="text-lg">🛒</span> Ingredient Breakdown
                      </h4>
                      <div className="space-y-3">
                        {/* If ingredients is object (new format) vs string (old format fallback) */}
                        {(meal.ingredients || []).map((ing: any, i) =>
                          typeof ing === "string" ? (
                            <div key={i} className="text-slate-300 text-sm bg-white/5 p-3 rounded-xl">
                              {ing}
                            </div>
                          ) : (
                            <div
                              key={i}
                              className="bg-dark-900 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-white font-bold text-sm">{ing.name || "Ingredient"}</span>
                                <span className="text-slate-400 text-xs font-medium bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                  {ing.amount || ""}
                                </span>
                              </div>
                              {/* Micro Macros */}
                              {ing.macros && (
                                <div className="grid grid-cols-3 gap-3">
                                  {/* Protein */}
                                  <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                                    <div className="flex justify-between items-end mb-1">
                                      <span className="text-[10px] font-black text-blue-500 uppercase">Pro</span>
                                      <span className="text-xs font-bold text-white">{ing.macros.protein || 0}g</span>
                                    </div>
                                    <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-500"
                                        style={{ width: `${Math.min(((ing.macros.protein || 0) / 30) * 100, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>

                                  {/* Carbs */}
                                  <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                                    <div className="flex justify-between items-end mb-1">
                                      <span className="text-[10px] font-black text-green-500 uppercase">Carb</span>
                                      <span className="text-xs font-bold text-white">{ing.macros.carbs || 0}g</span>
                                    </div>
                                    <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-green-500"
                                        style={{ width: `${Math.min(((ing.macros.carbs || 0) / 50) * 100, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>

                                  {/* Fats */}
                                  <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                                    <div className="flex justify-between items-end mb-1">
                                      <span className="text-[10px] font-black text-yellow-500 uppercase">Fat</span>
                                      <span className="text-xs font-bold text-white">{ing.macros.fats || 0}g</span>
                                    </div>
                                    <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-yellow-500"
                                        style={{ width: `${Math.min(((ing.macros.fats || 0) / 20) * 100, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <span className="text-lg">👨‍🍳</span> Preparation
                      </h4>
                      <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 leading-relaxed text-slate-300 text-sm font-light">
                        {meal.instructions || "No instructions available"}
                      </div>

                      <div className="mt-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4 items-start">
                        <div className="text-2xl">💡</div>
                        <div>
                          <p className="text-blue-400 font-bold text-xs uppercase mb-1">Chef's Tip</p>
                          <p className="text-slate-300 text-xs">
                            Use moderate oil/ghee. Spices like turmeric and cumin aid digestion and inflammation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
