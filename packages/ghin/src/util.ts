import { Gender } from "./types";

export const getGenderEnum = (gender?: string): Gender => {
  if (!gender) {
    return Gender.Male;
  }
  return gender in ["F", "f", "Female", "female"] ? Gender.Female : Gender.Male;
};
