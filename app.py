from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from flask_mysqldb import MySQL
import server_utils
import json

accessKey = 1234 # implementing an access key so users can not query the back end and get to decorator functions. another access key should be received from front end.

app = Flask(__name__)  # Flask constructor

CORS(app)

app.config['MYSQL_HOST'] = '100.83.147.89'
app.config['MYSQL_USER'] = 'joe'
app.config['MYSQL_PASSWORD'] = '345573'
app.config['MYSQL_DB'] = 'campus_navigation'
mysql = MySQL(app)

@app.route('/getLocation', methods=['POST'])
def getLocation(): # query database for coordinates
    cursor = mysql.connection.cursor()
    server_utils.check_key(request.headers.get('Access-Key'), accessKey) # confirm matching access key
    plain_text = json.dumps(request.get_json()) # convert request to plain text
    location = plain_text[9:-1]
    db_query = f"select coords from locations where name = {location}" # command for database
    cursor.execute(db_query) # executing command in database
    location_coords = cursor.fetchall() # storing results of command
    cursor.close()
    formatted_coords = location_coords[0][0] # returns are stored in a tuple of tuples
    print(formatted_coords)
    return jsonify(formatted_coords)

#   expects a JSON packet with format;  "key": "key1", "locations": "location_1", "location_2"
#   location_1 and location_2 will be start and destination's names respectively, in plain text
#   this function will turn those strings into coords then those two coords into one route, and send the route back in a JSON response
@app.route('/returnRoute', methods=['POST'])
def returnRoute():
    request_dict = request.get_json() # converting JSON request to a Python dictionary

    if not request_dict: # if no locations were sent, send back error
        return jsonify({"error": "Request contents not received"}), 400

    server_utils.check_key(request_dict["string"], accessKey) # checking if access key is valid so clients cannot stumble upon this page

    coordinates = getLocation(request_dict["locations"]) # converting name strings into respective coordinates



@app.route('/')
def index():
    return render_template("index.html")

if __name__ == '__main__':
    app.run(debug = True)