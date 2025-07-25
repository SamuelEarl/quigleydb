# Query Language

I want this database and query language to follow human-centered design principles as much as possible. For example, in the book "The Design of Everyday Things, 2nd Ed." page 20 talks about mapping. This is where the relationship between two things resemble each other. For example, if data is to be modeled as objects and their relationships to each other, then the query language should resemble the data model. That is what Cypher/GQL tries to do. I want to improve the GQL query language to make it even more intuitive and I also want the schema to resemble the data model.

These are some ideas for a query language that is simple and intuitive. I want the query language to model the data structure (like what Cypher/GQL does), but I also want the query functions to use standard programming language constructs. For example, if you need to update multiple nodes or relationships in a query, then a `FOR` loop should work the same way that it works in JavaScript or Python (see https://neo4j.com/docs/cypher-manual/current/clauses/foreach/ for ideas). There should be variables that can be referenced inside the queries and those variables should work the same as they do in programming languages.

I want there to be only one way to do something (similar to Python's manifesto). For example:

* To filter READ operations, I want to use a WHERE property. I do *NOT* also want to allow a filter to be applied inside the READ operation. That can get confusing.
* GQL allows for multiple ways to create data (CREATE, MERGE, others?). That is very confusing. You should only be able to create data with the CREATE clause and nothing else.

There should be only one way to perform an operation.


### Strongly Typed Variables

It would be nice if this query language was strongly typed. "Since EdgeQL is a strongly typed language, all query parameters must be prepended with a type cast to indicate the expected type." (See https://docs.edgedb.com/get-started/edgeql#query-parameters)


## Query Composition

Every query is constructed as an array of CRUD operations and each query is run as a transaction.

The alias values in a CRUD operation allow you to reference the result of a query in subsequent CRUD operations.

The CRUD operations stand for CREATE, READ, UPDATE, and DELETE. So those are the clauses that this query language will use (instead of SELECT, MATCH, etc.).

This database uses clauses (e.g. CREATE, READ, UPDATE, and DELETE) and functions (e.g. INCLUDES, FOR). Functions are used inside of clauses to provide query functionality (e.g. filter, update multiple node/relationships). All clauses and functions are capitalized with multi-word clauses/functions being separated by underscores.


## Example Queries

The following query ideas are taken from https://docs.edgedb.com/get-started/edgeql and converted into a query language that I think would be easy and intuitive to use. NOTE: I think that would be this page now: https://docs.geldata.com/learn/edgeql.

---

## CREATE Data

### Create a single node and return individual properties

The transaction function (`tx()`) takes two arguments: 

1. A string of query statements, which are composed as a function body.
    1. If users can compose statements into a function body and just pass that function body to the tx() function (as a string), then that would open up a lot of possibilities and it could make the queries much simpler.
    2. All variables that are defined within the query statements are global within a transaction. So anything that is defined can be referenced later in the query (e.g. aliases, variables that are defined with VAR).
2. A params object.
    1. Each key in the params object needs to be prefixed with a dollar symbol `$` and each param inside a `tx()` function needs to match exactly.
    2. When the query is sent to the database the params inside the `tx()` function will be replaced with the value of the param that is inside the params object.

You have to specify what you want returned from the transaction using a RETURN clause.

```js
const result = tx(
  `
    CREATE (m:Movie {
      title: $title,
      release_year: $release_year,
    })
    // Define a graph literal in the RETURN statement, which describes what to return from the query.
    RETURN (m {id, title, release_year})
  `,
  // Params
  {
    $title: "Avengers: The Kang Dynasty",
    $release_year: 2025,
  }
);
```

### Create nodes and a relationship between them

```js
const result = tx(
  `
    CREATE (m:Movie {
      title: $title,
      release_year: $release_year,
    })
    CREATE (a:Actor {
      first_name: $first_name,
      last_name: $last_name,
    })
    CREATE 
      (m)
      -[r:MOVIE_ACTOR {created_at: $created_at}]-
      (a)
    RETURN: (m)-[r]-(a)
  `,
  // Params
  {
    $title: "Avengers: The Kang Dynasty",
    $release_year: 2025,
    $first_name: "John",
    $last_name: "Smith,
    $created_at: new Date(),
  },
);
```

### Create new relationships between existing nodes

```js
const result = tx(
  `
    READ: (movie:Movie)
    WHERE: {
      movie.title: "Pirates of the Carribean",
    }
    
    READ: (actor:Person)
    WHERE: {
      actor.first_name: "Johnny",
      actor.last_name: "Depp",
    }
    
    READ: (director:Person)
    WHERE: {
      director.first_name: "Gore",
      director.last_name: "Verbinski",
    }
    
    CREATE: (actor)-[ACTED_IN]->(movie)
  
    CREATE: (director)-[DIRECTED]->(movie)

    CREATE: (actor)-[ACTED_UNDER]->(director)

    RETURN (movie)-[ACTED_IN]-(actor {first_name, last_name})-[ACTED_UNDER]-(director {first_name, last_name})-[DIRECTED]-(movie)
  `,
);
```

This query would return something like the following JSON object.

The query will start by fetching the first node listed in the RETURN statement and then add data to the JSON object as it continues down the RETURN statement, fetching more data and appending those data to the JSON object.

```json
{
  data: {
    "movie": {
      "title": "Pirates of the Carribean",
      "releaseYear": 2003,
      "genres": ["action", "adventure", "comedy"],
      "ACTED_IN": [ // In JSON, a relationship is modeled as a property of a node and that relationship (node property) has an array value. See the explanation next to the "actor" property below for more details. 
      // Each relationship provide data about itself through object properties. NOTE: GraphQL syntax does not provide and data about relationships.
        {
          "role": "Jack Sparrow",
          "awards": ["best actor"],
          "salary": 2000000000, // Expressed in cents.
          "actor": { // In JSON, a node that a relationship is pointing to is modeled as a property of the relationship. This is why: In a graph query, each entry node can have multiple relationships pointing "from" the node, so it is necessary to show the relationships that are pointing "from" a node as an array (e.g. the "ACTED_IN" property above). However, each of those relationships will have only one node that it is pointing "to", so it is necessary to show the node that a relationship is pointing to as a property of the relationship and the properties of the "to" node are displayed as a nested object (e.g. the "firstName" and "lastName" properties below).
            "firstName": "Johnny",
            "lastName": "Depp",
            "ACTED_UNDER": [
              {
                "director": {
                  "firstName": "Gore",
                  "lastName": "Verbinski",
                  "DIRECTED": [
                    {
                      "title": "Pirates of the Carribean",
                      "releaseYear": 2003,
                      "genres": ["action", "adventure", "comedy"],
                    },
                    {
                      // Another movie node would go here...
                    }
                  ]
                }
              },
              {
                // Another director node would go here...
              }
            ]
          }
        },
        {
          "role": "Hector Barbossa",
          "awards": ["best supporting actor"],
          "salary": 2000000000,
          "actor": {
            "firstName": "Geoffrey",
            "lastName": "Rush",
            "ACTED_UNDER": [
              {
                "director": {
                  "firstName": "Gore",
                  "lastName": "Verbinski"
                },
              },
            ],
          },
        },
      ],
    },
  },
  metadata: {
    // This would be data about the query (e.g. errors, query speed, etc).
  }
}
```

### Create multiple nodes/relationships with FOR

<!-- 
TODO: I still need to think through how this FOR function should work. For ideas on how I should design the functionality of this FOR function, see:
* Neo4j's FOREACH: https://neo4j.com/docs/cypher-manual/current/clauses/foreach/
* GelDB's for statement: https://docs.geldata.com/reference/edgeql/for
-->

The FOR clause is similar to Python's `for` loop.

This transaction will bulk insert nodes.

```js
const result = tx(
  `
    VAR newNodesList = []
    FOR user, index IN $users {
      VAR newNode = CREATE (User {
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: new Date(),
      })
      newNodesList.append(newNode)
    }
    // RETURN All newly created user nodes.
    RETURN newNodesList
  `,
  {
    $users: [
      { first_name: "John", last_name: "Smith" },
      { first_name: "Steve", last_name: "Johnson" },
      { first_name: "Will", last_name: "Ferguson" },
    ],
  }
);
```

---

## READ Data

### Read data and filter query results with the WHERE clause

```js
const result = tx(
  [
    {
      READ: `
        (m:Movie)
        -[r:MOVIE_ACTOR]-
        (a:ACTOR)
      `,
      WHERE: {
        m.title: INCLUDES($keyword),
        m.release_year: IS_GREATER_THAN($year),
        a.first_name: $first_name,
        a.last_name: $last_name,
      },
      ORDER_BY: {
        m.title: "ASC",
      },
    },
    {
      RETURN: `(m)-[r]-(a)`,
    },
  ],
  // Params
  {
    $keyword: "hero",
    $year: 2000,
    $first_name: "John",
    $last_name: "Smith",
  }
);
```

### Correct way to filter query

Use the WHERE clause to filter query results.

```js
const result = tx([
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
const result = tx([
  {
    READ: `(p:Person {
      name: "Sam Raimi",
    })`,
  }
]);
```

### Read Data with Filtering, Ordering, and Pagination

The ORDER_BY, SKIP, and LIMIT clauses go in the last operation in the transaction array along with the RETURN clause.

```js
const result = tx(
  [
    {
      READ: `
        (m:Movie)
        <-[a:ACTED_IN]-
        (p:Person)
      `,
      WHERE: {
        m.release_year: IS_GREATER_THAN(2017),
      },
    },
    {
      RETURN: `(m {id, title})<-[a]-(p {first_name, last_name})`,
      ORDER_BY: {
        m.title: "ASC"
      },
      // TODO: The results will be returned in a hierarchy, so I need to figure out how to skip and limit different parts of the hierarchical result set. Maybe what I have recorded below will work.
      // For ideas, look at how GelDB handles this (https://docs.geldata.com/learn/edgeql#filtering-ordering-and-pagination) and Neo4j (https://neo4j.com/docs/cypher-manual/current/clauses/skip/). Although, Neo4j returns a flat array of results, so that might not be too beneficial.
      SKIP: {
        m: 10,
      },
      LIMIT: {
        m: 10,
      },
    },
  ],
);
```

---

## UPDATE Data

### Use the READ and UPDATE clauses to update data

The READ and UPDATE clauses should be in their own operation objects.

Only the properties that are specified in the UPDATE clause will be updated. Nothing else will be touched.

```js
const result = tx(
  [
    {
      READ: `(m:Movie)`,
      WHERE: {
        m.title: $title,
      },
    },
    {
      UPDATE: {
        m.title: $newTitle,
      },
    },
    {
      RETURN: `(m)`,
    },
  ],
  {
    $title: "Doctor Strange 2",
    $newTitle: "Doctor Strange in the Multiverse of Madness",
  }
);
```

### Updating relationships

```js
const result = tx(
  [
    {
      READ: `(m:Movie)<-[a:ACTED_IN]-(p:Person)`,
      WHERE: {
        m.title: $title,
      },
    },
    {
      UPDATE: {
        a.year: $updatedYear,
      },
    },
    {
      RETURN: `(m)`,
    },
  ],
  {
    $title: "Doctor Strange 2",
    $updatedYear: 2021,
  }
);
```

---

## DELETE Data

### Use the READ and DELETE clauses to delete data

When deleting entire nodes or relationships, specify the nodes or relationships that you want to delete in the DELETE clause followed by `True`.

Any nodes/relationship that you specify in the RETURN clause will return the `id` of the node/relationships that have been deleted.

```js
const result = tx([
  {
    READ: `(m:Movie)`,
    WHERE: {
      m.title: STARTS_WITH("the avengers"),
    }
  },
  {
    DELETE: {
      m: True,
    },
  },
  {
    RETURN: `(m)`,
  },
]);
```

### How to DELETE properties

You can delete individual properties by specifying those properties inside an array in the DELETE clause. Any other properties that are not specified will be left untouched and the rest of the node/relationship will still exist.

```js
const result = tx(
  [
    {
      READ: `(m:Movie)`,
      WHERE: {
        m.id: EQUALS($id),
      },
    },
    {
      DELETE: {
        m: [viewer_rating],
      },
    },
    {
      RETURN: `(m)`,
    },
  ],
  {
    $id: "1234",
  }
);
```


### Deleting relationships

In order to delete nodes that have relationships to other nodes, you first have to delete any and all relationships that those nodes have. Then you can delete the nodes.

You can delete a relationship between two existing nodes by specifying the relationship in a DELETE clause.

Since each query runs a transaction of queries, you can specify only the data that you want to delete in each individual DELETE operation object. Make sure that relationships are deleted first.

```js
const result = tx(
  [
    {
      READ: `(m:Movie)<-[a:ACTED_IN]-(p:Person)`,
      WHERE: {
        m.id: EQUALS($mId),
        p.id: EQUALS($pId),
      },
    },
    {
      DELETE: {
        a: True,
      },
    },
    {
      DELETE: {
        m: True,
      },
    },
    {
      DELETE: {
        p: True,
      },
    },
    {
      RETURN: `(m)<-[a]-(p)`,
    },
  ],
  {
    $mId: "1234",
    $pId: "5678",
  }
);
```

Or you can combine all of the DELETE operations together into one DELETE operation object.

```js
const result = tx(
  [
    {
      READ: `(m:Movie)<-[a:ACTED_IN]-(p:Person)`,
      WHERE: {
        m.id: EQUALS($mId),
        p.id: EQUALS($pId),
      },
    },
    {
      DELETE: {
        m: True,
        a: True,
        p: True,
      },
    },
    {
      RETURN: `(m)<-[a]-(p)`,
    },
  ],
  {
    $mId: "1234",
    $pId: "5678",
  }
);
```


TODO: EdgeQL says that delete clauses can contain `filter`, `order by`, `offset`, and `limit` clauses (https://docs.edgedb.com/get-started/edgeql#delete-objects). (My versions of those clauses are WHERE, ORDER_BY, SKIP, and LIMIT.) Do those clauses make sense for deleting data, as in the follow example?

```js
const result = tx([
  {
    READ: `(m:Movie)`,
    WHERE: {
      m.title: STARTS_WITH("the avengers"),
    }
  },
  {
    DELETE: {
      m: True
    },
    LIMIT: {
      m: 3,
    },
  },
  {
    RETURN: `(m)`,
  },
]);
```

---

## Computed Properties

```js
const result = tx(
  [
    {
      READ: `(m:Movie)<-[ACTED_IN]-(p:Person)`,
    },
    {
      RETURN: `(m {title, title_upper, cast_size})`,
      COMPUTED: {
        m.title_upper: UPPER(),
        m.cast_size: COUNT(p)
      },
    },
  ],
});
```

---

TODO: CONTINUE HERE:

## Polymorphic queries & Grouping objects

See:
* https://docs.geldata.com/learn/edgeql#polymorphic-queries
* https://docs.geldata.com/learn/edgeql#grouping-objects

I don't think these types of queries would apply to my query language, but I could be wrong.
