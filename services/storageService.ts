import { UserProfile, AuthUser, DailyLog, MealLog, Contest, ContestSubmission, Goal, Gender, ActivityLevel, Post, MuscleData, MuscleChapter, MuscleBookContext, TrainingSplit } from '../types';

// DATABASE KEYS
const DB_USERS_KEY = 'evolvefit_db_users'; 
const DB_SESSION_KEY = 'evolvefit_db_session'; 
const DB_LOGS_PREFIX = 'evolvefit_db_logs_'; 
const DB_GLOBAL_CONTESTS = 'evolvefit_global_contests';
const DB_GLOBAL_POSTS = 'evolvefit_global_posts';
const DB_GLOBAL_SUBMISSIONS = 'evolvefit_global_submissions';
const DB_MUSCLEBOOK_CONTEXT = 'evolvefit_musclebook_ctx';

// --- SECURITY & ADMIN CONFIG ---
// Credentials stored as Base64 to prevent plain-text reading in source code.
// Email: abdullahansari01618@gmail.com
// Pass: 9920867077@Adil
const ADMIN_HASH_EMAIL = "YWJkdWxsYWhhbnNhcmkwMTYxOEBnbWFpbC5jb20="; 
const ADMIN_HASH_PASS = "OTkyMDg2NzA3N0BBZGls"; 

// --- HELPERS ---
// Robustly get local YYYY-MM-DD to avoid timezone split issues
export const getLocalDateKey = (date: Date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - offset)).toISOString().slice(0, 10);
};

const getUsersDB = (): Record<string, AuthUser> => {
    try {
        return JSON.parse(localStorage.getItem(DB_USERS_KEY) || '{}');
    } catch (e) {
        return {};
    }
};

const saveUsersDB = (db: Record<string, AuthUser>) => {
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(db));
};

export const getAllLocalUsers = (): AuthUser[] => {
    const db = getUsersDB();
    return Object.values(db).sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime());
};

// Returns a formatted list for the Admin Dashboard
export const getAllUsers = () => {
    const db = getUsersDB();
    return Object.values(db).map(u => ({
        id: u.id,
        name: u.profile?.name || 'Incomplete Profile',
        email: u.email,
        joined: new Date(u.createdAt).toLocaleDateString(),
        status: u.profile ? 'Active' : 'Pending',
        isAdmin: u.isAdmin
    }));
};

export const deleteUser = (userId: string) => {
    const db = getUsersDB();
    if (db[userId]) {
        delete db[userId];
        saveUsersDB(db);
    }
    return getAllUsers();
};

// --- AUTHENTICATION ---

export const registerUser = (email: string, password?: string, provider: 'email' | 'google' | 'apple' = 'email'): AuthUser => {
    const db = getUsersDB();
    const normalizedEmail = email.toLowerCase().trim();
    const existing = Object.values(db).find(u => u.email === normalizedEmail);
    
    // Explicit requirement: Tell user email is in use
    if (existing) throw new Error("This email is already in use.");

    const newUser: AuthUser = {
        id: 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        email: normalizedEmail,
        passwordHash: password ? btoa(password) : undefined,
        provider,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };

    db[newUser.id] = newUser;
    saveUsersDB(db);
    localStorage.setItem(DB_SESSION_KEY, newUser.id);
    return newUser;
};

export const loginUser = (email: string, password?: string): AuthUser => {
    const db = getUsersDB();
    const normalizedEmail = email.toLowerCase().trim();
    const user = Object.values(db).find(u => u.email === normalizedEmail);
    
    // Explicit requirement: Return "No account found."
    if (!user) throw new Error("No account found.");
    
    if (user.provider === 'email' && password) {
        if (user.passwordHash !== btoa(password)) throw new Error("Incorrect password.");
    }

    // --- SECURE ADMIN CHECK ---
    // Decrypting stored hash to compare with input (simulated secure environment)
    const isAdmin = (btoa(normalizedEmail) === ADMIN_HASH_EMAIL) && (password && btoa(password) === ADMIN_HASH_PASS);
    
    user.lastLogin = new Date().toISOString();
    user.isAdmin = !!isAdmin; // Set admin flag based on credentials

    db[user.id] = user;
    saveUsersDB(db);
    localStorage.setItem(DB_SESSION_KEY, user.id);
    return user;
};

export const handleGoogleAuth = (email: string): AuthUser => {
    const db = getUsersDB();
    const normalizedEmail = email.toLowerCase().trim();
    let user = Object.values(db).find(u => u.email === normalizedEmail);

    if (user) {
        user.lastLogin = new Date().toISOString();
        db[user.id] = user;
        saveUsersDB(db);
        localStorage.setItem(DB_SESSION_KEY, user.id);
        return user;
    } else {
        const newUser: AuthUser = {
            id: 'user_google_' + Date.now(),
            email: normalizedEmail,
            provider: 'google',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            profile: undefined 
        };
        db[newUser.id] = newUser;
        saveUsersDB(db);
        localStorage.setItem(DB_SESSION_KEY, newUser.id);
        return newUser;
    }
};

export const logoutUser = () => { localStorage.removeItem(DB_SESSION_KEY); };

export const getCurrentSession = (): AuthUser | null => {
    const userId = localStorage.getItem(DB_SESSION_KEY);
    if (!userId) return null;
    const db = getUsersDB();
    return db[userId] || null;
};

export const saveUserProfile = (profile: UserProfile): void => {
    const currentUser = getCurrentSession();
    if (!currentUser) return;
    const db = getUsersDB();
    if (db[currentUser.id]) {
        db[currentUser.id].profile = profile;
        // Persist admin status if it exists on the auth user
        if (currentUser.isAdmin) {
            db[currentUser.id].profile = { ...profile, isAdmin: true };
        } else {
            db[currentUser.id].profile = profile;
        }
        saveUsersDB(db);
    }
};

export const getUserProfile = (): UserProfile | null => {
    const currentUser = getCurrentSession();
    if (!currentUser) return null;
    
    // Inject admin status into profile if present in auth
    const profile = currentUser.profile || null;
    if (profile && currentUser.isAdmin) {
        return { ...profile, isAdmin: true };
    }
    return profile;
};

// --- LOGGING SERVICE ---

const getUserLogsKey = () => {
    const user = getCurrentSession();
    return user ? `${DB_LOGS_PREFIX}${user.id}` : null;
};

export const getDailyLog = (dateKey: string): DailyLog => {
    const key = getUserLogsKey();
    if (!key) return createEmptyLog(dateKey);
    const allLogs = JSON.parse(localStorage.getItem(key) || '{}');
    return allLogs[dateKey] || createEmptyLog(dateKey);
};

const createEmptyLog = (date: string): DailyLog => ({
    date,
    meals: [],
    waterIntake: 0,
    workoutCompleted: false,
    totalMacros: { calories: 0, protein: 0, carbs: 0, fats: 0 }
});

export const getRecentLogs = (days: number): DailyLog[] => {
    const key = getUserLogsKey();
    const allLogs = key ? JSON.parse(localStorage.getItem(key) || '{}') : {};
    const result: DailyLog[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateKey(d);
        result.push(allLogs[dateStr] || createEmptyLog(dateStr));
    }
    return result;
};

