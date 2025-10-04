# TODO:
# * When creating data, differentiate between Node and Relation record types. How should those be stored in this database? Should I have Node collections that are subdivided into other collections (e.g. "User", "Orders") and then have Relation collections that are subdivided into other collections (e.g. "USER_ORDERS")?
# * Right now I can read data by collection:id. I need to be able to pass an object to the `where` argument of the READ method to be able to filter records in other ways.
#     * I can loop over the records and check each record against the list of conditionals that are passed to the `where` dictionary. See this video https://www.youtube.com/watch?v=tb12omFYE5g at about 16:00. NOTE: It sounds like he is saying "vat conditions", but he is actually saying "where conditions".
# * Figure out how I want to use the `split_string()` to return the collection and record IDs as separate values in the CRUD operations. How should I let users specify if they want those values returned as separate values?

from python import Python
from utils import Variant
# import uuid_utils as uuid

alias MixedValue = Variant[String, Int]
alias NestedDict = Dict[String, MixedValue]

def generate_uuid() -> String:
    """Returns a uuid. TODO: Update this to uuidv7 instead of uuidv4.
    """
    var uuid = Python.import_module("uuid")
    return String(uuid.uuid4())

# def split_string(collection_id: String, separator: String) -> Tuple[StringSlice[__origin_of(collection_id)], StringSlice[__origin_of(collection_id)]]:
#     var parts = StringSlice(collection_id).split(separator)
#     return (parts[0], parts[1])

def split_string(collection_id: String, separator: String) -> Tuple[String, String]:
    var parts = StringSlice(collection_id).split(separator)
    # Convert StringSlices to Strings inside a two-item tuple and return the tuple.
    return (String(parts[0]), String(parts[1]))

struct KVStore():
    """A minimal KV store, which is a memtable + Write-Ahead Log (WAL).

    The KVStore will look like this:

    {
        "collection_name": {
            "id": {
                "prop1": "value1",
                "prop2": "value2",
                "prop3": "value3",
            }
        }
    }
    """

    var store: Dict[String, NestedDict]

    def __init__(out self, var store: Dict[String, NestedDict]):
        """Initializes the key-value store.

        Args:
            store: A dictionary that holds the data in memory.
        """
        self.store = {}

    # def __str__(self) -> String:
    #     """Returns a string representation of the store.

    #     Returns:
    #         A string representation of the store.

    #     Notes:
    #         You can use the `str()` or `print()` to call this method.
    #     """
    #     return String("KVStore() = {}").format(self.store)

    # def write_to[T: Writer](self, mut writer: T):
    #     """Writes the complex object to a writer."""
    #     writer.write(self.store)

    # def not_found(self, collection_id: String):
    #     return String('Record "{}" not found').format(collection_id)
    
    # # TODO: Implement try/except blocks and pass an error to this function when an error occurs.
    # def get_return_statement(self, error: Bool, data: NestedDict, CRUD: String, collection_id: String):
    #     return {
    #         "data": data,
    #         "metadata": {
    #             "error": error,
    #             "message": String('{0} record with ID "{1}"').format(CRUD, collection_id),
    #         },
    #     }

    def create(self, collection_id: String, mut props: Dict[String, MixedValue]):
        # try:
        var collection, id = split_string(collection_id, ":")
        print("PARTS:", collection, id)

        # If a property with key `id` already exists inside the `collection` dictionary`, then raise an exception.
        if collection in self.store:
            if id in self.store[collection]:
                raise Error(String('A record with ID "{0}:{1}" already exists in the database!').format(collection, id))
        # If no exception was raised, then create the new record.
        if not id:
            id = generate_uuid()
        props["id"] = String("{0}:{1}").format(collection, id)
        # if not collection in self.store:
        #     self.store[collection] = {}
        # self.store[collection][id] = props
        # return_data = self.store[collection][id]
        # return self.get_return_statement(False, return_data, "Created", collection_id)
        # except e:
        #     print("Error:",)
        #     return_data = None
        #     return self.get_return_statement(True, return_data, "Created", collection_id)

