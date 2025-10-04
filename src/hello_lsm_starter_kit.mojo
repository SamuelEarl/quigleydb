# Mojo LSM Key-Value Store — "Hello LSM" starter kit
# ---------------------------------------------------
# This is a teaching implementation that mirrors the core ideas behind RocksDB:
#  - WAL (write-ahead log)
#  - MemTable (in-memory map)
#  - Flush to immutable SSTable files (sorted string table)
#  - Table reader with in-memory index
#  - Simple compaction (merge two tables)
#  - DB facade with put/get/delete, flush, and compact
#
# Notes:
#  - Written in Mojo-like syntax with Pythonic flavor for clarity.
#  - I/O & error handling are simplified; adjust for your target runtime.
#  - Keys/values are treated as UTF-8 strings for simplicity.
#  - SSTable format (naive):
#      [DATA records ...][INDEX entries ...][FOOTER]
#    DATA record = u32 key_len | u32 val_len | u8 tombstone | key_bytes | val_bytes
#    INDEX entry = u32 key_len | key_bytes | u64 offset
#    FOOTER      = u32 index_count | u64 index_start | u64 magic (0x534154424153534D)  # "SATS"+"BASM"
#  - Index is loaded fully into memory on table open (good enough for a starter).
#
# Directory layout (example):
#   /data
#     ├─ MANIFEST (optional in this starter)
#     ├─ wal.log
#     ├─ 000001.sst
#     └─ 000002.sst

from IO import File, open, read, write, close, seek, tell   # placeholder imports
from Memory import memset                                     # placeholder
from Math import min, max                                     # placeholder

struct Optional[T]:
    var has: Bool
    var value: T

    fn none() -> Optional[T]:
        return Optional[T](has=False, value=unsafe_bitcast[T](0))

    fn some(v: T) -> Optional[T]:
        return Optional[T](has=True, value=v)


# ----------------------
# Utility encoding helpers
# ----------------------

fn u32_to_bytes(x: UInt32) -> Bytes:
    var b = Bytes(4)
    # little-endian
    b[0] = (x & 0xFF)
    b[1] = ((x >> 8) & 0xFF)
    b[2] = ((x >> 16) & 0xFF)
    b[3] = ((x >> 24) & 0xFF)
    return b

fn u64_to_bytes(x: UInt64) -> Bytes:
    var b = Bytes(8)
    for i in range(8):
        b[i] = ((x >> (8 * i)) & 0xFF)
    return b

fn bytes_to_u32(b: Bytes) -> UInt32:
    return (UInt32(b[0]) | (UInt32(b[1]) << 8) | (UInt32(b[2]) << 16) | (UInt32(b[3]) << 24))

fn bytes_to_u64(b: Bytes) -> UInt64:
    var x: UInt64 = 0
    for i in range(8):
        x |= (UInt64(b[i]) << (8 * i))
    return x


# ----------------------
# WAL
# ----------------------

struct WalRecord:
    var op: UInt8          # 0=put, 1=del
    var key: String
    var value: String      # empty when op=del

struct WAL:
    var path: String

    fn append_put(self, key: String, value: String):
        let f = open(self.path, mode="ab")
        # Format: u8 op | u32 klen | u32 vlen | key | value
        write(f, [UInt8(0)])
        write(f, u32_to_bytes(UInt32(key.byte_length())))
        write(f, u32_to_bytes(UInt32(value.byte_length())))
        write(f, key.bytes())
        write(f, value.bytes())
        close(f)

    fn append_del(self, key: String):
        let f = open(self.path, mode="ab")
        write(f, [UInt8(1)])
        write(f, u32_to_bytes(UInt32(key.byte_length())))
        write(f, u32_to_bytes(UInt32(0)))
        write(f, key.bytes())
        close(f)

    fn replay(self) -> List[WalRecord]:
        var out = List[WalRecord]()
        if !File.exists(self.path):
            return out
        let f = open(self.path, mode="rb")
        while True:
            let op_b = read(f, 1)
            if op_b.len() == 0: break
            let op = op_b[0]
            let klen = bytes_to_u32(read(f, 4))
            let vlen = bytes_to_u32(read(f, 4))
            let k = String(read(f, Int(klen)))
            var v = ""
            if op == 0:
                v = String(read(f, Int(vlen)))
            out.append(WalRecord(op=op, key=k, value=v))
        close(f)
        return out

    fn reset(self):
        # Truncate WAL after a successful flush
        let f = open(self.path, mode="wb")
        close(f)


