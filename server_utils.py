from flask import jsonify, request

def check_key(foreign_key, access_key):
    if (foreign_key != access_key):
        return jsonify({"error": "Unauthorized"}), 443

def getLocation(dictionary):
