import { co, z } from "jazz-tools";

export const TeeHole = co.map({
  id: z.string(),
  number: z.number(),
  par: z.number(),
  yards: z.number(),
  meters: z.number(),
  handicap: z.number(),
});
export type TeeHole = co.loaded<typeof TeeHole>;

export const ListOfTeeHoles = co.list(TeeHole);
export type ListOfTeeHoles = co.loaded<typeof ListOfTeeHoles>;

// Rating data for a nine (front/back) or full 18
const TeeRating = z.object({
  rating: z.number(),
  slope: z.number(),
  bogey: z.number(),
});

export const Tee = co.map({
  id: z.string(),
  name: z.string(),
  gender: z.literal(["M", "F", "Mixed"]),
  holes: ListOfTeeHoles,
  holesCount: z.number(),
  totalYardage: z.number(),
  totalMeters: z.number(),
  // Ratings stored as plain JSON - static data from GHIN, never edited independently
  ratings: z.object({
    total: TeeRating,
    front: TeeRating,
    back: TeeRating,
  }),
});
export type Tee = co.loaded<typeof Tee>;

export const FacilityGeolocation = co.map({
  formatted_address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});
export type FacilityGeolocation = co.loaded<typeof FacilityGeolocation>;

export const Facility = co.map({
  id: z.string(),
  status: z.string(),
  name: z.string(),
  number: z.string().optional(),
  geolocation: FacilityGeolocation,
});
export type Facility = co.loaded<typeof Facility>;

// Season is static metadata - plain JSON, not a co.map
const CourseSeason = z.object({
  name: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  all_year: z.boolean(),
});

export const CourseDefaultTee = co.map({
  male: co.optional(Tee),
  female: co.optional(Tee),
});
export type CourseDefaultTee = co.loaded<typeof CourseDefaultTee>;

export const ListOfTees = co.list(Tee);
export type ListOfTees = co.loaded<typeof ListOfTees>;

export const Course = co.map({
  id: z.string(),
  status: z.string(),
  name: z.string(),
  number: z.string().optional(),
  city: z.string(),
  state: z.string(),
  facility: co.optional(Facility),
  season: CourseSeason,
  default_tee: CourseDefaultTee,
  tees: ListOfTees,
});
export type Course = co.loaded<typeof Course>;
