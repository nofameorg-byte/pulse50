require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const API_KEY =
  process.env.OPENSTATES_API_KEY;

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

async function importState(state) {
  try {
    console.log(`IMPORTING ${state}...`);

    const response = await fetch(
      `https://v3.openstates.org/people?jurisdiction=${state}&per_page=50`,
      {
        headers: {
          "X-API-KEY": API_KEY,
        },
      }
    );

    const data = await response.json();

    if (!data.results) {
      console.log(
        `No results for ${state}`
      );
      return;
    }

    const officials = data.results.map(
      (rep) => ({
        name:
          rep.name || "Unknown",

        title:
          rep.current_role?.title ||
          "Official",

        state,

        category:
          rep.current_role?.title
            ?.toLowerCase()
            .includes("senator")
            ? "Senate"
            : rep.current_role?.title
                ?.toLowerCase()
                .includes("governor")
            ? "Governor"
            : "House",

        city: "",

        county: "",

        zip_code: "",

        image_url:
          rep.image || "",

        party:
          rep.party || "",

        district:
          rep.current_role?.district || "",

        source: "openstates",
      })
    );

    const { error } = await supabase
      .from("representatives")
      .upsert(officials, {
        onConflict: "name",
      });

    if (error) {
      console.error(
        `SUPABASE ERROR ${state}:`,
        error
      );
      return;
    }

    console.log(
      `Imported ${officials.length} officials from ${state}`
    );
  } catch (err) {
    console.error(
      `IMPORT FAILED ${state}:`,
      err
    );
  }
}

async function run() {
  for (const state of STATES) {
    await importState(state);

    console.log(
      "WAITING 7 SECONDS..."
    );

    await new Promise((r) =>
      setTimeout(r, 7000)
    );
  }

  console.log(
    "DONE IMPORTING STATES"
  );
}

run();