from flask import Flask, render_template, jsonify, request, redirect, url_for, send_from_directory
from flask_mail import Mail
from flask_cors import CORS
from flask_login import login_required, logout_user
from flask_mysqldb import MySQL
import server_utils
import json
from user_auth import auth, bcrypt, login_manager
from dotenv import load_dotenv
import os

accessKey = 1234 # implementing an access key so users can not query the back end and get to decorator functions. another access key should be received from front end.

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

if __name__ == '__main__':
    app.run(debug = True)