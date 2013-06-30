/*
 * auth.js
 */

var debug = process.env.DEBUG || true;
var path = require("path");
var express = require("express");

var email = require('./email');

var User = require('../models/user');

var app = module.exports = express();
var viewPath = path.resolve(__dirname, '..', 'views');
app.set("views", viewPath);
app.set('view engine', 'jade');
app.set('view options', {
  doctype: 'html'
});

app.get('/signup', function(req, res) {
  return res.render('auth/register');
});

app.post("/signup", function(req, res) {
  var params = ['name', 'company', 'email', 'password'];
  res.locals.params = {};
  for (var i = 0; i < params.length; i++) {
    res.locals.params[params[i]] = req.body[params[i]];
  }

  // going to do the validations here
  req.assert('name', 'Name cannot be empty.').notEmpty();
  req.assert('email', 'Email is invalid.').isEmail();
  req.assert('password', 'Password must be between 6 and 20 characters.').len(6, 20);

  var mappedErrors = req.validationErrors();
  if (mappedErrors) {
    // don't attempt to save, return the errors
    return res.render('auth/register', {
      errors: mappedErrors
    });
  }
  req.sanitize('name').trim();
  req.sanitize('lastName').trim();
  req.sanitize('email').trim();

  var newUser = new User({
    email: req.param("email"),
    name: req.param("name"),
    company: req.param("company")
  }).setPassword(req.param("password"), function(newUser) {
    //the newUser in this context actually comes from the model passing in itself on the done callback.
    newUser.createConfirmationToken(function(newUser) {
      newUser.save(function(err) {
        if (err) {
          if (err.code === 11000) {
            var isEmail = err.err.match(/email/);
            var errors = [];
            if (isEmail) {
              errors.push({
                param: 'email',
                msg: 'User already exists with that email.',
                value: newUser.email
              });
            }
            if (errors.length == 0) {
              console.log("[NEED-VALIDATION.signup.duplicate] " + err);
            }
            return res.render('auth/register', {
              errors: errors
            });
          }
          console.log("[NEED-VALIDATION.signup] " + err);
          return res.render('auth/register', {          
            errors: [{
                param: 'email',
                msg: 'validation error: ' + err,
                value: err
              }
            ]
          });
        }
        // save was successful
        // now only return back what we want to
        if (debug) {
          console.log('[SEND_EMAIL]:[VERIFICATION]:http://localhost/verify-account/' + newUser.confirmationToken);
        } else {
          email.sendVerificationEmail(newUser);
        }
        return res.render('auth/confirm-email', newUser.toJSON());
      });
    });
  });
});

app.get("/auth/resend-activation-email", function(req, res) {
  return res.render('auth/activate/resend-activation-email');
});

/*
  - This resource will take an email and send out the activation email.
  - This usually gets called from a form doing a post on the website.
*/
app.post("/auth/resend-activation-email", function(req, res) {
  var params = ['email'];
  res.locals.params = {};
  for (var i = 0; i < params.length; i++) {
    res.locals.params[params[i]] = req.body[params[i]];
  }

  // going to do the validations here
  req.assert('email', 'Valid email required').isEmail();
  var mappedErrors = req.validationErrors();
  if (mappedErrors) {
    // don't attempt to save, return the errors
    return res.render('auth/activate/resend-activation-email', {
      errors: mappedErrors
    });
  }
  req.sanitize('email').trim();

  // we have to lookup the user in the database first
  User.findOne({
    email: req.param("email")
  }, function(err, user) {
    if (err) {
      //db error, maybe a validation issue
      console.log("[DBERROR]: database error");
      return res.render('auth/activate/alert-invalid-email');
    }
    if (!user) {
      // send them back to the page with a flash message
      return res.render('auth/activate/alert-invalid-email');
    }
    if (user.activated) {
      // send them to the login and tell them their account is already activated
      return res.render('auth/activate/alert-already-activated');
    }
    if (debug) {
      console.log('[SEND_EMAIL]:[VERIFICATION]:http://localhost/verify-account/' + user.confirmationToken);
    } else {
      email.sendVerificationEmail(user);
    }
    return res.render('auth/activate/alert-email-sent');
  });
});

/*
  - This resource takes a token to enable the account after it is created.
  - This usually gets called from an email with a verify account url.
*/
app.get("/verify-account/:token", verifyAccount);

/*
  - This provides the form to reset your password.
*/
app.get("/forgot-password", function(req, res) {
  return res.render("auth/forgot_password/forgot-password");
});

/*
  - This resource takes an email address and creates a reset password token which is then emailed to the user.
  - This usually gets called from a form doing a post on the website.
*/
app.post("/forgot-password", forgotPassword);

/* 
  - This resource takes a token and an email and returns a form change to a password.
  - This usually gets called from an email with a reset password url.
*/
app.get("/reset-password", getResetPassword);

/*
  - This resource takes a token, email, and a password and sets the new password on the account to the provided password.
  - This usually gets called from a reset password form doing a post from the website.
*/
app.post("/reset-password", postResetPassword);


// helpers -----------------------------

