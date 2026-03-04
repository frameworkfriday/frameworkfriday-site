import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, city, state, zip } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Submit to Coda table if API token is configured
    const codaToken = process.env.CODA_API_TOKEN;
    const codaDocId = process.env.CODA_DOC_ID;
    const codaTableId = process.env.CODA_EVENTS_TABLE_ID;

    if (codaToken && codaDocId && codaTableId) {
      const response = await fetch(
        `https://coda.io/apis/v1/docs/${codaDocId}/tables/${codaTableId}/rows`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${codaToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rows: [
              {
                cells: [
                  { column: "Name", value: name },
                  { column: "Email", value: email },
                  { column: "Phone", value: phone || "" },
                  { column: "City", value: city || "" },
                  { column: "State", value: state || "" },
                  { column: "Zip", value: zip || "" },
                  { column: "Submitted", value: new Date().toISOString() },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        console.error("Coda API error:", await response.text());
        return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
      }
    } else {
      // Log submission when Coda is not configured (development)
      console.log("Events waitlist submission:", { name, email, phone, city, state, zip });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Events waitlist error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
