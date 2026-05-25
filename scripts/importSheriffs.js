require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const sheriffs = [

{
  name: "Todd E. Phelps",
  county: "Fairfax County",
  state: "VA",
},

{
  name: "Sean Casey",
  county: "Arlington County",
  state: "VA",
},

{
  name: "Stacey Kincaid",
  county: "Fairfax County",
  state: "VA",
},

{
  name: "Beth Arthur",
  county: "Arlington County",
  state: "VA",
},

{
  name: "Clarence Williams Jr.",
  county: "Petersburg County",
  state: "VA",
},

{
  name: "Howard Gregory",
  county: "Newport News County",
  state: "VA",
},

{
  name: "Jim O’Sullivan",
  county: "Fairfax City County",
  state: "VA",
},

{
  name: "Marvin “Andy” Taylor",
  county: "Alexandria County",
  state: "VA",
},

{
  name: "Antoine Mason",
  county: "Surry County",
  state: "VA",
},

{
  name: "Darryl Ford",
  county: "Chesapeake County",
  state: "VA",
},

{
  name: "Tyrone Foster",
  county: "Emporia County",
  state: "VA",
},

{
  name: "James Brown",
  county: "Dinwiddie County",
  state: "VA",
},

{
  name: "Randy Fisher",
  county: "Prince George County",
  state: "VA",
},

{
  name: "Ricky Gardner",
  county: "Nottoway County",
  state: "VA",
},

{
  name: "Tony Roper",
  county: "Buchanan County",
  state: "VA",
},

{
  name: "John Heath",
  county: "Carroll County",
  state: "VA",
},

{
  name: "David Hill",
  county: "Charlotte County",
  state: "VA",
},

{
  name: "Sean Reeves",
  county: "Brunswick County",
  state: "VA",
},

{
  name: "Brian Hieatt",
  county: "Shenandoah County",
  state: "VA",
},

{
  name: "Jeff Walton",
  county: "Spotsylvania County",
  state: "VA",
},

{
  name: "Mike Hall",
  county: "West Point County",
  state: "VA",
},

{
  name: "Scott Jenkins",
  county: "Madison County",
  state: "VA",
},

{
  name: "Michael Brown",
  county: "Roanoke County",
  state: "VA",
},

];

async function run() {

  const formatted = sheriffs.map((s) => ({
    name: s.name,
    title: "Sheriff",
    category: "Sheriffs",
    county: s.county,
    state: s.state,
    city: "",
    zip_code: "",
    source: "manual",
  }));

  const { error } = await supabase
    .from("representatives")
    .upsert(formatted, {
      onConflict: "name",
    });

  if (error) {
    console.error(error);
    return;
  }

  console.log("SHERIFFS IMPORTED");
}

run();