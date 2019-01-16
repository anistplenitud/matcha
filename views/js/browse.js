function viewprofile(id, name) {
	//window.redirect();
	console.log(id);
	console.log(name);
        
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
        //	document.getElementById('btn_block').innerHTML = 'User liked';
        	window.location.replace("/getuserprofile?user_id="+id);

        }
    }

    xhttp.open("POST", "/viewprofile", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("id="+id+"&name="+name);

	console.log(id);
}