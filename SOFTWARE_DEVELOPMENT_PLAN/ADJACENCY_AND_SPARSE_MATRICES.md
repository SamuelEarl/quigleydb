# How do I write an adjacency matrix in graphs?

An adjacency matrix is just a 2D table (matrix) that tells you which nodes in a graph are connected to each other.

## Step 1: Understand the basics

* If you have n nodes in your graph, the adjacency matrix will be an n × n matrix.
* Each row and column represents a node.
* If there is an edge between node i and node j, then the entry at position (i, j) is 1 (or the edge weight, if weighted).
* If there is no edge, the entry is 0.

## Step 2: Example with an unweighted graph

Suppose we have 4 nodes: A, B, C, D.
And the edges are:

* A → B
* A → C
* B → D
* C → D

Adjacency matrix looks like this:

```
    A  B  C  D
A [ 0, 1, 1, 0 ]
B [ 0, 0, 0, 1 ]
C [ 0, 0, 0, 1 ]
D [ 0, 0, 0, 0 ]
```

## Step 3: Example with weights

If edges have weights (say, cost or distance), you put the weight instead of 1.
Example:

* A → B (weight 5)
* A → C (weight 2)
* C → D (weight 7)

Matrix:

```
    A  B  C  D
A [ 0, 5, 2, 0 ]
B [ 0, 0, 0, 0 ]
C [ 0, 0, 0, 7 ]
D [ 0, 0, 0, 0 ]

```

## Step 4: Python implementation

```py
import numpy as np

# Number of nodes
n = 4
adj_matrix = np.zeros((n, n), dtype=int)

# Add edges (unweighted graph example)
# A=0, B=1, C=2, D=3
edges = [(0,1), (0,2), (1,3), (2,3)]

for u, v in edges:
    adj_matrix[u][v] = 1   # put weight instead if weighted

print(adj_matrix)
```

Output:

```py
[[0 1 1 0]
 [0 0 0 1]
 [0 0 0 1]
 [0 0 0 0]]
```

---

# Sparse Matrices

Sparse matrices are the way to go for large graphs, because most graphs are sparse (not every node is connected to every other node). An adjacency matrix of size 𝑛 × 𝑛 uses 𝑂(𝑛^2) space, which explodes fast — but a sparse matrix only stores the non-zero entries (the edges).

## Step 1: Install SciPy

If you don’t already have SciPy:

```py
pip install scipy
```

## Step 2: Example with SciPy’s sparse matrix

```py
import numpy as np
from scipy.sparse import csr_matrix

# Number of nodes
n = 4

# Define edges (like before)
# A=0, B=1, C=2, D=3
edges = [(0,1), (0,2), (1,3), (2,3)]

# Build row and col lists for sparse representation
rows = [u for u,v in edges]
cols = [v for u,v in edges]
data = [1] * len(edges)   # put weights here instead of 1 if weighted

# Create sparse adjacency matrix
adj_matrix_sparse = csr_matrix((data, (rows, cols)), shape=(n, n))

print("Sparse matrix:\n", adj_matrix_sparse)

# If you want to see the dense version
print("\nDense version:\n", adj_matrix_sparse.toarray())
```

**Output**

Sparse form (compact representation):

```
Sparse matrix:
  (0, 1)	1
  (0, 2)	1
  (1, 3)	1
  (2, 3)	1
```

Dense form (normal adjacency matrix):

```
[[0 1 1 0]
 [0 0 0 1]
 [0 0 0 1]
 [0 0 0 0]]
```

## Step 3: Why this matters

* `csr_matrix` = Compressed Sparse Row, great for fast row slicing (e.g., “get all neighbors of node X”).
* You can also use `csc_matrix` (Compressed Sparse Column) for column operations, or `coo_matrix` (Coordinate list) for building matrices.
* Linear algebra (like multiplication, eigenvalues, shortest paths approximations) can now be done efficiently on these sparse structures.

---

# Queries using linear algebra

ChatGPT asked me: Do you want me to also show how you can query the graph using linear algebra operations (like “find neighbors” or “two-hop connections”) directly with sparse matrices, similar to how FalkorDB does it?

I never responded, but I should explore this more.
