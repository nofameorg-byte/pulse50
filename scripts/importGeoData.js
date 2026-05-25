require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CENSUS_API_KEY =
  process.env.CENSUS_API_KEY;

const STATE_ABBREVIATIONS = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

async function importStates() {
  try {
    console.log("IMPORTING STATES...");

    const response = await fetch(
      `https://api.census.gov/data/2023/acs/acs1?get=NAME,B01003_001E&for=state:*&key=${CENSUS_API_KEY}`
    );

    const data = await response.json();

    const rows = data.slice(1);

    const seen = new Set();

    const formatted = [];

    for (const row of rows) {
      const stateName = row[0];

      const abbreviation =
        STATE_ABBREVIATIONS[stateName];

      if (!abbreviation) {
        console.log(
          `Missing abbreviation for ${stateName}`
        );
        continue;
      }

      if (seen.has(abbreviation)) {
        continue;
      }

      seen.add(abbreviation);

      formatted.push({
        name: stateName,
        abbreviation,
        population: parseInt(row[1] || 0),
        fips: row[2],
      });
    }

    const { error } = await supabase
      .from("states")
      .insert(formatted);

    if (error) {
      console.error(error);
      return;
    }

    console.log(
      `Imported ${formatted.length} states`
    );
  } catch (err) {
    console.error(
      "STATE IMPORT ERROR:",
      err
    );
  }
}

async function importCounties() {
  try {
    console.log("IMPORTING COUNTIES...");

    const response = await fetch(
      `https://api.census.gov/data/2023/acs/acs1?get=NAME,B01003_001E&for=county:*&key=${CENSUS_API_KEY}`
    );

    const data = await response.json();

    const statesResult = await supabase
      .from("states")
      .select("*");

    const states = statesResult.data || [];

    const counties = data.slice(1).map((row) => {
      const stateFips = row[3];

      const state = states.find(
        (s) => s.fips === stateFips
      );

      return {
        name: row[0],
        population: parseInt(row[1] || 0),
        fips: `${row[3]}${row[2]}`,
        state_id: state?.id || null,
      };
    });

    const { error } = await supabase
      .from("counties")
      .upsert(counties, {
        onConflict: "fips",
      });

    if (error) {
      console.error(error);
      return;
    }

    console.log(
      `Imported ${counties.length} counties`
    );
  } catch (err) {
    console.error(
      "COUNTY IMPORT ERROR:",
      err
    );
  }
}

async function run() {
  await importStates();

  await new Promise((r) =>
    setTimeout(r, 3000)
  );

  await importCounties();

  console.log(
    "DONE IMPORTING GEO DATA"
  );
}

run();