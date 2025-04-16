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
        cursor.close()
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

    try:
        if profile == "car":  # routing different profile's to appropriate docker container, car is port + 1
            ip, port = osrm_ip.split(':')
            final_ip = f"{ip}:{int(port) + 1}" # incrementing to achieve appropriate port

        elif profile == "foot": # foot is port + 2
            ip, port = osrm_ip.split(':')
            final_ip = f"{ip}:{int(port) + 2}" # incrementing to achieve appropriate port

        elif profile == "bicycle": # bicycle is port specified in osrm_ip from app.py
            final_ip = osrm_ip

        request_url = f"http://{final_ip}/route/v1/{profile}/{coords[0]};{coords[1]}"  # request to be sent to OSRM

        response = requests.get(request_url) # requests send HTTP request to OSRM. This variable holds the JSON response
 
        if response.status_code == 200:
            response_json = response.json() # going from request object type to json dict
            return response_json
        else:
            return jsonify({"error": "OSRM request error"}), 400
 
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"RequestException: {str(e)}"})

'''
Takes MySQL object and tuple of filters to apply. These filters must have the exact same name as the column names
in the database. Returns final JSON object to be returned as a response in main.
'''
def applyFilter(sql, filters):
    try:
        num_filters = len(filters) # counting number of filters

        if num_filters == 0:
            return jsonify({"error": "No filters selected"}), 400

        cursor = sql.connection.cursor()

        if num_filters == 1: #  simpler query when there is only one filter
            db_query = f"select name, coords from locations where {filters[0]} = 1"

        elif num_filters > 1: # adding all filters properly when there are multiple
            db_query = "select name, coords from locations where "
            for x in range(num_filters):
                if x == 0: # first element does not need an "and"
                    db_query += f"{filters[x]} = 1"

                else:
                    db_query += f" or {filters[x]} = 1" # ensuring "or" is included for filters after the first one

        cursor.execute(db_query)
        filtered_locations = cursor.fetchall() # storing query results
        
        # Convert tuple results to list of [name, coords] pairs
        location_pairs = []
        for location in filtered_locations:
            location_pairs.append([location[0], location[1]])
            
        cursor.close()
        return jsonify(location_pairs), 200 # casting results to json and returning

    except Exception as e:
        print("ERROR!!!")
        err_message = str(e)

        return jsonify({"error": f"An error occurred while fetching filtered locations: {err_message}"}), 400