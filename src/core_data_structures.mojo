# ==============================================================================
# Core Data Structures
# ==============================================================================

from collections import Dict, List

@value
struct NodeID:
    var id: UInt64
    
    fn __init__(inout self, id: UInt64):
        self.id = id
    
    fn __eq__(self, other: NodeID) -> Bool:
        return self.id == other.id
    
    fn __hash__(self) -> UInt64:
        return self.id

@value
struct EdgeID:
    var id: UInt64
    
    fn __init__(inout self, id: UInt64):
        self.id = id
    
    fn __eq__(self, other: EdgeID) -> Bool:
        return self.id == other.id
    
    fn __hash__(self) -> UInt64:
        return self.id

@value
struct PropertyValue:
    var data: String
    var type: String  # "string", "int", "float", "bool"
    
    fn __init__(inout self, data: String, type: String):
        self.data = data
        self.type = type

struct Node:
    var id: NodeID
    var labels: List[String]
    var properties: Dict[String, PropertyValue]
    
    fn __init__(inout self, id: NodeID):
        self.id = id
        self.labels = List[String]()
        self.properties = Dict[String, PropertyValue]()
    
    fn add_label(inout self, label: String):
        self.labels.append(label)
    
    fn set_property(inout self, key: String, value: PropertyValue):
        self.properties[key] = value

struct Edge:
    var id: EdgeID
    var from_node: NodeID
    var to_node: NodeID
    var relationship_type: String
    var properties: Dict[String, PropertyValue]
    
    fn __init__(inout self, id: EdgeID, from_node: NodeID, to_node: NodeID, rel_type: String):
        self.id = id
        self.from_node = from_node
        self.to_node = to_node
        self.relationship_type = rel_type
        self.properties = Dict[String, PropertyValue]()
    
    fn set_property(inout self, key: String, value: PropertyValue):
        self.properties[key] = value
