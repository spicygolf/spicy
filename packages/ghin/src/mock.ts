import type { AxiosRequestHeaders, AxiosResponse } from "axios";
import fs from "fs";
import path from "path";
import type { GhinRequest } from "./types";

const MOCK_DATA_DIR = path.join(__dirname, "..", "data", "mocks");

/**
 * Generate a mock file name based on the request parameters
 */
function generateMockFileName(request: GhinRequest): string {
  const { url, params } = request;

  // Clean up the URL to create a base filename
  const baseUrl = url
    .replace(/^\//, "")
    .replace(/\.json$/, "")
    .replace(/\//g, "_");

  // Create a hash of the parameters to differentiate requests
  if (params && Object.keys(params).length > 0) {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b)) // Sort for consistency
      .map(([key, value]) => `${key}-${value}`)
      .join("_")
      .replace(/[^a-zA-Z0-9_-]/g, ""); // Remove special characters

    return `${baseUrl}_${paramString}.json`;
  }

  return `${baseUrl}.json`;
}

/**
 * Find the best matching mock file for a request
 */
function findMockFile(request: GhinRequest): string | null {
  const exactFileName = generateMockFileName(request);
  const exactFilePath = path.join(MOCK_DATA_DIR, exactFileName);

  // Try exact match first
  if (fs.existsSync(exactFilePath)) {
    return exactFilePath;
  }

  // Try to find a fallback file based on the URL only
  const baseUrl = request.url
    .replace(/^\//, "")
    .replace(/\.json$/, "")
    .replace(/\//g, "_");
  const fallbackFileName = `${baseUrl}.json`;
  const fallbackFilePath = path.join(MOCK_DATA_DIR, fallbackFileName);

  if (fs.existsSync(fallbackFilePath)) {
    return fallbackFilePath;
  }

  // Try to find any file that starts with the base URL
  try {
    const files = fs.readdirSync(MOCK_DATA_DIR);
    const matchingFile = files.find(
      (file) => file.startsWith(baseUrl) && file.endsWith(".json"),
    );

    if (matchingFile) {
      return path.join(MOCK_DATA_DIR, matchingFile);
    }
  } catch (error) {
    console.warn("Could not read mock data directory:", error);
  }

  return null;
}

/**
 * Load and return mock response data
 */
export function getMockResponse(request: GhinRequest): AxiosResponse | null {
  const mockFilePath = findMockFile(request);

  if (!mockFilePath) {
    console.warn(
      `No mock file found for request: ${request.url}`,
      request.params,
    );
    return null;
  }

  try {
    const mockData = JSON.parse(fs.readFileSync(mockFilePath, "utf-8"));

    // Create a mock AxiosResponse object
    const mockResponse: AxiosResponse = {
      data: mockData,
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/json",
      },
      config: {
        url: request.url,
        method: request.method,
        params: request.params,
        data: request.data,
        headers: {} as AxiosRequestHeaders,
      },
      request: {},
    };

    console.log(`Using mock data from: ${path.basename(mockFilePath)}`);
    return mockResponse;
  } catch (error) {
    console.error(`Error loading mock file ${mockFilePath}:`, error);
    return null;
  }
}

/**
 * Check if mocking is enabled via environment variable
 */
export function isMockingEnabled(): boolean {
  return (
    process.env.GHIN_USE_MOCKS === "true" || process.env.NODE_ENV === "test"
  );
}

/**
 * List available mock files for debugging
 */
export function listAvailableMocks(): string[] {
  try {
    if (!fs.existsSync(MOCK_DATA_DIR)) {
      return [];
    }

    return fs
      .readdirSync(MOCK_DATA_DIR)
      .filter((file) => file.endsWith(".json"))
      .sort();
  } catch (error) {
    console.warn("Could not list mock files:", error);
    return [];
  }
}