# ----------------------
# MemTable (in-memory map)
# ----------------------

struct MemTable:
    var map: Dictionary[String, Optional[String]]

    fn init():
        self.map = Dictionary[String, Optional[String]]()

    fn put(self, key: String, value: String):
        self.map[key] = Optional[String].some(value)

    fn del(self, key: String):
        self.map[key] = Optional[String].some("")   # mark in map; tombstone comes at flush time
        self.map[key] = Optional[String].none()      # absence means deleted logically

    fn get(self, key: String) -> Optional[String]:
        if self.map.contains(key):
            return Optional[String].some(self.map[key].value)
        return Optional[String].none()

    fn size(self) -> Int:
        return self.map.len()

    fn clear(self):
        self.map.clear()

    fn items_sorted(self) -> List[(String, Optional[String])]:
        # Return items by sorted key for SSTable writing
        var keys = List[String]()
        for (k, _) in self.map:
            keys.append(k)
        keys.sort()
        var out = List[(String, Optional[String])]()
        for k in keys:
            out.append((k, self.map[k]))
        return out


# ----------------------
# SSTable writer/reader
# ----------------------

let SST_MAGIC: UInt64 = 0x534154424153534D  # arbitrary magic

struct SSTIndexEntry:
    var key: String
    var offset: UInt64

struct SSTWriter:
    var path: String

    fn write_from_memtable(self, mt: MemTable):
        let f = open(self.path, mode="wb")
        var index = List[SSTIndexEntry]()

        # 1) write data section
        for (k, opt_v) in mt.items_sorted():
            let pos = tell(f)
            index.append(SSTIndexEntry(key=k, offset=UInt64(pos)))

            var tomb: UInt8 = 0
            var v_bytes = Bytes(0)
            if !opt_v.has:
                tomb = 1
            else:
                v_bytes = opt_v.value.bytes()

            let k_bytes = k.bytes()
            write(f, u32_to_bytes(UInt32(k_bytes.len())))
            write(f, u32_to_bytes(UInt32(v_bytes.len())))
            write(f, [tomb])
            write(f, k_bytes)
            if tomb == 0:
                write(f, v_bytes)

        # 2) write index section
        let index_start = tell(f)
        for e in index:
            let k_bytes = e.key.bytes()
            write(f, u32_to_bytes(UInt32(k_bytes.len())))
            write(f, k_bytes)
            write(f, u64_to_bytes(e.offset))

        # 3) write footer (index_count | index_start | magic)
        write(f, u32_to_bytes(UInt32(index.len())))
        write(f, u64_to_bytes(UInt64(index_start)))
        write(f, u64_to_bytes(SST_MAGIC))
        close(f)

struct SSTReader:
    var path: String
    var f: File
    var index: List[SSTIndexEntry]

    fn open(self):
        self.f = open(self.path, mode="rb")
        self._load_index()

    fn close(self):
        close(self.f)

    fn _load_index(self):
        # Read footer
        let size = File.size(self.path)
        seek(self.f, size - (4 + 8 + 8))
        let index_count = bytes_to_u32(read(self.f, 4))
        let index_start = bytes_to_u64(read(self.f, 8))
        let magic = bytes_to_u64(read(self.f, 8))
        assert(magic == SST_MAGIC, "bad sstable magic")

        # Read index entries
        seek(self.f, Int(index_start))
        self.index = List[SSTIndexEntry]()
        for _ in range(Int(index_count)):
            let klen = bytes_to_u32(read(self.f, 4))
            let k = String(read(self.f, Int(klen)))
            let off = bytes_to_u64(read(self.f, 8))
            self.index.append(SSTIndexEntry(key=k, offset=off))

    fn get(self, key: String) -> Optional[String]:
        # binary search over index
        var lo = 0
        var hi = self.index.len() - 1
        while lo <= hi:
            let mid = (lo + hi) // 2
            let mk = self.index[mid].key
            if key == mk:
                # read record at offset
                seek(self.f, Int(self.index[mid].offset))
                let klen = bytes_to_u32(read(self.f, 4))
                let vlen = bytes_to_u32(read(self.f, 4))
                let tomb = read(self.f, 1)[0]
                let _ = read(self.f, Int(klen))  # skip key bytes
                if tomb == 1:
                    return Optional[String].none()
                let v = String(read(self.f, Int(vlen)))
                return Optional[String].some(v)
            elif key < mk:
                hi = mid - 1
            else:
                lo = mid + 1
        return Optional[String].none()


