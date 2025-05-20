const Student = {
  type: "node",
  label: "Student",
  props: {
    id: String,
    firstName: String,
    lastName: String,
    email: String,
    age: Number,
    address: {
      street: String,
      city: String,
      state: String,
      zip: String, 
    },
    roles: {
      type: [String],
      atLeastOneValue: ["student", "employee", "athlete"],
    },
    classYear: {
      type: String,
      onlyOneValue: ["freshman", "sophomore", "junior", "senior"],
    },
    misc: {
      type: JSON,
    },
  },
  indexes: [
    "CREATE INDEX student_id_index FOR (s:Student) ON (s.id)",
  ],
  constraints: [
    "CREATE CONSTRAINT unique_email_constraint FOR (s:Student) REQUIRE s.email IS UNIQUE",
  ],
};

const Course = {
  type: "node",
  label: "Course",
  props: {
    title: String,
    subject: String,
  },
  indexes: [],
  constraints: [],
};

const Course = {
  type: "node",
  label: "Course",
  props: {
    title: String,
    subject: String,
  },
  indexes: [],
  constraints: [],
};

const ENROLLED_IN = {
  type: "relation",
  label: "ENROLLED_IN",
  from: Student,
  to: Course,
  direction: "bidirectional",
  props: {
    enrollmentDate: Date,
    grade: Number,
  },
  indexes: [],
  constraints: [],
};

const Instructor = {
  type: "node",
  label: "Instructor",
  props: {
    firstName: String,
    lastName: String,
    email: String,
  },
  indexes: [],
  constraints: [],
};

const COURSE_INSTRUCTOR = {
  type: "relation",
  label: "COURSE_INSTRUCTOR",
  from: Course,
  to: Instructor,
  direction: "directed",
  props: {
    instructingCourseSince: Date,
  },
  indexes: [],
  constraints: [],
};

export const schema = {
  Student,
  Course,
  Course,
  ENROLLED_IN,
  Instructor,
  COURSE_INSTRUCTOR,
};
