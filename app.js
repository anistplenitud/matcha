var express = require('express');
var router = express.Router();

var config = require('./config/config.js');

var mongo = require('mongodb');
var assert = require('assert');

const https = require('https');
const fs = require('fs');

var bodyParser = require('body-parser');

var cookieParser = require("cookie-parser");

var session = require("express-session");

var path = require('path');

var ejs = require('ejs');

var app = express();

var nodemailer = require('nodemailer');

var randomstring = require('randomstring');

var mailbody = './views/partials/email.ejs';
var passwordmailbody = './views/partials/passwordemail.ejs';

const fileUpload = require('express-fileupload');

var ObjectId = require('mongodb').ObjectID;

const bcrypt = require('bcrypt');
const saltRounds = 10;

var dateTime = require('node-datetime');
var dt = dateTime.create();

var url = 'mongodb://'+config.db.host+':'+config.db.port;
console.log("Database url here");

app.use(fileUpload());


console.log(config);

var dbmatcha;

mongo.MongoClient.connect(url,{ useNewUrlParser: true } , function(err, db){
	if (err) throw err;
	console.log("Database Created");

	dbmatcha = db.db(config.db.name);

	dbmatcha.createCollection("Users", function(err, res){
		if (err) throw err;
		console.log("Users Collection Created");
	});

	dbmatcha.createCollection("Reported", function(err, res){
		if (err) throw err;
		console.log("Reported Collection Created");
	});

});



//serve static 
//app.use(express.static('public'));
app.use(express.static('views'));
app.use(express.static('js'));
//app.use('/static', express.static('views'))

//view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(cookieParser());

app.set('trust proxy', 1);

app.use(session({
	secret : 'secretkey',
	saveUninitialized : false,
	resave : false,
	cookie : {secure:true}
}));
// Set Static Path 
//app.use(express.static(path.join(__dirname, 'public')));

//Global Vars
app.use(function(req, res, next){
		res.locals.errors = null;
		next();

});

var transporter = nodemailer.createTransport({
  		service: config.mailtransporter.service,
  		auth: {
    		user: config.mailtransporter.user,
    		pass: config.mailtransporter.pass
  		}
});

app.get('/', function(req, res) {
	res.render('index', {
		title : 'foster',
		myconfig : config,
		details : null
	});
});

app.get('/forgotpassword', function(req, res) {

	res.render('forgotpassword', {
		title : 'foster',
	});	
	
});


app.get('/getuserprofile', function(req, res) {

	if (!req.session.email) {
		res.redirect('/');
		res.end();	
	}
	else {
		if (!req.query.user_id) {
			res.redirect('/browse');
			res.end();
		}
		else {
			console.log(req.query.user_id)

			dbmatcha.collection("Users").findOne({ _id: ObjectId(req.query.user_id)}, function(err, result) {
		    if (err) {
		    	throw err;	
		    } 
		    else if (result) {
		
				console.log('User found');

			}
			else {

				console.log('User Not found');
			}

		//	console.log(result);

			res.render('view_user_profile', {
					title : 'foster',
					details : req.session,
					user : result
			});


		});


			
		}
		
	}	
	
});

app.post('/forgotpassword', function(req, res){
	var abc = randomstring.generate();

	if (req.body.email) {
		dbmatcha.collection("Users").findOne({'email':req.body.email}, function(err, result) {
		    if (err) {
		    	throw err;	
		    } 
		    else if (result) {
		    		//send email
			console.log('User found');
			///////////////////////

			bcrypt.hash(abc, saltRounds, function(err, hash) {
				
				dbmatcha.collection("Users").updateOne(
				{'email':req.body.email},
				{$set:
					{'password': hash }
				},
				function(erro, resu) {
    				if (erro) throw erro;
    					console.log("password token for : "+req.body.email);
    					
  			});

		});

			////////////////////////


        reset_data = {
            'email' : req.body.email,
            'token' : abc
        };

        ejs.renderFile(

            passwordmailbody,
            reset_data ,
            (err, html) => {

                if (err) console.log(err);
                else {
                    let mailOptions = {
                        from: 'foster',
                        to: req.body.email,
                        subject: 'foster password reset',
                        html: html
                        }
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                        console.log(error);
                        } else {
                        console.log('Email sent: ' + info.response);
                        }
                    }); 

                console.log(reset_data.token);

                }
            });
		    		/////////////
		    	
		    }
		    else {
				res.send('KO : email is not registered');
				res.end();	    	
			   
		  		} 
  		});
	}
	else
	{
		res.send('KO : required field empty');
		res.end();
	}
});

