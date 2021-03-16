window.onload=function(){ //The code in this function will only run as soon as the page is loaded.
	
var ShareButton = document.getElementById('sharebutton'); //Gets the button id from the html document,
//I needed this so I could set a name for the'addEventListener' for the button trigger

ShareButton.addEventListener("click", WebShareAPI); //if you're using this with flask, put this code into
//the  onload function to avoid an error



}


function WebShareAPI() { //Button function

	
	var addresses = document.getElementById("adresses").value;
	const url = window.document.location.href;
	
	if (navigator.share) { //A test to see whether the browser supports the web share api or not
		navigator.share({
			title: 'Agile Share',
			text: addresses, 
			url: `${url}`
		})
		document.getElementById("sharebutton").disabled = false; //button is enabled if the browser supports the web share API
		console.log('web share supported'); //Message will show up on the console
	
	} else {
		alert("Browser doesn't support share, you will have to use the following:\nMicrosoft Edge 81\nSafari 12.1\nChrome Android 61\nOpera Android 48\nSafari iOS 12.2\nSamsung Internet Android 8.0\n"); //Gives this message to give a list of browsers that can support web share api, only if it is detected that the browser doesn't support web share
		document.getElementById("sharebutton").disabled = true;
		console.log('web share not supported');
	}
}


