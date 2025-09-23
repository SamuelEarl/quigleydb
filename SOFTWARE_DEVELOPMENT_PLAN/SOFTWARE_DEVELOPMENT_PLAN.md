# Software Development Plan

Record my notes from ChatGPT and organize them into a step-by-step software development plan and record those steps in the `SOFTWARE_DEVELOPMENT_PLAN.md` file.

---

# If I wanted to rewrite RocksDB in the Mojo language, where should I start?

Great question — rewriting RocksDB (or any log-structured merge-tree database) in Mojo is an ambitious project. RocksDB itself is a huge C++ codebase (>400K LOC), optimized for decades. But if your goal is to build a Mojo-native key-value store inspired by RocksDB, here’s how I’d recommend breaking it down:

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