function postResetPassword(req, res, next) {
  var params = ['token', 'email', 'password'];
  res.locals.params = {};
  for (var i = 0; i < params.length; i++) {
    res.locals.params[params[i]] = req.body[params[i]];
  }

  // going to do the validations here
  req.assert('token', 'Valid reset token required').notEmpty();
  req.assert('email', 'Valid email required').isEmail();
  req.assert('password', 'Password must be between 6 and 20 characters.').len(6, 20);
  var mappedErrors = req.validationErrors();
  if (mappedErrors) {
    // don't attempt to save, return the errors
    return res.render('auth/reset_password/reset-password', {
      errors: mappedErrors,
      email: req.param('email'),
      token: req.param('token')
    });
  }
  req.sanitize('token').trim();
  req.sanitize('email').trim();
  req.sanitize('password').trim();

  User.findOne({
    email: req.param('email'),
    passwordResetToken: req.param('token')
  }, function(err, user) {
    if (err) {
      //db error, maybe a validation issue
      console.log("[DBERROR]: database error");
      return res.render('auth/reset_password/reset-password');
    }
    if (!user) {
      // send them back to the page with a flash message
      return res.render('auth/reset_password/reset-password');
    }
    // check to make sure the token hasn't expired
    var elapsed = Date.now() - user.passwordResetTokenCreatedAt.getTime();
    // 86400000 ms in a day
    // 864000000 ms in 10 days
    if (elapsed > 864000000) {
      // send them to the forgot-password page with an alert
      return res.render('auth/reset_password/alert-url-expired');
    }
    user.setPassword(req.param("password"), function(user) {
      user.passwordResetToken = undefined;
      // should save the user with the new password
      user.save(function(err) {
        if (err) {
          console.log("[NEED-VALIDATION.postResetPassword] " + err);
          // send them to the reset-password page with an alert
          return res.render('auth/reset_password/alert-database-error');
        }

        return res.render('auth/reset_password/alert-password-reset');
      });
    });
  });
}

function getResetPassword(req, res, next) {
  var params = ['token', 'email'];
  res.locals.params = {};
  for (var i = 0; i < params.length; i++) {
    res.locals.params[params[i]] = req.body[params[i]];
  }

  // going to do the validations here
  req.assert('token', 'Valid reset token required').notEmpty();
  req.assert('email', 'Valid email required').isEmail();
  var mappedErrors = req.validationErrors();
  if (mappedErrors) {
    // don't attempt to save, return the errors
    return res.render('auth/reset_password/url-not-found', {
      errors: mappedErrors
    });
  }
  req.sanitize('token').trim();
  req.sanitize('email').trim();

  User.findOne({
    email: req.param('email'),
    passwordResetToken: req.param('token')
  }, function(err, user) {
    if (err) {
      //db error, maybe a validation issue
      console.log("[DBERROR]: database error");
      return res.render('auth/reset_password/url-not-found');
    }
    if (!user) {
      // send them back to the page with a flash message
      return res.render('auth/reset_password/url-not-found');
    }
    // check to make sure the token hasn't expired
    var elapsed = Date.now() - user.passwordResetTokenCreatedAt.getTime();
    // 86400000 ms in a day
    // 864000000 ms in 10 days
    if (elapsed > 864000000) {
      // send them to the forgot-password page with an alert
      return res.render('auth/reset_password/alert-url-expired');
    }
    // should return the user's passwordResetToken & email
    // that the frontend will then use to provide a form to change the password
    var data = {
      email: user.email,
      token: req.param('token')
    };
    return res.render('auth/reset_password/reset-password', data);
  });
}

function forgotPassword(req, res, next) {
  var params = ['email'];
  res.locals.params = {};
  for (var i = 0; i < params.length; i++) {
    res.locals.params[params[i]] = req.body[params[i]];
  }

  // going to do the validations here
  req.assert('email', 'Valid email required').isEmail();
  var mappedErrors = req.validationErrors();
  if (mappedErrors) {
    // don't attempt to save, return the errors
    return res.render('auth/forgot_password/forgot-password', {
      errors: mappedErrors
    });
  }
  req.sanitize('email').trim();

  User.findOne({
    email: req.param('email')
  }, function(err, user) {
    if (err) {
      //db error, maybe a validation issue
      console.log("[DBERROR]: database error");
      return res.render('auth/forgot_password/alert-database-error');
    }
    if (!user) {
      // send them back to the page with a flash message
      return res.render('auth/forgot_password/alert-invalid-email');
    }

    user.createPasswordResetToken(function(user) {
      user.save(function(err) {
        if (err) {
          //db error, maybe a validation issue
          console.log("[DBERROR]: database error");
          return res.render('auth/forgot_password/alert-database-error');
        }

        // send an email with the reset password url(email, token)
        if (debug) {
          console.log('[SEND_EMAIL]:[VERIFICATION]:http://localhost/reset-password?token=' + user.passwordResetToken + '&email=' + user.email);
        } else {
          email.sendForgotPasswordEmail(user);
        }

        // should return a success message saying an email was sent
        return res.render('auth/forgot_password/alert-email-sent');
      });
    });
  });
}

function verifyAccount(req, res, next) {
  User.findOne({
    confirmationToken: req.param("token")
  }, function(err, user) {
    if (err) {
      // db error
      return res.render('error/page-not-found');
    }
    if (!user) {
      // user not found for that token
      return res.render('error/page-not-found');
    }
    user.activated = true;
    user.confirmationToken = undefined;
    user.save(function(err) {
      if (err) {
        // something went wrong with the save, might be a validation thing
        console.log("[NEED-VALIDATION.confirmEmail] " + err);
        return res.render('error/page-not-found');
      }
      //return res.render('auth/verified', {
      req.login(user, function(err) {
        if (err) {
          return res.render('error/page-not-found');
        }
        return res.redirect('/');
      });
    });
  });
}

function extend(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i],
      keys = Object.keys(source)

      for (var j = 0; j < keys.length; j++) {
        var name = keys[j]
        target[name] = source[name]
      }
  }

  return target
}