app.get('/profile', function(req, res) {

	if (req.session.email) {
		res.render('profile', {
		title : 'foster',
		errors : null,
		details : req.session
		});	
	}
	else
	{
		res.redirect('/');
	}

	
});

app.post('/savep_pic', function(req, res) {
	var formatted = dt.format('YmdHMS');
	var abc = randomstring.generate();


	console.log(req.files.p_pic);

	if (Object.keys(req.files).length == 0) {
    	return res.send('No files were uploaded.');
  	}

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.p_pic;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('views/images/'+abc+formatted+'.png', function(err) {

    if (err) 
    	return res.send(err);
    dbmatcha.collection("Users").updateOne(
	{'email':req.session.email},
			{$set:
				{'profile.p_pic': '/images/'+abc+formatted+'.png' 
			}},
			function(erro, resu) {
    				if (erro) throw erro;
    					console.log("profile pic updated for "+req.session.email);
    					
  			});

    req.session.profile.p_pic = '/images/'+abc+formatted+'.png';

    res.render('profile', {
		title : 'foster',
		details : req.session
	});

  });
	
});


app.post('/savedisplaypic', function(req, res) {
	var formatted = dt.format('YmdHMS');
	var abc = randomstring.generate();

	console.log(req.files.pic1);

	if (Object.keys(req.files).length == 0) {
    	return res.send('No files were uploaded.');
  	}

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.pic1;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('views/images/'+abc+formatted+'.png', function(err) {

    if (err) 
    	return res.send(err);
    dbmatcha.collection("Users").updateOne(
	{'email':req.session.email},
			{$set:
				{'profile.photos.0': '/images/'+abc+formatted+'.png' 
			}},
			function(erro, resu) {
    				if (erro) throw erro;
    					console.log("1 photo saved for "+req.session.email);
  			});

	req.session.profile.photos[0] = '/images/'+abc+formatted+'.png';


    res.render('profile', {
		title : 'foster',
		details : req.session
	});

  });
	
});

app.post('/coords', function(req, res) {

	console.log(req.body.lat + req.body.lon +req.body.suburb+'<--');
	console.log(req.session.email);

	if (!req.body.lat || !req.body.lon || !req.body.suburb || !req.body.city
		|| !req.body.county || !req.body.postcode || !req.body.state || !req.body.county) {
		res.send('cmon, we need lat and lon coords');
	}
	else
	{
		console.log(req.body.suburb);
		dbmatcha.collection("Users").updateOne(
			{'email':req.session.email},
			{$set:
				{
					'gps_lat': req.body.lat,
					'gps_lon': req.body.lon,
					'location': {
						'suburb' : req.body.suburb,
      					'city' : req.body.city,
      					'county' : req.body.county,
      					'postcode' : req.body.postcode,
      					'state' : req.body.state,
      					'country': req.body.country
					}
				}
			},
			function(erro, resu) {
    				if (erro) throw erro;
    					console.log("gps geoloacation updated for "+req.session.email);
  			}
  		);


		req.session.gps_lat = req.body.lat;
		req.session.gps_lon = req.body.lon;
		req.session.location.state = req.body.state;
		req.session.location.country = req.body.country;
		req.session.location.postcode = req.body.postcode;
		req.session.location.city = req.body.city;
		req.session.location.suburb = req.body.suburb;
		req.session.location.county = req.body.county;


    	res.render('profile', {
			title : 'foster',
			details : req.session
		});
	}
	
});

