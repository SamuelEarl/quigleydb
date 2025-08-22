/**
 * NOTES: See my "Schema Definition Rules" in the README.md file.
 */

const Student = {
  type: "node",
  label: "Student",
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
      type: Array<string>,
      required: true,
      // The user's `roles` array can contain one or many values from the `allowedValues` array.
      allowedValues: ["student", "employee", "athlete"],
      default: ["student"]
    },
    classYear: {
      type: String,
      required: true,
      // The user's `classYear` can only be one of the values from the `allowedValues` array.
      allowedValues: ["freshman", "sophomore", "junior", "senior"],
      default: "freshman",
    },
    // Scenarios when you can use JSON in a database property:
    // Not all users may have access to the same features and sections of your application. Similarly, each user might configure your application based on their preferences. These are two common scenarios and involve data that changes a lot over time. This is because your application is likely to evolve, involving new configurations, views, features, and sections. As a result, you have to continuously update your relational schema to match the new data structure. This takes time and energy. Instead, you can store permissions and configurations in a JSON column directly connected to your user table. Also, JSON is a good data format for your permissions and configuration. In fact, your application is likely to treat this data in JSON format. See https://dev.to/writech/when-to-use-json-data-in-a-relational-database-4i0b
    misc: {
      type: JSON,
      required: true,
      default: '{"accomodations":{"tests":"extra time"},"studentHousing":{"location":"none"}}'
    }
  },
};

const Course = {
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

const STUDENT_COURSE = {
  type: "relationship",
  label: "STUDENT_COURSE",
  from: Student,
  to: Course,
  props: {},
}

export const schema = {
  Student,
  Course,
  STUDENT_COURSE,
};
