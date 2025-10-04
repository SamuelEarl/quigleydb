from quigley import tx

fn main():
    var query = """
        var student: Path[(Student)] = CREATE(
            (s:Student {
                props: {
                    first_name: $first_name,
                    last_name: $last_name,
                    email: $email,
                    age: $age,
                    address: {
                        street: $street,
                        city: $city,
                        state: $state,
                        zip: $zip,
                    },
                    roles: $roles,
                    class_year: $class_year,
                    misc: $misc,
                },
                return: {
                    id,
                    title,
                    release_year,
                }
            })
        )
    """

    var params = {
        $first_name: "John",
        $last_name: "Smith",
        $email: "john@example.com",
        $age: 18,
        $street: "123 Main",
        $city: "New Town",
        $state: "YZ",
        $zip: "12345",
        $roles: ["student"],
        $class_year: "freshman",
        $misc: '{}',
    }

    var result = tx(query, params)







# const results = qgly(query,
#   {
#     params: {
#       email: "john@example.com",
#     }
#   }
# );

const query = `
  CREATE (s:Student {
    email: $email
  })
  RETURN s
`;

const results = qgly(query,
  {
    params: {
      email: "john@example.com",
    }
  }
);


# const query = `
#   CREATE (u:User {
#     userId: $userId,
#     sessionId: $sessionId,
#     firstName: $firstName,
#     lastName: $lastName,
#     email: $email,
#     password: $password,
#     isVerified: $isVerified,
#     roles: $roles
#   })
#   CREATE (t:Token {
#     token: $token,
#     createdAt: $timestamp
#   })
#   MERGE (u)-[r:EMAIL_VERIFICATION_TOKEN { 
#     createdAt: $timestamp
#   }]->(t)
#   RETURN u,t,r
# `;

# const results = qgly(query,
#   {
#     params: {
#       userId: "1234",
#       sessionId: "9876",
#       firstName: "John",
#       lastName: "Doe",
#       email: "john@example.com",
#       password: "pa$$word",
#       isVerified: true,
#       roles: ["user", "priviledged"],
#       token: "abc123",
#       timestamp: new Date(),
#     }
#   }
# );

# ------------------------------------------

# # Return data about the movie, actors, directors, and the relationships between each.
# const query = `
#   MATCH (m:Movie {
#     title: $title
#   })<-[:ACTED_IN]-(a:Actor)-[:ACTED_UNDER]-(d:Director)
#   RETURN m, ACTED_IN, a.firstName, a.lastName, d.firstName, d.lastName
# `;

# const results = qgly(query,
#   {
#     params: {
#       title: "Pirates of the Carribean",
#     }
#   }
# );

# ------------------------------------------

# const query = `
#   MATCH (m:Movie {
#     title: $title,
#     genres: $genres,
#     year: $year
#   })<-[r:ACTED_IN {
#     createdAt: $timestamp 
#   }]-(a:Actor {
#     name: $name,
#     age: $age
#   })
#   RETURN m, r, a
# `;

# const query = `
#   MATCH (a:Actor {
#     name: $name,
#     age: $age
#   })
#   RETURN m, r, a
# `;


# const results = qgly(query,
#   {
#     params: {
#       title: "Pirates of the Carribean",
#       genres: ["action", "adventure", "comedy"],
#       year: 2003,
#       timestamp: new Date(),
#       name: "Mr. Sir",
#       age: 60,
#     }
#   }
# );

# const createResult = qgly(`
#     CREATE (m:Movie {
#       title: $title,
#       genres: $genres,
#       year: $year
#     })
#   `,
#   {
#     params: {
#       title: "Pirates of the Carribean",
#       genres: ["action", "adventure", "comedy"],
#       year: 2003,
#     }
#   }
# );

# const matchResult = qgly(`
#     MATCH (m:Movie {
#       title: $title
#     })<-[r:ACTED_IN]-(a:Actor)
#     RETURN m, r, a
#   `,
#   {
#     params: {
#       title: "Pirates of the Carribean",
#     }
#   }
# );
