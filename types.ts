export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other'
}

export enum Goal {
  FatLoss = 'Fat Loss',
  MuscleGain = 'Muscle Gain',
  Recomposition = 'Recomposition'
}

export enum ActivityLevel {
  Sedentary = 'Sedentary',
  LightlyActive = 'Lightly Active',
  ModeratelyActive = 'Moderately Active',
  VeryActive = 'Very Active'
}

export enum DietPreference {
  Vegetarian = 'Vegetarian',
  Eggitarian = 'Eggitarian',
  NonVegetarian = 'Non-Vegetarian'
}

export interface UserSettings {
  notifications: boolean;
  publicProfile: boolean;
  dataSharing: boolean;
}

// Separate Auth Data from Fitness Profile
export interface AuthUser {
  id: string;
  email: string;
  passwordHash?: string; // Simulated hash
  provider: 'email' | 'google' | 'apple';
  profile?: UserProfile; // Profile is optional until onboarding is done
  createdAt: string;
  lastLogin: string;
  isAdmin?: boolean; // Admin Flag
}

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  height: number; // cm
  currentWeight: number; // kg
  goalWeight: number; // kg
  diet: DietPreference;
  activity: ActivityLevel;
  goal: Goal;
  experience: 'Beginner' | 'Intermediate' | 'Advanced';
  bio?: string;
  avatar?: string; // base64
  settings?: UserSettings;
  createdAt: string;
  isAdmin?: boolean; // Admin Flag
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    steps: number;
  };
}

export interface MacroBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
}

export interface MealLog {
  id: string;
  timestamp: string;
  name: string;
  description?: string;
  imageUrl?: string;
  macros: MacroBreakdown;
  confirmed: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: MealLog[];
  waterIntake: number; // Liters
  workoutCompleted: boolean;
  totalMacros: MacroBreakdown;
}

export interface WidgetData {
  type: 'nutrient_highlight' | 'daily_summary' | 'meal_card';
  data: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  type: 'text' | 'image' | 'video';
  widget?: WidgetData;
  mediaData?: string; // base64
  timestamp: number;
}

export interface CoachSettings {
  personality: 'Strict Sergeant' | 'Empathetic Friend' | 'Data Analyst';
  focus: 'Nutrition' | 'Workouts' | 'General Wellness';
}

export interface Contest {
  id: number;
  title: string;
  image: string;
  participantsCount: string;
  prize: string;
  description: string;
  rules: string[];
  daysLeft: number;
  icon: string;
  color: string;
  // User specific state (runtime only, usually)
  isJoined?: boolean;
  myRank?: number;
  myPoints?: number;
}

export interface ContestSubmission {
  id: string;
  contestId: number;
  timestamp: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  points: number | string;
  mediaType: 'image' | 'video';
  mediaData?: string; // base64
  userName?: string; // For Admin display
  contestTitle?: string; // For Admin display
}

export interface Comment {
    id: number;
    user: string;
    text: string;
    time: string;
}

export interface Post {
    id: number;
    user: string;
    badge?: string;
    badgeType?: 'gold' | 'green' | 'blue';
    time: string;
    likes: number;
    isLiked: boolean;
    commentsCount: number;
    image?: string;
    caption: string;
    tags: string[];
    textOnly?: boolean;
    category: 'Milestone' | 'Nutrition' | 'General';
    isFollowing: boolean; 
    comments: Comment[];
}

// --- Plan Types ---

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  tips: string;
  youtubeUrl: string;
  
}

export interface WorkoutDay {
  day: string;
  focus: string; // e.g., Push, Pull, Legs
  description: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  splitName: string;
  overview: string;
  schedule: WorkoutDay[];
}

export interface IngredientDetail {
  name: string;
  amount: string;
  macros: MacroBreakdown;
}

export interface MealItem {
  type: string; // Breakfast, Lunch...
  name: string;
  ingredients: IngredientDetail[];
  macros: MacroBreakdown;
  instructions: string;
  prepTime?: string;
}

export interface MealPlan {
  title: string;
  totalMacros: MacroBreakdown;
  meals: MealItem[];
}

// --- MUSCLEBOOK TYPES ---

export type TrainingEnvironment = 'Home' | 'Gym';
export type TrainingSplit = 'Push' | 'Pull' | 'Legs' | 'Full Body';

export interface MuscleData {
    id: string;
    name: string;
    scientificName: string;
    group: TrainingSplit[]; // Which splits utilize this muscle
    function: string;
    targetDetails: string; // Specific breakdown of which part is targeted by what
    mistakes: string[];
    anatomyColor: string; // Hex for UI
}

export interface ExerciseVariant {
    id: string;
    name: string;
    category: 'Compound' | 'Isolation'; // New field for training logic
    equipment: string[]; // "Dumbbell", "Barbell", "Machine", "None"
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    sets: string;
    reps: string;
    cues: string[];
    videoUrl?: string;
}

export interface MuscleChapter {
    muscleId: string;
    gymExercises: ExerciseVariant[];
    homeExercises: ExerciseVariant[];
}

export interface MuscleBookContext {
    split: TrainingSplit;
    environment: TrainingEnvironment;
}
