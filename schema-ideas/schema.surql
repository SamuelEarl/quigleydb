-- I want to have the schema defined in one location to provide a quick reference of the database schema and to improve maintenance.

-- DATABASE MIGRATIONS:
-- This unofficial package has been recommended by SurrealDB users and some people who work for SurrealDB until they develop an official migration feature: https://github.com/Odonno/surrealdb-migrations.
-- It appears that I can alter the schema with the REMOVE FIELD and UPDATE statements. See https://surrealdb.com/learn/fundamentals/schemafull/schemafull-crud. How does this differ from actual schema migrations, like what you can do with the surrealdb-migrations package? I am guessing that one major difference is that actual schema migrations allow you to rollback changes whereas REMOVE FIELD plus UPDATE will not allow you to do that.
-- Also look at the OVERWRITE and ALTER statements: https://surrealdb.com/learn/fundamentals/schemafull/schemafull-crud

-- I want to make my SurrealDB data schemafull. That is done with the `DEFINE TABLE` statement (https://docs.surrealdb.com/docs/surrealql/statements/define/table). I might write functions to create a schema and constraints and execute those functions from the /scripts/index.js file. Or, when SurrealDB finishes the user interface, there might be an option to create a schema, when that is complete.

-- Change the data model to use graph relations. I think a graph will offer greater data integrity because the relations between each node will help to ensure that the correct data is being referenced. A graph would also help me prevent from having any dangling documents in the database that are not being referenced by other documents. Traversing a graph might offer greater data integrity and flexibility later on down the road.

-- Create the schema with the DEFINE TABLE statement: https://docs.surrealdb.com/docs/surrealql/statements/define/table.
-- Created indexes with the DEFINE INDEX statement: https://docs.surrealdb.com/docs/surrealql/statements/define/indexes/

-- TODO: Since the SELECT queries start by finding the User node whose id matches a given value or the UserAccount node whose id matches a given value, I should probably create an index on the User table and/or the User.id field and/or the UserAccount table and/or the UserAccount.id, if that's how the indexes work in SurrealDB.
-- NOTE: I do not need to create indexes if I am querying by the Record ID because Record IDs act as an index. However, if I am writing queries like you normally might with relational databases (e.g. using the WHERE, GROUP BY, or ORDER BY clauses to filter and sort query results), then I need an index because that would require a table scan instead of directly fetching data by Record ID. See https://surrealdb.com/learn/fundamentals/performance/index-data-model.


/*
GRAPH NAMING CONVENTIONS: 
I will use the same naming conventions that Neo4j uses so I can easily differentiate 
between nodes, edges/relationships, and the properties of nodes and edges in my queries.

>> DATABASE:
The database name should be capital snake case (i.e. the first letter of each word is capitalized and words are separated by underscores).
Example: `My_Database_Name`.

>> NODES: 
The table/collection name should be Pascal case, or upper camel case (i.e. the first letter of each word is capitalized). 
Example: `UserAccount`.

>> EDGES/RELATIONSHIPS: 
* The table/collection name should describe the relationship and should use all caps snake case (i.e. all the letters are capitalized and words are separated by underscores). 
Example: `USER_ACCOUNT_USER`.

Important Note: One question that needs to be answered is what properties should be stored in relationships vs nodes? This post on StackOverflow helps to answer that question: https://stackoverflow.com/questions/28121589/neo4j-storing-into-relationship-vs-nodes. It might be more useful to store properties in nodes and keep relationships simple. i.e. Just use relationship table names that describe the relationship and do not store any properties in the relationships. It might be fine to include a `createdAt` property in the relationship, but it might also be better to store that in the nodes.

>> PROPERTIES: 
All property names should be camel case. 
Example: `userId`.

NOTES:
* Table/collection names should be singular. SurrealDB's documentation uses singular table/collection names and singular names seem to make more sense in the queries.
* (UPDATE: SurrealDB's FROM, WHERE, FETCH, and LET clauses might allow for the kind of query flexibility and intuitiveness that I am looking for. I might just need to work with SurrealDB a bit more to get familiar with it.) SurrealDB's graph traversal is not as easy and intuitive to use as Neo4j. For example, Neo4j allows you to make long traversals and return properties from various parts of the traversal very easily by referencing the nodes or relationships in the traversal and the properties that you want to return from each one. It is also very obvious what is being queried and returned in a Neo4j query. Considering the complexity of SurrealDB queries, it might be best to keep the data schema shallow (i.e. keep the nodes one hop away from the UserAccount nodes). This app has a pretty simple data structure and probably does not need a graph structure, so this is probably how I should structure my data anyway to avoid making my data unnecessarily complex.
*/

-- See this example.surql file for a starting point: https://github.com/sebastianwessel/surrealdb-client-generator/blob/main/example.surql
-- Refer to the DEFINE FIELD docs: https://surrealdb.com/docs/surrealql/statements/define/field

-- TODO: Is there a way to check if the schema already exists? Yes. See the `DEFINE <something> IF NOT EXISTS <something else>` statement.
-- NOTE: Maybe this won't create a schema if the schema has already been created.
-- UPDATE: Maybe a check like that is not necessary.

-- TODO: Create any necessary indexes: https://surrealdb.com/docs/surrealdb/surrealql/statements/define/indexes.
-- I need to create an index at least for the UserAccount table.

-- UPDATE: I discovered that when I stop and restart the database, it wipes all the data clean, at least the local development database does that. So I do not need to use the REMOVE TABLE statement to drop any database schemas during development.
-- TODO: VERY IMPORTANT: I need to make sure that my staging and production databases, along with their schemas and indexes, do not get wiped if the database gets restarted.
-- Drop any old schema definitions that I am no longer using.
-- See https://docs.surrealdb.com/docs/surrealql/statements/remove/.
-- NOTE: I assume that I will be able to do this visually once the UI is ready.
-- const dropSchema = await db?.query(`
--   REMOVE TABLE Asset;
-- `);

-- TODO: I need to figure out any required and optional fields, default values, etc. Read through the DEFINE FIELD docs to find out what else I need to include: https://surrealdb.com/docs/surrealql/statements/define/field. I might also want to look at my `default.esdl` file.


-- --------------------------
-- TABLE: UserAccount
-- --------------------------
DEFINE TABLE UserAccount SCHEMAFULL;

DEFINE FIELD permissions ON TABLE UserAccount TYPE array<string>;
DEFINE FIELD createdAt ON TABLE UserAccount TYPE string;


-- --------------------------
-- TABLE: User
-- --------------------------
DEFINE TABLE User SCHEMAFULL;

DEFINE FIELD authServerUserId ON TABLE User TYPE string;
DEFINE FIELD firstName ON TABLE User TYPE string;
DEFINE FIELD lastName ON TABLE User TYPE string;
DEFINE FIELD preferredName ON TABLE User TYPE string;
DEFINE FIELD email ON TABLE User TYPE string
  ASSERT string::is::email($value);
DEFINE FIELD avatar ON TABLE User TYPE string;
-- The value of the field can only be one of the values that are defined in the array. See https://surrealdb.com/docs/surrealql/statements/define/field#array-with-allowed-values. 
-- Also see which operators you can use: https://surrealdb.com/docs/surrealql/operators.
-- This is similar to how Enums are used by other databases.
-- NOTE: It appears that `$value` has to be an array. So if the value that gets substituted for `$value` is already an array, then `$value` should NOT be wrapped inside of square brackets. Otherwise, if the value that gets substituted for `$value` is NOT an array, then `$value` should be wrapped inside of square brackets. For example, the user's `roles` field is an array<string> (e.g. the value looks like this: ["member"]), so for that field, $value` should NOT be wrapped with square brackets. But the user's `preferences.budgetLayout` field is a string (e.g. the value looks like this: "table"), so for that field, `$value` should be wrapped inside of square brackets.
-- The user's `roles` array can only contain the values that are specified in the array that follows the ASSERT keyword.
-- For more information about ASSERT statements, see https://surrealdb.com/docs/surrealql/statements/define/field and https://surrealdb.com/learn/fundamentals/schemafull/define-fields.
DEFINE FIELD roles ON TABLE User TYPE array<string>
  ASSERT ["member", "admin"] CONTAINSALL $value
  DEFAULT ["member"];
DEFINE FIELD createdAt ON TABLE User TYPE string;
DEFINE FIELD preferences ON TABLE User TYPE object;
-- The user's `preferences.budgetLayout` can only be one of the values from the specified array.
DEFINE FIELD preferences.budgetLayout ON TABLE User TYPE string 
  ASSERT [$value] CONTAINSANY ["table", "bubble", "mindMap"]
  DEFAULT "table";
-- The user's `preferences.theme` can only be one of the values from the specified array.
DEFINE FIELD preferences.theme ON TABLE User TYPE string
  ASSERT [$value] CONTAINSANY ["light", "dark"]
  DEFAULT "light";

-- Define indexes and constraints. TODO: I need to look through this schema and define indexes and constraints where necessary.
DEFINE INDEX authServerUserId ON TABLE User FIELDS authServerUserId;
DEFINE INDEX email ON TABLE User FIELDS email UNIQUE;


-- You can enforce relationships in the schema by using the TYPE RELATION statement: See https://surrealdb.com/docs/surrealql/statements/define/table. Note that the ENFORCED statement makes data creation work like it does in Neo4j.
-- In your queries you can create a relationship between two nodes with the RELATE statement. For example: 
-- RELATE UserAccount:01GT2ZEF2G8AC8D7H7FMZ1ZYZ3 -> USER_ACCOUNT_USER:ulid() -> User:01HGAR7A0R9BETTCMATM6SSXPT;
-- ------------------------------
-- EDGE TABLE: USER_ACCOUNT_USER
-- UserAccount->USER_ACCOUNT_USER->User
-- ------------------------------
DEFINE TABLE USER_ACCOUNT_USER SCHEMAFULL TYPE RELATION IN UserAccount OUT User ENFORCED;


-- TODO:
-- * Maybe when a user creates a budget or a bank transaction (on the bank-account page), then I will create Budget and BankTransaction nodes at that time. Maybe?
-- * When a user deletes a NetWorthItem record with subtype = bankAccount, then I need to alert the user that they will also delete all the transactions and budget data related to that bank account.
-- * I need to find out how to delete all child nodes of a (NetWorthItem {subtype:"bankAccount"}) node. Maybe I would use the LET clause to DELETE all the Budget nodes and then the BankTransaction nodes separately. See https://surrealdb.com/docs/surrealdb/surrealql/statements/delete.

-- NOTES:
-- * This is how a UserAccount is related to Budgets:
-- (UserAccount)->(NetWorthItem {subtype:"bankAccount"})->(Budget)
-- * This is how a UserAccount is related to BankTransactions:
-- (UserAccount)->(NetWorthItem {subtype:"bankAccount"})->(BankTransaction)
-- The Budget nodes and BankTransaction nodes branch off of (NetWorthItem {subtype:"bankAccount"}) nodes. The reason why is that Budget data (e.g. categories) could change over time, so organizing the data this way would allow me to relate any changes to Budget data in a given month with the corresponding BankTransactions for that same month.
-- * The (NetWorthItem {subtype:"bankAccount"}) `value` property is what will be displayed in the dashboard. That `value` property will be updated when the user saves transactions on their bank-account page.


-- --------------------------
-- TABLE: NetWorthItem
-- This table holds assets and liabilities
-- --------------------------
DEFINE TABLE NetWorthItem SCHEMAFULL;

-- `type` will be either "asset" or "liability".
DEFINE FIELD type ON TABLE NetWorthItem TYPE string;
-- `subtype` will be the type of asset or the type of liability.
DEFINE FIELD subtype ON TABLE NetWorthItem TYPE string;
DEFINE FIELD name ON TABLE NetWorthItem TYPE string;
-- Dollar amounts are stored as integers, which represents the cents for each amount. (This approach seems to be what other companies do: https://stackoverflow.com/questions/15726535/which-datatype-should-be-used-for-currency.) So the last 2 digits will represent the amount after the decimal point when converted to currency. The frontend will take the integer amount and display it as currency. The amounts will not be changed to decimal values in the frontend, they will just be displayed as currency amounts. That should ensure that the values being stored in the database are not altered, which will prevent errors that could occur when converting between decimals and integers.
-- Using the `decimal` data type for this field would work while preserving precision, but it does not appear to be possible to enforce a two-decimal constraint with `ASSERT math::fixed($value, 2)`. This only becomes an issue when the value is 0. SurrealDB will not accept a value of 0.00 (which would conform to the two-decimal constraint) because 0.00 is just treated as 0, which does not conform to the two-decimal constraint. But none of these issues exist if dollar amounts are stored as integer that represent the cents.
DEFINE FIELD value ON TABLE NetWorthItem TYPE int
  DEFAULT 0;
DEFINE FIELD calculatedBankBalance ON TABLE NetWorthItem TYPE option<bool>;
DEFINE FIELD loginURL ON TABLE NetWorthItem TYPE string;
DEFINE FIELD sortOrder ON TABLE NetWorthItem TYPE int;
DEFINE FIELD createdAt ON TABLE NetWorthItem TYPE string;


-- ------------------------------
-- EDGE TABLE: USER_ACCOUNT_NET_WORTH_ITEM
-- UserAccount->USER_ACCOUNT_NET_WORTH_ITEM->NetWorthItem
-- ------------------------------
DEFINE TABLE USER_ACCOUNT_NET_WORTH_ITEM SCHEMAFULL TYPE RELATION IN UserAccount OUT NetWorthItem ENFORCED;


-- TODO: How should I model subtransactions in the database? Each transaction record should have a `subtransactions` property that is an array of objects with the same data structure as the transactions objects. When a user creates a new transaction, it will be sent to the backend where an ID will be created for each transaction. When updates are made to the transactions, then those updates will be made by transaction ID. 
-- * The parent transaction will have a `category` of "Split Transaction" and its `amount` field will be calculated by adding the child transactions.
-- * The child transactions will inherit their `datetime` and `status` fields from the parent transaction.
-- --------------------------
-- TABLE: BankTransaction
-- --------------------------
DEFINE TABLE BankTransaction SCHEMAFULL;

DEFINE FIELD datetime ON TABLE BankTransaction TYPE string;
DEFINE FIELD year ON TABLE BankTransaction TYPE int;
DEFINE FIELD monthNumber ON TABLE BankTransaction TYPE int;
DEFINE FIELD description ON TABLE BankTransaction TYPE string;
-- See my comment above about the data type for dollar amounts.
DEFINE FIELD amount ON TABLE BankTransaction TYPE int;
-- Nested objects need to be defined as `TYPE object` before the fields of those nested objects are defined, otherwise no data will be inserted into those nested objects.
DEFINE FIELD category ON TABLE BankTransaction TYPE object;
DEFINE FIELD category.cashFlowType ON TABLE BankTransaction TYPE string;
DEFINE FIELD category.option ON TABLE BankTransaction TYPE string;
DEFINE FIELD status ON TABLE BankTransaction TYPE string
  ASSERT [$value] CONTAINSANY ["NONE", "PENDING", "CLEARED", "REJECTED", "BOUNCED", "OTHER"]
  DEFAULT "NONE";
DEFINE FIELD notes ON TABLE BankTransaction TYPE string;
-- TODO: This is how to define arrays of objects: https://surrealdb.com/learn/fundamentals/schemafull/define-fields
-- See also https://github.com/orgs/surrealdb/discussions/1443#discussioncomment-7447647
DEFINE FIELD subtransactions ON TABLE BankTransaction TYPE array<object>;
DEFINE FIELD subtransactions[*].description ON TABLE BankTransaction TYPE string;
-- See my comment above about the data type for dollar amounts.
DEFINE FIELD subtransactions[*].amount ON TABLE BankTransaction TYPE int;
DEFINE FIELD subtransactions[*].category ON TABLE BankTransaction TYPE object;
DEFINE FIELD subtransactions[*].category.cashFlowType ON TABLE BankTransaction TYPE string;
DEFINE FIELD subtransactions[*].category.option ON TABLE BankTransaction TYPE string;
DEFINE FIELD subtransactions[*].notes ON TABLE BankTransaction TYPE string;
-- This is the syntax from the documentation, but I prefer the syntax above:
-- DEFINE FIELD subtransactions.*.notes ON TABLE BankTransaction TYPE string;


-- ------------------------------
-- EDGE TABLE: NET_WORTH_ITEM_BANK_TRANSACTION
-- NetWorthItem->NET_WORTH_ITEM_BANK_TRANSACTION->BankTransaction
-- ------------------------------
DEFINE TABLE NET_WORTH_ITEM_BANK_TRANSACTION SCHEMAFULL TYPE RELATION IN NetWorthItem OUT BankTransaction ENFORCED;


-- TODO:
-- * Are there other budget items from the Summary.svelte component that should be properties in the Budget table?
-- --------------------------
-- TABLE: Budget
-- --------------------------
DEFINE TABLE Budget SCHEMAFULL;

DEFINE FIELD year ON TABLE Budget TYPE int;
DEFINE FIELD month ON TABLE Budget TYPE int;
-- TODO: I need to decide how I want to structure the categories and subcategories.
-- Should it be like this: categories = [{ name: "Food", subcategories: [ "Groceries", "Restaurants" ] }]
DEFINE FIELD categories ON TABLE Budget TYPE array<object>;
DEFINE FIELD subcategories ON TABLE Budget TYPE array<string>;


-- TODO: I need to figure out how to associate the BankTransaction table with the Budget table. Do I want them to both be related to the NetWorthItem table or do I want the Budget table to be a child table of the BankTransaction table?
