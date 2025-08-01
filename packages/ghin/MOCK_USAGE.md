# GHIN Mock System Usage Guide

The GHIN package now includes a comprehensive mocking system that allows you to develop and test without needing live API access.

## Quick Start

### Enable Mocking

Set the environment variable:
```bash
export GHIN_USE_MOCKS=true
```

Or programmatically:
```typescript
import { enableMocking } from '@your-org/ghin';
enableMocking();
```

### Check Mock Status

```typescript
import { mockStatus } from '@your-org/ghin';
mockStatus();
```

## How It Works

The mock system intercepts API calls made through the `ghinRequest` function and returns static JSON responses from the `data/mocks` folder instead of making real HTTP requests.

### Mock File Selection

Mock files are selected based on the API endpoint and request parameters:

1. **Exact Match**: First tries to find a file that matches the URL and all parameters
2. **Fallback Match**: Falls back to a file that matches just the URL
3. **Partial Match**: Looks for any file that starts with the base URL

### Naming Convention

Mock files follow this pattern:
```
{endpoint}_{param1}-{value1}_{param2}-{value2}.json
```

Examples:
- `golfers_search.json` - Default player search
- `golfers_search_last_name-Smith.json` - Search for players with last name "Smith"
- `courses_search_name-Pebble.json` - Search for courses with "Pebble" in the name
- `courses_12345.json` - Get specific course with ID 12345

## Available Mock Data

The package includes sample mock data for:

### Player Search (`/golfers/search.json`)
- `golfers_search.json` - Default search results with 3 players
- `golfers_search_last_name-Johnson.json` - Results for "Johnson" search

### Course Search (`/courses/search.json`)
- `courses_search.json` - Default course search results
- `courses_search_name-Pebble.json` - Pebble Beach specific results

### Get Course (`/courses/{id}.json`)
- `courses_12345.json` - Detailed Pebble Beach course data

### Get Tee (`/tees/{id}.json`)
- `tees_101.json` - Championship tees data for Pebble Beach

### Countries and States
- `countries_and_states.json` - List of countries and their states/provinces

## Creating Custom Mock Files

1. Create a new JSON file in `packages/ghin/data/mocks/`
2. Use the naming convention based on your API call
3. Structure the JSON to match the expected API response format

### Example: Custom Player Search

To mock a search for players in California:

1. Create `golfers_search_state-CA.json`:
```json
{
  "golfers": [
    {
      "ghin": "1234567",
      "first_name": "John",
      "last_name": "Doe",
      "state": "CA",
      "gender": "M",
      "handicap_index": "10.5"
    }
  ]
}
```

2. Make the API call:
```typescript
import { searchPlayer } from '@your-org/ghin';

const results = await searchPlayer({
  q: { state: "CA" },
  p: { page: 1, per_page: 10 }
});
```

## Utility Functions

```typescript
import { 
  enableMocking, 
  disableMocking, 
  mockStatus, 
  suggestMockFiles 
} from '@your-org/ghin';

// Enable/disable mocking
enableMocking();
disableMocking();

// Check current status and available files
mockStatus();

// Get help with file naming patterns
suggestMockFiles();
```

## Environment Variables

- `GHIN_USE_MOCKS=true` - Enable mock mode
- `NODE_ENV=test` - Automatically enables mocking for tests

## Development Workflow

1. Enable mocking: `export GHIN_USE_MOCKS=true`
2. Check available mocks: `mockStatus()`
3. Create custom mock files as needed
4. Develop and test your application
5. Disable mocking when ready to use live API

## Debugging

- Mock file selection is logged to the console
- Use `mockStatus()` to see available files
- Check file naming matches the expected pattern
- Verify JSON structure matches API response format

## Notes

- Mock files are loaded synchronously from the filesystem
- Parameter values are sanitized (special characters removed)
- Parameters are sorted alphabetically for consistent file naming
- The system falls back to live API if no mock file is found (with warning)
