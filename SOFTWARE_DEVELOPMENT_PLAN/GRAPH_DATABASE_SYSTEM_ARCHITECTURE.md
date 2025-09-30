# Why are graph databases written on top of key-value databases?

Graph databases are often written on top of key-value stores because a key-value store provides a very fast, flexible, and simple persistence layer, and graphs can be mapped efficiently onto that model. Here’s why this design is so common:

## 1. Simplicity of the Storage Model

* Key-value stores are conceptually minimal: `key → value`.
* Graphs can be broken down into small pieces (nodes, edges, properties), each of which can be stored as a key-value pair.
    * Example:
        * `node:123 → {properties...}`
        * `edge:456 → {from: node:123, to: node:789, type: "FRIENDS_WITH"}`

This makes it straightforward to persist graph structures without having to design a custom disk format from scratch.

## 2. Performance and Scalability

* Mature key-value stores (like RocksDB, LevelDB, or LMDB) are optimized for:
    * Fast random reads and writes
    * Efficient use of memory and disk
    * Log-structured storage with crash recovery
* Graph databases benefit from those optimizations "for free," without reinventing the storage engine.

## 3. Flexibility in Graph Representation

* Graphs are irregular structures: some nodes have millions of edges, others only one.
* Sparse and variable-sized relationships map more naturally to a key-value model than to rigid tabular (relational) schemas.
* You can design keys that encode adjacency lists:
    * `adj:node:123 → [edge1, edge2, edge3...]`

## Separation of Concerns

* The graph database can focus on graph logic (traversals, pattern matching, Cypher queries, etc.).
* The underlying key-value store handles low-level storage (persistence, caching, compaction, transactions).
* This separation keeps the graph engine simpler and more portable.

## Summary

Graph databases sit on top of key-value stores because KV stores give them a high-performance, scalable, and reliable foundation for persisting irregular graph structures, allowing the graph engine to focus on higher-level querying and algorithms.

---

# Graph Database System Architecture

A graph database written on top of a key-value store typically has a layered architecture that separates storage, graph representation, and query execution. Think of it like this:

## System Architecture Overview

```
+-----------------------------------------------------------+
| Layer 5: Query Language Layer (e.g., Cypher, Gremlin)     |
+-----------------------------------------------------------+
| Layer 4: Query Engine / Execution Layer                   |
|  - Parser, Planner, Optimizer, Execution Engine           |
+-----------------------------------------------------------+
| Layer 3: Graph Data Model Layer                           |
|  - Node Store, Edge Store, Property Store                 |
|  - Indexes, Caches, Schema Management                     |
+-----------------------------------------------------------+
| Layer 2: Key-Value Storage Layer                          |
|  - RocksDB / LevelDB / LMDB / Cassandra / etc.            |
|  - Log-structured merge trees, transactions               |
+-----------------------------------------------------------+
| Layer 1: File System / Hardware                           |
+-----------------------------------------------------------+
```

## Layer 5: Query Language Layer

ChatGPT did not provide any information about this layer. However, I don't think there is much to say about this layer. Whatever query language you design or use, that will be passed to the parser in layer 4 where it will be converted into an abstract syntax tree (AST).


## Layer 4: Query Engine / Execution Layer

This is where the graph intelligence happens:

1. Parser
    1. Parses Cypher, Gremlin, GraphQL, or custom query language.
2. Planner
    1. Converts query into a logical execution plan.
    2. Example: `MATCH (a:Person)-[:FRIEND]->(b) WHERE a.name="Alice"`
        1. Lookup node `a` by index on `Person:name`.
        2. Traverse `FRIEND` edges.
        3. Return connected nodes `b`.
3. Optimizer
    1. Chooses best indexes and join strategies.
    2. Pushes filters closer to storage layer when possible.
4. Execution Engine
    1. Runs operators like expand, filter, join, aggregate.
    2. Interacts with Graph Data Model to fetch nodes/edges.


## Layer 3: Graph Data Model Layer

This layer organizes raw KV entries into graph primitives:

1. Node Store
    1. Maintains node metadata (labels, properties).
    2. Handles property compression and serialization.
2. Edge Store
    1. Maintains edge metadata (source, target, type, properties).
    2. Uses adjacency lists for efficient traversals.
3. Property Store
    1. Stores large or complex properties separately (e.g., strings, JSON).
    2. Maps back to nodes/edges via property IDs.
4. Indexes
    1. Secondary indexes on labels, property values.
    2. Full-text indexes for searching properties.
    3. Schema-based constraints.
5. Caching Layer
    1. Keeps hot nodes/edges in memory.
    2. Often uses an LRU (Least Recently Used) strategy.

This layer abstracts away the KV schema so the query engine just "sees" graph objects.


## Layer 2: Key-Value Storage Layer

The key-value store is the persistence foundation. It provides:

* Put/Get/Delete operations
* Transactions/Consistency (depending on KV engine)
* On-disk format, compression, caching, compaction

Examples: RocksDB, LevelDB, LMDB, Cassandra, BadgerDB.

Graph data is encoded into keys and values. For instance:

* Node Storage

```
node:<id> → { label: "Person", properties: {name: "Alice", age: 30} }
```

* Edge Storage

```
edge:<id> → { from: node:123, to: node:456, type: "FRIEND" }
```

* Adjacency List (for traversal speed)

