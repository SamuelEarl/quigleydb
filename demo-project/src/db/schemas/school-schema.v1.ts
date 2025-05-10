/**
 * NOTES: See my "Schema Definition Rules" in the README.md file.
 */

import { randomUUID } from "crypto";
import { INodeSchema, IRelationshipSchema } from "../quigley/types";

const Student: INodeSchema = {
  type: "node",
  label: "Student",
  props: {
    // TODO: Figure out how to handle IDs. Look at the Mongoose docs for ideas: https://mongoosejs.com/docs/schematypes.html#uuid.
    // I don't think Cypher generates IDs for nodes and relationships. Explicit is better than implicit, so I want users to define their ID properties for nodes or relationships in the schema.
    id: {
      type: String,
      default: () => randomUUID(),
      // Or maybe the default value would be set like this and I would auto generate the ID value with `() => randomUUID()`.
      // default: "uuid",
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    address: {
      street: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      state: {
        type: String,
        default: "",
      },
      zip: {
        type: String, // Zip codes are strings because integers can't represent a leading zero and also because other countries might use letters, spaces, or dashes.
        default: "",
      },
    },
    roles: {
      type: [String],
      required: true,
      // The user's `roles` array can contain one or many values from the `atLeastOneValue` array.
      atLeastOneValue: ["student", "employee", "athlete"],
      default: ["student"]
    },
    classYear: {
      type: String,
      required: true,
      // The user's `classYear` can only be one of the values from the `onlyOneValue` array.
      onlyOneValue: ["freshman", "sophomore", "junior", "senior"],
      default: "freshman",
    },
    misc: {
      type: JSON,
      required: true,
      default: '{"accomodations":{"tests":"extra time"},"studentHousing":{"location":"none"}}'
    }
  },
};

const Course: INodeSchema = {
  type: "node",
  label: "Course",
  props: {
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
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
      required: true,
    },
  },
}

const Instructor: INodeSchema = {
  type: "node",
  label: "Instructor",
  props: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
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
      required: true,
    },
  },
};

export const schema = {
  Student,
  Course,
  ENROLLED_IN,
  Instructor,
  COURSE_INSTRUCTOR,
};
