# Query Language

I want this database and query language to follow human-centered design principles as much as possible. For example, page 20 in the book "The Design of Everyday Things, 2nd Ed" talks about mapping. This is where the relationship between two things resemble each other. For example, if data is to be modeled as objects and their relationships to each other, then the query language should resemble the data model. That is what Cypher/GQL tries to do. I want to improve the GQL query language to make it even more intuitive and I also want the schema to resemble the data model.

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

The CRUD operations stand for CREATE, READ, UPDATE, and DELETE. So those are the clauses/functions that this query language will use (instead of SELECT, MATCH, etc.).

This database uses functions for the CRUD operations (e.g. CREATE, READ, UPDATE, and DELETE) and other query functionality (e.g. filter, update multiple node/relationships). All functions and clauses are capitalized with multi-word functions/clauses being separated by underscores.

TODO:
  * I want users to be able to add `print()` function in their queries to inspect any part of the query.
  * Should every function block and every statement end with a semicolon? Maybe I should just use the same convention that JavaScript uses.


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
    VAR movie = CREATE() {
      (m:Movie {
        title: $title,
        release_year: $release_year,
      });
      // Define a graph literal in the RETURN statement, which describes what to return from the query.
      RETURN (m {id, title, release_year});
    }
    
    RETURN movie;
  `,
  // Params
  {
    $title: "Avengers: The Kang Dynasty",
    $release_year: 2025,
  }
);
```

### Create nodes and a relationship between them

#### Verbose Method

```js
const result = tx(
  `
    VAR movie = CREATE() {
      (m:Movie {
        title: $title,
        release_year: $release_year,
      });
      RETURN m;
    }
    VAR actor = CREATE() {
      (a:Actor {
        first_name: $first_name,
        last_name: $last_name,
      });
      RETURN a;
    }
    VAR path = CREATE() {
      (movie)
      -[r:MOVIE_ACTOR {created_at: $created_at}]-
      (actor);
      RETURN (movie)-[r]-(actor); 
    }
    RETURN path;
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

#### Simplified Method

```js
const result = tx(
  `
    VAR data = CREATE() {
      (m:Movie {
        title: $title,
        release_year: $release_year,
      });
      (a:Actor {
        first_name: $first_name,
        last_name: $last_name,
      });
      VAR path = (m)-[r:MOVIE_ACTOR {created_at: $created_at}]-(a);
      RETURN path;
    }
    RETURN data;
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
    VAR movie = READ() {
      (Movie {
        title: "Pirates of the Carribean",
      });
    }
    
    VAR actor = READ() {
      (Person {
        first_name: "Johnny",
        last_name: "Depp",
      });
    }
    
    VAR director = READ() {
      (Person {
        first_name: "Gore",
        last_name: "Verbinski",
      });
    }
    
    VAR acted_in_path = CREATE() {
      (actor)-[ACTED_IN]->(movie);
    }
  
    VAR directed_path = CREATE() {
      (director)-[DIRECTED]->(movie);
    }

    VAR acted_under_path = CREATE() {
      (actor)-[ACTED_UNDER]->(director);
    }

    VAR path = READ() {
      (movie)-[ACTED_IN]-(actor {first_name, last_name})-[ACTED_UNDER]-(director {first_name, last_name})-[DIRECTED]-(movie);
    }

    RETURN path;
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
    VAR newNodesList = [];
    FOR user, index IN $users {
      VAR newNode = CREATE() {
        (User {
          first_name: user.first_name,
          last_name: user.last_name,
          created_at: new Date(),
        });
      }
      newNodesList.append(newNode);
    }
    // RETURN All newly created user nodes.
    RETURN newNodesList;
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

### Read data and filter query results with node or relation properties

```js
const result = tx(
  `
    VAR result = READ() {
      (m:Movie {
        title: INCLUDES($keyword),
        release_year: IS_GREATER_THAN($year),
      })
      -[r:MOVIE_ACTOR]-
      (a:ACTOR {
        first_name: $first_name,
        last_name: $last_name,
      });
    }
    RETURN result;
    ORDER_BY {
      result.m.title: "ASC",
    },
  `,
  // Params
  {
    $keyword: "hero",
    $year: 2000,
    $first_name: "John",
    $last_name: "Smith",
  }
);
```

TODO: Should all CRUD functions have an implicit RETURN unless specified? For example, the following query uses an explicit RETURN in the READ function and the ORDER_BY clause takes that into account by referencing `result.last_name` instead of `result.a.last_name`.

```js
const result = tx(
  `
    VAR result = READ() {
      (m:Movie {
        title: INCLUDES($keyword),
        release_year: IS_GREATER_THAN($year),
      })
      -[r:MOVIE_ACTOR]-
      (a:ACTOR {
        first_name: $first_name,
        last_name: $last_name,
      });
      RETURN a;
    }
    RETURN result;
    ORDER_BY {
      result.last_name: "ASC",
    },
  `,
  // Params
  {
    $keyword: "hero",
    $year: 2000,
    $first_name: "John",
    $last_name: "Smith",
  }
);
```


### Read Data with Filtering, Ordering, and Pagination

The ORDER_BY, SKIP, and LIMIT clauses go after the RETURN clause. You can think of them as being part of the RETURN clause.

