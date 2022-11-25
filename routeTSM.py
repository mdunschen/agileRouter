import urllib.request as request
from urllib.parse import urlencode
import json
import itertools

import re

import os
import pickle

AGILE_HOME = os.getenv("AGILEHOME", "/home/agile")
def held_karp(dists, useEndDest = False):
    """
    Implementation of Held-Karp, an algorithm that solves the Traveling
    Salesman Problem using dynamic programming with memoization.
    Parameters:
        dists: distance matrix
    Returns:
        A tuple, (cost, path).
    """
    n = len(dists)

    # Maps each subset of the nodes to the cost to reach that subset, as well
    # as what node it passed before reaching this subset.
    # Node subsets are represented as set bits.
    C = {}

    # Set transition cost from initial state
    for k in range(1, n):
        C[(1 << k, k)] = (dists[0][k], 0)

    # Iterate subsets of increasing length and store intermediate results
    # in classic dynamic programming manner
    for subset_size in range(2, n):
        for subset in itertools.combinations(range(1, n), subset_size):
            # Set bits for all nodes in this subset
            bits = 0
            for bit in subset:
                bits |= 1 << bit

            # Find the lowest cost to get to this subset
            for k in subset:
                prev = bits & ~(1 << k)

                res = []
                for m in subset:
                    if m == 0 or m == k:
                        continue
                    res.append((C[(prev, m)][0] + dists[m][k], m))
                C[(bits, k)] = min(res)

    # We're interested in all bits but the least significant (the start state)
    bits = (2**n - 1) - 1

    # Calculate optimal cost
    res = []
    if useEndDest:
        res.append((C[(bits, n - 1)][0] + dists[n -1][0], n -1))
    else:
        for k in range(1, n):
            res.append((C[(bits, k)][0] + dists[k][0], k))
    opt, parent = min(res)

    # Backtrack to find full path
    path = []
    for i in range(n - 1):
        path.append(parent)
        new_bits = bits & ~(1 << parent)
        _, parent = C[(bits, parent)]
        bits = new_bits

    # Add implicit start state
    path.append(0)

    return opt, list(reversed(path))

cycleStreetsUrl = "https://www.cyclestreets.net/api/journey.json?key=%s&%s"
cycGeoCoder = "https://api.cyclestreets.net/v2/geocoder?key=%s&%s"

apiUse = "cycleStreets"

hwgKey = pickle.load(open(os.path.join(AGILE_HOME, "hwg.key"), "rb"))

hwgUrl = "https://router.hereapi.com/v8/routes?apiKey=%s&transportMode=pedestrian&origin=%s&destination=%s&return=summary"
cyclestreetskey = pickle.load(open(os.path.join(AGILE_HOME, "cyclestreets.key"), "rb"))

googleMapDirUrl = "https://www.google.co.uk/maps/dir/%s/%s/data=!4m2!4m1!3e1"


# https://www.google.co.uk/maps/dir/14+Woodrock+Rd,+Liverpool+L25+8RE/48+Cairns+St,+Liverpool+L8+2UW/@53.3874894,-2.9445621,13z/data=!3m1!4b1!4m14!4m13!1m5!1m1!1s0x487b1fe9fe3606eb:0x5909dd1acebd0ec9!2m2!1d-2.8615458!2d53.3723828!1m5!1m1!1s0x487b20fca594c967:0x287adffb0cff55e1!2m2!1d-2.9554543!2d53.3923331!3e1!5m1!1e3
# https://www.google.co.uk/maps/dir/14+Woodrock+Rd,+Liverpool+L25+8RE/48+Cairns+St,+Liverpool+L8+2UW/

def getLonLat(place):
    # place could be a geolocation already, just do some parsing
    try:
        m = re.match(".*lat?[\s,:]([-0-9.]+)[,\s]*lon?[\s,:]([-0-9.]+)", place.lower())
        if m and m.group(0) and m.group(1):
            return [float(m.group(2)), float(m.group(1))]

        m = re.match(".*lon?[\s,:]([-0-9.]+)[,\s]*lat?[\s,:]([-0-9.]+)", place.lower())
        if m and m.group(0) and m.group(1):
            return [float(m.group(1)), float(m.group(2))]
    except ValueError:
        pass

    r = request.urlopen(cycGeoCoder % (cyclestreetskey, urlencode({"q": place}))).read().decode('utf-8')
    r = json.loads(r)
    if (len(r["features"]) == 1):
        return(r["features"][-1]["geometry"]["coordinates"])
    return "Not found"

def getDistance(a, b):
    if a == b:
        return 0
    if apiUse == "cycleStreets":
        # a and b have to be lat,lon
        waypoints = "%s,%s|%s,%s" % tuple(a + b)
        req = cycleStreetsUrl % (cyclestreetskey, urlencode({"itinerarypoints": waypoints, "plan": "balanced"}))
        r = request.urlopen(req)
        result = json.loads(r.read().decode('utf-8'))
        return(int(result["marker"][0]["@attributes"]["length"]))
    elif apiUse == "hereWeGo":
        org = "%s,%s" % (a[-1], a[0])
        dest = "%s,%s" % (b[-1], b[0])
        req = hwgUrl % (hwgKey, org, dest)
        print(req)
        r = request.urlopen(req)
        result = json.loads(r.read().decode('utf-8'))
        print(result)
        xxxxx

    else:
        assert False, "which API?"


def writeProgress(pf, progress):
    if pf:
        pf.write(progress)



def route(addresses, useOneWay, progressWriter = None):
    # collect all lon/lat pairs
    locations = [getLonLat(a) for a in addresses]

    placesNotFound = [i for i in range(len(locations)) if locations[i] == "Not found"]
    if placesNotFound:
        return {"not found": placesNotFound, "result":[], "path":[]}


    distMatrix = []
    matrixSize = len(locations) * len(locations)
    icount = 0
    writeProgress(progressWriter, "%d of %d" % (icount, matrixSize))
    for i, a in enumerate(locations):
        distRow = []
        for j, b in enumerate(locations):
            distance = getDistance(a, b)
            icount += 1
            writeProgress(progressWriter, "%d of %d" % (icount, matrixSize))
            distRow.append(distance)
        distMatrix.append(distRow)

    writeProgress(progressWriter, "Solving...")
    r = held_karp(distMatrix, useOneWay)
    cost, path = r

    allDirs = []
    for k, ib in enumerate(path[1:]):
        ia = path[k]
        allDirs.append(googleMapDirUrl % (addresses[ia].replace(' ', '+'), addresses[ib].replace(' ', '+')))
    writeProgress(progressWriter, "Done.")
    return {"result": allDirs, "path": path, "not found":[]}
