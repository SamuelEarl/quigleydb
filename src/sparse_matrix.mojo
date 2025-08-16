# ==============================================================================
# Sparse Matrix Implementation
# ==============================================================================

from collections import List

struct SparseMatrix:
    var rows: Int
    var cols: Int
    var row_indices: List[Int]
    var col_indices: List[Int]
    var values: List[Float64]
    var nnz: Int  # number of non-zero elements
    
    fn __init__(out self, rows: Int, cols: Int):
        self.rows = rows
        self.cols = cols
        self.row_indices = List[Int]()
        self.col_indices = List[Int]()
        self.values = List[Float64]()
        self.nnz = 0
    
    fn set(out self, row: Int, col: Int, value: Float64):
        # Find if element already exists
        for i in range(self.nnz):
            if self.row_indices[i] == row and self.col_indices[i] == col:
                self.values[i] = value
                return
        
        # Add new element
        self.row_indices.append(row)
        self.col_indices.append(col)
        self.values.append(value)
        self.nnz += 1
    
    fn get(self, row: Int, col: Int) -> Float64:
        for i in range(self.nnz):
            if self.row_indices[i] == row and self.col_indices[i] == col:
                return self.values[i]
        return 0.0
    
    fn multiply_vector(self, vector: List[Float64]) -> List[Float64]:
        var result = List[Float64]()
        for i in range(self.rows):
            result.append(0.0)
        
        for i in range(self.nnz):
            var row = self.row_indices[i]
            var col = self.col_indices[i]
            var val = self.values[i]
            result[row] = result[row] + val * vector[col]
        
        return result
    
    fn transpose(self) -> SparseMatrix:
        var transposed = SparseMatrix(self.cols, self.rows)
        for i in range(self.nnz):
            transposed.set(self.col_indices[i], self.row_indices[i], self.values[i])
        return transposed