```js
const result = tx(
  `
    VAR path = READ() {
      (m:Movie {
        release_year: IS_GREATER_THAN(2017),
      })
      <-[a:ACTED_IN]-
      (p:Person)
      RETURN (m {id, title})<-[a]-(p {first_name, last_name});
    }
    RETURN path;
    ORDER_BY {
      path.m.title: "ASC",
    };
    // TODO: The results will be returned in a hierarchy, so I need to figure out how to skip and limit different parts of the hierarchical result set. Maybe what I have recorded below will work.
    // For ideas, look at how GelDB handles this (https://docs.geldata.com/learn/edgeql#filtering-ordering-and-pagination) and Neo4j (https://neo4j.com/docs/cypher-manual/current/clauses/skip/). Although, Neo4j returns a flat array of results, so that might not be too beneficial.
    SKIP: {
      path.m: 10,
    };
    LIMIT: {
      path.m: 10,
    };
  `
);
```

---

## UPDATE Data

### Use the READ and UPDATE functions to update data

Only the properties that are specified in the UPDATE function will be updated. Nothing else will be touched.

```js
const result = tx(
  `
    VAR movie = READ() {
      (Movie {
        title: $title,
      });
    }

    VAR updatedMovie = UPDATE() {
      movie.title = $newTitle;
    }

    RETURN updatedMovie;
  `,
  {
    $title: "Doctor Strange 2",
    $newTitle: "Doctor Strange in the Multiverse of Madness",
  }
);
```

### Updating relationships

```js
const result = tx(
  `
    VAR path = READ() {
      (m:Movie {
        m.title: $title,
      })
      <-[a:ACTED_IN]-
      (p:Person);
    }

    VAR updatedRelation = UPDATE() {
      path.a.year = $updatedYear;
    }

    VAR updatedPath = READ() {
      (m:Movie {
        m.title: $title,
      })
      <-[a:ACTED_IN]-
      (p:Person);
    }

    RETURN updatedPath;
  `,
  {
    $title: "Doctor Strange 2",
    $updatedYear: 2021,
  }
);
```

---

## DELETE Data

### Use the READ and DELETE functions to delete data

Any nodes/relationship that you specify in the RETURN clause will return the `id` of the node/relationships that have been deleted.

```js
const result = tx(
  `
    VAR movie = READ() {
      (Movie {
        title: STARTS_WITH("the avengers"),
      });
    }

    VAR deletedMovieId = DELETE() {
      movie;
    }

    RETURN deletedMovieId;
  `,
);
```

### How to DELETE properties

You can delete individual properties by specifying those properties inside the DELETE function. Any other properties that are not specified will be left untouched and the rest of the node/relationship will still exist.

```js
const result = tx(
  `
    VAR movie = READ() {
      (Movie {
        id: EQUALS($id)
      });
    }

    VAR movieWithDeletedProps = DELETE() {
      movie.viewer_rating;
      movie.release_year;
    }

    RETURN movieWithDeletedProps;
  `,
  {
    $id: "1234",
  }
);
```

### Deleting relationships

In order to delete nodes that have relationships to other nodes, you first have to delete any and all relationships that those nodes have. Then you can delete the nodes.

You can delete a relationship between two existing nodes by specifying the relationship in a DELETE function.

Since each query runs a transaction of operations, you can specify only the data that you want to delete in each individual DELETE function. Make sure that relationships are deleted first.

```js
const result = tx(
  `
    VAR path = READ() {
      (m:Movie {
        id: EQUALS($mId),
      })<-[a:ACTED_IN]-(p:Person {
        id: EQUALS($pId),
      });
    }

    VAR deletedRelationId = DELETE() {
      path.a;
    }

    VAR deletedMovieId = DELETE() {
      path.m;
    }

    VAR deletedPersonId = DELETE() {
      path.p;
    }
    
    RETURN {
      deletedMovieId,
      deletedRelationId,
      deletedPersonId,
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
  `
    VAR path = READ() {
      (m:Movie {
        id: EQUALS($mId),
      })<-[a:ACTED_IN]-(p:Person {
        id: EQUALS($pId),
      });
    }

    VAR deletedDataIds = DELETE() {
      path.a; // The relationship that is to be deleted needs to be listed first.
      path.m;
      path.p;
    }
    
    RETURN deletedDataIds;
  `,
  {
    $mId: "1234",
    $pId: "5678",
  }
);


TODO: EdgeQL says that delete clauses can contain `filter`, `order by`, `offset`, and `limit` clauses (https://docs.edgedb.com/get-started/edgeql#delete-objects). (My versions of those clauses are WHERE, ORDER_BY, SKIP, and LIMIT.) Do those clauses make sense for deleting data, as in the follow example?

```js
const result = tx(
  `
    VAR movie = READ() {
      (Movie {
        title: STARTS_WITH("the avengers"),
      });
    }

    VAR deletedMovieIds = DELETE() {
      movie;
    }

    RETURN deletedMovieIds;
    LIMIT: {
      deletedMovieIds: 3,
    };
  `
);
```

---

## Computed Properties

```js
const result = tx(
  `
    VAR path = READ() {
      (m:Movie)<-[r:ACTED_IN]-(p:Person);
      RETURN (m {title, title_upper, cast_size})<-[r]-(p);
    }

    RETURN path;

    COMPUTED: {
      path.m.title_upper: UPPER(),
      path.m.cast_size: COUNT(p)
    }
  `,
);
```

---

TODO: CONTINUE HERE:

## Polymorphic queries & Grouping objects

See:
* https://docs.geldata.com/learn/edgeql#polymorphic-queries
* https://docs.geldata.com/learn/edgeql#grouping-objects

I don't think these types of queries would apply to my query language, but I could be wrong.
