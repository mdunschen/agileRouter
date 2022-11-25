#!/usr/bin/python3


import os, sys
#import cgi
#import cgitb
#cgitb.enable()

import urllib.request as request
from urllib.parse import urlencode
import json

from routeTSM import route


def main(adrInput, useOneWay, progress=None):
    if not adrInput:
        return

    addresses = [a.strip() for a in adrInput.split(';') if a.strip()]
    if len(addresses) <= 1:
        return addresses and addresses[0] or "Error in input?"

    res = route(addresses, useOneWay, progress)
    jsonRes = {"route":[], "addresses":[], "notfound":[], "distance":[]}
    for ix in range(len(addresses)):
        if res["path"]:
            i = res["path"][ix]
            d = res["distance"][ix]
        else:
            i = ix
            d = 0.0
        a = addresses[i]
        jsonRes["addresses"].append(a)
        if i in res["not found"]:
            jsonRes["notfound"].append(i)
        else:
            jsonRes["route"].append(i)
            jsonRes["distance"].append(d)



    return(jsonRes)

if __name__ == "__main__":
    addresses = """
    """

    print(main(addresses, False))
