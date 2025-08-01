import type { AxiosResponse } from "axios";

export type GhinRequest = {
  method: string;
  url: string;
  params?: object;
  data?: object;
  token?: string | null;
  attempts: number;
};

export type GhinRequestFn = (
  options: GhinRequest,
) => Promise<AxiosResponse | null | undefined>;

export type Pagination = {
  page: number;
  per_page: number;
};

// Search Player

export type SearchPlayerRequest = {
  q: SearchPlayerQuery;
  p: Pagination;
};

export type SearchPlayerQuery = {
  golfer_id?: string;
  last_name?: string;
  first_name?: string;
  state?: string;
  country?: string;
  local_number?: string;
  email?: string;
  phone_number?: string;
  association_id?: number;
  club_id?: string;
  sorting_criteria?: string;
  order?: string;
  status?: string;
  updated_since?: string;
  soft_cap?: boolean;
  hard_cap?: boolean;
  is_test?: boolean;
};

type GenderString =
  | "M"
  | "Male"
  | "m"
  | "male"
  | "F"
  | "Female"
  | "f"
  | "female";

export enum Gender {
  Male = "Male",
  Female = "Female",
}

export type ResponsePlayer = {
  ghin?: string;
  first_name?: string;
  last_name?: string;
  player_name?: string;
  club_name?: string;
  club_id?: number;
  city?: string;
  state?: string;
  country?: string;
  is_home_club?: boolean;
  gender?: GenderString;
  status?: string;
  handicap_index?: string;
  hi_value?: number;
  hi_display?: string;
  rev_date?: string;
};

export type SearchPlayerResponse = {
  ghin?: string;
  first_name?: string;
  last_name?: string;
  player_name?: string;
  club_name?: string;
  club_id?: number;
  city?: string;
  state?: string;
  country?: string;
  is_home_club?: boolean;
  gender: Gender;
  status?: string;
  handicap_index?: string;
  hi_value?: number;
  hi_display?: string;
  rev_date?: string;
};

// Search Course

export type SearchCourseRequest = {
  q: SearchCourseQuery;
};

export type SearchCourseQuery = {
  name?: string;
  facility_id?: string;
  country?: string;
  state?: string;
  ent_country_code?: number;
  ent_state_code?: number;
  course_status?: string;
  facility_status?: string;
  offset?: number;
  limit?: number;
  include_tee_sets?: boolean;
  legacy_crp_course_ids?: string;
  updated_at?: string;
};

export type ResponseCourse = {
  CourseID: number;
  CourseStatus: string;
  CourseName: string;
  GeoLocationLatitude: number;
  GeoLocationLongitude: number;
  FacilityID: number;
  FacilityStatus: string;
  FacilityName: string;
  FullName: string;
  Address1: string;
  Address2: string;
  City: string;
  State: string;
  Zip: number;
  Country: string;
  UpdatedOn: string;
  Ratings: ResponseTeeSetRating[];
};

export type ResponseTeeSetRating = {
  TeeSetRatingId: number;
  TeeSetRatingName: string;
  TeeSetStatus: string;
};

export type SearchCourse = {
  course_id: number;
  course_status: string;
  course_name: string;
  geo_location_latitude: number;
  geo_location_longitude: number;
  facility_id: number;
  facility_status: string;
  facility_name: string;
  fullname: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  updated_on: string;
  ratings: TeeSetRating[];
};

export type TeeSetRating = {
  tee_set_rating_id: number;
  tee_set_rating_name: string;
  tee_set_status: string;
};

export type SearchCourseResponse = SearchCourse[];

// Get Course

export type GetCourseRequest = {
  q: GetCourseQuery;
};

export type GetCourseQuery = {
  course_id?: string;
  include_altered_tees?: boolean;
};

export type ResponseGetCourse = {
  CourseId?: number;
  CourseName?: string;
  CourseStatus?: string;
  CourseNumber?: number;
  CourseCity?: string;
  CourseState?: string;
  Facility?: ResponseFacility;
  Season?: ResponseSeason;
  TeeSets?: ResponseTee[];
};

export type ResponseFacility = {
  FacilityId?: number;
  FacilityName?: string;
  FacilityStatus?: string;
  FacilityNumber?: string;
  GeoLocationFormattedAddress?: string;
  GeoLocationLatitude?: number;
  GeoLocationLongitude?: number;
};

export type ResponseSeason = {
  SeasonName?: string;
  SeasonStartDate?: string;
  SeasonEndDate?: string;
  IsAllYear?: boolean;
};

export type GetCourseResponse = {
  course_id?: number;
  course_status?: string;
  course_name?: string;
  facility_id?: number;
  facility_status?: string;
  facility_name?: string;
  geo_location_formatted_address?: string;
  geo_location_latitude?: number;
  geo_location_longitude?: number;
  city?: string;
  state?: string;
  season_name?: string;
  season_start_date?: string;
  season_end_date?: string;
  is_all_year?: boolean;
  tees?: TeeSet[];
};

// Get Tee

export type GetTeeRequest = {
  q: GetTeeQuery;
};

export type GetTeeQuery = {
  tee_id?: string;
};

export type ResponseTee = {
  TeeSetRatingId?: number;
  TeeSetRatingName?: string;
  Gender?: GenderString;
  HolesNumber?: number;
  TotalYardage?: number;
  TotalMeters?: number;
  TotalPar?: number;
  Ratings?: ResponseRating[];
  Holes?: ResponseTeeHole[];
  Course?: ResponseTeeCourse;
};

export type ResponseRating = {
  RatingType?: string;
  CourseRating?: number;
  SlopeRating?: number;
  BogeyRating?: number;
};

export type Rating = {
  rating_type?: string;
  course_rating?: number;
  slope_rating?: number;
  bogey_rating?: number;
};

export type ResponseTeeHole = {
  Number?: number;
  HoleId?: string;
  Length?: number;
  Par?: number;
  Allocation?: number;
};

export type TeeHole = {
  number?: number;
  hole_id?: string;
  length?: number;
  par?: number;
  allocation?: number;
};

export type ResponseTeeCourse = {
  CourseId?: number;
  CourseStatus?: string;
  CourseName?: string;
  CourseNumber?: number;
  CourseCity?: string;
  CourseState?: string;
};

export type TeeCourse = {
  course_id?: number;
  course_status?: string;
  course_name?: string;
  course_number?: number;
  course_city?: string;
  course_state?: string;
};

export type TeeSet = {
  tee_id?: number;
  tee_name?: string;
  gender?: Gender;
  holes_number?: number;
  total_yardage?: number;
  total_meters?: number;
  total_par?: number;
  ratings?: Rating[];
  holes?: TeeHole[];
  course?: TeeCourse;
};

export type GetTeeResponse = TeeSet;

// Countries and States

export type Country = {
  name?: string;
  code?: string;
  crs_code?: string;
  states?: State[];
};

export type State = {
  name?: string;
  code?: string;
  course_code?: string;
};

export type GetCountriesAndStatesResponse = Country[];
