from flask_login import UserMixin, login_user,  logout_user, current_user, LoginManager
from flask_wtf import FlaskForm
from flask import url_for, render_template, request, flash, jsonify
from wtforms import StringField, PasswordField, SubmitField
from wtforms.fields.simple import BooleanField
from wtforms.validators import InputRequired, Length, ValidationError, Email
from flask_bcrypt import Bcrypt
from flask import redirect, Blueprint, current_app
from flask_mail import Message
from flask_wtf.recaptcha import RecaptchaField
import requests
from flask_login import LoginManager
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature

auth = Blueprint('auth', __name__)

bcrypt = Bcrypt()
login_manager = LoginManager()
login_manager.login_view = "auth.login"


@login_manager.user_loader
def load_user(sql, user_id):
    return User.get(sql, user_id)

def logout():
    logout_user()
    return redirect(url_for('dashboard'))

class User(UserMixin):
    def __init__(self, id, username, password, email_verified):
        self.id = id
        self.username = username
        self.password = password
        self.email_verified = email_verified

    @staticmethod
    def get(sql, user_id):
        cursor = sql.connection.cursor()
        cursor.execute("SELECT id, username, password, email_verified FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()
        cursor.close()
        if user_data:
            return User(*user_data)
        return None


class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[InputRequired(), Email()], render_kw={"placeholder": "Username"})
    password = PasswordField('Password', validators=[InputRequired(), Length(min=10, max=40)], render_kw={"placeholder": "Password"})
    first_name = StringField('First Name', validators=[InputRequired()], render_kw={"placeholder": "First Name"})
    last_name = StringField('Last Name', validators=[InputRequired()], render_kw={"placeholder": "Last Name"})
    submit = SubmitField('Register')

    def __init__(self, sql=None, *args, **kwargs):
        super(RegisterForm, self).__init__(*args, **kwargs)
        self.sql = sql

    def validate_email(self, username):
        if not username.data.endswith("floridapoly.edu"):
            raise ValidationError('Please enter a valid Florida Poly email address.', )

        cursor = self.sql.connection.cursor()
        cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
        existing_email = cursor.fetchone()
        cursor.close()
        if existing_email:
            raise ValidationError('Email already registered.')

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[InputRequired()])
    password = PasswordField('Password', validators=[InputRequired()])
    remember_me = BooleanField('Remember Me')
    recaptcha = RecaptchaField()
    submit = SubmitField('Login')

@auth.route('/register', methods=['GET','POST'])
def register():
    from app import mysql, bcrypt, mail
    if request.method == 'POST':
        data = request.get_json()
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        username = data.get('username')
        password = data.get('password')
        recaptcha_response = data.get('recaptcha_response')
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        verify_url = f"https://www.google.com/recaptcha/api/siteverify?secret={current_app.config['RECAPTCHA_SECRET_KEY']}&response={recaptcha_response}"
        response = requests.get(verify_url).json()
        if not response.get('success'):
            return jsonify({'success': False, 'message': 'reCAPTCHA failed.'}), 400

        if not username.endswith("floridapoly.edu"):
            return jsonify({'success': False, 'message': 'Please enter a valid Florida Poly email address.'}), 400

        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        existing_username = cursor.fetchone()
        if existing_username:
            cursor.close()
            return jsonify({'success': False, 'message': 'Username already registered.'}), 400
        cursor.execute("""
            INSERT INTO users (username, password, first_name, last_name, email_verified)
            VALUES (%s, %s, %s, %s, %s)
        """,(username, hashed_password, first_name, last_name, False))
        mysql.connection.commit()
        cursor.close()
        #Generate token
        serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        token = serializer.dumps(username, salt='email-confirm')
        verify_link = url_for('auth.email_verification', username=username, token=token, _external=True)
        message = Message(
            subject="Confirm Your Email",
            sender=("noreply", "noreply@floridapolymap.com"),
            recipients=[username]
        )
        message.body = f"""\
Hello {first_name},
Thank you for creating an account.
Please verify your email by clicking the link below:
{verify_link}
Best regards
https://floridapolymap.com
"""
        print(verify_link)
        try:
            mail.send(message)
            print("Email sent")
        except Exception as e:
            print(e)
        return jsonify({'success': True, 'message': 'Registration successful. Please verify email', 'redirect': url_for('auth.login')}), 200
    return render_template('html/register.html')

#
@auth.route('/verify/<username>/<token>')
def email_verification(username, token):
    from app import mysql
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        verified_username = serializer.loads(token, salt='email-confirm', max_age=3600)
    except SignatureExpired:
        flash('The verification link has expired', 'danger')
        return redirect(url_for('auth.login'))
    except BadSignature:
        flash('Invalid verification token', 'danger')
        return redirect(url_for('auth.login'))
    if verified_username != username:
        flash('Token does not match','danger')
        return redirect(url_for('auth.login'))
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT email_verified FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    if user:
        email_verified = user[0]
        if email_verified == 0:
            cursor.execute("UPDATE users SET email_verified = 1 WHERE username = %s", (username,))
            mysql.connection.commit()
            flash("Your email has been verified",'success')
        else:
            flash("Your email is already verified", 'info')
    else:
        flash('User not found', 'danger')
    cursor.close()
    return redirect(url_for('auth.login'))
@auth.route('/login', methods=['GET', 'POST'])
def login():
    from app import mysql
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message':'Invalid data format'}), 400
    username = data.get('username')
    password = data.get('password')
    recaptcha_response = data.get('recaptcha-response')
    verify_url = f"https://www.google.com/recaptcha/api/siteverify?secret={current_app.config['RECAPTCHA_SECRET_KEY']}&response={recaptcha_response}"
    response = requests.get(verify_url).json()

    if not response.get('success'):
        return jsonify({'error': 'Invalid email or password.'}), 401

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    cursor.close()
    if user:
        if bcrypt.check_password_hash(user['password'], password):
            if not user['email_verified']:
                return jsonify({'success': False, 'message': 'Please verify your email address'}),
            return redirect(url_for('dashboard'))
        else:
            return jsonify({'success': False, 'message': 'Incorrect password'})
    else:
        return jsonify({'success': False, 'message': 'Invalid email or password'})


@auth.route('/reset-password/<username>/<token>', methods = ['GET', 'POST'])
def reset_password(username, token):
    from app import mysql
    if not bcrypt.check_password_hash(token, username):
        return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401
    if request.method == 'POST':
        password = request.form.get('password')
        if len(password) < 10:
            return jsonify({'success': False, 'message': 'Password must be at least 10 characters.'}), 400
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        cursor = mysql.connection.cursor()
        cursor.execute("UPDATE users SET password = %s WHERE username = %s", (hashed_password, username))
        mysql.connection.commit()
        cursor.close()
        flash("Your password has been reset.", "success")
        return redirect(url_for('auth.login'))
    return render_template('html/forgot-password.html',username=username, token=token)
@auth.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    from app import mysql, mail
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        if not username or '@floridapoly.edu' not in username:
            return jsonify({'success': False, 'message': 'Email not found. Please enter a valid Florida Poly Email registered to an account.'}), 400
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        cursor.close()
        if not user:
            return jsonify({'success': False, 'message': 'Invalid username.'}), 401

        token = bcrypt.generate_password_hash(username).decode('utf-8')
        reset_link = url_for("auth.reset_password", token=token, _external=True)
        msg = Message('Password reset', recipients=[username])
        msg.body = f'Click link to reset password to {reset_link}'
        mail.send(msg)
        return jsonify({'success': True, 'message': 'Password reset'}), 200
    return render_template('html/forgot-password.html')


