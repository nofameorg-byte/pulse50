import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const zipcode =
      searchParams.get("zipcode") || "29805";

    const apiKey =
      process.env.OPENSTATES_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing OpenStates API key",
        },
        { status: 500 }
      );
    }

    // ZIP → Coordinates
    const geoRes = await fetch(
      `https://api.zippopotam.us/us/${zipcode}`
    );

    if (!geoRes.ok) {
      return NextResponse.json(
        {
          error:
            "Invalid ZIP code",
        },
        { status: 400 }
      );
    }

    const geoData = await geoRes.json();

    const lat =
      geoData.places[0].latitude;

    const lng =
      geoData.places[0].longitude;

    // OpenStates lookup
    const response = await fetch(
      `https://v3.openstates.org/people.geo?lat=${lat}&lng=${lng}`,
      {
        headers: {
          "X-API-KEY": apiKey,
        },
      }
    );

    const data =
      await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Server error",
      },
      { status: 500 }
    );
  }
}