# ----------------------
# Compaction (merge two SSTables)
# ----------------------

struct Compactor:
    fn merge_two(self, in1: String, in2: String, out: String):
        var r1 = SSTReader(path=in1)
        var r2 = SSTReader(path=in2)
        r1.open(); r2.open()

        # Load full key sets (starter approach)
        var keys = Set[String]()
        for e in r1.index: keys.insert(e.key)
        for e in r2.index: keys.insert(e.key)
        var all = List[String]()
        for k in keys: all.append(k)
        all.sort()

        var mt = MemTable()
        for k in all:
            let v2 = r2.get(k)  # newer table wins if present
            if v2.has:
                mt.put(k, v2.value)
                continue
            let v1 = r1.get(k)
            if v1.has:
                mt.put(k, v1.value)
            else:
                # if both delete, keep tombstone via none()
                mt.map[k] = Optional[String].none()

        var w = SSTWriter(path=out)
        w.write_from_memtable(mt)
        r1.close(); r2.close()


# ----------------------
# DB facade
# ----------------------

struct DBOptions:
    var dir: String
    var memtable_flush_threshold: Int = 1024  # number of entries, simple heuristic

struct DB:
    var opt: DBOptions
    var wal: WAL
    var mem: MemTable
    var tables: List[String]
    var next_file_id: Int

    fn __init__(out self, opt: DBOptions, wal: WAL, mem: MemTable, tables: List[String], next_file_id: Int):
        """Initialize a database.

        Args:
            opt: Database options.
            wal: A reference to the write-ahead log???
            mem: A Reference to the memtable???
            tables: A list of table names.
            next_file_id: ???
        """
        self.opt = opt
        self.wal = wal
        self.mem = mem
        self.tables = tables
        self.next_file_id = next_file_id

    fn open(dir: String, memtable_flush_threshold: Int = 1024) -> DB:
        var db = DB(
            opt=DBOptions(dir=dir, memtable_flush_threshold=memtable_flush_threshold),
            wal=WAL(path=f"{dir}/wal.log"),
            mem=MemTable(),
            tables=List[String](),
            next_file_id=1
        )
        db._bootstrap()
        return db

    fn _bootstrap(self):
        self.mem.init()
        # replay WAL
        for rec in self.wal.replay():
            if rec.op == 0:
                self.mem.put(rec.key, rec.value)
            else:
                self.mem.map[rec.key] = Optional[String].none()

    fn _new_table_path(self) -> String:
        let id = self.next_file_id
        self.next_file_id += 1
        return f"{self.opt.dir}/{id:06}.sst"

    fn flush(self):
        if self.mem.size() == 0: return
        let path = self._new_table_path()
        var w = SSTWriter(path=path)
        w.write_from_memtable(self.mem)
        self.tables.append(path)
        self.mem.clear()
        self.wal.reset()

    fn compact_all(self):
        if self.tables.len() <= 1: return
        # pairwise merge into one file (very naive)
        var cur = self.tables[0]
        for i in range(1, self.tables.len()):
            let out = self._new_table_path()
            Compactor().merge_two(cur, self.tables[i], out)
            # in a real system, delete input files
            cur = out
        self.tables = [cur]

    fn put(self, key: String, value: String):
        self.wal.append_put(key, value)
        self.mem.put(key, value)
        if self.mem.size() >= self.opt.memtable_flush_threshold:
            self.flush()

    fn delete(self, key: String):
        self.wal.append_del(key)
        self.mem.map[key] = Optional[String].none()
        if self.mem.size() >= self.opt.memtable_flush_threshold:
            self.flush()

    fn get(self, key: String) -> Optional[String]:
        # 1) memtable
        let mv = self.mem.get(key)
        if mv.has:
            return mv
        # 2) tables from newest to oldest
        for i in range(self.tables.len()-1, -1, -1):
            var r = SSTReader(path=self.tables[i])
            r.open()
            let tv = r.get(key)
            r.close()
            if tv.has:
                return tv
        return Optional[String].none()


# ----------------------
# Example usage (pseudo)
# ----------------------

fn main():
    var db = DB()
    db.open("/data", memtable_flush_threshold=4)
    db.put("alice", "A")
    db.put("bob", "B")
    db.put("carol", "C")
    db.put("dave", "D")  # triggers flush at 4 entries (toy)
    db.put("alice", "A2")
    let v = db.get("alice")
    print("alice=", v.has ? v.value : "<none>")
    db.flush()
    db.compact_all()

# End of starter kit
