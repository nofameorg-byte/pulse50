import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      `https://api.congress.gov/v3/bill?api_key=${process.env.CONGRESS_API_KEY}&limit=5`
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch Congress data" },
      { status: 500 }
    );
  }
}