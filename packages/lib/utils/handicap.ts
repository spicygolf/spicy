import type { Tee } from "../schema/courses";

interface CourseHandicapParams {
  handicapIndex: string;
  tee: Tee;
  holesPlayed?: "front9" | "back9" | "all18";
}

export function calculateCourseHandicap({
  handicapIndex,
  tee,
  holesPlayed = "all18",
}: CourseHandicapParams): number | null {
  if (!tee?.$isLoaded) {
    return null;
  }

  let index = Number.parseFloat(handicapIndex);
  if (Number.isNaN(index)) {
    return null;
  }

  if (handicapIndex.charAt(0) === "+") {
    index *= -1;
  }

  const { slope } = getRatings(tee, holesPlayed);
  if (slope === null) {
    return null;
  }

  return Math.round(index * (slope / 113));
}

export function formatCourseHandicap(courseHandicap: number | null): string {
  if (courseHandicap === null || courseHandicap === undefined) {
    return "";
  }

  let formatted = courseHandicap.toString();
  if (formatted.startsWith("-")) {
    formatted = formatted.replace("-", "+");
  }

  return formatted;
}

export function formatHandicapIndex(handicapIndex: string | null): string {
  if (!handicapIndex) {
    return "";
  }
  return handicapIndex;
}

function getRatings(
  tee: Tee,
  holesPlayed: "front9" | "back9" | "all18",
): { rating: number | null; slope: number | null; bogey: number | null } {
  if (!tee?.ratings?.$isLoaded) {
    return { rating: null, slope: null, bogey: null };
  }

  let ratings: { rating: number; slope: number; bogey: number } | null = null;

  switch (holesPlayed) {
    case "front9":
      ratings = tee.ratings.front?.$isLoaded ? tee.ratings.front : null;
      break;
    case "back9":
      ratings = tee.ratings.back?.$isLoaded ? tee.ratings.back : null;
      break;
    case "all18":
      ratings = tee.ratings.total?.$isLoaded ? tee.ratings.total : null;
      break;
  }

  if (!ratings) {
    return { rating: null, slope: null, bogey: null };
  }

  return {
    rating: Math.round((ratings.rating + Number.EPSILON) * 10) / 10,
    slope: ratings.slope,
    bogey: ratings.bogey,
  };
}
