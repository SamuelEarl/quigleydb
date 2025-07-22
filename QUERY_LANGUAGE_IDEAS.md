# Example Queries

These queries are taken from https://docs.edgedb.com/get-started/edgeql and converted into a query language that I think would be easy and intuitive to use. NOTE: I think that would be this page now: https://docs.geldata.com/learn/edgeql.

## Query Composition

Every query is run as a transaction, so composing multiple queries into a single query is simple. If you want a CRUD operation other than "select" operations to return data, then you can specify the return values in a separate "select" operation. You can give each CRUD operation within a query a variable name that can be referenced in subsequent CRUD operations. The results of a CRUD operation can be assigned to variables by prefixing the CRUD name with a variable name and separating the variable name and the CRUD name with a double underscore.

Maybe it would be better to structure queries as "query pipelines" where the order of each CRUD operation in the pipeline matters. This is similar to MongoDB aggregation pipelines.

GQL uses separate "CREATE", "MATCH", "RETURN" and other statements. So this query pipeline will do the same.

The CRUD operations stand for CREATE, READ, UPDATE, and DELETE. So those are the statements that this query language will use.

```js
const result = query([
  {
    create: {
      ref: "newMovie",
      node: "Movie", // This is the equivalent to a label in GQL.
      props: {
        title: "Avengers: The Kang Dynasty",
        releaseYear: 2025,
      },
    },
  },
  {
    create: {
      ref: "newActor",
      node: "Actor", // This is the equivalent to a label in GQL.
      props: {
        firstName: "John",
        lastName: "Smith",
      },
    },
  },
  {
    merge: {
      ref: "movieActor",
      edge: "MOVIE_ACTOR", // This is the equivalent to a label in GQL.
      props: {
        createdAt: "",
      },
      in: "newMovie",
      out: "newActor",
    },
  },
  {
    return: ["newMovie", "newActor", "movieActor"],
  },
]);
```

```js
const result = query([
  {
    select: {
      ref: "movie",
      node: "Movie",
      props: {
        title,
        releaseYear,
      },
      where: (title, releaseYear) => {
        title.includes("hero") && releaseYear > 2000;
      },
      orderBy: {
        title: "asc",
      }
      edges: [
        {
          ref: "movieActor",
          edge: "MOVIE_ACTOR",
          props: {
            createdAt: "",
          },
          relNode: { // Related node.
            ref: "actor",
            node: "Actor",
            props: {
              firstName: "John",
              lastName: "Smith",
            },
          },
        },
      ],
    },
  },
  // Select statements will return everything that is defined in the query, so return statements are not used.
  // {
  //   return: ["actor"],
  // },
]);
```

