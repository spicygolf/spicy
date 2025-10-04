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

export const Tee = co.map({
  id: z.string(),
  name: z.string(),
  gender: z.literal(["M", "F"]),
  holes: co.list(TeeHole),
  holesCount: z.number(),
  totalYardage: z.number(),
  totalMeters: z.number(),
  ratings: co.map({
    total: co.map({
      rating: z.number(),
      slope: z.number(),
      bogey: z.number(),
    }),
    front: co.map({
      rating: z.number(),
      slope: z.number(),
      bogey: z.number(),
    }),
    back: co.map({
      rating: z.number(),
      slope: z.number(),
      bogey: z.number(),
    }),
  }),
});
export type Tee = co.loaded<typeof Tee>;

export const Facility = co.map({
  id: z.string(),
  status: z.string(),
  name: z.string(),
  number: z.string().optional(),
  geolocation: co.map({
    formatted_address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
});
export type Facility = co.loaded<typeof Facility>;

export const Course = co.map({
  id: z.string(),
  status: z.string(),
  name: z.string(),
  number: z.string().optional(),
  city: z.string(),
  state: z.string(),
  facility: co.optional(Facility),
  season: co.map({
    name: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    all_year: z.boolean(),
  }),
  default_tee: co.map({
    male: co.optional(Tee),
    female: co.optional(Tee),
  }),
  tees: co.list(Tee),
});
export type Course = co.loaded<typeof Course>;
