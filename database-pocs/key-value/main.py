# TODO:
# * When creating data, differentiate between Node and Relation record types. How should those be stored in this database? Should I have Node collections that are subdivided into other collections (e.g. "User", "Orders") and then have Relation collections that are subdivided into other collections (e.g. "USER_ORDERS")?
# * Right now I can read data by collection:id. I need to be able to pass an object to the `where` argument of the READ method to be able to filter records in other ways.
#     * I can loop over the records and check each record against the list of conditionals that are passed to the `where` dictionary. See this video https://www.youtube.com/watch?v=tb12omFYE5g at about 16:00. NOTE: It sounds like he is saying "vat conditions", but he is actually saying "where conditions".
# * Figure out how I want to use the `split_collection_id()` to return the collection and record IDs as separate values in the CRUD operations. How should I let users specify if they want those values returned as separate values?

import uuid_utils as uuid

class SimpleKeyValueDB:
    def __init__(self):
        self.data = {}

    def split_collection_id(self, collection_id):
        return collection_id.split(":")

    def not_found(self, collection_id):
        return f'Record "{collection_id}" not found'
    
    # TODO: Implement try/except blocks and pass an error to this function when an error occurs.
    def get_return_statement(self, error, data, CRUD, collection_id):
        return {
            "data": data,
            "metadata": {
                "error": error,
                "message": f'{CRUD} record with ID "{collection_id}"',
            },
        }

    def CREATE(self, collection_id, props):
        try:
            [collection, id] = self.split_collection_id(collection_id)

            # If a property with key `id` already exists inside the `collection` dictionary`, then raise an exception.
            if collection in self.data:
                if id in self.data[collection]:
                    raise ValueError(f'A record with ID "{collection}:{id}" already exists in the database!')
            # If no exception was raised, then create the new record.
            if not id:
                id = uuid.uuid7()
            props["id"] = f"{collection}:{id}"
            if not collection in self.data:
                self.data[collection] = {}
            self.data[collection][id] = props
            return_data = self.data[collection][id]
            return self.get_return_statement(None, return_data, "Created", collection_id)
        except:
            return_data = None
            return self.get_return_statement("An error occurred", return_data, "Created", collection_id)

    def READ(self, collection_id, where={}, return_props={}):
        [collection, id] = self.split_collection_id(collection_id)
        # If no return_props are passed, then return the entire record.
        if not return_props:
            if collection in self.data:
                if id in self.data[collection]:
                    return_data = self.data.get(collection, {}).get(id, self.not_found(f"{collection}:{id}"))
                    return self.get_return_statement(None, return_data, "Read", collection_id)
                else:
                    raise ValueError(f'The record with ID "{collection}:{id}" does not exist. You may need to check your spelling.')
            else:
                raise ValueError(f'The collection "{collection}" does not exist. You may need to check your spelling.')
        # Else, return a dictionary that contains only the properties specified.
        else:
            filtered_dict = {}
            if collection in self.data:
                if id in self.data[collection]:
                    # Use the `get()` method to specify a default value to return if the key is not found.
                    record = self.data.get(collection, {}).get(id, self.not_found(f"{collection}:{id}"))
                    for value in return_props:
                        if value in record:
                            filtered_dict[value] = record[value]
                        else:
                            raise ValueError(f'The record "{collection}:{id}" does not have a property {value}.')    
                    return_data = filtered_dict    
                    return self.get_return_statement(None, return_data, "Read", collection_id)
                else:
                    raise ValueError(f'The record with ID "{collection}:{id}" does not exist. You may need to check your spelling.')
            else:
                raise ValueError(f'The collection "{collection}" does not exist. You may need to check your spelling.')            
    
    def UPDATE(self, collection_id, update_dict):
        [collection, id] = self.split_collection_id(collection_id)
        if collection in self.data:
            if id in self.data[collection]:
                self.data[collection][id].update(update_dict)
                return_data = self.data[collection][id]
                return self.get_return_statement(None, return_data, "Updated", collection_id)
            else:
                return self.not_found(f"{collection}:{id}")
        else:
            return self.not_found(f"{collection}:{id}")
    
    def DELETE(self, collection_id):
        [collection, id] = self.split_collection_id(collection_id)
        if collection in self.data:
            if id in self.data[collection]:
                del self.data[collection][id]
                return_data = f"{collection}:{id}"
                return self.get_return_statement(None, return_data, "Deleted", collection_id)
            else:
                return self.not_found(f"{collection}:{id}")
        else:
            return self.not_found(f"{collection}:{id}")

    def display(self):
        """
        Display all records
        """
        print("All Records:")
        for collection_key, collection_value in self.data.items():
            for id_key, id_value in collection_value.items():
                print(f"'{collection_key}:{id_key}': {id_value}")


db = SimpleKeyValueDB()

new_user_created = db.CREATE(f"User:{uuid.uuid7()}", {"name": "John", "age": 30, "city": "PHX"})
db.CREATE("User:001", {"name": "Steve", "age": 32, "city": "SF"})
db.CREATE("User:002", {"name": "Jane", "age": 28, "city": "LA"})
db.CREATE("User:003", {"name": "Mary", "age": 35, "city": "SD"})

# db.display()

new_user_read = db.READ(new_user_created['data']['id'])
print('READ: new_user:', new_user_read)
print('READ: new_user message:', new_user_read['metadata']['message'])

user001 = db.READ("User:001", {}, {"name"})
print('READ: "User:001":', user001["data"])

user002 = db.READ("User:002")
print('READ: "User:002":', user002)

user003 = db.READ("User:003")
print('READ: "User:003":', user003)

updated_user = db.UPDATE("User:002", {"name": "Allison", "age": 40})
print("UPDATE:", updated_user["metadata"]["message"])
print("UPDATE:", updated_user["data"])
db.display()

deleted_user = db.DELETE("User:003")
print("DELETE:", f"'{deleted_user}'")
db.display()
