import { GhinCourseSearchContext } from 'common/components/ghin/course/searchContext';
import GhinCourseSearchInput from 'common/components/ghin/course/searchInput';
import GhinCourseSearchResults from 'common/components/ghin/course/searchResults';
import React from 'react';

const GhinSearchCourse = ({ search, setSearch, course, setCourse, tee, setTee }) => {
  return (
    <GhinCourseSearchContext.Provider
      value={{
        search,
        setSearch,
        course,
        setCourse,
        tee,
        setTee,
      }}
    >
      <GhinCourseSearchInput />
      <GhinCourseSearchResults />
    </GhinCourseSearchContext.Provider>
  );
};

export default GhinSearchCourse;
