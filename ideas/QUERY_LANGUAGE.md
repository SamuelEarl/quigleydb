# Query Language

I want this database and query language to follow human-centered design principles as much as possible. For example, in the book "The Design of Everyday Things, 2nd Ed." page 20 talks about mapping. This is where the relationship between two things resemble each other. For example, if data is to be modeled as objects and their relationships to each other, then the query language should resemble the data model. That is what Cypher/GQL tries to do. I want to improve the GQL query language to make it even more intuitive and I also want the schema to resemble the data model.

These are some ideas for a query language that is simple and intuitive. I want the query language to model the data structure (like what Cypher/GQL does), but I also want the query functions to use standard programming language constructs. For example, if you need to update multiple nodes or relationships in a query, then a `FOR` loop should work the same way that it works in JavaScript or Python. There should be variables that can be referenced inside the queries and those variables should work the same as they do in programming languages.

I want there to be only one way to do something (similar to Python's manifesto). For example:

* To filter READ operations, I want to use a WHERE property. I do *NOT* also want to allow a filter to be applied inside the READ operation. That can get confusing.
* GQL allows for multiple ways to create data (CREATE, MERGE, others?). That is very confusing. You should only be able to create data with the CREATE clause and nothing else.

There should be only one way to perform an operation.


## Example Queries

These query ideas are taken from https://docs.edgedb.com/get-started/edgeql and converted into a query language that I think would be easy and intuitive to use. NOTE: I think that would be this page now: https://docs.geldata.com/learn/edgeql.

## Query Composition

Every query is constructed as an array of CRUD operations and each query is run as a transaction.

The alias values in a CRUD operation allow you to reference the result of a query in subsequent CRUD operations.

The CRUD operations stand for CREATE, READ, UPDATE, and DELETE. So those are the clauses that this query language will use (instead of SELECT, MATCH, etc.).

---

## Create Data

### Create a single node and return individual properties

```js
const result = query(
  // Query Transaction
  [
    {
      CREATE: `(m:Movie {
        title: $title,
        release_year: $release_year,
      })`,
    },
    {
      RETURN: `m.id, m.title, m.release_year`,
    },
  ],
  // Params
  {
    $title: "Avengers: The Kang Dynasty",
    $release_year: 2025,
  }
);
```

### Create nodes and a relationship between them

```js
const result = query(
  // Query Transaction
  [
    {
      CREATE: `(m:Movie {
        title: $title,
        releaseYear: $releaseYear,
      })`,
    },
    {
      CREATE: `(a:Actor {
        firstName: $firstName,
        lastName: $lastName,
      })`,
    },
    {
      CREATE: `
        (m)
        -[r:MOVIE_ACTOR {createdAt: $createdAt}]-
        (a)
      `,
    },
    {
      RETURN: `m, a, r`
    },
  ],
  // Params
  {
    $title: "Avengers: The Kang Dynasty",
    $releaseYear: 2025,
    $firstName: "John",
    $lastName: "Smith,
    $createdAt: new Date(),
  },
);
```

### Create new relationships between existing nodes

```js
const result = query(
  [
    {
      READ: `(m:Movie)`,
      WHERE: {
        m.title: "Doctor Strange",
      }
    },
    {
      READ: `(p1:Person)`,
      WHERE: {
        p1.first_name: "Benedict",
        p1.last_name: "Cumberbatch",
      },
    },
    {
      READ: `(p2:Person)`,
      WHERE: {
        p2.first_name: "Benedict",
        p2.last_name: "Wong",
      },
    },
    {
      CREATE: `(p1)-[ACTED_IN]->(m)`,
    },
    {
      CREATE: `(p2)-[ACTED_IN]->(m)`,
    },
    {
      RETURN: `m, p1, p2`,
    },
  ]
);
```

---

## Read Data

### Correct way to filter query

Use the WHERE clause to filter query results.

```js
const result = query([
  {
    READ: `(p:Person)`,
    WHERE: {
      p.name: "Sam Raimi",
    },
  }
]);
```

### Wrong way to filter query

Do *NOT* use a node property to filter query results.

```js
const result = query([
  {
    READ: `(p:Person {
      name: "Sam Raimi",
    })`,
  }
]);
```

```js
const result = query(
  [
    {
      READ: `
        (m:Movie { title, releaseYear })
        -[r:MOVIE_ACTOR { createdAt: "" }]-
        (a:ACTOR { firstName: "John", lastName: "Smith" })
      `,
      WHERE: {
        m.title: INCLUDES("hero"),
        m.releaseYear: > 2000,
      },
      ORDER_BY: {
        m.title: "asc",
      },
    },
    {
      RETURN: `a`,
    },
  ],
  // Params
  // {}
);
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
2. EdgeQL says that delete clauses can contain `filter`, `order by`, `offset`, and `limit` clauses (https://docs.edgedb.com/get-started/edgeql#delete-objects). Do those clauses make sense for deleting data?

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
