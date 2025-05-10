# Schema Definition Rules

## ID VALUES

* Explicit is better than implicit, so I want users to define their ID properties for nodes or relationships in the schema.

## REQUIRED & DEFAULT VALUES

* Required and default values seem to be beneficial features if they are implemented at the database level because you can enforce those constraints for users who access the database outside of the web app. Since I am creating Quigley for a web app, I can enforce required and default values through application code and I think the following notes are the best approach for a web app. I don't know if it makes sense to define "required" and "default" fields in the schema because I can simply assume that any field that is defined in the schema should be treated as a required field in CREATE and MERGE clauses and developers will have to provide default values in the code if a user does not provide a default value through the web app. This would be a stricter enforcement of the values that are inserted into the database, which is what I would prefer for data integrity. See the following notes for more details.
* If a property is defined in the schema, then it is considered to be a required property in CREATE and MERGE clauses. 
  * If I allow properties to be optional, then I would have to insert default values depending on the data type of the property (e.g. "" for string properties, 0 for number properties). I would have to insert the default value in both the query string and in the params object, but that seems too complex and maybe unnecessary. Maybe I should just require users to specify all values in the query string and the params object instead of allowing users to define default values in the schema. Since Cypher does not have a schema there is no way to define default values in Cypher, but I might want to change that with Quigley.
  * In version 1 I will require users to explicitly define the values and/or default values that should be inserted into the graph/database in each query that they define. Users would have to define their own default values in their code before they define a query. For example: `const displayName = payload.displayName ? payload.displayName : "";`
* TODO: Maybe this will be a version 2 feature, if I decide that I want to do this: If a user does not pass a required property (and param) in a CREATE or MERGE clause, then Quigly will throw an error, unless the user provides a default value in the schema. If the user does not pass a required property (and param) but does provide a default value in the schema, then the default value will be inserted into the database.
* If a user introduces a new property as part of a schema migration, then the user will need to define a default value that will be inserted into nodes or relationships that existed before the migration and that did not have that property previously. That way the schema will be consistent across the entire graph/database.

## RELATIONSHIPS

* Relationships are enforced through constraints that are defined on the database (i.e. they are not enforced through this package). So the `from` and `to` properties in a `relationship` object are not validated against the schema. However, the `from` and `to` properties are for your reference and can be used to help define the structure of your schema.
