/*
 * topic.js
 */

var debug = true;
var path = require("path");
var express = require("express");
var _ = require("underscore");
var auth = require('./auth-middleware');

//var User = require('../models/user');
var Topic = require('../models/topic');

var app = module.exports = express();
var viewPath = path.resolve(__dirname, '..', 'views');
app.set("views", viewPath);
app.set('view engine', 'jade');
app.set('view options', {
  doctype: 'html'
});

app.param('topic_id', function(req, res, next, id){
  Topic.findById(id, function(err, topic){
    if(err){
      return next(err);
    }
    if(!topic){
      var err = new Error('not found');
      err.status = 404;
      return next(err);
    }
    req.topic = topic;
    return next();
  });
});

/*
 * This resource handles voting up topics
 */
app.get('/t/:topic_id/u', voteUp);

/*
 * This resource handles voting down topics
 */
app.get('/t/:topic_id/d', voteDown);

/*
 * This resource handles voting up comments
 */
app.get('/t/:topic_id/c/:comment_id/u', voteUpComment);

/*
 * This resource handles voting down comments
 */
app.get('/t/:topic_id/c/:comment_id/d', voteDownComment);

// -------- HELPERS ----------------

// check if they already voted on the topic
function checkVoterRegistration(){

}

function voteUp(req, res, next){

}

function voteDown(req, res, next){
  
}

function voteUpComment(req, res, next){
  
}

function voteDownComment(req, res, next){
  
}

