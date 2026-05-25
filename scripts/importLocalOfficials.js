require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function importGovernors() {
  console.log("IMPORTING GOVERNORS...");

  const governors = [
  { name: "Kay Ivey", state: "AL" },
  { name: "Mike Dunleavy", state: "AK" },
  { name: "Katie Hobbs", state: "AZ" },
  { name: "Sarah Huckabee Sanders", state: "AR" },
  { name: "Gavin Newsom", state: "CA" },
  { name: "Jared Polis", state: "CO" },
  { name: "Ned Lamont", state: "CT" },
  { name: "John Carney", state: "DE" },
  { name: "Ron DeSantis", state: "FL" },
  { name: "Brian Kemp", state: "GA" },
  { name: "Josh Green", state: "HI" },
  { name: "Brad Little", state: "ID" },
  { name: "J.B. Pritzker", state: "IL" },
  { name: "Eric Holcomb", state: "IN" },
  { name: "Kim Reynolds", state: "IA" },
  { name: "Laura Kelly", state: "KS" },
  { name: "Andy Beshear", state: "KY" },
  { name: "Jeff Landry", state: "LA" },
  { name: "Janet Mills", state: "ME" },
  { name: "Wes Moore", state: "MD" },
  { name: "Maura Healey", state: "MA" },
  { name: "Gretchen Whitmer", state: "MI" },
  { name: "Tim Walz", state: "MN" },
  { name: "Tate Reeves", state: "MS" },
  { name: "Mike Parson", state: "MO" },
  { name: "Greg Gianforte", state: "MT" },
  { name: "Jim Pillen", state: "NE" },
  { name: "Joe Lombardo", state: "NV" },
  { name: "Chris Sununu", state: "NH" },
  { name: "Phil Murphy", state: "NJ" },
  { name: "Michelle Lujan Grisham", state: "NM" },
  { name: "Kathy Hochul", state: "NY" },
  { name: "Roy Cooper", state: "NC" },
  { name: "Doug Burgum", state: "ND" },
  { name: "Mike DeWine", state: "OH" },
  { name: "Kevin Stitt", state: "OK" },
  { name: "Tina Kotek", state: "OR" },
  { name: "Josh Shapiro", state: "PA" },
  { name: "Dan McKee", state: "RI" },
  { name: "Henry McMaster", state: "SC" },
  { name: "Kristi Noem", state: "SD" },
  { name: "Bill Lee", state: "TN" },
  { name: "Greg Abbott", state: "TX" },
  { name: "Spencer Cox", state: "UT" },
  { name: "Phil Scott", state: "VT" },
  { name: "Glenn Youngkin", state: "VA" },
  { name: "Jay Inslee", state: "WA" },
  { name: "Jim Justice", state: "WV" },
  { name: "Tony Evers", state: "WI" },
  { name: "Mark Gordon", state: "WY" },
];

  const formatted = governors.map((gov) => ({
    name: gov.name,
    title: "Governor",
    category: "Governors",
    state: gov.state,
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

  console.log(`Imported ${formatted.length} governors`);
}

async function importMayors() {
  console.log("IMPORTING MAYORS...");

  const mayors = [
    {
      name: "Brandon Johnson",
      city: "Chicago",
      state: "IL",
    },
    {
      name: "Eric Adams",
      city: "New York",
      state: "NY",
    },
    {
      name: "Karen Bass",
      city: "Los Angeles",
      state: "CA",
    },
    {
      name: "Daniel Rickenmann",
      city: "Columbia",
      state: "SC",
    },
  ];

  const formatted = mayors.map((mayor) => ({
    name: mayor.name,
    title: "Mayor",
    category: "Mayors",
    city: mayor.city,
    state: mayor.state,
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

  console.log(`Imported ${formatted.length} mayors`);
}

async function importSheriffs() {
  console.log("IMPORTING SHERIFFS...");

  const sheriffs = [
    {
      name: "Lee Foster",
      county: "Aiken",
      state: "SC",
    },
    {
      name: "Leon Lott",
      county: "Richland",
      state: "SC",
    },
  ];

  const formatted = sheriffs.map((sheriff) => ({
    name: sheriff.name,
    title: "Sheriff",
    category: "Sheriffs",
    county: sheriff.county,
    state: sheriff.state,
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

  console.log(`Imported ${formatted.length} sheriffs`);
}

async function run() {
  await importGovernors();

  await new Promise((r) =>
    setTimeout(r, 1000)
  );

  await importMayors();

  await new Promise((r) =>
    setTimeout(r, 1000)
  );

  await importSheriffs();

  console.log("DONE");
}

run();