app.post('/savedisplaypic1', function(req, res) {
	var formatted = dt.format('YmdHMS');
	var abc = randomstring.generate();

	console.log(req.files.pic2);

	if (Object.keys(req.files).length == 0) {
    	return res.send('No files were uploaded.');
  	}

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.pic2;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('views/images/'+abc+formatted+'.png', function(err) {

    if (err) 
    	return res.send(err);
    dbmatcha.collection("Users").updateOne(
	{'email':req.session.email},
			{$set:
				{'profile.photos.1': '/images/'+abc+formatted+'.png' 
			}},
			function(erro, resu) {
    				if (erro) throw erro;
    					console.log("2nd photo updated "+req.session.email);
    	
    				//		db.close();
  			});
	req.session.profile.photos[1] = '/images/'+abc+formatted+'.png'


    res.render('profile', {
		title : 'foster',
		details : req.session
	});

  });
	
});

app.post('/ipapi', function(req, res) {

	dbmatcha.collection("Users").updateOne(
			{'email':req.session.email},
			{$set:{'ipapi': {

				'postal' : req.body.postal,
      			'city' : req.body.city,
      			'country' : req.body.country,
      			'region' : req.body.region,
			}
		}},
		function(erro, resu) {
    			if (erro) throw erro;
    				console.log("ip geoloacation updated for "+req.session.email);
  			});
  	req.session.ipapi.postal = req.body.postal; 
  	req.session.ipapi.city = req.body.city;
  	req.session.ipapi.country = req.body.country;
  	req.session.ipapi.region =	req.body.region;

});

app.post('/report', function(req, res){
	console.log(req.body.id);


	dbmatcha.collection("Reported").insertOne(
		{
			'reported_id' : req.body.id,
			'reported_by' : req.session.email

		},
		function(err, result) {
	    if (err) throw err;
	    console.log(req.body.id + " Profile Reported");
	
  	});


	res.send('reported');
	res.end();

});



app.post('/like', function(req, res){
	console.log(req.body.id);

	dbmatcha.collection("Users").updateOne(
			{'email':req.session.email},
			{$push:{'liked': req.body.id}},
		function(erro, resu) {
    		if (erro) throw erro;
    			console.log("user id "+ req.body.id+" liked by "+req.session.email);
  	});

  	dbmatcha.collection("Users").updateOne(
  		{ _id: ObjectId(req.body.id)},
  		{$push:{'likers' : req.body.id}},
  		function(erro, resu) {
  			if (erro) throw erro;
  				console.log("likers appended for "+ req.body.id+" liked by "+req.session.email);	 
  		});

	dbmatcha.collection("Users").updateOne(
		{ _id: ObjectId(req.body.id)},
		{$inc:{'famerating': 1}},
		function(erro, resu) {
    		if (erro) throw erro;
    			console.log("famerating updated");
    
  		});

	req.session.liked.push(req.body.id);

	res.send('liked');
	res.end();

});

app.post('/unlike', function(req, res){
	console.log(req.body.id);

	dbmatcha.collection("Users").updateOne(
			{'email':req.session.email},
			{$pull:{'liked': req.body.id}},
		function(erro, resu) {
    		if (erro) throw erro;
    		console.log("user id "+ req.body.id+" pulled by "+req.session.email);
    		console.log('what is this ' + resu);
  	});

  	dbmatcha.collection("Users").updateOne(
  		{ _id: ObjectId(req.body.id)},
  		{$pull:{'likers' : req.body.id}},
  		function(erro, resu) {
  			if (erro) throw erro;
  				console.log("likers updated for "+ req.body.id+" pulled by "+req.session.email);	 
  		});

	dbmatcha.collection("Users").updateOne(
		{ _id: ObjectId(req.body.id)},
		{$inc:{'famerating': -2}},
		function(erro, resu) {
    		if (erro) throw erro;
    			console.log("famerating updated");
    
  		});


	res.send('unliked');
	res.end();

});



