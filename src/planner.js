const CITY_DATA = {
  Bangalore: {
    activities: [
      { name: "Lalbagh morning nature walk", tags: ["walks", "nature"], mood: ["tired", "calm"], cost: 50, durationMins: 75, crowded: false },
      { name: "Artisan coffee tasting at HSR", tags: ["food", "coffee"], mood: ["tired", "cozy"], cost: 350, durationMins: 60, crowded: false },
      { name: "Indie acoustic set at a quiet cafe", tags: ["music"], mood: ["fun", "uplift"], cost: 400, durationMins: 90, crowded: false },
      { name: "Board game social at Church Street", tags: ["games", "music"], mood: ["fun"], cost: 500, durationMins: 120, crowded: true },
      { name: "Lake-side sunset walk at Kaikondrahalli", tags: ["walks"], mood: ["tired", "reflective"], cost: 0, durationMins: 60, crowded: false }
    ],
    food: [
      { name: "South Indian vegetarian thali", type: "vegetarian", cost: 300, crowded: false },
      { name: "Farm-to-table salad bowl", type: "vegetarian", cost: 450, crowded: false },
      { name: "Budget street chaat trail", type: "vegetarian", cost: 180, crowded: true },
      { name: "Live grill dinner", type: "non-vegetarian", cost: 900, crowded: true }
    ]
  },
  Mumbai: {
    activities: [
      { name: "Bandra sea-face sunset walk", tags: ["walks"], mood: ["tired", "calm"], cost: 0, durationMins: 60, crowded: false },
      { name: "Vinyl listening session", tags: ["music"], mood: ["cozy", "fun"], cost: 500, durationMins: 90, crowded: false }
    ],
    food: [
      { name: "Coastal vegetarian meal", type: "vegetarian", cost: 500, crowded: false }
    ]
  }
};

const DEFAULT_CITY = "Bangalore";

function parseAvailableTime(raw) {
  if (!raw) return 240;
  const txt = String(raw).toLowerCase();
  const hoursMatch = txt.match(/(\d+)\s*hour/);
  const minsMatch = txt.match(/(\d+)\s*min/);
  const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
  const mins = minsMatch ? Number(minsMatch[1]) : 0;
  const total = (hours * 60) + mins;
  return total > 0 ? total : 240;
}

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map(v => v.trim()).filter(Boolean);
  return String(value).split(/,|\n/).map(v => v.trim()).filter(Boolean);
}

