# Florida Poly Navigation System

<div align="center">

![Florida Poly Logo](https://marvel-b1-cdn.bc0a.com/f00000000257950/floridapoly.edu/university-relations/brand/assets/cyan_phoenixlogos-tm-master-cmyk.png)

[![Website](https://img.shields.io/badge/Website-floridapolymap.com-6a0dad?style=for-the-badge)](https://floridapolymap.com)

</div>

## Overview

The Florida Poly Navigation System is a comprehensive campus navigation solution designed specifically for Florida Polytechnic University. This system provides efficient routing for pedestrians, cyclists, and drivers around the campus with an interactive user interface.

## Features

- **Multi-mode Navigation**: Support for walking, cycling, and driving directions
- **Campus Locations**: Easily find buildings, facilities, and services
- **User Authentication**: Secure access limited to Florida Poly members
- **Responsive Design**: Works on desktop and mobile devices
- **Turn-by-turn Directions**: Detailed navigation instructions

## Requirements

### Authentication

- **Florida Poly Email**: Users must have an email belonging to the floridapoly.edu domain

### Environment Setup

- **OSRM Configuration**: Due to OSRM's design, three separate routing machines must be configured for each profile:
  - Car: port + 1
  - Foot: port + 2
  - Bicycle: base port

- **.env File**: An .env file must be used with the appropriate keys for MailGun, MySQL, reCAPTCHA, along with mysql credentials. 

- **OSRM IP Configuration**: The IP for your OSRM Docker container must be specified in 'osrm_ip' in app.py

- **Access Key**: Decorators involving the backend must have an accessKey configured.

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/FPU_Navigation_System.git
   cd FPU_Navigation_System
   ```

2. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

3. Configure your .env file with the required credentials

4. Set up OSRM Docker containers for each profile (foot, car, bicycle)

5. Update the OSRM IP in app.py

6. Run the application
   ```bash
   python app.py
   ```

## Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Map**: Leaflet.js
- **Routing**: OSRM (Open Source Routing Machine)
- **Database**: MySQL
- **Authentication**: Flask-Login, Flask-Bcrypt
- **Email**: Flask-Mail with Mailgun
