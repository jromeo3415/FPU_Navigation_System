from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_mysqldb import MySQL
from server_utils import check_key, getLocation, calcRoute

accessKey = 1234 # implementing an access key so users can not query the back end and get to decorator functions. another access key should be received from front end.

osrm_ip = "100.83.147.89:5000"
app = Flask(__name__)  # Flask constructor

CORS(app)

app.config['MYSQL_HOST'] = '100.83.147.89'
app.config['MYSQL_USER'] = 'joe'
app.config['MYSQL_PASSWORD'] = '345573'
app.config['MYSQL_DB'] = 'campus_navigation'
mysql = MySQL(app)

@app.route('/')
def index():
    return send_from_directory('templates/html', 'login.html')

@app.route('/dashboard')
def dashboard():
    return send_from_directory('templates/html', 'dashboard.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('templates', path)

'''
expects a JSON packet with format;  "key": "key1", "locations": "start", "destination", "profile": "foot".
start and destination will be the start and destination's names respectively, in plain text.
profile is the method of travel, car, foot, or bike.
this function will turn those strings into coords then those two coords into one route, and send that route back in a JSON response
'''

@app.route('/returnRoute', methods=['POST'])
def returnRoute():
    request_dict = request.get_json() # converting JSON request to a Python dictionary

    if not request_dict: # if no locations were sent, send back error
        return jsonify({"error": "Request contents not received"}), 400

    check_key(request_dict["key"], accessKey) # checking if access key is valid so clients cannot stumble upon this page

    coordinates = getLocation(mysql, request_dict["locations"]) # converting name strings into respective coordinates

    route = calcRoute(osrm_ip, coordinates, request_dict["profile"])
    return route

    # test string below
    #curl -X POST 127.0.0.1:5000/returnRoute -H "Content-Type: application/json" -d '{"key": "1234", "locations": ["IST", "BARC"], "profile": "foot"}'

if __name__ == '__main__':
    app.run(debug=True)