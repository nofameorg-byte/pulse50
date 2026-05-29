import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.CONGRESS_API_KEY;

  const response = await fetch(
    `https://api.congress.gov/v3/bill/119/hr/1/summaries?api_key=${apiKey}`
  );

  const data = await response.json();

  return NextResponse.json(data);
}