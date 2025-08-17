// Debug script to check environment variables
// Run with: node debug-env.js

console.log("🔍 Environment Variables Debug");
console.log("===============================");

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log("All AIML-related environment variables:");
Object.keys(process.env)
  .filter(key => key.includes('AIML'))
  .forEach(key => {
    const value = process.env[key];
    console.log(`${key}: "${value}" (length: ${value?.length || 0})`);
    
    // Check for problematic characters
    if (value) {
      const hasTrailingSlash = value.endsWith('\\');
      const hasTrailingSpace = value !== value.trim();
      
      if (hasTrailingSlash) console.log(`  ⚠️  Has trailing backslash!`);
      if (hasTrailingSpace) console.log(`  ⚠️  Has trailing whitespace!`);
      
      // Show character codes for the last few characters
      const lastChars = value.slice(-3);
      console.log(`  Last 3 chars: [${lastChars.split('').map(c => c.charCodeAt(0)).join(', ')}]`);
    }
  });

console.log("\nExpected values:");
console.log("AIMLAPI_KEY: your-api-key-here");
console.log("AIMLAPI_BASE_URL: https://api.aimlapi.com");
console.log("AIMLAPI_MODEL: gpt-4o");

console.log("\nNext.js environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Current working directory:", process.cwd());