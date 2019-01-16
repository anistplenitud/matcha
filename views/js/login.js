
function login() {

	var xhttp = new XMLHttpRequest();

	var display = document.getElementById('login_result');
	var email = document.getElementById('email');
	var rawpassword = document.getElementById('pwd');

	xhttp.onreadystatechange = function() {
   		if (this.readyState == 4 && this.status == 200) {
   			if (this.responseText == 'OK') {
   				window.location = "/home";
   			}
   			else
   			{
   				display.innerHTML = this.responseText;	
   			}
   			
   		}
	}

	xhttp.open("POST", "/login", true);
   	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
   	xhttp.send("email="+email.value+"&raw="+rawpassword.value);	
}