/*
 * topic.js
 */

var debug = true;
var path = require("path");
var express = require("express");
var _ = require("underscore");
var auth = require('./auth-middleware');
var url = require('url');
var moment = require('moment');

//var User = require('../models/user');
var Topic = require('../models/topic');

var app = module.exports = express();
var viewPath = path.resolve(__dirname, '..', 'views');
app.set("views", viewPath);
app.set('view engine', 'jade');
app.set('view options', {
  doctype: 'html'
});

app.param('topic_id', function(req, res, next, id) {
  Topic.findById(id, function(err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      var err = new Error('not found');
      err.status = 404;
      return next(err);
    }
    req.topic = topic;
    return next();
  });
});

/*
 * The home page. Having this handled here because we use topics on home.
 */
app.get('/', showTopics);

/*
 * Display a page for a user to create a topic.
 */
app.get('/submit', auth.user, newTopic);

/*
 * Create a topic.
 */
app.post('/submit', auth.user, validateTopic, createTopic);

/*
 * Show the topic's page.
 */
app.get('/topic/:topic_id', showTopic);

// -------- HELPERS ----------------

function showTopics(req, res, next) {
  // get all the topics
  Topic.find({}, function(err, topics) {
    // go through and attach a time to the topic
    for (var i = topics.length - 1; i >= 0; i--) {
      topics[i].elapsedTime = moment(topics[i].createdAt).fromNow();
    };
    return res.render('index', {
      topics: topics,
      counter: 1
    });
  });
}

function newTopic(req, res, next) {
  return res.render('submit');
}

function validateTopic(req, res, next) {
  var params = [
      'title',
      'url',
      'text'
  ];
  res.locals.params = {};
  for (var i = 0; i < params.length; i++) {
    res.locals.params[params[i]] = req.body[params[i]];
  }

  // going to do the validations here
  req.assert('title', 'Title required').notEmpty();
  req.assert('title', 'Please use a descriptive title').notUrl()
  req.assert('title', 'Please do not use a url here').notContainsUrl();

  // either url or text has to have someting in it
  // make sure text isn't just whitespace
  var foundURL = (req.body.url && !req.body.url.match(/^[\s\t\r\n]*$/));
  var foundText = (req.body.text && !req.body.text.match(/^[\s\t\r\n]*$/));

  // if there is a url then we don't care about the text
  if (foundURL) {
    // if there is something there then make sure it's a url
    req.assert('url', 'Valid url required').isUrl();
    req.body.text = undefined;
  }

  //if(!foundURL && foundText){
  // do nothing here
  //}

  if (!foundURL && !foundText) {
    // make sure the text is there
    req.assert('url', 'Must fill in either url or text').isUrl();
    req.assert('text', 'Must fill in either url or text').notEmpty();
  }

  var mappedErrors = req.validationErrors();
  if (mappedErrors) {
    // don't attempt to save, return the errors
    return res.render('submit', {
      errors: mappedErrors
    });
  }
  for (var i = 0; i < params.length; i++) {
    req.sanitize(params[i]).trim();
  }
  return next();
}

function createTopic(req, res, next) {
  var hostname = undefined;
  if (req.body.url) {
    if (!req.body.url.match(/^http:\/\//g) && !req.body.url.match(/^https:\/\//g)) {
      req.body.url = 'http://' + req.body.url;
    }
    hostname = url.parse(req.body.url).hostname.replace(/^www\./g, "");
  }
  var topic = new Topic({
    title: req.body.title,
    url: req.body.url,
    text: req.body.text,
    creator: req.user,
    username: req.user.name,
    hostname: hostname
  });

  topic.voteup.push(req.user);

  topic.save(function(err, newTopic) {
    if (err) {
      return next(err);
    }
    return res.redirect('/topic/' + newTopic.id);
  });
}

function showTopic(req, res, next) {
  var topic = req.topic;
  if (!topic) {
    next();
  }
  topic.elapsedTime = moment(topic.createdAt).fromNow();
  return res.render('topic', topic);
}