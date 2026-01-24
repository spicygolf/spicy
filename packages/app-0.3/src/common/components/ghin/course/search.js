import { GhinCourseSearchContext } from "common/components/ghin/course/searchContext";
import GhinCourseSearchInput from "common/components/ghin/course/searchInput";
import GhinCourseSearchResults from "common/components/ghin/course/searchResults";

const GhinSearchCourse = ({ search, setSearch, course, setCourse }) => {
  return (
    <GhinCourseSearchContext.Provider
      value={{
        search,
        setSearch,
        course,
        setCourse,
      }}
    >
      <GhinCourseSearchInput />
      <GhinCourseSearchResults />
    </GhinCourseSearchContext.Provider>
  );
};

export default GhinSearchCourse;
