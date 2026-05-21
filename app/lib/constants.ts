// ── Category definitions ──────────────────────────────────────────────────────
export const CATEGORIES = [
  { id: "all",           label: "All",            icon: "⚡" },
  { id: "federal",       label: "Federal",         icon: "🏛" },
  { id: "governor",      label: "Governors",       icon: "🏛" },
  { id: "state",         label: "State Reps",      icon: "📋" },
  { id: "mayor",         label: "Mayors",          icon: "🏙" },
  { id: "sheriff",       label: "Sheriffs",        icon: "⭐" },
  { id: "judge",         label: "Judges",          icon: "⚖️" },
  { id: "school_board",  label: "School Boards",   icon: "🎓" },
  { id: "city_council",  label: "City Councils",   icon: "🏘" },
  { id: "bill",          label: "Bills & Policies",icon: "📜" },
  { id: "local_issue",   label: "Local Issues",    icon: "📍" },
] as const;

export type CategoryId = typeof CATEGORIES[number]["id"];

export const CATEGORY_COLORS: Record<string, string> = {
  federal:      "bg-yellow-400 text-black",
  governor:     "bg-blue-500 text-white",
  state:        "bg-purple-500 text-white",
  mayor:        "bg-orange-500 text-white",
  sheriff:      "bg-amber-600 text-white",
  judge:        "bg-slate-500 text-white",
  school_board: "bg-green-600 text-white",
  city_council: "bg-teal-500 text-white",
  bill:         "bg-indigo-500 text-white",
  local_issue:  "bg-rose-500 text-white",
};

export const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","Washington D.C.",
] as const;

export const STATE_ABBR: Record<string, string> = {
  "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA",
  "Colorado":"CO","Connecticut":"CT","Delaware":"DE","Florida":"FL","Georgia":"GA",
  "Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA",
  "Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD",
  "Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS",
  "Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH",
  "New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC",
  "North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA",
  "Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN",
  "Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA",
  "West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY","Washington D.C.":"DC",
};