app.post('/viewprofile', function(req, res){
	console.log(req.body.id);
	console.log(req.body.name);

	dbmatcha.collection("Users").updateOne(
			{'email':req.session.email},
			{$push:{'history': req.body.name+'|'+req.body.id}},
		function(erro, resu) {
    		if (erro) throw erro;
    			console.log("view of "+ req.body.id+" recorded for "+req.session.email);
  	});

  	dbmatcha.collection("Users").updateOne(
		{ _id: ObjectId(req.body.id)},
		{$inc:{'famerating': 1}},
		function(erro, resu) {
    		if (erro) throw erro;
    			console.log("famerating updated");
    
  		});

	res.send('view recorded');
	res.end();

});

app.post('/block', function(req, res){
	console.log(req.body.id);

	dbmatcha.collection("Users").updateOne(
			{'email':req.session.email},
			{$push:{'blocked': req.body.id}},
		function(erro, resu) {
    		if (erro) throw erro;
    			console.log("user id "+ req.body.id+" blocked for "+req.session.email);
  	});

	res.send('blocked');
	res.end();

});

app.post('/profile', function(req, res) {


	var errors = [];
	var prefs = [];
	var interests = [''];

	if (!req.body.gender) {
		errors.push({'elem' : 'gender_e'});
	}
	else if (!req.body.age) {
		errors.push({'elem' : 'age_e'});
	}
	else if (req.body.sm == 'false' && 
		req.body.sf == 'false' &&
		req.body.ogm == 'false' &&
		req.body.ogf == 'false' &&
		req.body.nsm == 'false' &&
		req.body.nsf == 'false') {

		errors.push({'elem' : 'pref_e'});

	} else if (!req.body.bio) {
		errors.push({'elem' : 'bio_e'});
	}
	else if (!req.body.interests || !checkinterests(req.body.interests)) {
		errors.push({'elem' : 'interests_e'});
	}
	else {
		errors = null;
	}

	if (errors) {
		res.send(errors[0].elem);
	}
	else {

		if (req.body.sm == 'true') {
			prefs.push('sm');
		}
		if (req.body.sf == 'true') {
			prefs.push('sf');
		}
		if (req.body.ogm == 'true') {
			prefs.push('ogm');
		}	
		if (req.body.ogf == 'true') {
			prefs.push('ogf');
		}
		if (req.body.nsm == 'true') {
			prefs.push('nsm');
		}	
		if (req.body.nsf == 'true') {
			prefs.push('nsf');
		}	

		var list = req.body.interests.split('#');

		list.forEach(function(word){
			if (word.length > 1)
				interests.push(word.trim());
		});

	
		dbmatcha.collection("Users").updateOne(
			{'email':req.session.email},
			{$set:{'profile.gender' : req.body.gender,
				  	'profile.age' : Number(req.body.age),
					'profile.preferences' : prefs,
					'profile.bio' : req.body.bio,
					'profile.interests' : interests,
				}
				
			},
			function(erro, resu) {
    				if (erro) throw erro;
    					console.log("profile updated for "+req.session.email);
  			});	

		req.session.profile.interests = interests;
		req.session.profile.age = req.body.age;
		req.session.profile.bio = req.body.bio;
		req.session.profile.preferences = prefs;
		req.session.profile.gender = req.body.gender;

		res.send("OK");
	}
});

function checkinterests(text) {

	var list = text.split('#');

	if (list.length < 0) {
		return null;
	}

	return true;

}


app.get('/home', function(req, res) {
	var formatted = dt.format('Y-m-d H:M:S');

	if (req.session.email && req.session.verified == 'true') {
		req.session.famerating = req.session.famerating + 1;
		dbmatcha.collection("Users").updateOne(
					{'email':req.session.email},
					{$set:{'famerating': req.session.famerating}},
						function(erro, resu) {
    						if (erro) throw erro;
    						console.log("famerating updated"+req.session.email);
    
  					});

  		dbmatcha.collection("Users").updateOne(
					{'email':req.session.email},
					{$push:{'history': 'logged in at'+ formatted}},
						function(erro, resu) {
    						if (erro) throw erro;
    						console.log("history updated"+req.session.email);
    
  					});

  		//req.session.history.push({'history': 'logged in at'+ formatted});

	  	res.render('home', {
			title : 'Succesful login!',
			myconfig : config,
			details : req.session
		});
	}
	else
	{
		details = null;
		res.redirect('/');
		res.end();
	}

});


