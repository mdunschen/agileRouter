const FlexSlider = {
	// total no of items
	num_items: document.querySelectorAll(".slider-item").length,

	// position of current item in view
	current: 1,

	init: function() {
		// set CSS order of each item initially
		document.querySelectorAll(".slider-item").forEach(function(element, index) {
			element.style.order = index+1;
		});

		this.addEvents();
	},

	addEvents: function() {
		var that = this;

		// click on move item button
		document.querySelector("#forward").addEventListener('click', () => {
			this.gotoNext();
		});

		// after each item slides in, slider container fires transitionend event
		document.querySelector("#slider-container").addEventListener('transitionend', () => {
			this.changeOrder();
		});
	},

	changeOrder: function() {
		// change current position
		if(this.current == this.num_items)
			this.current = 1;
		else
			this.current++;

		let order = 1;

		// change order from current position till last
		for(let i=this.current; i<=this.num_items; i++) {
			document.querySelector(".slider-item[data-position='" + i + "']").style.order = order;
			order++;
		}

		// change order from first position till current
		for(let i=1; i<this.current; i++) {
			document.querySelector(".slider-item[data-position='" + i + "']").style.order = order;
			order++;
		}

		// translate back to 0 from -100%
		// we don't need transitionend to fire for this translation, so remove transition CSS
		document.querySelector("#slider-container").classList.remove('slider-container-transition');
		document.querySelector("#slider-container").style.transform = 'translateX(0)';
	},

	gotoNext: function() {
		// translate from 0 to -100%
		// we need transitionend to fire for this translation, so add transition CSS
		document.querySelector("#slider-container").classList.add('slider-container-transition');
		document.querySelector("#slider-container").style.transform = 'translateX(-100%)';
	}
};

FlexSlider.init();




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
    document.getElementById("map").innerHTML = "";
    submitAdresses();
    loadProgress();
}

function onLegDone(iLeg) {
    // write the time it was done into the label
    var lab = document.getElementById("labelLeg" + iLeg);
    options = {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false };
    var d = new Date();
    var fmt = new Intl.DateTimeFormat('en-GB', options);
    lab.innerHTML = fmt.format(d);

    // disable checkbox
    var box = document.getElementById("leg" + iLeg);
    box.disabled = true;

}

var mapLegs = new Array();
function buildMapLinks() {
    // we read the data from the text edit and build links between each pair
    var googleMapDirUrl = "https://www.google.co.uk/maps/dir/%s/%s/data=!4m2!4m1!3e1"

    var addresses = document.getElementById("adresses").value.split(';');

    // loop over addresses an build legs
    var legList = '<div id="slider-container" class="slider-container-transition" style="transition: transform 0.7s ease-in-out;">';
    for (var i = 1; i < addresses.length; ++i) {
        var a = addresses[i - 1].replace(" ", "+");
        var b = addresses[i].replace(" ", "+");
        var leg = "https://www.google.co.uk/maps/dir/" + a + "/" + b + "/data=!4m2!4m1!3e1"
        var legLink = '<a href="' + leg + '" target="_blank">' + "Leg " + i + '</a>'
        var checkBox = '<input type="checkbox" id="leg' + i + '" value = "legDone" onClick = "onLegDone(' + i + ');">';
        var lab = '<label id="labelLeg' + i + '" for="leg' + i + '">Time</label>';
        legList += '<div class="slider-item" style="width: 100%; flex-shrink: 0;">' + legLink + checkBox + lab + '</div>';
    }
    legList += '</div>';
    document.getElementById("map").innerHTML += legList;

    // make controls visible:
    document.getElementById("controls").style.display = "block";

    //var stackedCard = new stackedCards({
	// 	selector: '.legs',
	// 	layout: "slide",
	// 	transformOrigin: "center",
	//});

	//stackedCard.init();
}

