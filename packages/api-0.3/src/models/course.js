import datefnstz from "date-fns-tz";

import { db } from "../db/db";
import {
  getCourse as getCourseGhin,
  searchCourse as searchCourseGhin,
} from "../ghin";
import { Doc } from "./doc";

const { zonedTimeToUtc } = datefnstz;

const collection = db.collection("courses");

class Course extends Doc {
  constructor() {
    super(collection);
    this.gameTS = zonedTimeToUtc(new Date());
    //console.log('gameTS', this.gameTS);
  }

  async getCourse({ q }) {
    return getCourseGhin({ q });
  }

  async searchCourse({ q }) {
    return searchCourseGhin({ q });
  }

  _normalize(orig) {
    return {
      course_id: orig.course_id ? orig.course_id : orig.CourseId,
      name: orig.name ? orig.name : orig.CourseName,
      city: orig.city ? orig.city : orig.CourseCity,
      state: orig.state ? orig.state : orig.CourseState,
      default_tee_male: orig.default_tee_male ? orig.default_tee_male : null,
      default_tee_female: orig.default_tee_female
        ? orig.default_tee_female
        : null,
    };
  }
}

const _Course = Course;
export { _Course as Course };
