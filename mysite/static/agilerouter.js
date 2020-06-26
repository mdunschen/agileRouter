    window.onbeforeunload = function() {
        return "Do you really want to leave our brilliant application?";
    };




    var cyclistArtIn = ["------__o", "-----_\ <,_", "----(_)/ (_)"];
    var cyclistArt = cyclistArtIn.slice(0, 3);

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
        var r = Math.max(3, Math.min(8, rows));
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
            if (obj.route.length > 0) {
                ix = obj.route[ix];
            }
            var c = comments[ix];
            if (c.length > 0) {
                adrOut[i] += ' /' + c.join(', ') + '/';
            }
        }
        updateTextEdit(adrOut.join(';\n'), true);
        if (nf == 0) {
            buildMapLinks(adr, comments, obj.route);
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
            cyclistArt[0] = '-' + cyclistArt[0];
            cyclistArt[1] = '-' + cyclistArt[1];
            cyclistArt[2] = '-' + cyclistArt[2];

            if (cyclistArt[2].length == 80) {
                cyclistArt = cyclistArtIn.slice(0, 3);
            }

            updateTextEdit(cyclistArt.join(String.fromCharCode(10)), true);
            requestProgress();
            setTimeout(loadProgress, 500);
        }
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
        for (var i = 0; i < filteredAdresses.length; i++) {
            route[i] = i;
        }

        document.getElementById("results").innerHTML = "";
        buildMapLinks(filteredAdresses, comments, route);

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
                var t = $("#leg" + (i+1)).text();
                if (t.indexOf("/") == -1) { // stamp only if it has no timestamp yet
                    $("#leg" + (i+1)).text(t + ' ' + fmt.format(d));
                }
            }
        });
    }

    function buildMapLinks(addresses, comments, route) {
        // we read the data from the text edit and build links between each pair
        var googleMapDirUrl = "https://www.google.co.uk/maps/dir/%s/%s/data=!4m2!4m1!3e1"

        document.getElementById("results").innerHTML += "<br><br><strong>Legs on google maps:</strong><br>";

        var extractor = new PostCodeExtractor();

        // loop over addresses an build legs
        var legList = '<div class="carousel-inner">';
        for (var i = 1; i < addresses.length; ++i) {
            var a = addresses[i - 1].replace(/\s/g, "+");
            var b = addresses[i].replace(/\s/g, "+");

            // filter out the postcodes
            var pcode_a = extractor.extractPostCode(addresses[i - 1]);
            if (pcode_a == null) {
                pcode_a = addresses[i - 1];
            }
            var pcode_b = extractor.extractPostCode(addresses[i]);
            if (pcode_b == null) {
                pcode_b = addresses[i];
            }

            var leg = "https://www.google.co.uk/maps/dir/" + a + "/" + b + "/data=!4m2!4m1!3e1"
            var legLink = '<a href="' + leg + '" target="_blank" id="leg' + i + '" role="button">' + pcode_a + "&#8594;" + pcode_b + '</a>'
            var ir = route[i];
            if (comments[ir].length > 0) {
                legLink += `<br><p>` + comments[ir].join(', ') + `</p>`;
            }
            var divitem = '<div class="carousel-item';
            if (i == 1) {
                divitem += ' active';
            }
            legList += divitem + '"><div class="maplink">' + legLink + '</div>';


            legList += '</div>';
        }
        legList += '</div>';
        var controls = `
          <a class="carousel-control-prev" href="#map" role="button" data-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="sr-only">Previous</span>
          </a>
          <a class="carousel-control-next" href="#map" role="button" data-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="sr-only">Next</span>
          </a>`;
        // a button to set the time
        var stampButton = '<button type="button" class="btn btn-primary btn-lg btn-block" onClick="stampActive();">Stamp</button>'

        var indicators = `
            <ol class="carousel-indicators">
            <li data-target="#map" data-slide-to="0" class="active"></li>`;
        for (var i = 1; i < addresses.length - 1; ++i) {
            indicators += '<li data-target="#map" data-slide-to="' + i + '"></li>';
        }
        indicators += '</ol>';

        document.getElementById("results").innerHTML += '<div id="map" class="carousel slide">' + legList + controls + indicators + '</div><div class="stamp">' + stampButton + '</div>';
        $('.carousel').carousel({interval: 0});
    }

