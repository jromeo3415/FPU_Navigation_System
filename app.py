from flask import Flask, send_from_directory

app = Flask(__name__)

@app.route('/')
def index():
    return send_from_directory('static/html', 'login.html')

@app.route('/dashboard')
def dashboard():
    return send_from_directory('static/html', 'dashboard.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True)
