# ==============================================================================
# Main Graph Database Interface
# ==============================================================================

from collections import List
from graph_query_engine import GraphQueryEngine
from core_data_structures import NodeID, EdgeID

struct GraphDatabase:
    var query_engine: GraphQueryEngine
    
    fn __init__(out self, max_nodes: Int = 10000):
        self.query_engine = GraphQueryEngine(max_nodes)
    
    fn execute(self, cypher_query: String) -> List[String]:
        return self.query_engine.execute_query(cypher_query)
    
    fn create_node(self, labels: List[String]) -> NodeID:
        var node_id = NodeID(self.query_engine.store.node_counter)
        self.query_engine.store.node_counter += 1
        
        var new_node = Node(node_id)
        for i in range(len(labels)):
            new_node.add_label(labels[i])
        
        self.query_engine.store.store_node(new_node)
        return node_id
    
    fn create_edge(self, from_id: NodeID, to_id: NodeID, rel_type: String) -> EdgeID:
        var edge_id = EdgeID(self.query_engine.store.edge_counter)
        self.query_engine.store.edge_counter += 1
        
        var new_edge = Edge(edge_id, from_id, to_id, rel_type)
        self.query_engine.store.store_edge(new_edge)
        return edge_id
    
    fn shortest_path(self, from_id: NodeID, to_id: NodeID) -> List[NodeID]:
        return self.query_engine.find_shortest_path(from_id, to_id)
    
    fn pagerank(self) -> List[Float64]:
        return self.query_engine.compute_pagerank()
