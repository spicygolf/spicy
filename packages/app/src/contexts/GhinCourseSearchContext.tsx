import type { CourseSearchRequest } from "@spicygolf/ghin";
import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

interface GhinCourseSearchContextType {
  state: CourseSearchRequest;
  setState: (state: CourseSearchRequest) => void;
}

export const defaultState: CourseSearchRequest = {
  country: "USA",
  state: "",
  name: "",
};

const GhinCourseSearchContext = createContext<
  GhinCourseSearchContextType | undefined
>(undefined);

export function GhinCourseSearchProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<CourseSearchRequest>(defaultState);

  return (
    <GhinCourseSearchContext.Provider value={{ state, setState }}>
      {children}
    </GhinCourseSearchContext.Provider>
  );
}

export function useGhinCourseSearchContext() {
  const context = useContext(GhinCourseSearchContext);
  if (!context) {
    throw new Error(
      "useGhinCourseSearchContext must be used within a GhinCourseSearchProvider",
    );
  }
  return context;
}
