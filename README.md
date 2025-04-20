Florida Poly Navigation System

To use this system, you must have an email belonging to the floridapoly domain. 
Due to OSRM's design, you must configure three seperate routing machines for each profile (foot, car, and bicycle) as OSRM does not allow multiple profiles for one Docker container.
Car will be on on the port + 1, foot is on port + 2, and bicycle is on port. 
A .env file must be used with the appropriate keys for MailGun, MySQL, reCAPTCHA, along with mysql credentials. 
The IP for your OSRM Docker container must be specified in 'osrm_ip' in app.py
Decorators involving the backend must have an accessKey as well.
Make sure to install all libraries through the requirements file.

Thank you for using.
