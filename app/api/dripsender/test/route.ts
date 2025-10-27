import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Test a DripSender API key to check if it's working
 */
export async function POST(request: NextRequest) {
  try {
    const { apiKey, label } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API key is required" },
        { status: 400 }
      );
    }

    // Test the API key by sending to a test number (won't actually send)
    const response = await fetch("https://api.dripsender.id/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        phone: "6281234567890", // Test number
        text: "Test message - API key validation",
      }),
    });

    const responseData = await response.json();

    // Check if the response indicates the API key is valid
    // DripSender returns different error codes for invalid keys vs other errors
    if (response.ok) {
      return NextResponse.json({
        success: true,
        status: "working",
        message: "API key is valid and working",
        label: label || "Unknown",
      });
    } else {
      // Check error type
      const errorMessage =
        responseData.message || responseData.error || "Unknown error";

      // Common error patterns for invalid API keys
      const isInvalidKey =
        errorMessage.toLowerCase().includes("invalid") ||
        errorMessage.toLowerCase().includes("unauthorized") ||
        errorMessage.toLowerCase().includes("api key") ||
        response.status === 401 ||
        response.status === 403;

      if (isInvalidKey) {
        return NextResponse.json({
          success: false,
          status: "invalid",
          error: "Invalid or unauthorized API key",
          label: label || "Unknown",
          details: errorMessage,
        });
      } else {
        // Other errors (might still be a valid key, just other issues)
        return NextResponse.json({
          success: true,
          status: "working",
          message: "API key appears valid (other error encountered)",
          label: label || "Unknown",
          warning: errorMessage,
        });
      }
    }
  } catch (error) {
    console.error("[API TEST] Error:", error);
    return NextResponse.json(
      {
        success: false,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