#     def read(self, collection_id: String, where: Dict[String, String]={}, return_props: Dict[String, String]={}):
#         var collection, id = split_string(collection_id, ":")
#         # If no return_props are passed, then return the entire record.
#         if not return_props:
#             if collection in self.store:
#                 if id in self.store[collection]:
#                     return_data = self.store.get(collection, {}).get(id, self.not_found(f"{collection}:{id}"))
#                     return self.get_return_statement(False, return_data, "Read", collection_id)
#                 else:
#                     raise Error(f'The record with ID "{collection}:{id}" does not exist. You may need to check your spelling.')
#             else:
#                 raise Error(f'The collection "{collection}" does not exist. You may need to check your spelling.')
#         # Else, return a dictionary that contains only the properties specified.
#         else:
#             filtered_dict = {}
#             if collection in self.store:
#                 if id in self.store[collection]:
#                     # Use the `get()` method to specify a default value to return if the key is not found.
#                     record = self.store.get(collection, {}).get(id, self.not_found(f"{collection}:{id}"))
#                     for value in return_props:
#                         if value in record:
#                             filtered_dict[value] = record[value]
#                         else:
#                             raise Error(f'The record "{collection}:{id}" does not have a property {value}.')    
#                     return_data = filtered_dict    
#                     return self.get_return_statement(False, return_data, "Read", collection_id)
#                 else:
#                     raise Error(f'The record with ID "{collection}:{id}" does not exist. You may need to check your spelling.')
#             else:
#                 raise Error(f'The collection "{collection}" does not exist. You may need to check your spelling.')            
    
#     def update(self, collection_id: String, update_dict: Dict[String, String]):
#         var collection, id = split_string(collection_id, ":")
#         if collection in self.store:
#             if id in self.store[collection]:
#                 self.store[collection][id].update(update_dict)
#                 return_data = self.store[collection][id]
#                 return self.get_return_statement(False, return_data, "Updated", collection_id)
#             else:
#                 return self.not_found(f"{collection}:{id}")
#         else:
#             return self.not_found(f"{collection}:{id}")
    
#     def delete(self, collection_id: String):
#         var collection, id = split_string(collection_id, ":")
#         if collection in self.store:
#             if id in self.store[collection]:
#                 del self.store[collection][id]
#                 return_data = f"{collection}:{id}"
#                 return self.get_return_statement(False, return_data, "Deleted", collection_id)
#             else:
#                 return self.not_found(f"{collection}:{id}")
#         else:
#             return self.not_found(f"{collection}:{id}")

#     def display(self):
#         """
#         Display all records
#         """
#         print("All Records:")
#         for collection_key, collection_value in self.store.items():
#             for id_key, id_value in collection_value.items():
#                 print(f"'{collection_key}:{id_key}': {id_value}")


def main():
    try:
        var db: KVStore = KVStore(store={})
        # print("DB:", db)

        # var id = generate_uuid()
        var user_id = String("User:{}").format(generate_uuid())
        print("USER ID:", user_id)
        var props0: Dict[String, MixedValue] = {"name": "John", "age": 30, "city": "PHX"}
        new_user_created = db.create(user_id, props0)
        # db.create("User:001", {"name": "Steve", "age": 32, "city": "SF"})
        # db.create("User:002", {"name": "Jane", "age": 28, "city": "LA"})
        # db.create("User:003", {"name": "Mary", "age": 35, "city": "SD"})

        # # db.display()

        # new_user_read = db.read(new_user_created['data']['id'])
        # print('READ: new_user:', new_user_read)
        # print('READ: new_user message:', new_user_read['metadata']['message'])

        # user001 = db.read("User:001", {}, {"name"})
        # print('READ: "User:001":', user001["data"])

        # user002 = db.read("User:002")
        # print('READ: "User:002":', user002)

        # user003 = db.read("User:003")
        # print('READ: "User:003":', user003)

        # updated_user = db.update("User:002", {"name": "Allison", "age": 40})
        # print("UPDATE:", updated_user["metadata"]["message"])
        # print("UPDATE:", updated_user["data"])
        # db.display()

        # deleted_user = db.delete("User:003")
        # print("DELETE:", f"'{deleted_user}'")
        # db.display()
    except e:
        print("ERROR:", e)

    