app.get('/browse', function(req, res) {

	if (!req.session.email) {
		res.redirect('/');
		res.end();	
	}
	else
	{
		dbmatcha.collection("Users").find({'email':{$ne : req.session.email}}).toArray(
			function(err, result) {

				res.render('browse', {

					title : 'foster',
					myconfig : config,
					details : req.session,
					users : result
				});
	    });
	}
	
});

app.post('/filter', function(req, res) {


	if (!req.session.email) {
		res.redirect('/');
		res.end();	
	}
	else {

		var interests = [];
		var minAge = 18;
		var maxAge = 25;

		if (req.body.age == '18 - 25') {

			 minAge = 18;
			 maxAge = 25;
		}
		else if (req.body.age == '25 - 35') {
			 minAge = 25;
			 maxAge = 35;	
		}
		else{
			 minAge = 35;
			 maxAge = 100;
		}

		console.log('min :' + minAge + '|' + 'max' + maxAge+'<br>');

	console.log('Age :'+req.body.age);
	console.log('location :'+req.body.location);
	console.log('famerating :'+req.body.famerating);
	console.log('interests :'+req.body.interests);

	var list = req.body.interests.split('#');

	list.forEach(function(word){
			if (word.length > 1)
				interests.push(word.trim());
	});

	console.log(interests);
	if (interests.length == 0) {
		interests.push('');
	}

/*	{
    $and : [
    	{'email':{$ne : req.session.email}},
        {'famerating':{$gte : req.body.famerating}},
        {'profile.interests': {$all : interests}}
    ]
	}
*/

	dbmatcha.collection("Users").find(
			{
	    		$and :
	    		[
	    			{'email':{$ne : req.session.email}},
	        		{'famerating': {$gte : Number(req.body.famerating)}},
	        		{'profile.interests': {$all : interests }},
	        		{'profile.age': {$gte: minAge }},
	        		{'profile.age': {$lte: maxAge }},
	        		{
	        			$or :
	        			[
	        				{'ipapi.city' : req.body.location},
	        				{'ipapi.country' : req.body.location},
	        				{'ipapi.region' : req.body.location}
	        			]
	        		}
	    		]
			}
		).toArray(
			function(err, result) {

				res.render('browse', {

					title : 'foster',
					myconfig : config,
					details : req.session,
					users : result
				});
	    	});
	}
	
});


app.get('/confirm', function(req, res) {

	console.log(req.query.token);
	console.log(req.query.email);
	
	dbmatcha.collection("Users").findOne(
		{'email':req.query.email},
		function(err, result) {
			if (err) { throw err} 
			else if (result){
				console.log("**"+result.token);
				console.log(req.query.token+"**");
				if (result.token == req.query.token) {

					dbmatcha.collection("Users").updateOne(
						{'email':req.query.email},
						{$set:{'verified':'true'}},
						function(erro, resu) {
    						if (erro) throw erro;
    						console.log("account confirmed :"+req.query.email);
    				//		db.close();
  					});

  				res.render('index', {
					title : 'Account Verified!',
					myconfig : config,
					details : {'email' : req.query.email}
				});	

				}
				else {
					console.log('not verified');
					//res.end();
				}
			}
			else
			{
				console.log('Empty Result, email does not exist');
			}

    	});

});

app.get('/logout', function(req, res) {
	req.session.destroy();
	console.log('out');
	res.redirect('/');
}); 

