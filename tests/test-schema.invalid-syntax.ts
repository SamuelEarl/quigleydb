/**
 * NOTES: See my schema notes in the `movie-schema.v1.ts` file.
 */

import { INodeSchema, IRelationshipSchema } from "../types";

const Student: INodeSchema = {
  type: "node",
  label: "Student",
  props: {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
    age: {
      type: Number,
    },
    address: {
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zip: {
        type: String, // Zip codes are strings because integers can't represent a leading zero and also because other countries might use letters, spaces, or dashes.
      },
    },
    roles: {
      type: [String],
      // The user's `roles` array can contain one or many values from the `atLeastOne` array.
      atLeastOneValue: ["student", "employee", "athlete"],
      // EXAMPLE VALUE: ["student"]
    },
    classYear: {
      type: String,
      // The user's `classYear` can only be one of the values from the `onlyOne` array.
      onlyOneValue: ["freshman", "sophomore", "junior", "senior"],
      // EXAMPLE VALUE: "freshman",
    },
    misc: {
      type: JSON,
      // EXAMPLE VALUE: '{"accomodations":{"tests":"extra time"},"studentHousing":{"location":"none"}}'
    }
  },
};

const StudentAlt: INodeSchema = {
  type: "node",
  label: "Student",
  props: {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
  },
};

const Course: INodeSchema = {
  type: "node",
  label: "Course",
  props: {
    title: {
      type: String,
    },
    subject: {
      type: String,
    },
  },
};

const ENROLLED_IN: IRelationshipSchema = {
  type: "relationship",
  label: "ENROLLED_IN",
  from: Student,
  to: Course,
  direction: "bidirectional",
  props: {
    enrollmentDate: {
      type: Date,
    },
  },
}

const Instructor: INodeSchema = {
  type: "node",
  label: "Instructor",
  props: {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
  },
};

const COURSE_INSTRUCTOR: IRelationshipSchema = {
  type: "relationship",
  label: "COURSE_INSTRUCTOR",
  from: Course,
  to: Instructor,
  direction: "directed",
  props: {
    instructingCourseSince: {
      type: Date,
    },
  },
};

export const schema = {
  Student,
  StudentAlt,
  Course,
  ENROLLED_IN,
  Instructor,
  COURSE_INSTRUCTOR,
};
