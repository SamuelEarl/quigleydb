# Query Language

I want this database and query language to follow human-centered design principles as much as possible. For example, page 20 in the book "The Design of Everyday Things, 2nd Ed" talks about mapping. This is where the relationship between two things resemble each other. For example, if data is to be modeled as objects and their relationships to each other, then the query language should resemble the data model. That is what Cypher/GQL tries to do. I want to improve the GQL query language to make it even more intuitive and I also want the schema to resemble the data model.

These are some ideas for a query language that is simple and intuitive. I want the query language to model the data structure (like what Cypher/GQL does), but I also want the query functions to use standard programming language constructs. In fact, I think the query language will just be Mojo code with some GQL language constructs mixed in that make it easy to work with nodes and edges because the mapping will fit the conceptual model. For example, if you need to update multiple nodes or relationships in a query, then a regular Mojo `for` loop can be used (see https://neo4j.com/docs/cypher-manual/current/clauses/foreach/ for ideas). Since the query language will just be Mojo code, then it will take advantage of variables that can be referenced inside the queries.

I want there to be only one way to do something (similar to Python's manifesto). For example:

* To filter READ operations, I want to use an explicit WHERE property.
* GQL allows for multiple ways to create data (CREATE, MERGE, others?). That is very confusing. You should only be able to create data with the CREATE clause and nothing else.

There should be only one way to perform an operation.


### Strongly Typed Variables

It would be nice if this query language was strongly typed. "Since EdgeQL is a strongly typed language, all query parameters must be prepended with a type cast to indicate the expected type." (See https://docs.edgedb.com/get-started/edgeql#query-parameters)


## Query Composition

Each query is run as a transaction that is constructed as a function that can have as many CRUD operations as you need.

The alias values in a CRUD operation allow you to reference the result of a query in subsequent CRUD operations.

The CRUD operations stand for CREATE, READ, UPDATE, and DELETE. So those are the functions that this query language will use (instead of SELECT, MATCH, etc.).

This database uses functions for the CRUD operations (e.g. CREATE, READ, UPDATE, and DELETE) and other query functionality (e.g. filter, update multiple node/relationships). All functions and clauses are capitalized with multi-word functions/clauses being separated by underscores.

Since each query is just Mojo code, I want users to be able to add `print()` function in their queries to inspect any part of the query.


## Example Queries

The following query ideas are taken from https://docs.edgedb.com/get-started/edgeql and converted into a query language that I think would be easy and intuitive to use. NOTE: I think that would be this page now: https://docs.geldata.com/learn/edgeql.

---

## CREATE Data

### Create a single node and return individual properties

The transaction function (`tx()`) takes two arguments: 

1. A string of query statements, which are composed as a function body.
    1. If users can compose statements into a function body and just pass that function body to the tx() function (as a string), then that would open up a lot of possibilities and it could make the queries much simpler.
    2. All variables that are defined within the query statements are global within a transaction. So anything that is defined can be referenced later in the query (e.g. aliases, variables that are defined with `var`).
2. A params object.
    1. Each key in the params object needs to be prefixed with a dollar symbol `$` and each param inside a `tx()` function needs to match exactly.
    2. When the query is sent to the database the params inside the `tx()` function will be replaced with the value of the param that is inside the params object.

You have to specify what you want returned from the transaction using a RETURN clause.

```py
result = db.tx(
    """
    var movie: Path[(Movie)] = CREATE(
        (m:Movie {
            "title": $title,
            "release_year": $release_year,
        })
    )

    # Define a graph literal in the RETURN clause, which describes what to return from the query.
    RETURN (movie {"id", "title", "release_year"})
    """,
    # Params
    {
        "$title": "Avengers: The Kang Dynasty",
        "$release_year": 2025,
    }
)
```

### Create nodes and a relationship between them

```py
result = db.tx(
    """
    var path: Path[[(Movie)-[MOVIE_ACTOR]-(Actor)] = CREATE(
        (m:Movie {
            "title": $title,
            "release_year": $release_year,
        })
        -[r:MOVIE_ACTOR {"created_at": $created_at}]-
        (a:Actor {
            "first_name": $first_name,
            "last_name": $last_name,
        })
    )

    RETURN path
    """,
    {
        "$title": "Avengers: The Kang Dynasty",
        "$release_year": 2025,
        "$first_name": "John",
        "$last_name": "Smith,
        "$created_at": datetime.datetime.now(),
    },
)
```

### Create new relationships between existing nodes

NOTE: You can filter inside a READ() function by passing a `WHERE` clause to node or relation properties. You can also pass a `RETURN` clause inside a node or relation properties to specify which properties you want to return, which is similar to how GraphQL works. However, if you do not pass a `RETURN` clause to a node or relation, then all properties for that node or relation will be returned.

```py
result = db.tx(
    """
    var movie: Path[(Movie)] = READ(
        (m:Movie {
            "WHERE": {
                "title": "Pirates of the Carribean",
            },
            "RETURN": {
                "title",
                "releaseYear",
                "genres",
            },
        })
    )
    
    var actor: Path[(Person)] = READ(
        (p:Person {
            "first_name": "Johnny",
            "last_name": "Depp",
        })
    )
    
    var director: Path[(Person)] = READ(
        (p:Person {
            "first_name": "Gore",
            "last_name": "Verbinski",
        })
    )

    # Create relation
    CREATE(
        (actor)-[ACTED_IN]->(movie)
    )

    # Create relation
    CREATE(
        (director)-[DIRECTED]->(movie)
    )

    # Create relation
    CREATE(
        (actor)-[ACTED_UNDER]->(director)
    )

    # If you have a complex data object that you want to return, then call the READ() function and pass it the query path.
    var path: Path[(Movie)-[ACTED_IN]-(Actor)-[ACTED_UNDER]-(Director)-[DIRECTED]-(Movie)] = READ(
        (movie)-[ACTED_IN]-(actor { "RETURN": "first_name", "last_name"})-[ACTED_UNDER]-(director { "RETURN": "first_name", "last_name"})-[DIRECTED]-(movie)
    )

    RETURN path
    """,
)
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

---

## READ Data

### Read data and filter query results with node or relation properties

```py
result = db.tx(
    """
    var path: Path[(Movie)-[Movie_Actor]-(Actor)] = READ(
        (m:Movie {
            "WHERE": {
                "title": INCLUDES($keyword),
                "release_year": IS_GREATER_THAN($year),
            }
        })
        -[r:MOVIE_ACTOR]-
        (a:Actor {
            "WHERE": {
                "first_name": EQUALS($first_name),
                "last_name": EQUALS($last_name),
            },
        })
    )

    RETURN path

    ORDER_BY {
        path.m.title: "ASC",
    }
    """,
    {
        "$keyword": "hero",
        "$year": 2000,
        "$first_name": "John",
        "$last_name": "Smith",
    }
)
```

The RETURN clause states to return only the Actors from the path, which will return a flat list of Actors.

```py
result = db.tx(
    """
    var path: Path[(Movie)-[MOVIE_ACTOR]-(Actor)] = READ(
        (m:Movie {
            "WHERE": {
                "title": INCLUDES($keyword),
                "release_year": IS_GREATER_THAN($year),
            },
        })
        -[r:MOVIE_ACTOR]-
        (a:Actor {
            "WHERE": {
                "first_name": EQUALS($first_name),
                "last_name": EQUALS($last_name),
            },
            "ORDER_BY": {
                "last_name": "ASC",
            }
        })
    )

    # You can filter what is returned from the path by specifying the return variable followed by brackets and then passing a path literal inside those brackets.
    RETURN path[(a)]
    """,
    {
        "$keyword": "hero",
        "$year": 2000,
        "$first_name": "John",
        "$last_name": "Smith",
    }
)
```


### Read Data with Filtering, Ordering, and Pagination

The ORDER_BY, SKIP, and LIMIT clauses go after the node/relation RETURN clause. You can think of them as being part of the RETURN clause.

The results will be returned in a hierarchy and this is how you can specify which parts of the hierarchy can be skipped and/or limited.

For ideas, look at how GelDB handles this (https://docs.geldata.com/learn/edgeql#filtering-ordering-and-pagination) and Neo4j (https://neo4j.com/docs/cypher-manual/current/clauses/skip/). Although, Neo4j returns a flat array of results, so that might not be too beneficial.

```py
result = db.tx(
    """
    var path: Path[(Movie)<-[ACTED_IN]-(Person)] = READ(
        (m:Movie {
            "WHERE": {
                "release_year": IS_GREATER_THAN(2017),
            },
            "RETURN": {
                "id",
                "title",
            },
            "ORDER_BY": {
                "title": "ASC",
            },
            "SKIP": 10,
            "LIMIT": 10,
        })
        <-[a:ACTED_IN]-
        (p:Person {
            "RETURN": {
                "first_name", 
                "last_name",
            }
        })
    )

    RETURN path
    """
)
```

---

## UPDATE Data

### Use the UPDATE function along with the SET option to update data

Only the properties that are specified in the UPDATE function will be updated. Nothing else will be touched.

The UPDATE() function will only return the `id` field of the objects that were updated. If you want to retrieve an updated object, then use the READ() function to retrieve it (maybe by its `id`).

```py
result = db.tx(
    """
    var updatedMovieId: Path[(Movie)] = UPDATE(
        (Movie {
            "WHERE": {
                "title": EQUALS($title),
            },
            "SET": {
                "title": $newTitle,
            }
        })
    )

    RETURN updatedMovieId

    # Return value:
    # {
    #     data: {
    #         Movie: "1234", # This is the `id` of the updated object.
    #         # Movie: [ "1234", "5678", ... ] # If multiple Movie nodes were updated, then it would return an array of `id`s.
    #     },
    #     metadata: {}
    # }
  """,
  {
    "$title": "Doctor Strange 2",
    "$newTitle": "Doctor Strange in the Multiverse of Madness",
  }
)
```

### Updating relationships

```py
result = db.tx(
    """
    var updatedRelationId: Path[] = UPDATE(
        (m:Movie {
            "WHERE": {
                "title": $title,
            },
        })
        <-[a:ACTED_IN {
            "SET": {
                "year": $updatedYear,
            },
        }]-
        (p:Person)
    )

    RETURN updatedRelationId
    """,
    {
        $title: "Doctor Strange 2",
        $updatedYear: 2021,
    }
)
```

### Update multiple nodes/relationships with for loops

<!-- 
TODO: I still need to think through how this for loop should work. For ideas on how I should design the functionality of this FOR function, see:
* Neo4j's FOREACH: https://neo4j.com/docs/cypher-manual/current/clauses/foreach/
* GelDB's for statement: https://docs.geldata.com/reference/edgeql/for
-->

Since the queries are just Mojo code, it is easy to update multiple objects using a for loop.

```py
result = db.tx(
    """
    var newNodesList = []
    for user, index in $users:
        var newNode = UPDATE(
            (User {
                "WHERE": {
                    "id": EQUALS(user.id),
                },
                "SET": {
                    "age": INCREMENT(user.age, user.age + 1),
                },
            })
        )

        newNodesList.append(newNode)

    # RETURN All newly created user nodes.
    RETURN newNodesList
    """,
    {
        "$users": [
            { "id": 1, "first_name": "John", "last_name": "Smith" },
            { "id": 2, "first_name": "Steve", "last_name": "Johnson" },
            { "id": 3, "first_name": "Will", "last_name": "Ferguson" },
        ],
    }
)
```

---

## DELETE Data

### Use the DELETE function to delete data

Any nodes/relationship that you specify in the RETURN clause will return the `id` of the node/relationships that have been deleted.

The DELETE() function will only return the `id` field of the objects that were deleted.

```py
result = db.tx(
  """
    var deletedMovieId = DELETE(
        (m:Movie {
            "WHERE": {
                "title": STARTS_WITH("the avengers"),
            },
            "DELETE": True,
        })
    )

    RETURN deletedMovieId

    # Return value:
    # {
    #     data: {
    #         m: "1234", # This is the `id` of the deleted object.
    #     },
    #     metadata: {}
    # }
  """,
)
```

### Deleting relationships

In order to delete nodes that have relationships to other nodes, you first have to delete any and all relationships that those nodes have. Then you can delete the nodes. Or you can do it all in one query.

You can delete a relationship between two existing nodes by specifying the relationship in a DELETE function.

Since each query runs a transaction of operations, you can specify only the data that you want to delete in each individual DELETE function. Make sure that relationships are deleted first.

```py
result = db.tx(
    """
    var deletedObjects = DELETE(
        (m:Movie {
            "WHERE": {
                "id": EQUALS($mId),
            },
            "DELETE": True,
        })
        <-[a:ACTED_IN {
            "DELETE": True,
        }]-
        (p:Person {
            "WHERE": {
                "id": EQUALS($pId),
            },
            "DELETE": True,
        })
    )
    
    RETURN deletedObjects

    # Return value:
    # {
    #     data: {
    #         # These are the `id`s of the deleted objects.
    #         a: "0987",
    #         m: "1234",
    #         p: "5678",
    #     },
    #     metadata: {}
    # }
    """,
    {
        "$mId": "1234",
        "$pId": "5678",
    }
)
```

### Delete properties with the DELETE function and the REMOVE option

You can delete individual properties by specifying those properties inside the "REMOVE" option of a DELETE function. Any other properties that are not specified will be left untouched and the rest of the node/relationship will still exist.

```py
result = db.tx(
    """
    var movieWithDeletedProps = DELETE(
        (Movie {
            "WHERE": {
                "id": EQUALS($id)
            },
            "REMOVE": {
                "viewer_rating",
                "release_year",
            }
        })
    )

    RETURN movieWithDeletedProps
    """,
    {
        $id: "1234",
    }
)
```


TODO: EdgeQL says that delete clauses can contain `filter`, `order by`, `offset`, and `limit` clauses (https://docs.edgedb.com/get-started/edgeql#delete-objects). (My versions of those clauses are WHERE, ORDER_BY, SKIP, and LIMIT.) Do those clauses make sense for deleting data, as in the follow example?

```py
result = db.tx(
    """
    var deletedMovieIds = DELETE(
        (Movie {
            "WHERE": {
                "title": STARTS_WITH("the avengers"),
            },
            "LIMIT": 3,
        })
    )

    RETURN deletedMovieIds
    """
)
```

---

## Computed Properties

```py
result = db.tx(
    """
    var path = READ(
        (m:Movie {
            COMPUTED: {
                "title_upper": title.upper(),
                "cast_size": COUNT(p)
            }
            "RETURN": {
                "title",
                "title_upper",
                "cast_size",
            }
        })
        <-[r:ACTED_IN]-
        (p:Person {
            COMPUTED: {
                "cast_size": COUNT(p)
            }
        })
    )

    RETURN path
    """,
)
```

---

TODO: CONTINUE HERE:

## Polymorphic queries & Grouping objects

See:
* https://docs.geldata.com/learn/edgeql#polymorphic-queries
* https://docs.geldata.com/learn/edgeql#grouping-objects

I don't think these types of queries would apply to my query language, but I could be wrong.
