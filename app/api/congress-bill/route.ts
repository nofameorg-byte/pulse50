import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const congress = searchParams.get("congress");
    const type = searchParams.get("type");
    const number = searchParams.get("number");

    if (!congress || !type || !number) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing congress, type, or number parameter",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.CONGRESS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Congress API key",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.congress.gov/v3/bill/${congress}/${type}/${number}?api_key=${apiKey}`
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Congress API returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    let summaryText = "";

try {
  const summaryUrl =
    data?.bill?.summaries?.url;

  if (summaryUrl) {
    const summaryResponse =
      await fetch(
        `${summaryUrl}&api_key=${apiKey}`
      );

    if (summaryResponse.ok) {
      const summaryData =
        await summaryResponse.json();

      const summaries =
        summaryData?.summaries || [];

      if (summaries.length > 0) {
        summaryText =
          summaries[summaries.length - 1]
            ?.text || "";
      }
    }
  }
} catch (error) {
  console.error(
    "Summary fetch error:",
    error
  );
}

    console.log(
  JSON.stringify(data, null, 2)
);

return NextResponse.json({
  success: true,
  bill: data.bill || data,
  summary: summaryText,
});
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to fetch bill",
      },
      { status: 500 }
    );
  }
}