app.post('/login', function(req, res) {

	dbmatcha.collection("Users").findOne({'email':req.body.email}, function(err, result) {
    if (err) {
    	throw err;	
    } 
    else if (result ) {

    	bcrypt.compare(req.body.raw, result.password, function(erro, resu) {
    		if (erro) {
    			throw erro;
    		}
    		else if (resu)
    		{
    			if (result.verified =='false') {
    				console.log("email not verified");
    					res.render('partials/verificationerror.ejs', {
							title : 'Unsuccesful login!',
							myconfig : config,
							details : {'email' : result.email}
						});
    			}
    			else
    			{
	    			req.session.email = result.email;
	    			req.session.password = result.password;
	    			req.session.first_name = result.first_name;
	    			req.session.last_name = result.last_name;
	    			req.session.verified = result.verified;
	    			req.session.profile = result.profile;
	    			req.session.gps_lat = result.gps_lat;
	    			req.session.gps_lon = result.gps_lon;
	    			req.session.location = result.location;
	    			req.session.ipapi = result.ipapi;
	    			req.session.history = result.history;
	    			req.session.liked = result.liked;
	    			req.session.likers = result.likers;
	    			req.session.blocked = result.blocked;

	    			if (!result.famerating)
	    				req.session.famerating = 1;
	    			else
	    				req.session.famerating = result.famerating;

	    			console.log(req.session.liked);

    				res.send('OK');
    			}
    		}
    		else {
    			console.log("Wrong Password");
    			res.render('partials/loginerror.ejs', {
				title : 'Unsuccesful login!',
				myconfig : config
				});
    		}
    	});
    }
    else {
	    	console.log('empty result	');
	    	res.render('partials/loginerror.ejs', {
			title : 'Unsuccesful login!',
			myconfig : config
			});
  		} 
  	});

});


app.post('user');

app.post('/modifyaccount', function(req, res){

	console.log('name :'+req.body.first_name);
	console.log('last name :'+req.body.last_name);
	console.log('email :'+req.body.email);

	console.log('pass_c :'+req.body.password_c);
	console.log('pass :'+req.body.password);


	console.log('pass_v :'+req.body.password_v);
	
	var errors = [];

	if (!req.body.first_name) {
		errors.push({'msg':'First name is Required'});
	}
	else if (!req.body.last_name) {
		errors.push({'msg':'Last name is Required'});
	}
	else if (!req.body.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/))
	{
		errors.push({'msg':'Valid email Required'});
	}

	else if (!req.body.password.match(/^.*(?=.{8,16})(?=.*\d)(?=.*[A-Z]).*$/)) {

		errors.push({'msg':'password needs to be 8 characters long, contain atleast one Capital letter and one number'});
	}
	else if (req.body.password != req.body.password_c) {

		errors.push({'msg':'passwords must match'});
	}
	else
		errors = null;

	if (errors) {
		console.log('Errors');
		res.render('profile', {
			title : 'foster',
			errors : errors,
			details : req.session
		});
	}
	else
	{
		dbmatcha.collection("Users").findOne({'email':req.body.email}, function(err, result) {

		    if (err) {
		    	throw err;	
		    } 
		    else if (result && req.session.email != result.email) {
		    
			    var email_error = [];
				email_error.push({'msg':'E-mail is already registered.'});	

				console.log('user exits');
			
				res.render('profile', {
					title : 'foster',
					errors : email_error,
					details : req.session
				});
				res.end();
			}
			else {

				console.log(req.session.email);
				console.log(req.body.password_v);
				console.log(req.session.password);
				
				bcrypt.compare(req.body.password_v, req.session.password, function(erro, match_resu) {
		    		if (erro) {
		    			throw erro;
		    		}
		    		else if (match_resu) {
		    			
						bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
						
							dbmatcha.collection("Users").updateOne(
							{'email':req.session.email},
							{$set:
								{	'first_name' : req.body.first_name,
									'last_name' : req.body.last_name,
									'email' : req.body.email,
									'password': hash},
							},
							function(erro, resu) {
		    					if (erro) throw erro;
		    					console.log("profile modified for : "+req.session.email);
		    					req.session.email = req.body.email;
		    					req.session.first_name = req.body.first_name;
		    					req.session.last_name = req.body.last_name;
		    					req.session.password = req.body.hash;
		    					
		  					});

						}); 

						res.render('profile', {
								title : 'foster',
								errors : [{'msg' : 'Account modified!'}],
								details : req.session
							});
						res.end();

		    		}
		    		else {
		    			res.render('profile', {
							title : 'foster',
							errors : [{'msg' : 'Wrong Password!'}],
							details : req.session
						});
						res.end();

		    		}
		    	});

			}

		});

	}
});

