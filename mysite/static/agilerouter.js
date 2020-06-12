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

    var resultReceived = new StateChanges();

    function debugWrite(txt) {
        document.getElementById("adresses").value += txt;
    }

    function request(type, url, data, callback) {
        var req = new XMLHttpRequest();
        req.open(type, url, true);
        if (data != false) {
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        }
        req.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                callback(req.responseText);
            }
        }

        if (data != false) {
            req.send(data);
        } else {
            req.send();
        }
    }

    function reportProgress(txt) {
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
    }


    function requestProgress() {
        if (resultReceived.getStatus() == false) {
            request('GET', '/router?getprogress', false, reportProgress);
        }
    }

    function onReceiveResult(txt) {
        resultReceived.changeStatus(true);
        updateTextEdit(txt, true);
        buildMapLinks();
    }

    function submitAdresses() {
        var adr = "adresses=";
        var data = adr.concat(encodeURI(document.getElementById("adresses").value));
        var oneway = "oneway=";
        var val = document.getElementById("oneway").checked ? "1" : "0";
        data = data.concat("&oneway=", encodeURI(val));
        updateTextEdit("", true);
        request('POST', '/router', data, onReceiveResult);
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

    function buildMapLinks() {
        // we read the data from the text edit and build links between each pair
        var googleMapDirUrl = "https://www.google.co.uk/maps/dir/%s/%s/data=!4m2!4m1!3e1"

        var addresses = document.getElementById("adresses").value.split(';');

        document.getElementById("results").innerHTML += "<br><br><strong>Legs on google maps:</strong><br>";

        // loop over addresses an build legs
        var legList = '<div class="carousel-inner">';
        for (var i = 1; i < addresses.length; ++i) {
            var a = addresses[i - 1].replace(" ", "+");
            var b = addresses[i].replace(" ", "+");
            var leg = "https://www.google.co.uk/maps/dir/" + a + "/" + b + "/data=!4m2!4m1!3e1"
            var legLink = '<a href="' + leg + '" target="_blank" id="leg' + i + '" role="button">' + "Leg " + i + '</a>'
            var divitem = '<div class="carousel-item';
            if (i == 1) {
                divitem += ' active';
            }
            legList += divitem + '"><div class="maplink">' + legLink + '</div></div>';
        }
        legList += '</div>';
        var controls = `
          <a class="carousel-control-prev" href="#map" role="button" data-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true">Previous</span>
          <span class="sr-only">Previous</span>
          </a>
          <a class="carousel-control-next" href="#map" role="button" data-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true">Next</span>
          <span class="sr-only">Next</span>
          </a>`;
        // a button to set the time
        var stampButton = '<button type="button" class="btn btn-primary btn-lg btn-block" onClick="stampActive();">Stamp</button>'
        document.getElementById("results").innerHTML += '<div id="map" class="carousel slide">' + legList + controls + '</div><br>' + stampButton;
        $('.carousel').carousel({interval: 0});
    }

