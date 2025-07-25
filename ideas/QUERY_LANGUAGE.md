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

TODO: I am seeing a pattern where all the queries can/should be performed in stage0 and then stage1 is just a simple RETURN of stage0. That's not very beneficial. Maybe I can get rid of the query function and just use the tx() function. Hmmm. Still thinking through these ideas.

---

## CREATE Data

### Create a single node and return individual properties

The transaction function (`tx()`) takes two arguments: 

1. A query transaction object that contains all of the queries. 
    1. Each key in the transaction object is a stage in the transaction and the value of each stage is a `query()` function. 
    2. The stages will be executed in the order of their key names, not in the order in which they are listed. So, for example, if the first stage listed is `stage0`, the second is `stage2`, and the third is `stage1`, the execution order will be `stage0`, `stage1`, `stage2`.
2. A params object. 
    1. Each key in the params object needs to be prefixed with a dollar symbol `$` and each param inside a `query()` function needs to match exactly. 
    2. When the query is sent to the database the param inside the `query()` function will be replaced with the value of the param that is inside the params object.

You have to specify what you want returned from the transaction in the last stage using a RETURN clause.

In all stages previous to the last stage you can specify individual properties that you want returned for nodes and relationships with a RETURN clause. If you do not specify individual properties, then all properties will be returned for the node or relationship.


```js
const result = tx(
  // Query Transaction Object
  {
    stage0: query(`
      CREATE (m:Movie {
        title: $title,
        release_year: $release_year,
      })
      // Use a RETURN statement to define a graph literal, which describes what to return from the stage0 query.
      RETURN (m {id, title, release_year})
    `),
    stage1: query(`
      // Return the results of the query from stage0.
      RETURN stage0
    `),
  },
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
  {
    stage0: query(`
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
    `),
    stage1: query(`
      RETURN stage0
    `),
  },
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
  {
    stage0: query(`
      READ: (m:Movie)
      WHERE: {
        m.title: "Doctor Strange",
      }
      RETURN (m)
    `),
    stage1: query(`
      READ: (p1:Person)
      WHERE: {
        p1.first_name: "Benedict",
        p1.last_name: "Cumberbatch",
      }
      RETURN (p1)
    `),
    stage2: query(`
      READ: (p2:Person)
      WHERE: {
        p2.first_name: "Benedict",
        p2.last_name: "Wong",
      }
      RETURN (p2)
    `),
    stage3: query(`
      CREATE: (stage1)-[a:ACTED_IN]->(stage0),
    `),
    stage4: query(`
      CREATE: (stage2)-[a:ACTED_IN]->(stage0),
    `),
    stage5: query(`
      RETURN (stage1 {first_name, last_name})-[a:ACTED_IN]->(stage0)<-[a:ACTED_IN]-(stage2 {first_name, last_name})
    `),
  },
  // TODO: Decide if the RETURN clause in the last stage should be an object of properties (like the WHERE clause) or a string of graph relations (like the READ clause).
  // {
  //   RETURN: {
  //     stage1: [ first_name, last_name ],
  //     a: True,
  //     stage0: True,
  //     stage2: [ first_name, last_name ],
  //   },
  // },
);
```

Or you could also do this:

```js
const result = tx(
  {
    stage0: query(`
      READ: (m:Movie)
      WHERE: {
        m.title: "Doctor Strange",
      }
      
      READ: (p1:Person)
      WHERE: {
        p1.first_name: "Benedict",
        p1.last_name: "Cumberbatch",
      }
      
      READ: (p2:Person)
      WHERE: {
        p2.first_name: "Benedict",
        p2.last_name: "Wong",
      }
      
      CREATE: (p1)-[a:ACTED_IN]->(m)
    
      CREATE: (p2)-[a:ACTED_IN]->(m)

      RETURN (p1 {first_name, last_name})-[a]->(m)<-[a]-(p2 {first_name, last_name})
    `),
    stage1: query(`
      RETURN stage0
    `),
  },
  // TODO: Decide if the RETURN clause in the last stage should be an object of properties (like the WHERE clause) or a string of graph relations (like the READ clause).
  // {
  //   RETURN: {
  //     p1: [ first_name, last_name ],
  //     a: True,
  //     m: True,
  //     p2: [ first_name, last_name ],
  //   },
  // },
);
```

### Create multiple nodes/relationships with FOR

<!-- 
TODO: I still need to think through how this FOR function should work. For ideas on how I should design the functionality of this FOR function, see:
* Neo4j's FOREACH: https://neo4j.com/docs/cypher-manual/current/clauses/foreach/
* GelDB's for statement: https://docs.geldata.com/reference/edgeql/for
-->

The FOR clause is similar to Python's `for` loop.

```js
const result = tx(
  {
    // Bulk insert nodes.
    stage0: query(`
      VAR newNodes = []
      FOR user, index IN $users {
        CREATE (User {
          first_name: user.first_name,
          last_name: user.last_name,
          created_at: new Date(),
        })
      }
      // RETURN All newly created user nodes.
      RETURN newNodes
    `),
  },
  // Params
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
