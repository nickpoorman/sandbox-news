var express = require("express");
var passport = require("passport");
var app = module.exports = express();

var authenticate = function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if(err) {
        return next(err);
      }
      if(!user) {
        // the user wasn't found so send back a message template based on the error
        // do a switch here on the error codes...
        switch(info.errorCode) {
        case 1:
          // email / username invalid
          return res.render('auth/login/alert-invalid-email');
        case 2:
          // password invalid
          return res.render('auth/login/alert-invalid-password');
        case 3:
          // account not activated
          return res.render('auth/login/alert-not-activated');
        }
      }
      req.logIn(user, function(err) {
        if(err) {
          return next(err);
        }
        next();
      });
    })(req, res, next);
  };

// ROUTES -----------------------------------------------------------
app.get('/login', function(req, res) {
  if(req.user){
    return res.redirect('/');
  }
  return res.render('auth/login/login');
});

//use a custom middleware here instead of passport.authenticate (this way we can return our own message --and not in the flash)
//http://passportjs.org/guide/authenticate.html
app.post('/login', authenticate, function(req, res) {
  return res.render('index');
});
// app.get("/logout", function(req, res){
//   req.logout();
//   return res.send(200);
// });