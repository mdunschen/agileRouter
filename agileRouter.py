#!/usr/bin/python3


import os, sys
import cgi
import cgitb
cgitb.enable()

import urllib.request as request
from urllib.parse import urlencode
import json

from routeTSM import route

cgiName = "agileRouter"

def printForm(txt):
    formContent = """
    <html>
    <header></header>
    <body>
    <form action="/router" method="post">"""
    formContent += '<textarea rows = "10" cols = "80" id="adresses" name="adresses">%s</textarea><br>' % txt
    formContent += """
    <input type="submit" value="Calculate">
    </form>"""
    return formContent

def closeHTML():
    return """
    </body>
    </html>"""

def main(adrInput):
    s = ""
    if not adrInput:
        s += printForm("Addresses (separate with ';')")
        s += closeHTML()
        return s
    test = False
    if (not test):
        submitted = adrInput
        addresses = [a.strip() for a in submitted.split(';')]
        addresses = [a for a in addresses if a] # strip out empties


    else:
        addresses = [
            "66 Mount Pleasant, L3 5SD",
            "92 Quebec Quay, L3 4ER",
            "22 Percy Street, L8 7LU",
            "16 Aigburth Drive, L17 4JG",
            "10 Rundle Road, L17 0AG",
            "94 Blythswood St, L17 7DG",
            "52 Woodlands Road, L17 0AP",
            "100 Belgrave Road, L17 7AH",
            "29 Wembley Rd, L18 2DP",
            "5 Ramilies Road, L18 1EE"]
    routeOnGoogle = route(addresses)
    txt = ""
    for ix in range(len(addresses)):
        if routeOnGoogle["path"]:
            i = routeOnGoogle["path"][ix]
        else:
            i = ix
        a = addresses[i]
        if i in routeOnGoogle["not found"]:
            txt += "%s NOT FOUND" % a
        else:
            txt += "%s" % a
        if ix < len(addresses) - 1:
            txt += ";"
        txt += "\n"

    s += printForm(txt)
    for i, r in enumerate(routeOnGoogle["result"]):
        s += '<p>Leg %d: <a href="%s">%s</a><br>' % (i, r, r)

    s += closeHTML()
    return s

if __name__ == "__main__":
    addresses = """
    66 Mount Pleasant, L3 5SD;
    92 Quebec Quay, L3 4ER;
    22 Percy Street, L8 7LU;
    16 Aigburth Drive, L17 4JG;
    10 Rundle Road, L17 0AG;
    94 Blythswood St, L17 7DG;
    52 Woodlands Road, L17 0AP;
    100 Belgrave Road, L17 7AH;
    29 Wembley Rd, L18 2DP;
    5 Ramilies Road, L18 1EE;"""

    print(main(addresses))