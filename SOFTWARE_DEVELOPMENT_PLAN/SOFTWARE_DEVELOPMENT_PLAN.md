# Software Development Plan

---

# If I wanted to rewrite RocksDB in the Mojo language, where should I start?

Great question — rewriting RocksDB (or any log-structured merge-tree database) in Mojo is an ambitious project. RocksDB itself is a huge C++ codebase (>400K LOC), optimized over decades. But if your goal is to build a Mojo-native key-value store inspired by RocksDB, here’s how I’d recommend breaking it down:

## Step 1: Understand the Core Design of RocksDB

RocksDB is a log-structured merge-tree (LSM) key-value store. Its core components are:

1. Write Path
    1. Writes go into a memtable (an in-memory skiplist or balanced tree).
    2. Appended to a WAL (Write-Ahead Log) for durability.
    3. When memtable is full → flush to disk as an SSTable (immutable sorted file).
2. Read Path
    1. Look in memtable → then immutable memtables → then SSTables (via bloom filters + index blocks).
    2. Merged view across levels.
3. Compaction
    1. Periodically merge SSTables to reduce read amplification and reclaim space.
4. Other Features
    1. Column families
    2. Transactions
    3. Prefix seek, iterators
    4. Bloom filters, caching layers

At its core, RocksDB = WAL + Memtable + SSTables + Compaction + Iterators.

## Step 2: Start Small in Mojo

Mojo is designed for low-level, high-performance systems code (similar to Rust/C++). You’ll want to build incrementally:

### Phase 1: In-Memory KV Store

* Implement a simple memtable (hashmap or sorted map).
* Support put(key, value), get(key), delete(key).

```mojo
struct MemTable:
    var store: Dictionary[String, String]

    fn put(self, key: String, value: String):
        self.store[key] = value

    fn get(self, key: String) -> String?:
        return self.store.get(key)
```

### Phase 2: Persistence (WAL + SSTable Files)

1. Implement a Write-Ahead Log:
    1. Append every write to a log file.
    2. On restart, replay WAL to rebuild memtable.
2. Implement SSTables:
    1. Immutable, sorted files on disk.
    2. Store keys in sorted order.
    3. Include index block + bloom filter.

### Phase 3: Compaction

1. Merge multiple SSTables into fewer levels.
2. Keep keys sorted and deduplicate deleted/overwritten entries.
3. This is the heart of LSM-tree design.

### Phase 4: Iterators + Bloom Filters

1. Iterators for range scans (`db.range("a", "z")`).
2. Bloom filters for efficient negative lookups.

### Phase 5: Optimizations

1. Caching (block cache, row cache).
2. Column families (namespaces for data).
3. Transactions (optional, advanced).


## Step 3: Suggested Roadmap

1. Build a minimal KV store in Mojo (memtable + WAL).
2. Add SSTable format (sorted immutable files).
3. Implement compaction (merge sorted runs).
4. Layer indexing + bloom filters for reads.
5. Benchmark vs. RocksDB to find bottlenecks.

In short: Start by re-implementing a toy LSM-tree in Mojo: WAL → Memtable → SSTable → Compaction. That’s the foundation of RocksDB. Once you’ve got that, you can extend into advanced RocksDB features.

Look in the `HELLO_LSM_STARTER_KIT.md` file for a starting point.

---

# If I wanted to create a graph database on top of RocksDB using the Mojo language, where should I start?

If you want to build a graph database on top of RocksDB in Mojo, the key is to think in layers. Let’s break it down step by step so you know where to start and how to progress:

## 1. Understand the Core Idea

* RocksDB: A fast key-value store (persistent, embedded, ordered).
* Graph database: Needs to store and query nodes, edges, properties, and indexes.
* Mojo: A systems-oriented, high-performance language (similar to Python syntax but with C++/Rust-like performance). Since Mojo doesn’t yet have a fully fleshed-out ecosystem, you’ll likely need to use its FFI (foreign function interface) to bind to RocksDB’s C API.

Your graph database will sit on top of RocksDB as a storage layer.

## 2. Define the Storage Model

You’ll need to decide how to map graph concepts to key-value pairs.

A common approach is:

* Nodes:

Key: `"node:<node_id>"` → Value: serialized properties (JSON, MessagePack, ProtoBuf, or a custom format).

* Edges:

Key: `"edge:<src_id>:<dst_id>:<label>"` → Value: serialized edge properties.
(Optional: store a reversed key for fast reverse lookups).

* Adjacency lists:

Key: `"adj:<node_id>"` → Value: list of neighbor node IDs (or compressed sparse row representation for linear algebra queries).

This way, RocksDB acts as your raw graph store.

## 3. Sparse Matrix Representation

Since you mentioned FalkorDB-style sparse matrices:

* Store adjacency lists in RocksDB, but also load them into memory as sparse matrices (e.g., CSR or COO format) when querying.
* For queries like "neighbors of X" → use RocksDB lookups.
* For graph algorithms (PageRank, shortest path, etc.) → pull subsets into sparse matrices and run linear algebra ops.

## 4. Mojo Integration Plan

Since RocksDB is written in C++, you’ll need to bind it. Steps:

1. Use Mojo’s C FFI to call RocksDB’s C API.
    1. Wrap `rocksdb_open`, `rocksdb_put`, `rocksdb_get`, `rocksdb_iterate`.
    2. Write a small Mojo wrapper class: `GraphKVStore`.
2. Build higher-level abstractions:
    1. `Node(id: Int, props: Dict)`
    2. `Edge(src: Int, dst: Int, label: String, props: Dict)`
    3. `GraphDB` (manages schema, adjacency, queries).
3. Implement a simple query engine:
    1. `get_neighbors(node_id)`
    2. `add_node`, `add_edge`
    3. `find_path`, `degree(node_id)`, etc.

## 5. Incremental Build Path

Here’s a suggested roadmap:

### Phase 1: RocksDB Binding in Mojo

1. Write a Mojo wrapper for RocksDB basic operations (put, get, delete).

### Phase 2: Graph Primitives

1. Define Node and Edge.
2. Encode/decode them to RocksDB key-value pairs.

### Phase 3: Adjacency

1. Implement adjacency list persistence (adj:<node_id> → neighbors).
2. Add sparse matrix loader for queries.

### Phase 4: Query Layer

1. Add basic query functions (neighbors, edges, shortest_path).
2. Maybe mimic a subset of Cypher or Gremlin later.

### Phase 5: Optimizations

1. Indexing by property values.
2. Caching adjacency lists in memory.
3. Adding linear algebra kernels in Mojo (Mojo’s strong suit).

### 6. Where to Literally Start

Since you’re using Mojo, I’d recommend:

1. Start small: Write a Mojo wrapper around RocksDB (`GraphKVStore`).
2. Implement `add_node(node_id, props)` and `get_node(node_id)`.
3. Then move to `add_edge(src, dst, label, props)` + adjacency storage.
4. Only after this, start designing the query language (Cypher-like).
