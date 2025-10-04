# What is the best way to learn about the internals of RocksDB for a graph database?

Great question — digging into RocksDB internals is the right path if you want to build a graph database (or any higher-level system) on top of it. Since RocksDB is a complex LSM-tree-based key-value store, you’ll want to approach it systematically, balancing theory, code, and practice. Here’s a roadmap tailored for graph database use cases:

## 1. Start with the Fundamentals of LSM Trees

RocksDB is essentially an optimized Log-Structured Merge (LSM) tree. Before diving into RocksDB-specific code:

* Learn how LSM-trees differ from B-trees: write amplification, compaction, bloom filters, etc.
* Read the original LSM-tree paper and LevelDB’s design doc (RocksDB was forked from LevelDB).

📖 Resources:

* “The Log-Structured Merge-Tree (LSM-Tree)” (O’Neil et al., 1996)
* RocksDB’s [Architecture Overview](https://github.com/facebook/rocksdb/wiki)
* [RocksDB Overview](https://docs.pingcap.com/tidb/stable/rocksdb-overview/)
* MemTable, Commitlog, SSTable diagram and explanation for ScyllaDB: https://www.scylladb.com/glossary/cassandra-memtable/. 

## 2. RocksDB’s High-Level Architecture

Focus on how it organizes data, since graph workloads often mean:

* Small, random writes (edge/vertex inserts).
* Range scans (neighborhood traversal).
* Secondary indexing (for graph properties).

Key concepts you must internalize:

* Memtables, WAL, and SSTables (write path).
* Compaction strategies (leveled vs universal).
* Iterators and prefix seeks (for adjacency list lookups).
* Column families (good for separating vertices, edges, and metadata).
* Prefix bloom filters (critical for adjacency queries).

## 3. Learn by Mapping Graph Structures onto RocksDB

A graph DB is really just a schema on top of KV pairs. Study:

* How to encode adjacency lists:
```
vertex:<id> → [property blob]
edge:<src_id>:<dst_id> → [property blob]
```
* How to store sparse matrices if you want a FalkorDB-style design.
* Tradeoffs of key layouts (lex ordering in RocksDB lets you scan neighbors efficiently).

Exercise: Try implementing a simple adjacency list store in RocksDB (Python binding pyrocksdb or C++).

## 4. Dive Into the RocksDB Codebase

RocksDB’s code is large (~1M LOC in C++), so don’t try to “read everything.” Instead:

1. Start with `db/db_impl.cc` → main entry point for Put/Get/Iterate.
2. Then study:
    1. `memtable/` (in-memory write buffer).
    2. `table/` (SSTables, block-based format).
    3. `db/compaction/` (compaction logic).
3. Use debug logging + tracing while running microbenchmarks to connect theory with practice.

Tip: Compile RocksDB with debug symbols and step through with `gdb` when calling `Put` and `Get`.

## 5. Experiment with Graph-Oriented Benchmarks

To see how RocksDB performs for graphs:

* Use LDBC SNB (Social Network Benchmark).
* Compare adjacency traversal vs random edge lookup.
* Measure effect of:
    * Prefix iterators (fast neighbor scans).
    * Bloom filters (reduce random IO).
    * Different compaction styles (graph workloads tend to be write-heavy).

## 6. Follow Others Who Built Graph DBs on RocksDB

Several production graph DBs already use RocksDB:

* FalkorDB (sparse-matrix-based, linear algebra queries).
* NebulaGraph (column-family partitioning).
* Dgraph (early versions).
* TiDB/TiKV (not a graph DB, but KV-on-RocksDB, very relevant).

Studying their design docs is often easier than deciphering RocksDB source directly.

## 7. Optional: Re-implement a Subset in Mojo/Python

Once you understand RocksDB’s internals, you could try:

* Writing a mini-LSM tree in Python or Mojo.
* Add features like compaction, bloom filters, and prefix iterators.
* Use that as a testbed for your graph encoding ideas before committing to full RocksDB.

## Best path forward if your goal is a graph DB:

1. Learn LSM + RocksDB basics (memtables, SSTables, compaction).
2. Map graph schema → key-value layouts.
3. Prototype queries (adjacency scans, edge lookups) with RocksDB iterators.
4. Read RocksDB source strategically (db_impl.cc → memtable → compaction).
5. Benchmark graph workloads + tune (prefix iterators, bloom filters).

---

# Can I get a guided reading plan through the RocksDB codebase step-by-step?

ChatGPT posted a guided reading plan for me in the "Learning RocksDB Internals" chat.
