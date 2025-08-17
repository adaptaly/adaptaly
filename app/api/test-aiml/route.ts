// Test endpoint for AIMLAPI integration
import { NextRequest, NextResponse } from "next/server";
import { aimlapi } from "@/app/lib/aimlapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    console.log("🧪 Testing AIMLAPI integration...");
    
    // Test basic configuration
    const isConfigured = aimlapi.isConfigured();
    console.log("Configuration check:", isConfigured);
    
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: "AIMLAPI not configured - missing API key",
        debug: {
          hasApiKey: !!process.env.AIMLAPI_KEY,
          envVars: Object.keys(process.env).filter(k => k.includes('AIML'))
        }
      }, { status: 500 });
    }
    
    // Test simple chat call
    console.log("🚀 Making test chat call...");
    const testResponse = await aimlapi.chat([
      {
        role: "user",
        content: "Say 'Hello, AIMLAPI is working!' and nothing else."
      }
    ], { max_tokens: 50 });
    
    console.log("✅ Test response received:", testResponse);
    
    return NextResponse.json({
      success: true,
      message: "AIMLAPI is working correctly",
      testResponse,
      debug: {
        hasApiKey: !!process.env.AIMLAPI_KEY,
        baseURL: process.env.AIMLAPI_BASE_URL || "https://api.aimlapi.com",
        model: process.env.AIMLAPI_MODEL || "gpt-4o"
      }
    });
    
  } catch (error: any) {
    console.error("❌ AIMLAPI test failed:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      debug: {
        hasApiKey: !!process.env.AIMLAPI_KEY,
        envVars: Object.keys(process.env).filter(k => k.includes('AIML')),
        errorType: error.constructor.name,
        stack: error.stack
      }
    }, { status: 500 });
  }
}