```
adj:<node-id>:<edge-type>:out → [edge-ids...]
adj:<node-id>:<edge-type>:in  → [edge-ids...]
```

* Index Storage

```
index:Person:name:Alice → node:123
```

The KV store doesn’t "know" about graphs — it just stores bytes. The graph layer interprets them.


## Layer 1: File System / Hardware

ChatGPT didn't mention anything for this layer, but that is probably because there is nothing specific to databases that needs to be described. This is just the same file system and hardware that any other software program would run on.

## Advanced Features

1. Transactions & Consistency
    1. Often provided by the underlying KV store (e.g., RocksDB supports atomic batches).
    2. Graph DB ensures higher-level ACID semantics.
2. Replication & Sharding
    1. For distributed KV stores (like Cassandra, FoundationDB), graph data can be partitioned.
    2. Adjacency lists may be partitioned by node ID ranges.
3. Graph Analytics
    1. Some systems (like FalkorDB, TigerGraph) use linear algebra over sparse matrices.
    2. Adjacency matrix stored in KV store, computations run via vectorized math.
4. Schema & Metadata
    1. Labels, relationship types, and property definitions stored separately.
    2. Ensures schema validation and query planning.

## Data Flow Example

Let’s say a query runs:

```
MATCH (a:Person {name: "Alice"})-[:FRIEND]->(b)
RETURN b.name
```

1. Parser: Converts query into AST.
2. Planner: Decides execution plan:
    1. Use index on `Person:name`.
    2. Traverse `FRIEND` edges.
    3. Collect neighbors.
3. Graph Layer:
    1. Fetch node Alice (`node:123`).
    2. Lookup adjacency list `adj:node:123:FRIEND:out`.
    3. Get connected nodes.
    4. Fetch property `name` for each neighbor.
4. Storage Layer:
    1. Translate lookups into KV gets (like RocksDB `Get()` calls).
5. Result: Return names of Alice’s friends.

## In essence

A graph database on a key-value store is like a "translation machine" — it translates graph operations into key-value lookups and updates. The KV store provides the raw persistence, while the graph layer provides structure, semantics, and query power.

---

# A graph adjacency list that is mapped onto a key-value schema (with concrete key naming patterns)

An adjacency list in a graph stores, for each node, the set of edges that connect it to other nodes. In a key-value backed graph DB, adjacency lists are usually stored as KV pairs with carefully designed keys so lookups are efficient.

Let’s model the key-value schema for adjacency lists with some Python code. We’ll simulate a key-value store using a plain dictionary. However, in a real database system, the key-value store could be RocksDB, LevelDB, LMDB, or another KV engine.

Let’s say we have a simple graph:

```
(Alice) -[:FRIEND]-> (Bob)
(Alice) -[:FRIEND]-> (Carol)
(Bob)   -[:WORKS_AT]-> (AcmeCorp)
```

```py
# Simulated key-value store
kv_store = {}

# -------------------------------
# 1. Insert Nodes
# -------------------------------
kv_store["node:1"] = {"label": "Person", "properties": {"name": "Alice"}}
kv_store["node:2"] = {"label": "Person", "properties": {"name": "Bob"}}
kv_store["node:3"] = {"label": "Person", "properties": {"name": "Carol"}}
kv_store["node:4"] = {"label": "Company", "properties": {"name": "AcmeCorp"}}

# -------------------------------
# 2. Insert Edges
# -------------------------------
kv_store["edge:100"] = {"from": 1, "to": 2, "type": "FRIEND"}
kv_store["edge:101"] = {"from": 1, "to": 3, "type": "FRIEND"}
kv_store["edge:102"] = {"from": 2, "to": 4, "type": "WORKS_AT"}

# -------------------------------
# 3. Build Adjacency Lists
# -------------------------------
kv_store["adj:out:1:FRIEND"] = [2, 3]   # Alice → Bob, Carol
kv_store["adj:out:2:WORKS_AT"] = [4]    # Bob → AcmeCorp

kv_store["adj:in:2:FRIEND"] = [1]       # Bob ← Alice
kv_store["adj:in:3:FRIEND"] = [1]       # Carol ← Alice
kv_store["adj:in:4:WORKS_AT"] = [2]     # AcmeCorp ← Bob

# -------------------------------
# 4. Indexes for fast lookup
# -------------------------------
kv_store["index:Person:name:Alice"] = 1
kv_store["index:Person:name:Bob"] = 2
kv_store["index:Person:name:Carol"] = 3
kv_store["index:Company:name:AcmeCorp"] = 4

# -------------------------------
# Query Example:
# -------------------------------
MATCH (a:Person {name: "Alice"})-[:FRIEND]->(b)
RETURN b.name


def query_friends_of(name: str):
    # Step 1: Lookup node ID from index
    node_id = kv_store[f"index:Person:name:{name}"]

    # Step 2: Get adjacency list for outgoing FRIEND edges
    friends_ids = kv_store.get(f"adj:out:{node_id}:FRIEND", [])

    # Step 3: Fetch names of connected nodes
    results = []
    for fid in friends_ids:
        friend_node = kv_store[f"node:{fid}"]
        results.append(friend_node["properties"]["name"])

    return results


# Run the query
print(query_friends_of("Alice"))
# Output → ['Bob', 'Carol']
```

This demonstrates how:

* Nodes, edges, adjacency lists, and indexes are all stored in a KV schema.
* A graph query (friends of Alice) turns into a few KV lookups.
