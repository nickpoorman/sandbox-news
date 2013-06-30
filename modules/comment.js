/*
 * comment.js
 */

var debug = true;
var path = require("path");
var express = require("express");
var _ = require("underscore");
var auth = require('./auth-middleware');

//var User = require('../models/user');
//var Comment = require('../models/comment');

var app = module.exports = express();
var viewPath = path.resolve(__dirname, '..', 'views');
app.set("views", viewPath);
app.set('view engine', 'jade');
app.set('view options', {
  doctype: 'html'
});

// app.param('comment_id', function(req, res, next, id){
//   Comment.findById(id, function(err, comment){
//     if(err){
//       return next(err);
//     }
//     if(!comment){
//       var err = new Error('not found');
//       err.status = 404;
//       return next(err);
//     }
//     req.comment = comment;
//     return next();
//   });
// });

/*
 * This resource handles voting up topics
 */
// app.post('/r/:topic_id', voteUp);

// -------- HELPERS ----------------

// create a new comment
// function checkVoterRegistration(){

// }