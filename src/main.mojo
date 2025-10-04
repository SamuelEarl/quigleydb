# TODO:
# * When creating data, differentiate between Node and Relation record types. How should those be stored in this database? Should I have Node collections that are subdivided into other collections (e.g. "User", "Orders") and then have Relation collections that are subdivided into other collections (e.g. "USER_ORDERS")?
# * Right now I can read data by collection:id. I need to be able to pass an object to the `where` argument of the READ method to be able to filter records in other ways.
#     * I can loop over the records and check each record against the list of conditionals that are passed to the `where` dictionary. See this video https://www.youtube.com/watch?v=tb12omFYE5g at about 16:00. NOTE: It sounds like he is saying "vat conditions", but he is actually saying "where conditions".
# * Figure out how I want to use the `split_collection_id()` to return the collection and record IDs as separate values in the CRUD operations. How should I let users specify if they want those values returned as separate values?

from python import Python
from utils import Variant
# import uuid_utils as uuid

alias MixedValue = Variant[String, Int]
alias ReturnData = Dict[String, MixedValue]

def generate_uuid() -> String:
    var uuid = Python.import_module("uuid")
    return String(uuid.uuid4())

def split_collection_id(mut collection_id: String) -> List[StringSlice[__origin_of((muttoimm origin._mlir_origin))]]:
    return StringSlice(collection_id).split(":")

struct KVStore():
    """A minimal KV store, which is a memtable + Write-Ahead Log (WAL)."""

    var store: Dict[String, String]

    def __init__(out self, store: Dict[String, String] = {}):
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
    # def get_return_statement(self, error: Bool, data: ReturnData, CRUD: String, collection_id: String):
    #     return {
    #         "data": data,
    #         "metadata": {
    #             "error": error,
    #             "message": String('{} record with ID "{}"').format(CRUD, collection_id),
    #         },
    #     }

    def CREATE(self, collection_id: String, props: Dict[String, MixedValue]):
        # try:
        # [collection, id] = self.split_collection_id(collection_id)
        var val = split_collection_id(collection_id)
        # var val = StringSlice(collection_id).split(":")
        print("VAL:", val[0], val[1])

    #     # If a property with key `id` already exists inside the `collection` dictionary`, then raise an exception.
    #     if collection in self.store:
    #         if id in self.store[collection]:
    #             raise ValueError(f'A record with ID "{collection}:{id}" already exists in the database!')
    #     # If no exception was raised, then create the new record.
    #     if not id:
    #         # id = uuid.uuid7()
    #         id = generate_uuid()
    #     props["id"] = f"{collection}:{id}"
    #     if not collection in self.store:
    #         self.store[collection] = {}
    #     self.store[collection][id] = props
    #     return_data = self.store[collection][id]
    #     return self.get_return_statement(False, return_data, "Created", collection_id)
        # except e:
        #     print("Error:",)
        #     return_data = None
        #     return self.get_return_statement(True, return_data, "Created", collection_id)

#     def READ(self, collection_id: String, where: Dict[String, String]={}, return_props: Dict[String, String]={}):
#         [collection, id] = self.split_collection_id(collection_id)
#         # If no return_props are passed, then return the entire record.
#         if not return_props:
#             if collection in self.store:
#                 if id in self.store[collection]:
#                     return_data = self.store.get(collection, {}).get(id, self.not_found(f"{collection}:{id}"))
#                     return self.get_return_statement(False, return_data, "Read", collection_id)
#                 else:
#                     raise ValueError(f'The record with ID "{collection}:{id}" does not exist. You may need to check your spelling.')
#             else:
#                 raise ValueError(f'The collection "{collection}" does not exist. You may need to check your spelling.')
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
#                             raise ValueError(f'The record "{collection}:{id}" does not have a property {value}.')    
#                     return_data = filtered_dict    
#                     return self.get_return_statement(False, return_data, "Read", collection_id)
#                 else:
#                     raise ValueError(f'The record with ID "{collection}:{id}" does not exist. You may need to check your spelling.')
#             else:
#                 raise ValueError(f'The collection "{collection}" does not exist. You may need to check your spelling.')            
    
#     def UPDATE(self, collection_id: String, update_dict: Dict[String, String]):
#         [collection, id] = self.split_collection_id(collection_id)
#         if collection in self.store:
#             if id in self.store[collection]:
#                 self.store[collection][id].update(update_dict)
#                 return_data = self.store[collection][id]
#                 return self.get_return_statement(False, return_data, "Updated", collection_id)
#             else:
#                 return self.not_found(f"{collection}:{id}")
#         else:
#             return self.not_found(f"{collection}:{id}")
    
#     def DELETE(self, collection_id: String):
#         [collection, id] = self.split_collection_id(collection_id)
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
        var db: KVStore = KVStore()
        # print("DB:", db)

        # var id = generate_uuid()
        var user_id = String("User:{}").format(generate_uuid())
        print("USER ID:", user_id)
        var props0: Dict[String, MixedValue] = {"name": "John", "age": 30, "city": "PHX"}
        new_user_created = db.CREATE(user_id, props0)
        # db.CREATE("User:001", {"name": "Steve", "age": 32, "city": "SF"})
        # db.CREATE("User:002", {"name": "Jane", "age": 28, "city": "LA"})
        # db.CREATE("User:003", {"name": "Mary", "age": 35, "city": "SD"})

        # # db.display()

        # new_user_read = db.READ(new_user_created['data']['id'])
        # print('READ: new_user:', new_user_read)
        # print('READ: new_user message:', new_user_read['metadata']['message'])

        # user001 = db.READ("User:001", {}, {"name"})
        # print('READ: "User:001":', user001["data"])

        # user002 = db.READ("User:002")
        # print('READ: "User:002":', user002)

        # user003 = db.READ("User:003")
        # print('READ: "User:003":', user003)

        # updated_user = db.UPDATE("User:002", {"name": "Allison", "age": 40})
        # print("UPDATE:", updated_user["metadata"]["message"])
        # print("UPDATE:", updated_user["data"])
        # db.display()

        # deleted_user = db.DELETE("User:003")
        # print("DELETE:", f"'{deleted_user}'")
        # db.display()
    except e:
        print("ERROR:", e)

    