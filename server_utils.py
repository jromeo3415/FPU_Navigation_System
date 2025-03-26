import requests
from flask import jsonify, request

def check_key(foreign_key, access_key):
    if foreign_key != access_key:
        return jsonify({"error": "Unauthorized"}), 443

'''
takes MySQL object and dictionary of location names (only two locations, maybe implement to have multiple?).
then queries database to retrieve the coordinates in decimal degrees in a tuple.
'''
def getLocation(sql, dictionary):
    start = dictionary[0] # storing start and destination strings from dictionary
    destination = dictionary[1]

    if not start or not destination: # checking if one of the locations are missing
        return jsonify({"error": "Missing one or more locations"}), 400
    try:
        cursor = sql.connection.cursor() # object to represent database

        db_query = f"select coords from locations where name in ('{start}', '{destination}')" # query for database
        cursor.execute(db_query) # executing command on database
        coords = cursor.fetchall() # retrieving results of command

        coords_tuple = [coords[0][0], coords[1][0]] # converting from tuple of tuples to tuple
        clean_tuple = (coords_tuple[0].replace(", ", ","), coords_tuple[1].replace(", ", ","))
        #print(clean_tuple[0])
        #print(clean_tuple[1])
        return clean_tuple

    except Exception as e:
        err_message = str(e)
        return jsonify({"error": f"An error occurred while fetching location coordinates: {err_message}"}), 400

'''
takes coordinates in decimal degrees in a tuple along with profile (transportation method).
calls OSRM docker container to make a route between two points.
returns route in JSON format.
'''
def calcRoute(osrm_ip, coords, profile):
    request_url = f"{osrm_ip}/route/v1/{profile}/{coords[0]};{coords[1]}" # request to be sent to OSRM

    try:
        response = requests.get(request_url) # requests send HTTP request to OSRM. This variable holds the JSON response
        if requests.status_codes == 200:
            return response # front end (leaflet) prefers JSON format for route
        else:
            return jsonify({"error": "OSRM request error"}), 400

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"RequestException: {str(e)}"})