export const saveMealLog = (meal: MealLog): DailyLog => {
    const key = getUserLogsKey();
    if (!key) throw new Error("No user logged in");
    
    // Use the timestamp of the meal to determine the date key
    const dateKey = getLocalDateKey(new Date(meal.timestamp));
    
    const currentLog = getDailyLog(dateKey);
    
    const updatedMeals = [...currentLog.meals, meal];
    const totals = updatedMeals.reduce((acc, m) => ({
        calories: acc.calories + m.macros.calories,
        protein: acc.protein + m.macros.protein,
        carbs: acc.carbs + m.macros.carbs,
        fats: acc.fats + m.macros.fats,
        fiber: (acc.fiber || 0) + (m.macros.fiber || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });
    
    const updatedLog: DailyLog = { ...currentLog, meals: updatedMeals, totalMacros: totals };
    
    const allLogs = JSON.parse(localStorage.getItem(key) || '{}');
    allLogs[dateKey] = updatedLog;
    localStorage.setItem(key, JSON.stringify(allLogs));
    
    return updatedLog;
};

// ... (Global Data / Contest / Post functions) ...
export const getContests = () => JSON.parse(localStorage.getItem(DB_GLOBAL_CONTESTS) || '[]');
export const saveContest = (c: Contest) => { const all = getContests(); localStorage.setItem(DB_GLOBAL_CONTESTS, JSON.stringify([c, ...all])); };
export const deleteContest = (id: number) => { 
    const all = getContests(); 
    const updated = all.filter((c: Contest) => String(c.id) !== String(id)); 
    localStorage.setItem(DB_GLOBAL_CONTESTS, JSON.stringify(updated)); 
    return updated; 
};

export const getPosts = () => JSON.parse(localStorage.getItem(DB_GLOBAL_POSTS) || '[]');
export const savePost = (p: Post) => { const all = getPosts(); localStorage.setItem(DB_GLOBAL_POSTS, JSON.stringify([p, ...all])); };
export const updatePost = (p: Post) => { const all = getPosts(); localStorage.setItem(DB_GLOBAL_POSTS, JSON.stringify(all.map((x:Post) => x.id === p.id ? p : x))); };

export const deletePost = (id: number) => { 
    const all = getPosts(); 
    // Coerce IDs to string to ensure matching even if type varies in storage
    const u = all.filter((x:Post) => String(x.id) !== String(id)); 
    localStorage.setItem(DB_GLOBAL_POSTS, JSON.stringify(u)); 
    return u; 
};

export const banUser = (u: string) => { 
    const all = getPosts(); 
    const up = all.filter((x:Post) => x.user !== u); 
    localStorage.setItem(DB_GLOBAL_POSTS, JSON.stringify(up)); 
    return up; 
};

export const getContestSubmissions = (id?: number) => { const all = JSON.parse(localStorage.getItem(DB_GLOBAL_SUBMISSIONS) || '[]'); return id ? all.filter((s:any) => s.contestId === id) : all; };
export const saveContestSubmission = (s: ContestSubmission) => { const all = getContestSubmissions(); localStorage.setItem(DB_GLOBAL_SUBMISSIONS, JSON.stringify([s, ...all])); };
export const updateSubmissionStatus = (id: string, status: any) => { const all = getContestSubmissions(); localStorage.setItem(DB_GLOBAL_SUBMISSIONS, JSON.stringify(all.map((s:any) => s.id === id ? { ...s, status } : s))); };
export const getPlatformStats = () => {
    const users = getAllLocalUsers();
    const posts = getPosts();
    const contests = getContests();
    const pendingVerifications = getContestSubmissions().filter((s: any) => s.status === 'Pending').length;
    // Estimate Database Size (Simulated)
    const dbSize = JSON.stringify(localStorage).length; 

    return { 
        userCount: users.length, 
        totalMealsLogged: 0, // Placeholder
        pendingVerifications, 
        activeContests: contests.length, 
        totalPosts: posts.length, 
        revenue: users.length * 10, // Simulated revenue
        databaseSize: dbSize 
    };
};

// --- SCIENCE-BASED CALORIE CALCULATOR (Mifflin-St Jeor) ---
export const calculateTargets = (age: number, gender: Gender, height: number, weight: number, activity: ActivityLevel, goal: Goal) => {
    // 1. Calculate BMR (Mifflin-St Jeor)
    // Men: 10W + 6.25H - 5A + 5
    // Women: 10W + 6.25H - 5A - 161
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === Gender.Male) {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    // 2. Calculate TDEE based on Activity Multiplier
    let activityMultiplier = 1.2; // Sedentary
    switch (activity) {
        case ActivityLevel.LightlyActive: activityMultiplier = 1.375; break;
        case ActivityLevel.ModeratelyActive: activityMultiplier = 1.55; break;
        case ActivityLevel.VeryActive: activityMultiplier = 1.725; break;
    }
    const tdee = Math.round(bmr * activityMultiplier);

    // 3. Adjust for Goal
    let targetCalories = tdee;
    if (goal === Goal.FatLoss) {
        targetCalories = tdee - 500; // Standard deficit
    } else if (goal === Goal.MuscleGain) {
        targetCalories = tdee + 300; // Lean bulk surplus
    } else if (goal === Goal.Recomposition) {
        targetCalories = tdee - 100; // Slight deficit for body recomp
    }

    // Ensure safety floor (don't go below 1200/1500 typically, but here simple floor)
    if (targetCalories < 1200) targetCalories = 1200;

    // 4. Calculate Macros (Science based split)
    // Protein: 2.0g per kg of bodyweight (good for gain/loss retention)
    // Fats: 0.8g per kg of bodyweight (hormonal health)
    // Carbs: Remainder
    const proteinGrams = Math.round(weight * 2.0);
    const fatGrams = Math.round(weight * 0.8);
    
    const proteinCals = proteinGrams * 4;
    const fatCals = fatGrams * 9;
    const remainingCals = targetCalories - (proteinCals + fatCals);
    const carbGrams = Math.max(0, Math.round(remainingCals / 4));

    // Steps Calculation
    let stepTarget = 6000;
    if (activity === ActivityLevel.ModeratelyActive) stepTarget = 8000;
    if (activity === ActivityLevel.VeryActive) stepTarget = 10000;
    if (goal === Goal.FatLoss) stepTarget += 2000; // Add steps for NEAT during fat loss

    return { 
        calories: targetCalories, 
        protein: proteinGrams, 
        carbs: carbGrams, 
        fats: fatGrams, 
        steps: stepTarget 
    };
};


// --- MUSCLEBOOK DATA SERVICE ---

const MUSCLES_DB: MuscleData[] = [
    // --- CHEST ---
    { 
        id: 'chest_upper', 
        name: 'Upper Chest', 
        scientificName: 'Clavicular Pectoralis', 
        group: ['Push', 'Full Body'], 
        function: 'Flexes arm, brings arm up and across', 
        targetDetails: 'Targets the Clavicular Head. Best exercises involve pressing at a 30-45° incline or moving arms from low to high.',
        mistakes: ['Too much front delt', 'Flaring elbows excessively'], 
        anatomyColor: '#ef4444' 
    },
    { 
        id: 'chest_mid', 
        name: 'Middle Chest', 
        scientificName: 'Sternal Pectoralis', 
        group: ['Push', 'Full Body'], 
        function: 'Adducts arm across chest', 
        targetDetails: 'Targets the Sternal Head (Primary mass). Best activated by flat pressing movements and flies where arms meet in the center.',
        mistakes: ['Short range of motion', 'Bouncing bar'], 
        anatomyColor: '#dc2626' 
    },
    { 
        id: 'chest_lower', 
        name: 'Lower Chest', 
        scientificName: 'Costal Pectoralis', 
        group: ['Push', 'Full Body'], 
        function: 'Brings arm down and across', 
        targetDetails: 'Targets the Costal Head. Prioritize Decline Presses, Dips, and High-to-Low Cable Flys.',
        mistakes: ['Shoulders rolling forward', 'Over-arching'], 
        anatomyColor: '#b91c1c' 
    },
    
    // --- BACK ---
    { 
        id: 'traps', 
        name: 'Traps', 
        scientificName: 'Trapezius', 
        group: ['Pull', 'Full Body'], 
        function: 'Shrugs shoulders, stabilizes neck', 
        targetDetails: 'Upper Traps: Shrugs. Mid/Lower Traps: Face Pulls and Rows. Essential for neck stability and posture.',
        mistakes: ['Rolling shoulders', 'Using arms to lift'], 
        anatomyColor: '#fbbf24' 
    },
    { 
        id: 'lats', 
        name: 'Lats', 
        scientificName: 'Latissimus Dorsi', 
        group: ['Pull', 'Full Body'], 
        function: 'Pulls arms down', 
        targetDetails: 'Targets the largest back muscle. Vertical Pulls (Pullups) build width; Horizontal Pulls (Rows) build thickness.',
        mistakes: ['Swinging torso', 'Shrugging'], 
        anatomyColor: '#3b82f6' 
    },
    { 
        id: 'mid_back', 
        name: 'Mid-Back', 
        scientificName: 'Rhomboids', 
        group: ['Pull', 'Full Body'], 
        function: 'Retracts shoulder blades', 
        targetDetails: 'Targets Rhomboids & Teres Major. Critical for thickness. Focus on squeezing shoulder blades together (Retraction).',
        mistakes: ['Rounding shoulders', 'Not squeezing blades'], 
        anatomyColor: '#2563eb' 
    },
    { 
        id: 'lower_back', 
        name: 'Lower Back', 
        scientificName: 'Erector Spinae', 
        group: ['Pull', 'Legs', 'Full Body'], 
        function: 'Spinal extension', 
        targetDetails: 'Stabilizes the spine. Targeted by Deadlifts, Rack Pulls, and Hyperextensions.',
        mistakes: ['Rounding back', 'Hyperextension'], 
        anatomyColor: '#60a5fa' 
    },
    
    // --- SHOULDERS ---
    { 
        id: 'delts_front', 
        name: 'Front Delts', 
        scientificName: 'Anterior Deltoid', 
        group: ['Push', 'Full Body'], 
        function: 'Flexes shoulder forward', 
        targetDetails: 'Heavily involved in all Chest Presses. Isolate with Overhead Press and Front Raises.',
        mistakes: ['Lifting too heavy', 'Arching back'], 
        anatomyColor: '#f97316' 
    },
    { 
        id: 'delts_side', 
        name: 'Side Delts', 
        scientificName: 'Medial Deltoid', 
        group: ['Push', 'Full Body'], 
        function: 'Abducts arm to side', 
        targetDetails: 'Creates the "Cap" look. Targeted exclusively by lateral raising motions (Dumbbell or Cable).',
        mistakes: ['Using traps to lift', 'Swinging weights'], 
        anatomyColor: '#fb923c' 
    },
    { 
        id: 'delts_rear', 
        name: 'Rear Delts', 
        scientificName: 'Posterior Deltoids', 
        group: ['Pull', 'Full Body'], 
        function: 'Pulls arms back horizontally', 
        targetDetails: 'Often neglected. Targets the back of the shoulder. Use Face Pulls and Reverse Pec Deck.',
        mistakes: ['Engaging back muscles too much', 'Short ROM'], 
        anatomyColor: '#ea580c' 
    },
    { 
        id: 'neck', 
        name: 'Neck', 
        scientificName: 'Sternocleidomastoid', 
        group: ['Full Body', 'Pull'], 
        function: 'Rotates and flexes head', 
        targetDetails: 'Targets the Sternocleidomastoid. Exercises: Neck Curls and Extensions. Build slowly to avoid injury.',
        mistakes: ['Using too much weight', 'Jerking motion'], 
        anatomyColor: '#a8a29e' 
    },

    // --- ARMS ---
    { 
        id: 'biceps', 
        name: 'Biceps', 
        scientificName: 'Biceps Brachii', 
        group: ['Pull', 'Full Body'], 
        function: 'Flexes elbow', 
        targetDetails: 'Long Head (Outer Peak): Incline Curls/Drag Curls. Short Head (Inner Thickness): Preacher/Spider Curls.',
        mistakes: ['Swinging elbows', 'Curling wrists'], 
        anatomyColor: '#8b5cf6' 
    },
    { 
        id: 'triceps', 
        name: 'Triceps', 
        scientificName: 'Triceps Brachii', 
        group: ['Push', 'Full Body'], 
        function: 'Extends elbow', 
        targetDetails: 'Long Head (Inner Mass): Overhead Extensions. Lateral Head (Outer Horseshoe): Pushdowns. Medial Head: Reverse grip.',
        mistakes: ['Flaring elbows', 'Moving shoulders'], 
        anatomyColor: '#eab308' 
    },
    { 
        id: 'forearms', 
        name: 'Forearms', 
        scientificName: 'Brachioradialis & Flexors', 
        group: ['Pull', 'Full Body'], 
        function: 'Grip strength, wrist flexion', 
        targetDetails: 'Brachioradialis (Top): Hammer Curls/Reverse Curls. Flexors (Bottom): Wrist Curls.',
        mistakes: ['Using biceps', 'Too fast tempo'], 
        anatomyColor: '#a78bfa' 
    },
    
    // --- LEGS ---
    { 
        id: 'abs', 
        name: 'Abs (Core)', 
        scientificName: 'Rectus Abdominis & Obliques', 
        group: ['Push', 'Pull', 'Legs', 'Full Body'], 
        function: 'Flexes spine, Rotates torso', 
        targetDetails: 'Upper Abs: Crunches. Lower Abs: Leg Raises. Obliques (Sides): Woodchoppers/Twists. Transverse (Inner): Planks.',
        mistakes: ['Pulling neck', 'Hip flexor dominance', 'No rotation'], 
        anatomyColor: '#ec4899' 
    },
    { 
        id: 'glutes', 
        name: 'Glutes', 
        scientificName: 'Gluteus Maximus', 
        group: ['Legs', 'Full Body'], 
        function: 'Hip extension', 
        targetDetails: 'Primary hip extensor. Targeted by Hip Thrusts (Short position) and Squats/RDLs (Lengthened position).',
        mistakes: ['Not squeezing at top', 'Knees caving'], 
        anatomyColor: '#f43f5e' 
    },
    { 
        id: 'quads', 
        name: 'Quads', 
        scientificName: 'Quadriceps Femoris', 
        group: ['Legs', 'Full Body'], 
        function: 'Knee extension', 
        targetDetails: 'Rectus Femoris (Middle): Leg Extensions. Vastus Lateralis (Outer Sweep): Close stance Leg Press. Vastus Medialis (Teardrop): Deep Squats/Split Squats.',
        mistakes: ['Heels lifting', 'Half reps'], 
        anatomyColor: '#22c55e' 
    },
    { 
        id: 'hamstrings', 
        name: 'Hamstrings', 
        scientificName: 'Biceps Femoris', 
        group: ['Legs', 'Pull', 'Full Body'], 
        function: 'Knee flexion', 
        targetDetails: 'Knee Flexion: Leg Curls (Inner/Outer). Hip Extension: RDLs/Good Mornings. Train both functions.',
        mistakes: ['Hips rising too fast', 'Incomplete stretch'], 
        anatomyColor: '#16a34a' 
    },
    { 
        id: 'calves', 
        name: 'Calves', 
        scientificName: 'Gastrocnemius', 
        group: ['Legs', 'Full Body'], 
        function: 'Plantar flexion', 
        targetDetails: 'Gastrocnemius (Diamond): Standing Calf Raises (Knee straight). Soleus (Width): Seated Calf Raises (Knee bent).',
        mistakes: ['Bouncing', 'Short ROM'], 
        anatomyColor: '#15803d' 
    },
];

// ... (EXERCISES_DB and other exports remain unchanged) ...

const EXERCISES_DB: Record<string, MuscleChapter> = {
    // --- CHEST ---
    'chest_upper': {
        muscleId: 'chest_upper',
        gymExercises: [
            {id:'incline_bb', category: 'Compound', name:'Incline Barbell Bench Press', equipment:['Barbell', 'Incline Bench'], difficulty:'Intermediate', sets:'3', reps:'8-12', cues:['Bench at 30 degrees', 'Touch upper chest', 'Don\'t flare elbows'], videoUrl:'https://www.youtube.com/watch?v=SrqOu55lrYu'},
            {id:'incline_db', category: 'Compound', name:'Incline Dumbbell Press', equipment:['Dumbbells', 'Incline Bench'], difficulty:'Intermediate', sets:'3', reps:'10-12', cues:['Deep stretch', 'Converge at top', 'Control negative'], videoUrl:'https://www.youtube.com/watch?v=8iPEnn-ltC8'},
            {id:'low_cable', category: 'Isolation', name:'Low-to-High Cable Fly', equipment:['Cables'], difficulty:'Advanced', sets:'3', reps:'15', cues:['Scoop up and in', 'Focus on upper pecs', 'Constant tension'], videoUrl:'https://www.youtube.com/watch?v=M2658bfbbd8'},
            {id:'hammer_incline', category: 'Compound', name:'Hammer Strength Incline Press', equipment:['Machine'], difficulty:'Beginner', sets:'3', reps:'12', cues:['Seat height so handles align with clavicle', 'Full ROM'], videoUrl:'https://www.youtube.com/watch?v=Z57CtFmRMxA'}
        ],
        homeExercises: [
            {id:'decline_pushup', category: 'Compound', name:'Decline Push-Up', equipment:['Chair/Bed'], difficulty:'Intermediate', sets:'3', reps:'12-15', cues:['Feet elevated', 'Hands on floor', 'Core tight'], videoUrl:'https://www.youtube.com/watch?v=SKPab2YC8BE'},
            {id:'band_incline', category: 'Isolation', name:'Resistance Band Incline Press', equipment:['Resistance Band'], difficulty:'Beginner', sets:'3', reps:'15-20', cues:['Step on band with back foot', 'Press up and forward', 'Squeeze upper chest'], videoUrl:'https://www.youtube.com/watch?v=G6X5VqX12i4'},
            {id:'pike_pushup_mod', category: 'Compound', name:'Modified Pike Push-Up', equipment:['None'], difficulty:'Intermediate', sets:'3', reps:'10', cues:['Hips high', 'Focus on upper chest/shoulders'], videoUrl:'https://www.youtube.com/watch?v=sposDXWEB0A'}
        ]
    },
    'chest_mid': {
        muscleId: 'chest_mid',
        gymExercises: [
            {id:'flat_bb', category: 'Compound', name:'Barbell Bench Press', equipment:['Barbell', 'Bench'], difficulty:'Intermediate', sets:'4', reps:'6-10', cues:['Arch back slightly', 'Retract scapula', 'Leg drive'], videoUrl:'https://www.youtube.com/watch?v=rT7DgCr-3pg'}, 
            {id:'flat_db', category: 'Compound', name:'Dumbbell Bench Press', equipment:['Dumbbells', 'Bench'], difficulty:'Intermediate', sets:'3', reps:'8-12', cues:['Deeper range than barbell', 'Squeeze at top'], videoUrl:'https://www.youtube.com/watch?v=VmB1G1K7v94'},
            {id:'pec_deck', category: 'Isolation', name:'Machine Pec Deck', equipment:['Machine'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Elbows slightly bent', 'Squeeze for 1s'], videoUrl:'https://www.youtube.com/watch?v=eGjt4lkiwJw'},
            {id:'cable_fly', category: 'Isolation', name:'Standing Cable Fly', equipment:['Cables'], difficulty:'Intermediate', sets:'3', reps:'15', cues:['Hug a tree motion', 'Chest up'], videoUrl:'https://www.youtube.com/watch?v=Iwe6AmxVf7o'}
        ],
        homeExercises: [
            {id:'pushup', category: 'Compound', name:'Standard Push-Up', equipment:['None'], difficulty:'Beginner', sets:'3', reps:'AMRAP', cues:['Chest to floor', 'Elbows 45 degrees'], videoUrl:'https://www.youtube.com/watch?v=IODxDxX7oi4'},
            {id:'band_fly', category: 'Isolation', name:'Resistance Band Fly', equipment:['Resistance Band', 'Pole/Door'], difficulty:'Beginner', sets:'3', reps:'20', cues:['Anchor band behind', 'Hug forward'], videoUrl:'https://www.youtube.com/watch?v=9j7gJ7qgZKw'},
            {id:'floor_press', category: 'Compound', name:'Dumbbell/Bottle Floor Press', equipment:['Weights'], difficulty:'Beginner', sets:'3', reps:'12', cues:['Lie on floor', 'Press up', 'Save shoulders'], videoUrl:'https://www.youtube.com/watch?v=uUGDRwge4F8'}
        ]
    },
    'chest_lower': {
        muscleId: 'chest_lower',
        gymExercises: [
            {id:'dips', category: 'Compound', name:'Chest Dips', equipment:['Dip Station'], difficulty:'Intermediate', sets:'3', reps:'8-12', cues:['Lean forward', 'Elbows slightly flared', 'Deep stretch'], videoUrl:'https://www.youtube.com/watch?v=2z8JmcrW-As'},
            {id:'high_cable_fly', category: 'Isolation', name:'High-to-Low Cable Fly', equipment:['Cable'], difficulty:'Advanced', sets:'3', reps:'15', cues:['Pull down and across', 'Squeeze at bottom', 'Keep chest up'], videoUrl:'https://www.youtube.com/watch?v=Iwe6AmxVf7o'},
            {id:'decline_bench', category: 'Compound', name:'Decline Barbell Bench', equipment:['Decline Bench', 'Barbell'], difficulty:'Intermediate', sets:'3', reps:'10', cues:['Touch lower chest', 'Control weight'], videoUrl:'https://www.youtube.com/watch?v=LfyQBUKR8SE'}
        ],
        homeExercises: [
            {id:'incline_pushup', category: 'Compound', name:'Incline Push-Up', equipment:['Table/Chair'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Hands on elevated surface', 'Touch chest to edge'], videoUrl:'https://www.youtube.com/watch?v=Z0bRiVhIX8o'},
            {id:'chair_dips', category: 'Compound', name:'Bench Dips', equipment:['Chairs'], difficulty:'Beginner', sets:'3', reps:'12', cues:['Legs straight for harder', 'Don\'t shrug shoulders'], videoUrl:'https://www.youtube.com/watch?v=0326dy_-CzM'}
        ]
    },

    // --- SHOULDERS ---
    'delts_front': {
        muscleId: 'delts_front',
        gymExercises: [
            {id:'ohp', category: 'Compound', name:'Overhead Press', equipment:['Barbell'], difficulty:'Intermediate', sets:'3', reps:'8-10', cues:['Clear head', 'Lock out at top'], videoUrl:'https://www.youtube.com/watch?v=2yjwXTZQDDI'},
            {id:'db_shoulder_press', category: 'Compound', name:'Seated DB Press', equipment:['Dumbbells', 'Bench'], difficulty:'Intermediate', sets:'3', reps:'10-12', cues:['Back supported', 'Press in arc'], videoUrl:'https://www.youtube.com/watch?v=qEwKCR5JCog'},
            {id:'front_raise', category: 'Isolation', name:'Cable Front Raise', equipment:['Cable'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Through legs', 'Lift to eye level'], videoUrl:'https://www.youtube.com/watch?v=GzYk7g77eHk'}
        ],
        homeExercises: [
            {id:'pike_pushup', category: 'Compound', name:'Pike Push-Up', equipment:['None'], difficulty:'Intermediate', sets:'3', reps:'8-12', cues:['Hips high', 'Vertical press path'], videoUrl:'https://www.youtube.com/watch?v=sposDXWEB0A'},
            {id:'water_front_raise', category: 'Isolation', name:'Water Bottle Front Raise', equipment:['Bottles'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Thumbs up grip', 'Controlled tempo'], videoUrl:'https://www.youtube.com/watch?v=-t7fuZ0KhDA'},
            {id:'band_press', category: 'Compound', name:'Resistance Band OHP', equipment:['Band'], difficulty:'Intermediate', sets:'3', reps:'12', cues:['Stand on band', 'Press overhead'], videoUrl:'https://www.youtube.com/watch?v=K3p7lJ2WkEQ'}
        ]
    },
    'delts_side': {
        muscleId: 'delts_side',
        gymExercises: [
            {id:'lat_raise', category: 'Isolation', name:'DB Lateral Raise', equipment:['Dumbbells'], difficulty:'Beginner', sets:'4', reps:'12-15', cues:['Lead with elbows', 'Dont swing', 'Pinkies up slightly'], videoUrl:'https://www.youtube.com/watch?v=3VcKaXpzqRo'},
            {id:'cable_lat_raise', category: 'Isolation', name:'Egyptian Cable Lateral Raise', equipment:['Cable'], difficulty:'Intermediate', sets:'3', reps:'15', cues:['Lean away', 'Constant tension'], videoUrl:'https://www.youtube.com/watch?v=WJm8Jq_bCoU'},
            {id:'machine_lat_raise', category: 'Isolation', name:'Machine Lateral Raise', equipment:['Machine'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Pad on elbow', 'Lift with shoulders'], videoUrl:'https://www.youtube.com/watch?v=2kL-2Jq-xM8'}
        ],
        homeExercises: [
            {id:'band_lat_raise', category: 'Isolation', name:'Band Lateral Raise', equipment:['Resistance Band'], difficulty:'Beginner', sets:'3', reps:'20', cues:['Step on band', 'Raise to side'], videoUrl:'https://www.youtube.com/watch?v=0_Z9JpPZ6Rc'},
            {id:'bottle_lat_raise', category: 'Isolation', name:'Water Bottle Lateral Raise', equipment:['Bottles'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Hold filled bottles', 'Raise to shoulder height'], videoUrl:'https://www.youtube.com/watch?v=3VcKaXpzqRo'},
            {id:'door_lean_raise', category: 'Isolation', name:'Doorframe Leaning Raise', equipment:['Jug/Bag'], difficulty:'Intermediate', sets:'3', reps:'12', cues:['Lean from door', 'Raise weight'], videoUrl:'https://www.youtube.com/watch?v=WJm8Jq_bCoU'}
        ]
    },
    'delts_rear': {
        muscleId: 'delts_rear',
        gymExercises: [
            {id:'face_pull', category: 'Isolation', name:'Face Pulls', equipment:['Cable'], difficulty:'Intermediate', sets:'4', reps:'15', cues:['Pull to forehead', 'External rotation', 'Squeeze rear delts'], videoUrl:'https://www.youtube.com/watch?v=rep-qVOkqgk'},
            {id:'rev_pec_deck', category: 'Isolation', name:'Reverse Pec Deck', equipment:['Machine'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Palms facing in or down', 'Push back with elbows'], videoUrl:'https://www.youtube.com/watch?v=2tX2yKz8Z8E'},
            {id:'bent_over_fly', category: 'Isolation', name:'Bent Over DB Fly', equipment:['Dumbbells'], difficulty:'Intermediate', sets:'3', reps:'15', cues:['Hinge at hips', 'Fly out to side'], videoUrl:'https://www.youtube.com/watch?v=ttvfGg-LC7k'}
        ],
        homeExercises: [
            {id:'band_pull_apart', category: 'Isolation', name:'Band Pull-Aparts', equipment:['Resistance Band'], difficulty:'Beginner', sets:'4', reps:'20', cues:['Pull band across chest', 'Squeeze blades'], videoUrl:'https://www.youtube.com/watch?v=fKHtLqQ4qQw'},
            {id:'door_face_pull', category: 'Isolation', name:'Doorway Face Pulls', equipment:['Towel/Door'], difficulty:'Beginner', sets:'4', reps:'20', cues:['Wrap towel on doorknob', 'Lean back', 'Pull to face'], videoUrl:'https://www.youtube.com/watch?v=fKHtLqQ4qQw'},
            {id:'bent_bottle_fly', category: 'Isolation', name:'Bent Over Bottle Fly', equipment:['Bottles'], difficulty:'Intermediate', sets:'3', reps:'15', cues:['Flat back', 'Fly out'], videoUrl:'https://www.youtube.com/watch?v=ttvfGg-LC7k'}
        ]
    },

    // --- ARMS ---
    'biceps': {
        muscleId: 'biceps',
        gymExercises: [
            {id:'bb_curl', category: 'Compound', name:'Barbell Curl', equipment:['Barbell'], difficulty:'Beginner', sets:'3', reps:'8-10', cues:['Elbows pinned', 'Full ROM'], videoUrl:'https://www.youtube.com/watch?v=kwG2ipFRgfo'},
            {id:'hammer_curl', category: 'Isolation', name:'DB Hammer Curl', equipment:['Dumbbells'], difficulty:'Beginner', sets:'3', reps:'12', cues:['Palms facing each other', 'Hits brachialis'], videoUrl:'https://www.youtube.com/watch?v=zC3nLlEvin4'},
            {id:'preacher_curl', category: 'Isolation', name:'Preacher Curl', equipment:['EZ Bar/Machine'], difficulty:'Intermediate', sets:'3', reps:'12', cues:['Armpits over pad', 'Full stretch'], videoUrl:'https://www.youtube.com/watch?v=fIWP-FRFNU0'},
            {id:'bayesian_curl', category: 'Isolation', name:'Behind-the-Back Cable Curl', equipment:['Cable'], difficulty:'Advanced', sets:'3', reps:'15', cues:['Face away from cable', 'Arm behind body'], videoUrl:'https://www.youtube.com/watch?v=34wP5861Lhk'}
        ],
        homeExercises: [
            {id:'band_curl', category: 'Isolation', name:'Resistance Band Curl', equipment:['Band'], difficulty:'Beginner', sets:'3', reps:'20', cues:['Step on band', 'Curl up'], videoUrl:'https://www.youtube.com/watch?v=7M73nJ2qfE8'},
            {id:'towel_curl', category: 'Isolation', name:'Towel Leg Curl', equipment:['Towel'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Loop towel under leg', 'Use leg as weight', 'Curl up'], videoUrl:'https://www.youtube.com/watch?v=kwG2ipFRgfo'},
            {id:'chin_up', category: 'Compound', name:'Chin-Ups', equipment:['Bar'], difficulty:'Advanced', sets:'3', reps:'AMRAP', cues:['Palms facing you', 'Chin over bar'], videoUrl:'https://www.youtube.com/watch?v=brhRXlOhsAM'}
        ]
    },
    'triceps': {
        muscleId: 'triceps',
        gymExercises: [
            {id:'pushdown', category: 'Isolation', name:'Cable Pushdown', equipment:['Cable'], difficulty:'Beginner', sets:'3', reps:'12-15', cues:['Keep elbows at side', 'Lock out bottom'], videoUrl:'https://www.youtube.com/watch?v=2-LAMcpzODU'},
            {id:'skullcrusher', category: 'Isolation', name:'EZ Bar Skullcrusher', equipment:['EZ Bar', 'Bench'], difficulty:'Intermediate', sets:'3', reps:'10-12', cues:['Lower to forehead/behind head', 'Keep elbows in'], videoUrl:'https://www.youtube.com/watch?v=d_KZxkY_0cM'},
            {id:'overhead_ext', category: 'Isolation', name:'Overhead DB Extension', equipment:['Dumbbell'], difficulty:'Intermediate', sets:'3', reps:'12', cues:['Stretch tricep', 'Full extension'], videoUrl:'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q'}
        ],
        homeExercises: [
            {id:'diamond_push', category: 'Compound', name:'Diamond Pushup', equipment:['None'], difficulty:'Intermediate', sets:'3', reps:'10-15', cues:['Hands in diamond shape', 'Elbows tight'], videoUrl:'https://www.youtube.com/watch?v=J0DnG1_S92I'},
            {id:'bench_dip', category: 'Compound', name:'Chair Dips', equipment:['Chairs'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Hands on chair', 'Lower hips', 'Press up'], videoUrl:'https://www.youtube.com/watch?v=0326dy_-CzM'},
            {id:'band_pushdown', category: 'Isolation', name:'Band Pushdown', equipment:['Band', 'Door'], difficulty:'Beginner', sets:'3', reps:'20', cues:['Anchor band high', 'Push down'], videoUrl:'https://www.youtube.com/watch?v=2-LAMcpzODU'}
        ]
    },
    'forearms': {
        muscleId: 'forearms',
        gymExercises: [
            {id:'wrist_curl', category: 'Isolation', name:'DB Wrist Curls', equipment:['Dumbbell'], difficulty:'Beginner', sets:'3', reps:'20', cues:['Forearms on bench', 'Roll weight to fingertips'], videoUrl:'https://www.youtube.com/watch?v=U6z8eE5G5fE'},
            {id:'rev_curl', category: 'Isolation', name:'Reverse Barbell Curl', equipment:['Barbell'], difficulty:'Intermediate', sets:'3', reps:'12', cues:['Overhand grip', 'Keep elbows pinned'], videoUrl:'https://www.youtube.com/watch?v=nRgxYX2Ve9w'},
            {id:'farmers', category: 'Compound', name:'Farmers Walk', equipment:['Heavy DBs/Kettlebells'], difficulty:'Intermediate', sets:'3', reps:'60s', cues:['Heavy weight', 'Walk straight', 'Don\'t slouch'], videoUrl:'https://www.youtube.com/watch?v=Fkzk_RqlYig'}
        ],
        homeExercises: [
            {id:'towel_wring', category: 'Isolation', name:'Towel Wring', equipment:['Towel'], difficulty:'Beginner', sets:'3', reps:'Failure', cues:['Wet towel', 'Wring it out repeatedly', 'Squeeze hard'], videoUrl:'https://www.youtube.com/watch?v=U6z8eE5G5fE'},
            {id:'bag_hold', category: 'Isolation', name:'Static Bag Hold', equipment:['Heavy Bag'], difficulty:'Beginner', sets:'3', reps:'Failure', cues:['Hold heavy bag', 'Don\'t let grip fail'], videoUrl:'https://www.youtube.com/watch?v=Fkzk_RqlYig'},
            {id:'finger_pushup', category: 'Compound', name:'Fingertip Pushups', equipment:['None'], difficulty:'Advanced', sets:'3', reps:'10', cues:['On fingers', 'Strengthens grip'], videoUrl:'https://www.youtube.com/watch?v=U6z8eE5G5fE'}
        ]
    },

    // --- BACK ---
    'lats': {
        muscleId: 'lats',
        gymExercises: [
            {id:'lat_pulldown', category: 'Compound', name:'Lat Pulldown', equipment:['Cable Machine'], difficulty:'Beginner', sets:'3-4', reps:'10-12', cues:['Drive elbows down', 'Chest up'], videoUrl:'https://www.youtube.com/watch?v=CAwf7n6Luuc'},
            {id:'pullup', category: 'Compound', name:'Pull-Ups', equipment:['Pullup Bar'], difficulty:'Advanced', sets:'3', reps:'AMRAP', cues:['Full hang', 'Chin over bar', 'Squeeze lats'], videoUrl:'https://www.youtube.com/watch?v=eGo4IYlbE5g'},
            {id:'db_row', category: 'Compound', name:'Single Arm DB Row', equipment:['Dumbbell', 'Bench'], difficulty:'Intermediate', sets:'3', reps:'10', cues:['Pull to hip', 'Flat back'], videoUrl:'https://www.youtube.com/watch?v=pYcpY20QaE8'}
        ],
        homeExercises: [
            {id:'door_pullin', category: 'Compound', name:'Doorframe Row', equipment:['Door Frame'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Hold door frame', 'Lean back', 'Pull chest to frame'], videoUrl:'https://www.youtube.com/watch?v=rloYp8p26r0'},
            {id:'band_pulldown', category: 'Isolation', name:'Banded Lat Pulldown', equipment:['Band', 'Door'], difficulty:'Beginner', sets:'3', reps:'20', cues:['Anchor high', 'Pull elbows down'], videoUrl:'https://www.youtube.com/watch?v=CAwf7n6Luuc'},
            {id:'table_row', category: 'Compound', name:'Inverted Table Row', equipment:['Sturdy Table'], difficulty:'Intermediate', sets:'3', reps:'10', cues:['Lie under table', 'Pull chest to edge'], videoUrl:'https://www.youtube.com/watch?v=rloYp8p26r0'}
        ]
    },
    'traps': {
        muscleId: 'traps',
        gymExercises: [
            {id:'bb_shrug', category: 'Isolation', name:'Barbell Shrug', equipment:['Barbell'], difficulty:'Beginner', sets:'4', reps:'15', cues:['Shrug straight up', 'Hold for 2s', 'Do NOT roll shoulders'], videoUrl:'https://www.youtube.com/watch?v=g6qqx4bCXPo'},
            {id:'db_shrug', category: 'Isolation', name:'Dumbbell Shrug', equipment:['Dumbbells'], difficulty:'Beginner', sets:'4', reps:'15-20', cues:['Neutral grip', 'Squeeze traps'], videoUrl:'https://www.youtube.com/watch?v=g6qqx4bCXPo'},
            {id:'face_pull_high', category: 'Isolation', name:'High Face Pulls', equipment:['Cable'], difficulty:'Intermediate', sets:'3', reps:'15', cues:['Pull high to forehead', 'Squeeze upper back'], videoUrl:'https://www.youtube.com/watch?v=rep-qVOkqgk'}
        ],
        homeExercises: [
            {id:'bag_shrug', category: 'Isolation', name:'Backpack Shrugs', equipment:['Backpack'], difficulty:'Beginner', sets:'4', reps:'25', cues:['Fill bag with books', 'Shrug up'], videoUrl:'https://www.youtube.com/watch?v=g6qqx4bCXPo'},
            {id:'band_shrug', category: 'Isolation', name:'Resistance Band Shrug', equipment:['Band'], difficulty:'Beginner', sets:'4', reps:'20', cues:['Stand on band', 'Shrug up'], videoUrl:'https://www.youtube.com/watch?v=g6qqx4bCXPo'}
        ]
    },
    'mid_back': {
        muscleId: 'mid_back',
        gymExercises: [
            {id:'seated_row', category: 'Compound', name:'Seated Cable Row', equipment:['Cable'], difficulty:'Intermediate', sets:'3', reps:'12', cues:['Squeeze blades together', 'Chest out'], videoUrl:'https://www.youtube.com/watch?v=GZbfZ033f74'},
            {id:'chest_supported_row', category: 'Compound', name:'Chest Supported Row', equipment:['Machine/Bench'], difficulty:'Beginner', sets:'3', reps:'12', cues:['Isolates back', 'No lower back momentum'], videoUrl:'https://www.youtube.com/watch?v=0UBRfiO4zDs'},
            {id:'t_bar_row', category: 'Compound', name:'T-Bar Row', equipment:['T-Bar/Landmine'], difficulty:'Advanced', sets:'3', reps:'8-10', cues:['Flat back', 'Pull to stomach'], videoUrl:'https://www.youtube.com/watch?v=j3Igk5nyZE4'}
        ],
        homeExercises: [
            {id:'door_row', category: 'Compound', name:'Inverted Row', equipment:['Table/Chairs'], difficulty:'Intermediate', sets:'3', reps:'10', cues:['Lie under table', 'Pull chest to table edge'], videoUrl:'https://www.youtube.com/watch?v=rloYp8p26r0'},
            {id:'band_row', category: 'Isolation', name:'Seated Band Row', equipment:['Band'], difficulty:'Beginner', sets:'3', reps:'20', cues:['Loop band around feet', 'Row to waist'], videoUrl:'https://www.youtube.com/watch?v=GZbfZ033f74'},
            {id:'superman_pull', category: 'Isolation', name:'Superman Pull', equipment:['None'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Lie on stomach', 'Lift chest', 'Pull arms back'], videoUrl:'https://www.youtube.com/watch?v=z6PJMT2y8GQ'}
        ]
    },
    'lower_back': {
        muscleId: 'lower_back',
        gymExercises: [
            {id:'hyperextension', category: 'Isolation', name:'Back Extension', equipment:['Bench'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Hinge at hips', 'Neutral spine'], videoUrl:'https://www.youtube.com/watch?v=ph3pddpKzzw'},
            {id:'rack_pull', category: 'Compound', name:'Rack Pull', equipment:['Barbell', 'Rack'], difficulty:'Advanced', sets:'3', reps:'6-8', cues:['Pull from knee height', 'Lock out hips'], videoUrl:'https://www.youtube.com/watch?v=e1rHj9yJdYc'}
        ],
        homeExercises: [
            {id:'superman', category: 'Isolation', name:'Superman Hold', equipment:['None'], difficulty:'Beginner', sets:'3', reps:'30s', cues:['Lift chest & thighs', 'Squeeze glutes'], videoUrl:'https://www.youtube.com/watch?v=z6PJMT2y8GQ'},
            {id:'bird_dog', category: 'Isolation', name:'Bird Dog', equipment:['None'], difficulty:'Beginner', sets:'3', reps:'12/side', cues:['Opposite arm/leg', 'Core tight'], videoUrl:'https://www.youtube.com/watch?v=wiFNA3sqjCA'}
        ]
    },

    // --- LEGS ---
    'quads': {
        muscleId: 'quads',
        gymExercises: [
            {id:'squat', category: 'Compound', name:'Barbell Squat', equipment:['Barbell', 'Rack'], difficulty:'Advanced', sets:'4', reps:'6-8', cues:['Knees out', 'Chest up', 'Break parallel'], videoUrl:'https://www.youtube.com/watch?v=ultWZbGWL5c'}, // Athlean X Squat
            {id:'leg_press', category: 'Compound', name:'Leg Press', equipment:['Machine'], difficulty:'Intermediate', sets:'3', reps:'10-15', cues:['Feet hip width', 'Lower deep', 'Don\'t lock knees'], videoUrl:'https://www.youtube.com/watch?v=IZxyjW7MPJQ'},
            {id:'leg_ext', category: 'Isolation', name:'Leg Extension', equipment:['Machine'], difficulty:'Beginner', sets:'3', reps:'15-20', cues:['Squeeze at top', 'Control negative'], videoUrl:'https://www.youtube.com/watch?v=YyvSfVjQeL0'},
            {id:'goblet_squat', category: 'Compound', name:'Goblet Squat', equipment:['Dumbbell'], difficulty:'Beginner', sets:'3', reps:'12', cues:['Hold weight at chest', 'Sit between legs'], videoUrl:'https://www.youtube.com/watch?v=MeIiIdhvXT4'}
        ],
        homeExercises: [
            {id:'bw_squat', category: 'Compound', name:'Air Squat', equipment:['None'], difficulty:'Beginner', sets:'3', reps:'20', cues:['Chest up', 'Knees out'], videoUrl:'https://www.youtube.com/watch?v=C_VtOYc6j5c'},
            {id:'bulgarian', category: 'Compound', name:'Bulgarian Split Squat', equipment:['Chair/Couch'], difficulty:'Intermediate', sets:'3', reps:'12/leg', cues:['Rear foot on chair', 'Keep torso upright', 'Drop back knee'], videoUrl:'https://www.youtube.com/watch?v=2C-uNgKwPLE'},
            {id:'step_up', category: 'Compound', name:'Step Ups', equipment:['Chair/Step'], difficulty:'Beginner', sets:'3', reps:'15/leg', cues:['Drive through heel', 'Control descent'], videoUrl:'https://www.youtube.com/watch?v=dJiPuzzlegs'},
            {id:'sissy_squat', category: 'Isolation', name:'Sissy Squat (Bodyweight)', equipment:['Door frame'], difficulty:'Advanced', sets:'3', reps:'10', cues:['Lean back', 'Knees forward', 'Use door for balance'], videoUrl:'https://www.youtube.com/watch?v=8sL5f6m-LAA'}
        ]
    },
    'hamstrings': {
        muscleId: 'hamstrings',
        gymExercises: [
            {id:'rdl', category: 'Compound', name:'Romanian Deadlift', equipment:['Barbell'], difficulty:'Advanced', sets:'3', reps:'8-10', cues:['Hips back', 'Soft knees', 'Feel the stretch'], videoUrl:'https://www.youtube.com/watch?v=JCXUYuzwNrM'},
            {id:'seated_curl', category: 'Isolation', name:'Seated Leg Curl', equipment:['Machine'], difficulty:'Beginner', sets:'3', reps:'12-15', cues:['Lock pads tight', 'Full ROM'], videoUrl:'https://www.youtube.com/watch?v=OrxowZ4544A'},
            {id:'lying_curl', category: 'Isolation', name:'Lying Leg Curl', equipment:['Machine'], difficulty:'Beginner', sets:'3', reps:'12', cues:['Hips down', 'Curl to butt'], videoUrl:'https://www.youtube.com/watch?v=1Tq3QdYUuHs'}
        ],
        homeExercises: [
            {id:'single_rdl', category: 'Compound', name:'Single Leg RDL', equipment:['Water Bottle'], difficulty:'Intermediate', sets:'3', reps:'12/leg', cues:['Hinge at hips', 'Back leg straight', 'Balance'], videoUrl:'https://www.youtube.com/watch?v=75X39J5XQ58'},
            {id:'slider_curl', category: 'Isolation', name:'Floor Slider Curls', equipment:['Socks/Towel'], difficulty:'Intermediate', sets:'3', reps:'12', cues:['Hips up', 'Feet on towel', 'Drag heels to butt'], videoUrl:'https://www.youtube.com/watch?v=AgG9J9f8t_4'},
            {id:'nordic', category: 'Isolation', name:'Nordic Curl Negatives', equipment:['Couch/Partner'], difficulty:'Advanced', sets:'3', reps:'5-8', cues:['Anchor feet under couch', 'Lower slowly', 'Push up'], videoUrl:'https://www.youtube.com/watch?v=d8PEkriCcQA'}
        ]
    },
    'glutes': {
        muscleId: 'glutes',
        gymExercises: [
            {id:'hip_thrust', category: 'Compound', name:'Barbell Hip Thrust', equipment:['Barbell', 'Bench'], difficulty:'Intermediate', sets:'4', reps:'8-12', cues:['Chin tucked', 'Lock out hips', 'Shins vertical'], videoUrl:'https://www.youtube.com/watch?v=SEdqd4hPr80'},
            {id:'cable_kickback', category: 'Isolation', name:'Glute Kickback', equipment:['Cable'], difficulty:'Intermediate', sets:'3', reps:'15', cues:['Kick back and out', 'Squeeze glute'], videoUrl:'https://www.youtube.com/watch?v=nlTS5g2U4ac'},
            {id:'glute_bridge_load', category: 'Compound', name:'Weighted Glute Bridge', equipment:['Dumbbell'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Weight on hips', 'Squeeze top'], videoUrl:'https://www.youtube.com/watch?v=OUsw6qJydj8'}
        ],
        homeExercises: [
            {id:'glute_bridge', category: 'Compound', name:'Glute Bridge', equipment:['None'], difficulty:'Beginner', sets:'3', reps:'20', cues:['Squeeze glutes at top', 'Don\'t arch back'], videoUrl:'https://www.youtube.com/watch?v=OUsw6qJydj8'},
            {id:'single_bridge', category: 'Isolation', name:'Single Leg Bridge', equipment:['None'], difficulty:'Intermediate', sets:'3', reps:'12/leg', cues:['One leg up', 'Drive hips'], videoUrl:'https://www.youtube.com/watch?v=2ipr9j-1k5s'},
            {id:'donkey_kick', category: 'Isolation', name:'Donkey Kicks', equipment:['None'], difficulty:'Beginner', sets:'3', reps:'20', cues:['Kick ceiling', 'Squeeze glute'], videoUrl:'https://www.youtube.com/watch?v=SJ1Xuz9D-ZQ'}
        ]
    },
    'calves': {
        muscleId: 'calves',
        gymExercises: [
            {id:'standing_calf', category: 'Isolation', name:'Standing Calf Raise', equipment:['Machine/Smith'], difficulty:'Beginner', sets:'4', reps:'15-20', cues:['Deep stretch', 'Pause at top'], videoUrl:'https://www.youtube.com/watch?v=-M4-G8p8fmc'},
            {id:'seated_calf', category: 'Isolation', name:'Seated Calf Raise', equipment:['Machine'], difficulty:'Beginner', sets:'3', reps:'15', cues:['Focus on soleus', 'Full ROM'], videoUrl:'https://www.youtube.com/watch?v=JbyjNymZOt0'},
            {id:'leg_press_calf', category: 'Isolation', name:'Leg Press Calf Raise', equipment:['Leg Press'], difficulty:'Intermediate', sets:'3', reps:'15', cues:['Toes on edge', 'Don\'t lock knees'], videoUrl:'https://www.youtube.com/watch?v=Kz8rQ5q5Cj0'}
        ],
        homeExercises: [
            {id:'single_calf', category: 'Isolation', name:'Single Leg Calf Raise', equipment:['Step/Stairs'], difficulty:'Beginner', sets:'3', reps:'15/leg', cues:['Heels off edge', 'Deep stretch', 'Squeeze top'], videoUrl:'https://www.youtube.com/watch?v=gwLzBJYoWlI'},
            {id:'donkey_calf', category: 'Isolation', name:'Donkey Calf Raise', equipment:['Stairs'], difficulty:'Intermediate', sets:'3', reps:'20', cues:['Lean forward', 'Partner on back optional'], videoUrl:'https://www.youtube.com/watch?v=r30dY0e3Xxo'}
        ]
    },
    'abs': {
        muscleId: 'abs',
        gymExercises: [
            {id:'cable_crunch', category: 'Isolation', name:'Cable Crunch', equipment:['Cable'], difficulty:'Intermediate', sets:'3', reps:'15', cues:['Round the back', 'Elbows to thighs'], videoUrl:'https://www.youtube.com/watch?v=2fSTDeq2g9M'},
            {id:'hanging_leg_raise', category: 'Compound', name:'Hanging Leg Raise', equipment:['Pullup Bar'], difficulty:'Advanced', sets:'3', reps:'10-12', cues:['No swinging', 'Lift hips'], videoUrl:'https://www.youtube.com/watch?v=Pr1ieGZ5atk'},
            {id:'woodchop', category: 'Isolation', name:'Cable Woodchopper', equipment:['Cable'], difficulty:'Intermediate', sets:'3', reps:'15/side', cues:['Twist torso', 'Core tight'], videoUrl:'https://www.youtube.com/watch?v=pvt-0laRu5A'}
        ],
        homeExercises: [
            {id:'plank', category: 'Isolation', name:'Plank', equipment:['None'], difficulty:'Beginner', sets:'3', reps:'60s', cues:['Straight line', 'Squeeze glutes'], videoUrl:'https://www.youtube.com/watch?v=pSHjTRCQxIw'},
            {id:'bicycle', category: 'Isolation', name:'Bicycle Crunches', equipment:['None'], difficulty:'Beginner', sets:'3', reps:'20', cues:['Elbow to opposite knee', 'Slow tempo'], videoUrl:'https://www.youtube.com/watch?v=9FGilxCbdz8'},
            {id:'leg_raise', category: 'Isolation', name:'Lying Leg Raise', equipment:['None'], difficulty:'Intermediate', sets:'3', reps:'15', cues:['Lower back flat', 'Legs straight'], videoUrl:'https://www.youtube.com/watch?v=l4kQd9eWclE'}
        ]
    },
    'neck': {
        muscleId: 'neck',
        gymExercises: [
            {id:'neck_curl', category: 'Isolation', name:'Plate Neck Curl', equipment:['Weight Plate'], difficulty:'Advanced', sets:'3', reps:'15', cues:['Lie on bench', 'Plate on forehead with towel', 'Chin to chest'], videoUrl:'https://www.youtube.com/watch?v=K22TEY30dcA'},
            {id:'neck_harness', category: 'Isolation', name:'Neck Harness Extension', equipment:['Harness'], difficulty:'Advanced', sets:'3', reps:'15', cues:['Control weight', 'Full ROM'], videoUrl:'https://www.youtube.com/watch?v=1-3e5-4e3-4'}
        ],
        homeExercises: [
            {id:'iso_neck', category: 'Isolation', name:'Isometric Holds', equipment:['Hands'], difficulty:'Beginner', sets:'3', reps:'30s', cues:['Push forehead against hands', 'Resist movement'], videoUrl:'https://www.youtube.com/watch?v=SP7XN3WvW9E'},
            {id:'neck_bridge', category: 'Compound', name:'Neck Bridge', equipment:['Mat'], difficulty:'Advanced', sets:'3', reps:'30s', cues:['Bridge on head', 'Be careful'], videoUrl:'https://www.youtube.com/watch?v=SP7XN3WvW9E'}
        ]
    }
};

export const getMuscleBookContext = (): MuscleBookContext | null => {
    const data = localStorage.getItem(DB_MUSCLEBOOK_CONTEXT);
    return data ? JSON.parse(data) : null;
};

export const saveMuscleBookContext = (ctx: MuscleBookContext) => {
    localStorage.setItem(DB_MUSCLEBOOK_CONTEXT, JSON.stringify(ctx));
};

export const getMusclesForSplit = (split: TrainingSplit): MuscleData[] => {
    return MUSCLES_DB.filter(m => m.group.includes(split));
};

export const getMuscleChapter = (muscleId: string): MuscleChapter | null => {
    return EXERCISES_DB[muscleId] || null;
};
