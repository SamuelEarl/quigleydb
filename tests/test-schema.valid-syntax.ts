/**
 * NOTES: See my schema notes in the `movie-schema.v1.ts` file.
 */

import { INodeSchema, IRelationshipSchema } from "../src/types";

const Student: INodeSchema = {
  type: "node",
  label: "Student",
  props: {
    id: {
      type: String,
    },
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
      // The user's `roles` array can contain one or many values from the `atLeastOneValue` array.
      atLeastOneValue: ["student", "employee", "athlete"],
      // EXAMPLE VALUE: ["student"]
    },
    classYear: {
      type: String,
      // The user's `classYear` can only be one of the values from the `onlyOneValue` array.
      onlyOneValue: ["freshman", "sophomore", "junior", "senior"],
      // EXAMPLE VALUE: "freshman",
    },
    misc: {
      type: JSON,
      // EXAMPLE VALUE: '{"accomodations":{"tests":"extra time"},"studentHousing":{"location":"none"}}'
    }
  },
  indexes: [
    "CREATE INDEX student_id_index FOR (s:Student) ON (s.id)"
  ],
  constraints: [
    "CREATE CONSTRAINT unique_email_constraint FOR (s:Student) REQUIRE s.email IS UNIQUE"
  ],
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
  indexes: [],
  constraints: [],
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
  indexes: [],
  constraints: [],
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
  indexes: [],
  constraints: [],
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
  indexes: [],
  constraints: [],
};

export const schema = {
  Student,
  Course,
  ENROLLED_IN,
  Instructor,
  COURSE_INSTRUCTOR,
};