function parseFreeText(input) {
  const text = String(input || "").toLowerCase();
  const city = Object.keys(CITY_DATA).find(c => text.includes(c.toLowerCase())) || DEFAULT_CITY;
  const budgetMatch = text.match(/(?:budget|under|around)\s*(?:rs\.?|inr)?\s*(\d{2,6})/i) || text.match(/\b(\d{3,6})\b/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : 2000;
  const available_time = text.match(/\d+\s*(?:hour|hr|min)/) ? text.match(/\d+\s*(?:hour|hr|min)/i)[0] : "4 hours";
  const moods = ["tired", "fun", "cozy", "calm", "adventurous", "relaxed"];
  const interestsPool = ["food", "music", "walks", "nature", "coffee", "games"];
  const detectedMood = moods.find(m => text.includes(m)) || "wants something fun";
  const interests = interestsPool.filter(i => text.includes(i));
  const constraints = [];
  if (text.includes("vegetarian") || text.includes("veg")) constraints.push("vegetarian");
  if (text.includes("avoid crowded") || text.includes("not crowded") || text.includes("quiet")) constraints.push("avoid crowded places");

  return {
    city,
    budget,
    available_time,
    mood: detectedMood,
    interests: interests.length ? interests : ["food", "walks"],
    constraints
  };
}

function parseUserPreferences(input) {
  if (!input) {
    return {
      parsed: {
        city: DEFAULT_CITY,
        budget: 2000,
        available_time: "4 hours",
        mood: "wants something fun",
        interests: ["food", "music"],
        constraints: []
      },
      warnings: ["No input provided. Using default preferences."]
    };
  }

  const base = typeof input === "string" ? parseFreeText(input) : {
    city: input.city || DEFAULT_CITY,
    budget: Number(input.budget) || 2000,
    available_time: input.available_time || "4 hours",
    mood: input.mood || "wants something fun",
    interests: parseList(input.interests),
    constraints: parseList(input.constraints)
  };

  const warnings = [];
  if (!base.city) {
    base.city = DEFAULT_CITY;
    warnings.push(`City was unclear, defaulted to ${DEFAULT_CITY}.`);
  }
  if (!base.interests.length) {
    warnings.push("Interests were missing, defaulted to food and walks.");
    base.interests = ["food", "walks"];
  }

  return { parsed: base, warnings };
}

function getActivityOptions(city, interests, mood, constraints = []) {
  const cityData = CITY_DATA[city] || CITY_DATA[DEFAULT_CITY];
  const avoidsCrowd = constraints.some(c => c.toLowerCase().includes("avoid crowded"));

  return cityData.activities.filter(activity => {
    const interestHit = interests.some(interest => activity.tags.includes(interest.toLowerCase()));
    const moodHit = activity.mood.some(m => mood.toLowerCase().includes(m)) || mood.toLowerCase().includes("fun");
    const crowdHit = avoidsCrowd ? !activity.crowded : true;
    return interestHit && moodHit && crowdHit;
  });
}

function getFoodOptions(city, budget, constraints = []) {
  const cityData = CITY_DATA[city] || CITY_DATA[DEFAULT_CITY];
  const vegetarianOnly = constraints.some(c => c.toLowerCase().includes("vegetarian"));
  const avoidsCrowd = constraints.some(c => c.toLowerCase().includes("avoid crowded"));

  return cityData.food.filter(item => {
    const foodTypeHit = vegetarianOnly ? item.type === "vegetarian" : true;
    const crowdHit = avoidsCrowd ? !item.crowded : true;
    const budgetHit = item.cost <= budget;
    return foodTypeHit && crowdHit && budgetHit;
  });
}

function estimateCost(planItems = []) {
  return planItems.reduce((sum, item) => sum + (item.cost || 0), 0);
}

function validatePlan(plan, constraints = [], budget = 2000, availableTimeMins = 240) {
  const reasons = [];
  const avoidsCrowd = constraints.some(c => c.toLowerCase().includes("avoid crowded"));
  const vegetarianOnly = constraints.some(c => c.toLowerCase().includes("vegetarian"));

  const totalCost = estimateCost(plan);
  const totalDuration = plan.reduce((sum, step) => sum + (step.durationMins || 0), 0);

  if (totalCost > budget) reasons.push(`Estimated cost ₹${totalCost} exceeds budget ₹${budget}.`);
  if (totalDuration > availableTimeMins) reasons.push(`Estimated duration ${Math.ceil(totalDuration / 60)}h exceeds available time.`);
  if (avoidsCrowd && plan.some(step => step.crowded)) reasons.push("Plan includes crowded options despite crowd constraint.");
  if (vegetarianOnly && plan.some(step => step.type === "non-vegetarian")) reasons.push("Plan includes non-vegetarian option despite vegetarian constraint.");

  return {
    valid: reasons.length === 0,
    reasons,
    totalCost,
    totalDuration
  };
}

function summarizeFit(step, preferences) {
  const reasons = [];
  if (preferences.interests.some(i => step.tags?.includes(i.toLowerCase()))) {
    reasons.push(`matches your interest in ${step.tags.find(t => preferences.interests.includes(t) || preferences.interests.includes(t.toLowerCase()))}`);
  }
  if (preferences.mood && step.mood?.some(m => preferences.mood.toLowerCase().includes(m))) {
    reasons.push(`fits your mood (${preferences.mood})`);
  }
  if (step.crowded === false && preferences.constraints.some(c => c.toLowerCase().includes("avoid crowded"))) {
    reasons.push("keeps things relatively uncrowded");
  }
  return reasons.length ? reasons.join(", ") : "fits your overall Saturday preferences";
}

function generateFinalPlan(context) {
  const { preferences, activityOptions, foodOptions } = context;
  const availableMins = parseAvailableTime(preferences.available_time);
  const plan = [];

  let usedMins = 0;
  let spent = 0;

  const candidateActivities = [...activityOptions].sort((a, b) => a.cost - b.cost);
  for (const activity of candidateActivities) {
    if (usedMins + activity.durationMins > availableMins * 0.75) continue;
    if (spent + activity.cost > preferences.budget * 0.8) continue;
    plan.push({ ...activity, kind: "activity" });
    usedMins += activity.durationMins;
    spent += activity.cost;
    if (plan.length >= 2) break;
  }

  const foodPick = foodOptions.sort((a, b) => a.cost - b.cost)[0];
  if (foodPick && usedMins + 60 <= availableMins && spent + foodPick.cost <= preferences.budget) {
    plan.push({ ...foodPick, kind: "food", durationMins: 60, tags: ["food"], mood: ["cozy", "relaxed"] });
    usedMins += 60;
    spent += foodPick.cost;
  }

  if (!plan.length) {
    return {
      plan: [
        {
          kind: "fallback",
          name: "Quiet at-home reset + nearby short walk",
          durationMins: Math.min(90, availableMins),
          cost: 100,
          crowded: false,
          why: "No good city options matched all constraints, so this fallback keeps the day calm, affordable, and practical."
        }
      ],
      usedFallback: true
    };
  }

  return { plan, usedFallback: false };
}

function createSaturdayPlan(input) {
  const trace = [];

  trace.push({ tool: "parseUserPreferences", status: "started" });
  const { parsed: preferences, warnings } = parseUserPreferences(input);
  trace.push({ tool: "parseUserPreferences", status: "completed", details: { preferences, warnings } });

  if (!preferences.city || preferences.interests.length === 0) {
    return {
      success: false,
      clarifyingQuestions: [
        "Which city should I plan for?",
        "What 2-3 interests should I prioritize?"
      ],
      trace
    };
  }

  trace.push({ tool: "getActivityOptions", status: "started" });
  const activityOptions = getActivityOptions(preferences.city, preferences.interests, preferences.mood, preferences.constraints);
  trace.push({ tool: "getActivityOptions", status: "completed", details: { count: activityOptions.length } });

  trace.push({ tool: "getFoodOptions", status: "started" });
  const foodOptions = getFoodOptions(preferences.city, preferences.budget, preferences.constraints);
  trace.push({ tool: "getFoodOptions", status: "completed", details: { count: foodOptions.length } });

  trace.push({ tool: "generateFinalPlan", status: "started" });
  const generated = generateFinalPlan({ preferences, activityOptions, foodOptions });
  trace.push({ tool: "generateFinalPlan", status: "completed", details: { steps: generated.plan.length, usedFallback: generated.usedFallback } });

  trace.push({ tool: "estimateCost", status: "started" });
  const totalCost = estimateCost(generated.plan);
  trace.push({ tool: "estimateCost", status: "completed", details: { totalCost } });

  trace.push({ tool: "validatePlan", status: "started" });
  const validation = validatePlan(generated.plan, preferences.constraints, preferences.budget, parseAvailableTime(preferences.available_time));
  trace.push({ tool: "validatePlan", status: "completed", details: validation });

  const enrichedPlan = generated.plan.map((step, index) => ({
    step: index + 1,
    name: step.name,
    duration: `${step.durationMins} mins`,
    estimatedCost: step.cost,
    whyThisFits: step.why || summarizeFit(step, preferences)
  }));

  const tradeOffs = [];
  if (!foodOptions.length) {
    tradeOffs.push("No food option fully matched your constraints within budget, so I prioritized activities and a fallback meal idea.");
  }
  if (validation.totalDuration < parseAvailableTime(preferences.available_time)) {
    tradeOffs.push("I left a little buffer time so the plan feels relaxed instead of rushed.");
  }

  return {
    success: true,
    preferences,
    warnings,
    plan: enrichedPlan,
    summary: {
      estimatedTotalCost: validation.totalCost,
      estimatedTotalDurationMinutes: validation.totalDuration,
      budget: preferences.budget,
      availableTime: preferences.available_time,
      validAgainstConstraints: validation.valid,
      validationNotes: validation.reasons
    },
    tradeOffs,
    trace
  };
}

module.exports = {
  parseUserPreferences,
  getActivityOptions,
  getFoodOptions,
  estimateCost,
  validatePlan,
  generateFinalPlan,
  createSaturdayPlan,
  parseAvailableTime
};