const result = query([
  {
    ref: "new_movie",
    create: {
      label: "Movie",
      props: {
        title: "Avengers: The Kang Dynasty",
        release_year: 2025,
      },
    },
  },
  {
    ref: "result",
    select: {
      label: "new_movie",
      props: {
        id: true,
        title: true,
        release_year: true,
      },
    },
  },
  {
    return: ["result"],
  },
]);
```

```js
const result = query([
  {
    ref: "movie1",
    select: {
      label: "Movie",
      filter: {
        title: "Doctor Strange",
      },
    },
  },
  {
    ref: "actor1",
    select: {
      label: "Person",
      filter: {
        first_name: "Benedict",
        last_name: "Cumberbatch",
      },
    },
  },
  {
    ref: "actor2",
    select: {
      label: "Person",
      filter: {
        first_name: "Benedict",
        last_name: "Wong",
      },
    },
  },
  {
    ref: "updated_movie1",
    update: {
      label: "movie1",
      set: {
        // TODO: If multiple relationships are being updated (that are connected by the same prop name), then this probably needs to be a list of props that are being updated instead of a dictionary of props that each have the same key. I think this would throw an error:
        actors: {
          relationship: "<-[ACTED_IN]-",
          label: "actor1",
          create_relationship: true,
        },
        actors: {
          relationship: "<-[ACTED_IN]-",
          label: "actor2",
          create_relationship: true,
        },
      },
    },
  },
  {
    ref: "result",
    select: {
      label: "updated_movie1",
      props: {
        actors: {
          relationship: "<-[ACTED_IN]-",
          filter: {
            // where first_name = actor1.first_name or actor2.first_name
            first_name: "actor1.first_name or actor2.first_name",
            // where last_name = actor1.last_name or actor2.last_name
            last_name: "actor1.last_name or actor2.last_name",
          },
          props: {
            first_name: true,
            last_name: true,
          },
        },
      },
    },
  },
  {
    return: ["result"],
  },
]);
```

<!-- ```js
const result = query({
    movie1__select: {
        label: "Movie",
        filter: {
            "title": "Doctor Strange",
        },
    },
    actor1__select: {
        label: "Person",
        filter: {
            first_name: "Benedict",
            last_name: "Cumberbatch",
        },
    },
    actor2__select: {
        label: "Person",
        filter: {
            first_name: "Benedict",
            last_name: "Wong",
        },
    },
    updated_movie1__update: {
        label: "movie1",
        set: {
            actors__<-[ACTED_IN]-: {
                label: "actor1",
                create_relationship: true,
            },
            actors__<-[ACTED_IN]-: {
                label: "actor2",
                create_relationship: true,
            },
        },
    },
    select: {
        label: "updated_movie1",
        props: {
            actors__<-[ACTED_IN]-: {
                filter: {
                    // where first_name = actor1.first_name or actor2.first_name
                    first_name: "actor1.first_name or actor2.first_name",
                    // where last_name = actor1.last_name or actor2.last_name
                    last_name: "actor1.last_name or actor2.last_name",
                },
                props: {
                    first_name: true,
                    last_name: true,
                },
            }
        }
    }
})
``` -->

---

## Create Data

```js
const result = query([
  {
    create: {
      label: "Movie",
      props: {
        title: "Doctor Strange 2",
        releaseYear: 2022,
        director: {
          edge: "->DIRECTED->",
          label: "Person",
          props: {
            name: "Sam Raimi",
          },
        },
      },
    },
  },
]);
```

---

## Read Data

```js
const result = query([
  {
    select: {
      label: "Movie",
      props: {
        id: true,
        title: true,
        actors: {
          relationship: "<-[ACTED_IN]-",
          label: "Person",
          props: {
            name: true,
          },
        },
      },
    },
  },
]);
```

```js
const result = query([
  {
    select: {
      label: "Movie",
      props: {
        id: true,
        title: true,
        actors: {
          relationship: "<-[ACTED_IN]-",
          label: "Person",
          props: {
            name: true,
          },
        },
      },
    },
  },
]);
```

---

## Read Data with Filtering, Ordering, and Pagination

```js
const result = query([
  {
    select: {
      label: "Movie",
      filter: {
        release_year: "> 2017",
      },
      props: {
        id: true,
        title: true,
        actors: {
          relationship: "<-[ACTED_IN]-",
          label: "Person",
          props: {
            name: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
      offset: 10,
      limit: 10,
    },
  },
]);
```

---

## Read Data with different scopes

Every new set of curly braces introduces a new scope. You can add `props`, `filter`, `limit`, and `offset` clauses to nested shapes.

```js
const result = query([
  {
    select: {
      label: "Movie",
      filter: {
        title: "'avengers' in",
      },
      props: {
        title: true,
        actors: {
          relationship: "<-[ACTED_IN]-",
          label: "Person",
          filter: {
            name: "startswith('Chris')",
          },
          props: {
            name: true,
          },
        },
      },
    },
  },
]);
```

---

## Update Data

```js
const result = query([
  {
    update: {
      label: "Movie",
      filter: {
        title: "Doctor Strange 2",
      },
      set: {
        title: "Doctor Strange in the Multiverse of Madness",
      },
    },
  },
]);
```

---

When updating relationships, you can create a relationship between two existing nodes by specifying `create_relationship: true`, like this:

```js
const result = query([
  {
    update: {
      label: "Movie",
      filter: {
        title: "Doctor Strange 2",
      },
      set: {
        actors: {
          relationship: "<-[ACTED_IN]-",
          label: "Person",
          filter: {
            name: "Rachel McAdams",
          },
          create_relationship: true,
        },
      },
    },
  },
]);
```

You can delete a relationship between two existing nodes by specifying `"delete_relationship": true`.

---

## Delete Data

TODOs:

1. Show how to delete nodes that have relationships. I think Cypher requires you to delete the relationship(s) first and then delete the nodes.
2. EdgeQL says that delete statements can contain `filter`, `order by`, `offset`, and `limit` clauses (https://docs.edgedb.com/get-started/edgeql#delete-objects). Do those clauses make sense for a deleting data?

```js
const result = query([
  {
    delete: {
      label: "Movie",
      filter: {
        title: "startswith('the avengers')",
      },
      limit: 3,
    },
  },
]);
```

---

## Computed Properties

```js
const result = query({
  select: {
    label: "Movie",
    props: {
      title: true,
      title_upper: "title.upper()",
      cast_size: "actors.count()",
    },
  },
});
```

TODO: CONTINUE HERE:

## Query Parameters

Since your queries use Python dictionaries, you can reference query parameters in your queries with plain Python variables.

TODO: It would be nice if this query language was strongly typed. "Since EdgeQL is a strongly typed language, all query parameters must be prepending with a type cast to indicate the expected type." (See https://docs.edgedb.com/get-started/edgeql#query-parameters)

```js
title = "Doctor Strange 2";
release_year = 2022;

const result = query({
  create: {
    label: "Movie",
    props: {
      title: title,
      release_year: release_year,
    },
  },
});
```

---

## Polymorphic queries & Grouping objects

I don't think these types of queries would apply to a OGM, but I could be wrong. See https://docs.edgedb.com/get-started/edgeql#polymorphic-queries and https://docs.edgedb.com/get-started/edgeql#grouping-objects.
