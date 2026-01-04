import type { Course, Tee } from "spicylib/schema";
import { useJazzWorker } from "./useJazzWorker";

/**
 * Hook to access the catalog of courses from the worker account.
 *
 * The catalog contains courses imported from GHIN, keyed by GHIN course ID.
 * Each course contains a list of tees.
 *
 * Use this to look up existing courses before creating new ones.
 */
export function useCatalogCourses() {
  const { account: workerAccount } = useJazzWorker({
    profile: {
      catalog: {
        courses: {
          $each: {
            facility: true,
            tees: { $each: { holes: { $each: true } } },
          },
        },
      },
    },
  });

  const isLoading =
    !workerAccount?.$isLoaded ||
    !workerAccount.profile?.$isLoaded ||
    !workerAccount.profile.catalog?.$isLoaded;

  const coursesMap = (() => {
    if (isLoading) return null;
    const catalog = workerAccount.profile.catalog;
    // Use $jazz.has() to check if property exists before accessing
    if (!catalog.$jazz.has("courses")) return null;
    if (!catalog.courses?.$isLoaded) return null;
    return catalog.courses;
  })();

  /**
   * Find a course in the catalog by GHIN course ID.
   * Returns the course reference if found, null otherwise.
   */
  const findCourseById = (courseId: string): Course | null => {
    if (!coursesMap) return null;
    const course = coursesMap[courseId];
    return course?.$isLoaded ? course : null;
  };

  /**
   * Find a tee within a course by GHIN tee set rating ID.
   * Returns the tee reference if found, null otherwise.
   */
  const findTeeById = (course: Course, teeId: string): Tee | null => {
    if (!course.$isLoaded || !course.tees?.$isLoaded) return null;

    for (let i = 0; i < course.tees.length; i++) {
      const tee = course.tees[i];
      if (tee?.$isLoaded && tee.id === teeId) {
        return tee;
      }
    }
    return null;
  };

  /**
   * Find a course and tee by their GHIN IDs.
   * Returns both if found, null otherwise.
   */
  const findCourseTee = (
    courseId: string,
    teeId: string,
  ): { course: Course; tee: Tee } | null => {
    const course = findCourseById(courseId);
    if (!course) return null;

    const tee = findTeeById(course, teeId);
    if (!tee) return null;

    return { course, tee };
  };

  /**
   * Search for courses by name (case-insensitive partial match).
   * Returns array of matching courses.
   */
  const searchByName = (query: string, limit = 20): Course[] => {
    if (!coursesMap || !query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();
    const results: Course[] = [];

    for (const key in coursesMap) {
      if (results.length >= limit) break;

      const course = coursesMap[key];
      if (
        course?.$isLoaded &&
        course.name?.toLowerCase().includes(lowerQuery)
      ) {
        results.push(course);
      }
    }

    return results;
  };

  /**
   * Get all courses as an array.
   */
  const allCourses = (): Course[] => {
    if (!coursesMap) return [];
    return Object.values(coursesMap).filter(
      (course): course is Course => course?.$isLoaded === true,
    );
  };

  return {
    isLoading,
    coursesMap,
    findCourseById,
    findTeeById,
    findCourseTee,
    searchByName,
    allCourses,
  };
}
