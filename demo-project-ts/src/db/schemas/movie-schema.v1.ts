/**
 * NOTES: See my "Schema Definition Rules" in the README.md file.
 */

const Movie = {
  type: "node",
  label: "Movie",
  props: {
    title: {
      type: String,
      required: true,
    },
    releaseyear: {
      type: String,
      required: true,
    },
    genres: {
      type: Array<string>,
      required: true,
      // The `genres` array can contain one or many values from the `allowedValues` array.
      allowedValues: ["action", "adventure", "comedy", "drama", "horror"],
    },
  },
};

const Actor = {
  type: "node",
  label: "Actor",
  props: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
  },
};

const ACTED_IN = {
  type: "relationship",
  label: "ACTED_IN",
  from: Actor,
  to: Movie,
  props: {
    role: {
      type: String,
    },
    awards: {
      type: Array<string>,
    },
    salary: {
      type: Number
    },
  },
}

export const schema = {
  Movie,
  Actor,
  ACTED_IN,
};
