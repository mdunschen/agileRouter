
# A very simple Flask Hello World app for you to get started with...
import sys, os
AGILE_HOME = os.getenv("AGILEHOME", "/home/agile")
sys.path.append(AGILE_HOME)

from agileRouterAjax import main
from tabledatadef import *

from flask import Flask, request, redirect, url_for, jsonify
from flask import render_template
from flask import flash, session, abort
import flask_login

import random, string
import datetime
import tempfile, shutil

from sqlalchemy.orm import sessionmaker
from tabledef import *
user_engine = create_engine('sqlite:///tutorial.db', echo=True)
data_engine = create_engine('sqlite:///..///routedata.db', echo=True)

app = Flask(__name__)
app.secret_key = open(os.path.join(AGILE_HOME, "mysite", "secret.key")).read()

def getUniqId(N):
    return ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=N))

@app.route('/')
def home():
    if not session.get('logged_in'):
        return render_template('login.html')
    else:
        return redirect(url_for('router'))

@app.route('/login', methods=['POST'])
def do_admin_login():

    POST_USERNAME = str(request.form['username'])
    POST_PASSWORD = str(request.form['password'])

    Session = sessionmaker(bind=user_engine)
    s = Session()
    query = s.query(User).filter(User.username.in_([POST_USERNAME]), User.password.in_([POST_PASSWORD]) )
    result = query.first()
    if result:
        session['logged_in'] = True
        session['username'] = POST_USERNAME
    else:
        flash('wrong password!')
    return home()

@app.route("/logout")
def logout():
    session['logged_in'] = False
    return home()

@app.route('/router', methods=['GET', 'POST'])
def router():
    if not session.get('logged_in'):
        return home()
    adrIn = None
    if request.method == 'POST' and 'adresses' in request.form:
        adrIn = request.form.get('adresses')
        useOneWay = request.form.get('oneway') == "1"
        return jsonify(main(adrIn, useOneWay, None))

    elif request.method == 'GET' and 'getprogress' in request.args:
        return ''

    return render_template("start.html", addresses="", mapRoute="")


@app.route("/leg", methods=['POST'])
def receive_leg():
    if not session.get('logged_in'):
        return home()
    if request.method == 'POST':
        #print("Received a leg data point, request=\n%s" % str(request))
        #print(request.form.get('legdata'))
        #print(session.keys())
        #print(session['username'])
        Session = sessionmaker(bind=data_engine)
        s = Session()
        delivery = Delivery(session['username'], request.form.get('legdata'))
        s.add(delivery)
        s.commit()
        s.commit()
        return jsonify('received')


@app.route('/other', methods=['GET', 'POST'])
def other():
    return redirect(url_for('router'))


if __name__ == "__main__":
    app.run()

