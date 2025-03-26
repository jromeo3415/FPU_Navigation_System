import json

data = { "locations": ["IST", "Dining Hall"],
         "key": "asdf"}

json_message = json.dumps(data)

print(json_message)

plain = json.loads(json_message)
print(plain["key"])
print(plain["locations"][1])