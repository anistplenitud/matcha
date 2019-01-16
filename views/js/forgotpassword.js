
function resetpassword() {

	var xhttp = new XMLHttpRequest();

	var display = document.getElementById('request_result');
	var email = document.getElementById('email');

	xhttp.onreadystatechange = function() {
   		if (this.readyState == 4 && this.status == 200) {
   			if (this.responseText == 'OK') {
   			   display.innerHTML = 'A link to reset the password was sent to your e-mail';	
   			}
   			else
   			{
   				display.innerHTML = 'e-mail not registered.';	
   			}
   			
   		}
	}

	xhttp.open("POST", "/forgotpassword", true);
   	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
   	xhttp.send("email="+email.value);	
}