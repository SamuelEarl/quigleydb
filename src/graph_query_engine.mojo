# ==============================================================================
# Graph Query Engine using Linear Algebra
# ==============================================================================

from collections import List

struct GraphQueryEngine:
    var store: GraphKeyValueStore
    var parser: CypherParser
    
    fn __init__(inout self, max_nodes: Int = 10000):
        self.store = GraphKeyValueStore(max_nodes)
        self.parser = CypherParser()
    
    fn execute_query(inout self, query: String) -> List[String]:
        var parsed = self.parser.parse(query)
        var results = List[String]()
        
        if parsed.query_type == "MATCH":
            results = self.execute_match(parsed)
        elif parsed.query_type == "CREATE":
            results = self.execute_create(parsed)
        
        return results
    
    fn execute_match(inout self, query: CypherQuery) -> List[String]:
        var results = List[String]()
        
        # Use sparse matrix operations for graph traversal
        var start_vector = List[Float64]()
        var num_nodes = len(self.store.node_id_to_index)
        
        for i in range(self.store.max_nodes):
            start_vector.append(0.0)
        
        # Set starting nodes (simplified - mark all nodes as potential starts)
        for i in range(num_nodes):
            start_vector[i] = 1.0
        
        # Perform matrix-vector multiplication for one-hop traversal
        var reachable = self.store.adjacency_matrix.multiply_vector(start_vector)
        
        # Collect results
        for i in range(len(reachable)):
            if reachable[i] > 0 and i in self.store.index_to_node_id:
                var node_id = self.store.index_to_node_id[i]
                results.append("node_id:" + str(node_id))
        
        return results
    
    fn execute_create(inout self, query: CypherQuery) -> List[String]:
        var results = List[String]()
        
        # Create a new node (simplified)
        var node_id = NodeID(self.store.node_counter)
        self.store.node_counter += 1
        
        var new_node = Node(node_id)
        new_node.add_label("Person")
        
        self.store.store_node(new_node)
        results.append("Created node: " + str(node_id.id))
        
        return results
    
    fn find_shortest_path(inout self, from_id: NodeID, to_id: NodeID) -> List[NodeID]:
        var path = List[NodeID]()
        
        if from_id.id not in self.store.node_id_to_index or to_id.id not in self.store.node_id_to_index:
            return path
        
        var from_idx = self.store.node_id_to_index[from_id.id]
        var to_idx = self.store.node_id_to_index[to_id.id]
        
        # Use BFS with adjacency matrix (simplified implementation)
        var visited = List[Bool]()
        var queue = List[Int]()
        var parent = List[Int]()
        
        for i in range(self.store.max_nodes):
            visited.append(False)
            parent.append(-1)
        
        queue.append(from_idx)
        visited[from_idx] = True
        
        # BFS traversal using adjacency matrix
        var found = False
        while len(queue) > 0 and not found:
            var current = queue[0]
            queue = queue[1:]  # Remove first element
            
            if current == to_idx:
                found = True
                break
            
            # Check all neighbors using sparse matrix
            for i in range(self.store.adjacency_matrix.nnz):
                if self.store.adjacency_matrix.row_indices[i] == current:
                    var neighbor = self.store.adjacency_matrix.col_indices[i]
                    if not visited[neighbor]:
                        visited[neighbor] = True
                        parent[neighbor] = current
                        queue.append(neighbor)
        
        # Reconstruct path
        if found:
            var current = to_idx
            while current != -1:
                if current in self.store.index_to_node_id:
                    var node_id = NodeID(self.store.index_to_node_id[current])
                    path.append(node_id)
                current = parent[current]
            
            # Reverse path
            var reversed_path = List[NodeID]()
            for i in range(len(path) - 1, -1, -1):
                reversed_path.append(path[i])
            path = reversed_path
        
        return path
    
    fn compute_pagerank(inout self, damping_factor: Float64 = 0.85, iterations: Int = 100) -> List[Float64]:
        var num_nodes = len(self.store.node_id_to_index)
        var pagerank = List[Float64]()
        var new_pagerank = List[Float64]()
        
        # Initialize PageRank values
        var initial_value = 1.0 / Float64(num_nodes)
        for i in range(self.store.max_nodes):
            pagerank.append(initial_value if i < num_nodes else 0.0)
            new_pagerank.append(0.0)
        
        # Create column-stochastic matrix (transpose and normalize)
        var transposed = self.store.adjacency_matrix.transpose()
        
        # Power iteration
        for iter in range(iterations):
            # Reset new pagerank values
            for i in range(self.store.max_nodes):
                new_pagerank[i] = (1.0 - damping_factor) / Float64(num_nodes)
            
            # Matrix-vector multiplication with damping
            var contribution = transposed.multiply_vector(pagerank)
            for i in range(num_nodes):
                new_pagerank[i] += damping_factor * contribution[i]
            
            # Update pagerank
            for i in range(self.store.max_nodes):
                pagerank[i] = new_pagerank[i]
        
        return pagerank
