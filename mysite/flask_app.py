
# A very simple Flask Hello World app for you to get started with...
import sys, os
AGILE_HOME = os.getenv("AGILEHOME", "/home/agile")
sys.path.append(AGILE_HOME)

from agileRouterAjax import main
from createRouteDatabase import *

from flask import Flask, request, redirect, url_for, jsonify, send_file
from flask import render_template
from flask import flash, session, abort
from werkzeug import Response
import io

import random, string
import datetime
import tempfile, shutil

from sqlalchemy.orm import sessionmaker
from createUserDatabase import *
user_engine = create_engine('sqlite:///%s///mysite///users.db' % (AGILE_HOME), echo=True)
data_engine = create_engine('sqlite:///%s///mysite///routedata.db' % (AGILE_HOME), echo=True)

app = Flask(__name__)
app.secret_key = open(os.path.join(AGILE_HOME, "mysite", "secret.key")).read()

def getUniqId(N):
    return ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=N))

def object_as_dict(obj):
    return {c.key: getattr(obj, c.key)
            for c in inspect(obj).mapper.column_attrs}

def toCSV(l):
    r = []
    if len(l) < 1:
        return ''
    l0 = l[0]
    # get the column names
    colnames = l0.keys()
    r.append(','.join(colnames) + ','.join([',date', 'time']))
    print("r=\n", r)
    for ll in l:
        vals = [str(ll[k]) for k in colnames]
        print("vals = \n", vals)
        r.append(','.join(vals))
    csv = '\n'.join(r)
    print(csv)
    return csv

def getDataAsCSV(request):
    users = [u for u in request.args.get('users').split(',')]
    Session = sessionmaker(bind=data_engine)
    s = Session()
    if len(users) == 1 and users[0] == '':
        cond = True
    else:
        cond = Delivery.username.in_(users)
    query = s.query(Delivery).filter(cond)
    db = io.BytesIO(bytes(toCSV([object_as_dict(d) for d in query]), 'utf-8'))
    return bytes(toCSV([object_as_dict(d) for d in query]), 'utf-8')
    #return send_file(db, "text/plain", True, "deliveries.csv")

def clearAllData():
    Session = sessionmaker(bind=data_engine)
    s = Session()
    s.query(Delivery).delete()
    s.commit()

def registerNewUser(username, password):
    # create a Session
    Session = sessionmaker(bind=user_engine)
    session = Session()

    user = User(username, password)
    session.add(user)
    session.commit()



@app.route('/')
def home():
    if not session.get('logged_in'):
        return render_template('login.html')
    else:
        return redirect(url_for('router'))

@app.route('/login', methods=['POST'])
def do_admin_login():
    POST_USERNAME = str(request.form['email'])
    POST_PASSWORD = str(request.form['password'])

    Session = sessionmaker(bind=user_engine)
    s = Session()
    query = s.query(User).filter(User.username.in_([POST_USERNAME]), User.password.in_([POST_PASSWORD]) )
    result = query.first()
    if result:
        session['logged_in'] = True
        session['username'] = POST_USERNAME
    else:
        query = s.query(User).filter(User.username.in_([POST_USERNAME]) )
        result = query.all()
        if result:
            return('Wrong password')
        else:
            registerNewUser(POST_USERNAME, POST_PASSWORD)
            session['logged_in'] = True
            session['username'] = POST_USERNAME
        
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

    elif request.method == 'GET' and 'download' in request.args:
        return getDataAsCSV(request)

    return render_template("start.html", addresses="", mapRoute="")


@app.route("/leg", methods=['POST'])
def receive_leg():
    if not session.get('logged_in') or 'username' not in session.keys():
        return home()
    if request.method == 'POST':
        u = session['username']
        ldata = request.form.get('legdata')
        Session = sessionmaker(bind=data_engine)
        s = Session()
        delivery = Delivery(u, ldata)
        s.add(delivery)
        s.commit()
        return jsonify('received')

@app.route("/download", methods=['GET', 'POST'])
def download_leg():
    if not session.get('logged_in'):
        return home()
    if request.method == 'GET':
        return getDataAsCSV(request)

@app.route("/cleardatabase", methods=['GET'])
def cleardatabase():
    if not session.get('logged_in'):
        return jsonify("not allowed")
    if request.method == 'GET' and 'delete' in request.args and 'agile' in request.args:
        clearAllData()
        return jsonify("done")




@app.route('/other', methods=['GET', 'POST'])
def other():
    return redirect(url_for('router'))


if __name__ == "__main__":
    app.run()

