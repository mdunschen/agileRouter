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

    routeOnGoogle = route(addresses, useOneWay, progress)
    output = []
    for ix in range(len(addresses)):
        if routeOnGoogle["path"]:
            i = routeOnGoogle["path"][ix]
        else:
            i = ix
        a = addresses[i]
        if i in routeOnGoogle["not found"]:
            output.append("%s NOT FOUND" % a)
        else:
            output.append(a)

    return(";\n".join(output))

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

    print(main(addresses, False))