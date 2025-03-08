import logging
from flask import Flask
from flask_mysqldb import MySQL

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

with app.app_context():
    app.config['MYSQL_HOST'] = '100.83.147.89'
    app.config['MYSQL_USER'] = 'joe'
    app.config['MYSQL_PASSWORD'] = '345573'
    app.config['MYSQL_DB'] = 'campus_navigation'
    mysql = MySQL(app)
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT * FROM locations')
    mysql.connection.commit()
    res = cursor.fetchall()
    print(f"results: {res}")
    cursor.close()


if __name__ == '__main__':
    app.run(debug=True)