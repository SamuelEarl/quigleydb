# ==============================================================================
# Key-Value Store for Graph Data
# ==============================================================================

from collections import Dict
from sparse_matrix import SparseMatrix

struct GraphKeyValueStore:
    var nodes: Dict[String, String]  # Serialized node data
    var edges: Dict[String, String]  # Serialized edge data
    var node_counter: UInt64
    var edge_counter: UInt64
    var adjacency_matrix: SparseMatrix
    var node_id_to_index: Dict[UInt64, Int]
    var index_to_node_id: Dict[Int, UInt64]
    var max_nodes: Int
    
    fn __init__(out self, max_nodes: Int = 10000):
        self.nodes = Dict[String, String]()
        self.edges = Dict[String, String]()
        self.node_counter = 0
        self.edge_counter = 0
        self.adjacency_matrix = SparseMatrix(max_nodes, max_nodes)
        self.node_id_to_index = Dict[UInt64, Int]()
        self.index_to_node_id = Dict[Int, UInt64]()
        self.max_nodes = max_nodes
    
    fn node_key(self, node_id: NodeID) -> String:
        return "node:" + String(node_id.id)
    
    fn edge_key(self, edge_id: EdgeID) -> String:
        return "edge:" + String(edge_id.id)
    
    fn serialize_node(self, node: Node) -> String:
        # Simple serialization (in practice, use proper serialization format)
        var result = String(node.id.id) + "|"
        for i in range(len(node.labels)):
            result += node.labels[i] + ","
        result += "|"
        return result
    
    fn serialize_edge(self, edge: Edge) -> String:
        # Simple serialization
        return String(edge.id.id) + "|" + String(edge.from_node.id) + "|" + String(edge.to_node.id) + "|" + edge.relationship_type
    
    fn store_node(out self, node: Node):
        var key = self.node_key(node.id)
        var serialized = self.serialize_node(node)
        self.nodes[key] = serialized
        
        # Add to adjacency matrix mapping
        var index = len(self.node_id_to_index)
        if index < self.max_nodes:
            self.node_id_to_index[node.id.id] = index
            self.index_to_node_id[index] = node.id.id
    
    fn store_edge(out self, edge: Edge):
        var key = self.edge_key(edge.id)
        var serialized = self.serialize_edge(edge)
        self.edges[key] = serialized
        
        # Update adjacency matrix
        if edge.from_node.id in self.node_id_to_index and edge.to_node.id in self.node_id_to_index:
            var from_idx = self.node_id_to_index[edge.from_node.id]
            var to_idx = self.node_id_to_index[edge.to_node.id]
            self.adjacency_matrix.set(from_idx, to_idx, 1.0)
    
    fn get_node(self, node_id: NodeID) -> Optional[String]:
        var key = self.node_key(node_id)
        if key in self.nodes:
            return self.nodes[key]
        return None
    
    fn get_edge(self, edge_id: EdgeID) -> Optional[String]:
        var key = self.edge_key(edge_id)
        if key in self.edges:
            return self.edges[key]
        return None
