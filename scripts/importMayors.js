require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const mayors = [
  {
    name: "Eric Adams",
    title: "Mayor",
    state: "NY",
    category: "Mayors",
    city: "New York",
  },
  {
    name: "Karen Bass",
    title: "Mayor",
    state: "CA",
    category: "Mayors",
    city: "Los Angeles",
  },
  {
    name: "Brandon Johnson",
    title: "Mayor",
    state: "IL",
    category: "Mayors",
    city: "Chicago",
  },
  {
    name: "Daniel Lurie",
    title: "Mayor",
    state: "CA",
    category: "Mayors",
    city: "San Francisco",
  },
  {
    name: "Muriel Bowser",
    title: "Mayor",
    state: "DC",
    category: "Mayors",
    city: "Washington",
  },
  {
    name: "Cherelle Parker",
    title: "Mayor",
    state: "PA",
    category: "Mayors",
    city: "Philadelphia",
  },
  {
    name: "Mike Duggan",
    title: "Mayor",
    state: "MI",
    category: "Mayors",
    city: "Detroit",
  },
  {
    name: "Sylvester Turner",
    title: "Mayor",
    state: "TX",
    category: "Mayors",
    city: "Houston",
  },
  {
    name: "Ron Nirenberg",
    title: "Mayor",
    state: "TX",
    category: "Mayors",
    city: "San Antonio",
  },
  {
    name: "Todd Gloria",
    title: "Mayor",
    state: "CA",
    category: "Mayors",
    city: "San Diego",
  }
];

async function run() {
  const { error } = await supabase
    .from("representatives")
    .upsert(mayors, {
      onConflict: "name",
    });

  if (error) {
    console.error(error);
    return;
  }

  console.log("MAYORS IMPORTED");
}

run();