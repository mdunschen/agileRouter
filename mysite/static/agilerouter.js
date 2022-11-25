    window.onbeforeunload = function() {
        return "Do you really want to leave our brilliant application?";
    };




    /*var cyclistArtIn = ["------__o", 
                        "-----_\ <,_", 
                        "----(_)/ (_)"];*/
    var cyclistArtIn = ["-------_O",
                        "-------/    ______", 
                        "-----_\ <,_/_____/_", 
                        "----(_)/         (_)"];
    var cyclistArtHeight = 4;
    var cyclistArt = cyclistArtIn.slice(0, cyclistArtHeight);

    class StateChanges {
        constructor() {
            this.status = false;
        }

        changeStatus(newStatus) {
            this.status = newStatus;
        }

        getStatus() {
            return this.status;
        }
    }

    class PostCodeExtractor {
        constructor() {
            this.pattern = /\w{1,2}\d{1,2}\s*\d{1,2}\w{2}/i;
        }


        extractPostCode(adr) {
            var match = this.pattern.exec(adr);
            if (match != null && match.length > 0) {
                return (match[0].replace(/\s/g, "")).toUpperCase();
            }
            return null;
        }
    }

    class GeoExtractor {
        constructor() {
            this.patternLatLon = /.*lat?[\s,:]([-0-9.]+)[,\s]*lon?[\s,:]([-0-9.]+)/i;
            this.patternLonLat = /.*lon?[\s,:]([-0-9.]+)[,\s]*lat?[\s,:]([-0-9.]+)/i;
        }


        extractForGMap(loc) {
            var m = this.patternLatLon.exec(loc);
            if (m != null && m.length == 3) {
                return(m.slice(1,3).join(','));
            }
            m = this.patternLonLat.exec(loc);
            if (m != null && m.length == 3) {
                return(m.slice(1,3).reverse().join(','));
            }
            return null;
        }
    }


    var resultReceived = new StateChanges();

    function debugWrite(txt) {
        document.getElementById("adresses").value += txt;
    }

    function request(type, url, data, callback, userdata) {
        var req = new XMLHttpRequest();
        req.open(type, url, true);
        if (data != false) {
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        }
        req.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                callback(req.responseText, userdata);
            }
        }

        if (data != false) {
            req.send(data);
        } else {
            req.send();
        }
    }

    function reportProgress(txt, t) {
        if (resultReceived.getStatus() == false) {
            updateTextEdit(txt);
        }
    }

    function updateTextEdit(txt, clear = false) {
        if (clear) {
            document.getElementById("adresses").value = txt;
        } else {
            document.getElementById("adresses").value += txt;
        }

        // adjust rows
        var rows = ((document.getElementById("adresses").value).split('\n')).length;
        var r = Math.max(5, Math.min(8, rows));
        if (r != document.getElementById("adresses").rows) {
            document.getElementById("adresses").rows = r;
        }
    }


    function requestProgress() {
        if (resultReceived.getStatus() == false) {
            request('GET', '/router?getprogress', false, reportProgress, null);
        }
    }

    function onReceiveResult(txt, comments) {
        resultReceived.changeStatus(true);
        // txt is a json string that needs dismantling now for the text edit
        var obj = JSON.parse(txt)
        // check if we have anything in "notfound"
        var nf = obj.notfound.length > 0;
        var adr = obj.addresses;
        var adrOut = new Array();
        for (var i = 0; i < adr.length; i++) {
            // is this address unkown?
            adrOut[i] = adr[i]
            if (obj.notfound.includes(i)) {
                adrOut[i] += " NOT FOUND";
            }
            var ix = i;
            if (0 < obj.route.length && ix < obj.route.length) {
                ix = obj.route[ix];
            }
            var c = comments[ix];
            if (0 < c.length) {
                adrOut[i] += ' /' + c.join('. ') + '/';
            }
        }
        updateTextEdit(adrOut.join(';\n'), true);
        if (nf == 0) {
            buildMapLinks(adr, comments, obj.route, obj.distance);
        }
    }

    function filterComments(adr) {
        // split at ';'
        var adrList = adr.split(';');

        var comments = new Array();
        var filteredAdresses = new Array();
        var commentPattern = /\/.*?\//g;
        for (var i = 0; i < adrList.length; ++i) {
            var a = adrList[i].trim();
            // now strip out all comments from a and save in filteredAdresses.
            // test we have zero or an even number of '/'
            var f = a;
            comments[i] = new Array();
            var n = 0;
            var cc = f.match(/\//g);
            if (cc != null) {
                n = cc.length;
            }
            if (n % 2 == 0) { // expect these in pairs
                var c;
                var ic = 0;
                while ((c = commentPattern.exec(a)) != null) {
                    comments[i][ic++] = ((c[0].substring(1, c[0].length - 1)).replace(',', '')).trim(); // strip out the '/'
                    var s = f.indexOf(c[0]);
                    var e = s + c[0].length;
                    f = f.substring(0, s) + f.substring(e);
                }
            }
            filteredAdresses[i] = f;
        }

        return [filteredAdresses, comments];
    }

    function submitAdresses() {
        var res = filterComments(document.getElementById("adresses").value);
        var filteredAdresses = res[0];
        var comments = res[1];
        var adr = "adresses=";
        var data = adr.concat(encodeURI(filteredAdresses.join(';')));
        var oneway = "oneway=";
        var val = document.getElementById("oneway").checked ? "1" : "0";
        data = data.concat("&oneway=", encodeURI(val));
        updateTextEdit("", true);
        request('POST', '/router', data, onReceiveResult, comments);
    }

    function loadProgress() {
        if (resultReceived.getStatus() == false) {
            for (var i = 0; i < cyclistArtHeight; ++i) {
                cyclistArt[i] = '-' + cyclistArt[i];
            }

            if (cyclistArt[2].length == 80) {
                cyclistArt = cyclistArtIn.slice(0, cyclistArtHeight);
            }

            updateTextEdit(cyclistArt.join(String.fromCharCode(10)), true);
            requestProgress();
            setTimeout(loadProgress, 500);
        }
    }

    function onReceiveDatabase(db) {
        var blob = new Blob([db], {type: "text/plain"});
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        document.body.appendChild(link);
        link.style = "display: none";
        link.href = url;
        link.download = "database.csv";
        link.click();

        setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove(); } , 100);    
    }

    function downloadData() {
        request('GET', '/router?download&users=', false, onReceiveDatabase, false);
    }


    function doSubmit() {
        resultReceived.changeStatus(false);
        document.getElementById("results").innerHTML = "";
        submitAdresses();
        loadProgress();
    }

    function navigate() {
        var res = filterComments(document.getElementById("adresses").value);
        var filteredAdresses = res[0];
        var comments = res[1];

        var route = new Array();
        var distance = new Array();
        for (var i = 0; i < filteredAdresses.length; i++) {
            route[i] = i;
            distance[i] = 0;
        }

        document.getElementById("results").innerHTML = "";
        buildMapLinks(filteredAdresses, comments, route, distance);

    }

    function onDataSaved(r, ix) {
        var obj = JSON.parse(r);
        if (obj.localeCompare("received") == 0) {
            var t = $("#leg" + (ix)).text();
            $("#leg" + (ix)).text(t + "✔");
        }
    }

    function stampActive() {
        $(".carousel-item").each(function(i) {
            if ($(this).hasClass("active")) {
                options = {
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: 'numeric', minute: 'numeric', second: 'numeric',
                    hour12: false };
                var d = new Date();
                var fmt = new Intl.DateTimeFormat('en-GB', options);
                var t = $("#leg" + (i)).text();
                if (t.indexOf("/") == -1) { // stamp only if it has no timestamp yet
                    $("#leg" + (i)).text(t + ', ' + fmt.format(d));

                    // send data to server
                    data = "legdata=" + $("#leg" + (i)).text();
                    request('POST', '/leg', data, onDataSaved, i);
                }
            }
        });
    }

    function convertToMiles(m) {
        return (m * 0.00062137).toFixed(1);
    }

    function buildMapLinks(addresses, comments, route, distance) {
        // we read the data from the text edit and build links between each pair
        var googleMapDirUrl = "https://www.google.co.uk/maps/dir/%s/%s/data=!4m2!4m1!3e1";

        var oneway = document.getElementById("oneway").checked;

        document.getElementById("results").innerHTML += "<br><br><strong>Legs on google maps:</strong><br>";

        var pc = new PostCodeExtractor();
        var geo = new GeoExtractor();

        // loop over addresses an build legs
        var legList = '<div class="carousel-inner">';
        var loopEnd = oneway ? addresses.length - 1 : addresses.length;
        for (var i = 0; i < loopEnd; ++i) {

            var a;
            var b;


            var pcode_a;
            var pcode_b;

            var geo_a = geo.extractForGMap(addresses[i]);
            if (geo_a != null) {
                a = geo_a;
                pcode_a = geo_a;
            } else {
                a = addresses[i].replace(/\s/g, "+");
                pcode_a = pc.extractPostCode(addresses[i]);
                if (pcode_a == null) {
                    pcode_a = addresses[i];
                }
            }

            var inext = i + 1;
            if (inext == addresses.length) {
                inext = 0; // a round trip, go back to start
            }

            var geo_b = geo.extractForGMap(addresses[inext]);
            if (geo_b != null) {
                b = geo_b;
                pcode_b = geo_b;
            } else {
                b = addresses[inext].replace(/\s/g, "+");
                pcode_b = pc.extractPostCode(addresses[inext]);
                if (pcode_b == null) {
                    pcode_b = addresses[inext];
                }
            }

            var leg = "https://www.google.co.uk/maps/dir/" + a + "/" + b + "/data=!4m2!4m1!3e1";
            var legDist = '';
            if (distance[i] > 0) {
                legDist = ": " + convertToMiles(distance[i]) + " miles"
            }

            var legLink = '<a href="' + leg + '" target="_blank" id="leg' + i + '" role="button">' + pcode_a + "&#8594;" + pcode_b + legDist + '</a>';
            var ir = route[i];
            if (comments[ir].length > 0) {
                legLink += `<br><p>` + comments[ir].join(', ') + `</p>`;
            }
            var divitem = '<div class="carousel-item';
            if (i == 0) {
                divitem += ' active';
            }
            legList += divitem + '"><div class="maplink">' + legLink + '</div>';


            legList += '</div>';
        }
        legList += '</div>';
        var controls = `
            <button class="carousel-control-prev" type="button" data-bs-target="#agilemap" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#agilemap" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </button>`;

        var indicators = `<div class="carousel-indicators">`;
        for (var i = 0; i < loopEnd; ++i) {
            indicators += '<button type="button" data-bs-target="#agilemap" data-bs-slide-to="' + i;
            if (i == 0) {
                indicators += '" class="active"';
            }
            indicators += ' aria-label="Slide ' + i + '"></button>';
        }
        indicators += '</div>';

        // a button to set the time
        var stampButton = '<div class="d-grid gap-2"><button type="button" class="btn btn-primary  btn-lg" onClick="stampActive();">Stamp</button></div>';

        var t = '<div id="agilemap" class="carousel slide" data-bs-ride="carousel">' + 
            indicators + legList + controls + 
            '</div><div class="stamp">' + 
            stampButton + 
            '</div>';

        document.getElementById("results").innerHTML += t;

        // stop the carousel from moving;
        $('.carousel').carousel({interval: 0});
    }

