# ==============================================================================
# Example Usage and Demo
# ==============================================================================

from collections import List
from graph_database_interface import GraphDatabase

fn main():
    print("Initializing Graph Database...")
    var db = GraphDatabase(1000)
    
    # Create some nodes
    var person_labels = List[String]()
    person_labels.append("Person")
    
    var node1 = db.create_node(person_labels)
    var node2 = db.create_node(person_labels)
    var node3 = db.create_node(person_labels)
    
    print("Created nodes:", str(node1.id), str(node2.id), str(node3.id))
    
    # Create edges
    var edge1 = db.create_edge(node1, node2, "KNOWS")
    var edge2 = db.create_edge(node2, node3, "KNOWS")
    var edge3 = db.create_edge(node1, node3, "FRIENDS_WITH")
    
    print("Created edges:", str(edge1.id), str(edge2.id), str(edge3.id))
    
    # Find shortest path
    var path = db.shortest_path(node1, node3)
    print("Shortest path length:", str(len(path)))
    
    # Execute Cypher queries
    var results = db.execute("MATCH (n:Person) RETURN n")
    print("Query results count:", str(len(results)))
    
    # Compute PageRank
    var pagerank_scores = db.pagerank()
    print("PageRank computation completed")
    
    print("Graph Database demo completed successfully!")