app.post('/users/add', function(req, res_main){

	var abc = randomstring.generate();

	var errors = [];

	if (!req.body.first_name) {
		errors.push({'msg':'First name is Required'});
	}
	else if (!req.body.last_name) {
		errors.push({'msg':'Last name is Required'});
	}
	else if (!req.body.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/))
	{
		errors.push({'msg':'Valid email Required'});
	}

	else if (!req.body.password.match(/^.*(?=.{8,16})(?=.*\d)(?=.*[A-Z]).*$/)) {

		errors.push({'msg':'password needs to be 8 characters long, contain atleast one Capital letter and one number'});
	}
	else if (req.body.password != req.body.password_v) {

		errors.push({'msg':'passwords must match'});
	}
	else
		errors = null;

	if (errors) {
		console.log('Errors');
		res_main.render('index', {
			title : 'foster',
			errors : errors,
			myconfig : config,
			details : null
		});
	}
	else
	{
		dbmatcha.collection("Users").findOne({'email':req.body.email}, function(err, result) {

		    if (err) {
		    	throw err;	
		    } 
		    else if (result) {
		    
		    var email_error = [];
			email_error.push({'msg':'E-mail is already registered.'});	

			console.log('user exits');
		
			res_main.render('index', {
				title : 'foster',
				errors : email_error,
				myconfig : config,
				details : null
					});
			res_main.end();
			}
			else {
				/////////////////////
				console.log('plan');
				bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
				
					dbmatcha.collection("Users").insertOne(
					{
						'first_name' : req.body.first_name,
						'last_name' : req.body.last_name,
						'email' : req.body.email,
						'password':hash,
						'token': abc,
						'verified' : 'false',
						'profile' : 
							{
							'gender' : null,
							'age' : null,
							'preferences' : null,
							'bio' : null,
							'interests' : null,
							'photos' : [null,null],
							'p_pic' : null
							},
						'gps_lat': null,
						'gps_lon': null,
						'location': {
							'suburb' : null,
	      					'city' : null,
	      					'county' : null,
	      					'postcode' : null,
	      					'state' : null,
	      					'country': null
							},
						'ipapi': {

							'postal' : null,
	      					'city' : null,
	      					'country' : null,
	      					'region' : null,
							}
	 
					},

					function(err, res){
						if (err) throw err;
					
						console.log("user add");
						data = {
								'first_name' : req.body.first_name,
								'email' : req.body.email,
								'token' : abc
							};

						ejs.renderFile(

								mailbody,
								data ,
								(err, html) => {

									if (err) console.log(err);
									else {
										let mailOptions = {
					 						from: 'foster',
					  						to: req.body.email,
					  						subject: 'foster account confirmation',
					  						html: html
											}
										transporter.sendMail(mailOptions, function(error, info){
					  						if (error) {
					    					console.log(error);
					  						} else {
					    					console.log('Email sent: ' + info.response);
					  						}
										});	

									console.log(data.token);

									}
						});

								console.log('No Errors');
									res_main.render('index', {
										title : 'foster',
										errors : [{'msg' : 'You have been registered please check your email'}],
										myconfig : config,
										details : null
								});

					});


				});
				/////////////////////
			}
		});

		
	}
});

app.use("*",function(req,res){
  res.sendFile(__dirname + "/views/html/404.html");
});

/* if I decide to use https 
__________________________________ */
const httpsOptions = {
	key : fs.readFileSync('./key.pem'),
	cert : fs.readFileSync('./cert.pem')
}

const server = https.createServer(httpsOptions, app).listen(3000, ()=> {
	console.log('https server running');
});









