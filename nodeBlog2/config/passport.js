const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose"),
	  User = mongoose.model("User");

module.exports.init = function (){
	console.log("passport.local.init");
	passport.use(new LocalStrategy({
		usernameField:"userName",
		passwordField:"password"
	},function(username, password, done) {
	    User.findOne({ userName: username }, function (err, user) {
	      console.log("passport.local.findOne:",err,user);
	      if (err) { return done(err); }
	      if (!user) { return done(null, false); }
	      if (!user.verifyPassword(password)) { return done(null, false); }
	      return done(null, user);
	    });
	  }
	));
	
	passport.serializeUser(function(user, done) {
	  console.log("passport.local.serializeUser",user);
	  done(null, user._id);
	});
	 
	passport.deserializeUser(function(id, done) {
	   console.log("passport.local.deserializeUser",id);
	  User.findById(id, function (err, user) {
	    done(err, user);
	  });
	});

}