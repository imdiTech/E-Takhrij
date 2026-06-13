from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, TextAreaField
from wtforms.validators import DataRequired, Length

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=50)])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Ingat Saya')
    submit = SubmitField('Login')

class HadithForm(FlaskForm):
    kitab = StringField('Kitab', validators=[DataRequired(), Length(max=100)])
    nomor = StringField('Nomor Hadis', validators=[DataRequired(), Length(max=50)])
    bab = StringField('Bab', validators=[Length(max=255)])
    
    arab = TextAreaField('Teks Arab (opsional)')
    terjemahan = TextAreaField('Terjemahan Indonesia (opsional)')
    english = TextAreaField('Teks Inggris (opsional)')
    
    sanad_json = TextAreaField('Sanad JSON (opsional)')
    sanad_edges_json = TextAreaField('Sanad Edges JSON (opsional)')
    
    submit = SubmitField('Simpan')
