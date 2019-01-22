
function validateForm() {
 
  function validatePass(pass) {
    var re = /^.*(?=.{8,16})(?=.*\d)(?=.*[A-Z]).*$/;
    return re.test(String(pass));
    }
  
  var x = document.getElementById('password').value;
  var c_x = document.getElementById('password_v').value;

  if ((!validatePass(x)) || (x != c_x))
  {
    alert("Password must contain : \natleast 1 number,\n1 CAPITAL LETTER, \n and must 8-16 chars long.");
    return false;
  }

}

var x = document.getElementById("demo");

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);

  } else { 
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
   var xhttp = new XMLHttpRequest();

   var settings = {
    "async": true,
    "crossDomain": true,
    "url": "https://us1.locationiq.com/v1/reverse.php?key=dfe0682ca973a1&lat="+
    position.coords.latitude+"&lon="+position.coords.longitude+"&format=json",
    "method": "GET"
   }

   $.ajax(settings).done(function (response) {
      var region = response.address.city;
      if (!region)
        region = response.address.town;

         x.innerHTML = "Thank you! You are near :<br>"+ JSON.stringify(response.address)
         +"<br>We have recorded that. ";

         xhttp.open("POST", "/coords", true);
  //       console.log(response.address);
         xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
         xhttp.send("lat="+position.coords.latitude 
      +"&lon="+position.coords.longitude
      +"&road="+response.address.road 
      +"&suburb="+response.address.suburb 
      +"&city="+region
      +"&county="+response.address.county
      +"&postcode="+response.address.postcode
      +"&state="+response.address.state
      +"&country="+response.address.country);

   });

}

function save_pic() {
   
   console.log(event.target.parentNode.elements[0].files[0]);

   var xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function() {
         if (this.readyState == 4 && this.status == 200) {
            
             alert(this.responseText);
             console.log('here' + this.responseText);
         }
   }

   xhttp.open("POST", "/savep_pic", true);
      xhttp.setRequestHeader("Content-type", "multipart/form-data");
      xhttp.send("p_pic="+event.target.parentNode.elements[0].files[0]);
}

function saveprofile() {

	var xhttp = new XMLHttpRequest();

	var gender = document.getElementById('gender');
	var sm = document.getElementById('sm');
	var sf = document.getElementById('sf');
	var ogm = document.getElementById('ogm');
	var ogf = document.getElementById('ogf');
	var nsm = document.getElementById('nsm');
	var nsf = document.getElementById('nsf');
	var bio = document.getElementById('bio');
   var age = document.getElementById('age');
	var interests = document.getElementById('interests');

	xhttp.onreadystatechange = function() {
   		if (this.readyState == 4 && this.status == 200) {
            if (this.responseText != 'OK') {
               document.getElementById(this.responseText).style.display = 'block';
               window.scrollTo(0, document.getElementById(this.responseText).offsetTop);
            }
            else
            {
               document.getElementById('profileform').innerHTML = '<div class="alert alert-success"><strong>Profile Info Updated!</strong></div>';
               window.scrollTo(0, document.getElementById('profileform').offsetTop);
            }
   			
   		}
	}

	xhttp.open("POST", "/profile", true);
   	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
   	xhttp.send("gender="+gender.value
         +"&age="+age.value
   		+"&sm="+sm.checked
   		+"&sf="+sf.checked
   		+"&ogm="+ogm.checked
   		+"&ogf="+ogf.checked
   		+"&nsm="+nsm.checked
   		+"&nsf="+nsf.checked
   		+"&bio="+bio.value
   		+"&interests="+interests.value);
} 