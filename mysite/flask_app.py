
# A very simple Flask Hello World app for you to get started with...
import sys, os
sys.path.append('/home/agile')

from agileRouterAjax import main

from flask import Flask, request, redirect, url_for, jsonify
from flask import render_template
import flask_login

import random, string
import datetime
import tempfile, shutil


app = Flask(__name__)
app.secret_key = open("/home/agile/mysite/secret.key").read()

def getUniqId(N):
    return ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=N))

class User(flask_login.UserMixin):
    def __init__(self, id):
        self.id = id
        self.progressFn = "/home/agile/progress/prog%s.txt" % self.id

    def getProgTxt(self):
        if not os.path.isfile(self.progressFn):
            return "..."
        with open(self.progressFn) as f:
            return f.read()


login_manager = flask_login.LoginManager()

login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    user = User(user_id)
    return user



class Progress:
    def __init__(self, fn):
        self.fn = fn

    def write(self, progress):
        tmp = tempfile.mkstemp(text=True)
        os.write(tmp[0], ("%s\n" % progress).encode('utf-8'))
        shutil.copy(tmp[1], self.fn)
        os.remove(tmp[1])


@app.route('/router', methods=['GET', 'POST'])
def router():
    adrIn = None
    if request.method == 'POST' and 'adresses' in request.form:
        adrIn = request.form.get('adresses')
        useOneWay = request.form.get('oneway') == "1"
        flask_login.logout_user()
        # make up a user
        user = User(getUniqId(8))
        flask_login.login_user(user)
        p = Progress(flask_login.current_user.progressFn)
        return jsonify(main(adrIn, useOneWay, p))

    elif request.method == 'GET' and 'getprogress' in request.args:
        # need to get the progress file and read last entry
        # who is 'logged in'?
        return app.make_response(flask_login.current_user.getProgTxt())

    return render_template("start.html", addresses="", mapRoute="")


@app.route('/other', methods=['GET', 'POST'])
def other():
    return redirect(url_for('router'))

