/**
 * Simple test script to verify the mock system is working
 * Run with: npx tsx src/testMocks.ts
 */

import { getCourse } from "./getCourse";
import { enableMocking, mockStatus } from "./mockUtils";
import { searchCourse } from "./searchCourse";
import { searchPlayer } from "./searchPlayer";

async function testMockSystem() {
  console.log("🧪 Testing GHIN Mock System\n");

  // Enable mocking
  enableMocking();
  mockStatus();
  console.log(`\n${"=".repeat(50)}\n`);

  try {
    // Test 1: Default player search
    console.log("1️⃣ Testing default player search...");
    const players = await searchPlayer({
      q: { last_name: "Smith" },
      p: { page: 1, per_page: 10 },
    });
    console.log(`✅ Found ${players.length} players`);
    if (players.length > 0) {
      console.log(
        `   First player: ${players[0].first_name} ${players[0].last_name} (${players[0].ghin})`,
      );
    }
    console.log("");

    // Test 2: Specific player search (Johnson)
    console.log("2️⃣ Testing specific player search (Johnson)...");
    const johnsonPlayers = await searchPlayer({
      q: { last_name: "Johnson" },
      p: { page: 1, per_page: 10 },
    });
    console.log(`✅ Found ${johnsonPlayers.length} Johnson players`);
    if (johnsonPlayers.length > 0) {
      console.log(
        `   First Johnson: ${johnsonPlayers[0].first_name} ${johnsonPlayers[0].last_name}`,
      );
    }
    console.log("");

    // Test 3: Default course search
    console.log("3️⃣ Testing default course search...");
    const courses = await searchCourse({
      q: { name: "Golf" },
    });
    console.log(`✅ Found ${courses.length} courses`);
    if (courses.length > 0) {
      console.log(
        `   First course: ${courses[0].course_name} (${courses[0].course_id})`,
      );
    }
    console.log("");

    // Test 4: Specific course search (Pebble)
    console.log("4️⃣ Testing specific course search (Pebble)...");
    const pebbleCourses = await searchCourse({
      q: { name: "Pebble" },
    });
    console.log(`✅ Found ${pebbleCourses.length} Pebble courses`);
    if (pebbleCourses.length > 0) {
      console.log(`   Pebble course: ${pebbleCourses[0].course_name}`);
    }
    console.log("");

    // Test 5: Get specific course
    console.log("5️⃣ Testing get specific course (12345)...");
    const courseDetail = await getCourse({
      q: { course_id: "12345" },
    });
    if (courseDetail) {
      console.log(`✅ Got course: ${courseDetail.course_name}`);
      console.log(`   Tees available: ${courseDetail.tees?.length || 0}`);
    } else {
      console.log("❌ No course data returned");
    }
    console.log("");

    console.log("🎉 All mock tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testMockSystem();
}

export { testMockSystem };
