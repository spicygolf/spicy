import { getCourse, login, refreshEdge } from '../util/ghin';

import { Doc } from './doc';
import { Tee } from './tee';
import { aql } from 'arangojs';
import datefnstz from 'date-fns-tz';
import { db } from '../db/db';
import { findIndex } from 'lodash-es';

const { zonedTimeToUtc } = datefnstz;

const collection = db.collection('courses');

class Course extends Doc {
  constructor() {
    super(collection);
    this.gameTS = zonedTimeToUtc(new Date());
    //console.log('gameTS', this.gameTS);
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

  async register(clubid, course, token) {
    //console.log('db', db);
    const course_id = course.course_id ? course.course_id : course.CourseID;
    const res = await this.getGHINCourse(course_id, token);
    //console.log('course res', res);
    const normCourse = this._normalize(res);
    let newCourse = Object.assign(normCourse, res);

    // correct state value
    let state = newCourse.state;
    if (state.split('-').length > 1) {
      state = state.split('-')[1];
    }
    newCourse.state = state;

    const existing = await this.find({
      name: newCourse.name,
      city: newCourse.city,
      state: state,
    });
    if (existing && existing.length) newCourse._key = existing[0]._key;

    const tees = newCourse.TeeSets;
    delete newCourse.TeeSets;
    delete newCourse.CourseId;
    delete newCourse.CourseName;
    delete newCourse.CourseCity, delete newCourse.CourseState;

    //console.log('newCourse', newCourse);
    this.set(newCourse);
    const ret = await this.save({ overwrite: true });

    if (ret && ret._id) {
      const courseid = ret._id;
      // refresh edge
      if (clubid) await refreshEdge('course2club', courseid, clubid);

      // process tees for this course
      tees.map(async (tee) => {
        const t = new Tee();
        await t.register(courseid, tee);
      });

      // also remove tees that are no longer in ghin
      let removeTees = [];
      const existingTees = await this.getTees(courseid);
      existingTees.map((et) => {
        const f = findIndex(tees, {
          TeeSetRatingName: et.name,
          Gender: et.gender,
        });
        if (f < 0) removeTees.push(et);
      });
      removeTees.map(async (tee) => {
        const t = new Tee();
        await t.unregister(courseid, tee);
      });

      return ret;
    }
  }

  async getGHINCourse(course_id, token) {
    let t = token;
    if (!token) {
      const login_res = await login();
      t = login_res.token;
    }
    const course = await getCourse(course_id, t);
    return course;
  }
}

const _Course = Course;
export { _Course as Course };
