import { aql } from 'arangojs';
import datefnstz from 'date-fns-tz';

import {
  getCourse as getCourseGRPC,
  searchCourse as searchCourseGRPC
} from '../clients/handicap';
import { db } from '../db/db';
import { Doc } from './doc';

const { zonedTimeToUtc } = datefnstz;

const collection = db.collection('courses');

class Course extends Doc {
  constructor() {
    super(collection);
    this.gameTS = zonedTimeToUtc(new Date());
    //console.log('gameTS', this.gameTS);
  }

  async getCourse({ q }) {
    return getCourseGRPC({ q });
  }

  async searchCourse({ q }) {
    return searchCourseGRPC({ q });
  }


  async getTees(courseID) {
    const cursor = await db.query(aql`
      FOR v, e
          IN 1..1
          ANY ${courseID}
          GRAPH 'games'
          FILTER e.type == 'tee2course'
          AND (
            (
              (IS_DATESTRING(v.effective.start) AND DATE_TIMESTAMP(v.effective.start) <= DATE_TIMESTAMP(${this.gameTS}))
              OR NOT IS_DATESTRING(v.effective.start)
            )
            AND
            (
              (IS_DATESTRING(v.effective.end) AND DATE_TIMESTAMP(v.effective.end) > DATE_TIMESTAMP(${this.gameTS}))
              OR NOT IS_DATESTRING(v.effective.end)
            )
          )
         SORT v.TotalYardage DESC
         RETURN v
    `);
    return await cursor.all();
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
