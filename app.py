from flask import Flask, session, render_template, jsonify, request, redirect, url_for, send_from_directory
from flask_mail import Mail
from flask_cors import CORS
from flask_login import login_required, logout_user
from flask_mysqldb import MySQL
from server_utils import calcRoute, getLocation, check_key, applyFilter, getAll
import json
from user_auth import auth, bcrypt, login_manager
from dotenv import load_dotenv
import os

accessKey = 1234 # implementing an access key so users can not query the back end and get to decorator functions. another access key should be received from front end.

osrm_ip = "127.0.0.1:5000"
app = Flask(__name__)  # Flask constructor

CORS(app)

app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

mysql = MySQL(app)

app.config['RECAPTCHA_PUBLIC_KEY'] = os.getenv('RECAPTCHA_PUBLIC_KEY')
app.config['RECAPTCHA_SECRET_KEY'] = os.getenv('RECAPTCHA_SECRET_KEY')

bcrypt.init_app(app)
login_manager.init_app(app)

load_dotenv()

app.config['MAIL_SERVER'] = 'smtp.mailgun.org'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER')
mail = Mail(app)

app.register_blueprint(auth, url_prefix='')

@app.route('/')
def index():
    return redirect('/login')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('html/dashboard.html')

@app.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

# need to remove following decorator and function
'''@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('templates', path)'''

'''
expects a JSON packet with format;  "key": "key1", "locations": "start", "destination", "profile": "foot"
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
    #   curl -X POST 127.0.0.1:5000/returnRoute -H "Content-Type: application/json" -d '{"key": "1234", "locations": ["IST", "BARC"], "profile": "foot"}'

'''
expects a JSON packet with the format: "key": "key1", "filters": "filter1", "filter2", "filterN" and so on
Content of filter header will have the filtered requirement, for example, "has_bathroom"
These filter requirements must match their format in the database.
Function will return a JSON reply with locations that match the filter.
'''
@app.route('/returnFiltered', methods=['POST'])
def returnFiltered():
    request_dict = request.get_json() # casting response object to python dictionary

    if not request_dict:
        return jsonify({"error": "Request contents not received"}), 400

    check_key(request_dict["key"], accessKey) # checking access key

    filtered_locations = applyFilter(mysql, request_dict["filters"])
    return filtered_locations

    #   curl -X POST 127.0.0.1:5000/returnFiltered -H "Content-Type: application/json" -d '{"key": "1234", "filters": ["has_bathroom", "dorm"]}'

@app.route('/allLocations', methods=['POST'])
def allLocations():
    key = request.get_json() #  only argument should be access key

    if not key:
        return jsonify({"error": "Forbidden"}), 500

    check_key(key["key"], accessKey) #  checking access key

    return getAll(mysql)


if __name__ == '__main__':
    app.run(debug=True)
