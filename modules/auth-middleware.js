/**
 * Module dependencies.
 */

/**
 * Expose `auth`.
 */

module.exports = new Auth();

function Auth(){
  // any setup?
}

/*
 * Check if the user is an admin
 */
Auth.prototype.admin = function admin(req, res, next) {
  if (!req.user.admin) {
    // should probably log this
      var err = new Error('unauthorized');
      err.status = 401;
      return next(err);
  }
  res.locals.isAdmin = true;
  return next();
}

 /*
 * Check if there is a user session
 * - Else send them to the login page
 */
Auth.prototype.user = function user(req, res, next) {
  if (!req.user) {
    return res.redirect('/login')
  }
  return next();
}