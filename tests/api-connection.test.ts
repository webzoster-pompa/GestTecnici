import { describe, it, expect } from "vitest";

describe("API Connection Test", () => {
  it("should connect to API server and get response", async () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
    
    // Test health endpoint
    const response = await fetch(`${apiUrl}/api/health`);
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty("ok");
    expect(data.ok).toBe(true);
    expect(data).toHaveProperty("timestamp");
  });

  it("should have valid API_BASE_URL configured", () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    
    expect(apiUrl).toBeDefined();
    expect(apiUrl).toContain("https://");
    expect(apiUrl).toContain("3000-");
  });
});
