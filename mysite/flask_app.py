
# A very simple Flask Hello World app for you to get started with...
import sys, os
sys.path.append('/home/agile')

from agileRouter import main
from agileRouterAjax import main as mmain

from flask import Flask, request
from flask import render_template
import flask_login

import random, string
import datetime
import tempfile, shutil


app = Flask(__name__)
app.secret_key = b'xyz///1245'

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


@app.route('/other', methods=['GET', 'POST'])
def other():
    adrIn = None
    adrOut = ""
    if request.method == 'POST' and 'adresses' in request.form:
        adrIn = request.form.get('adresses')
        useOneWay = request.form.get('oneway') == "1"
        flask_login.logout_user()
        # make up a user
        user = User(getUniqId(8))
        flask_login.login_user(user)
        p = Progress(flask_login.current_user.progressFn)
        adrOut = mmain(adrIn, useOneWay, p)
        return adrOut

    elif request.method == 'GET' and 'getprogress' in request.args:
        # need to get the progress file and read last entry
        # who is 'logged in'?
        return app.make_response(flask_login.current_user.getProgTxt())

    return render_template("start.html", addresses="Addresses (separate by ';')", mapRoute="")


@app.route('/router', methods=['GET', 'POST'])
def router():
    adrIn = ""
    f = open("/home/agile/test.log", "a")
    f.write("request: %s\n" % str(request))
    #f.write("keys: %s\n" % str(list(request.form.keys())))
    ff = request.form
    for key in ff.keys():
        for value in ff.getlist(key):
            f.write("%s:%s\n" % (key, value))
    if request.method == 'POST':  #this block is only entered when the form is submitted
        adrIn = request.form.get('adresses')


    f.close()
    return main(adrIn)

