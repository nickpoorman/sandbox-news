/**
 * App monitor.
 */
if ('production' != process.env.NODE_ENV) {
  var growl = require('growl');
  growl('Started sandbox-news server')
}

/**
 * Module dependencies.
 */

// base dependencies for app ----------------------------------------------------
var express = require("express");
var routes = require("./routes/routes");
var http = require("http");
var path = require("path");

var connect = require('connect');

var passport = require('passport');
var mongoose = require('mongoose');

// node-validator
var expressValidatorExtend = require('./modules/express-validator-extend');
var expressValidator = require('express-validator');

// app config -------------------------------------------------------------------
var app = module.exports = express();

// Session store | Redis --------------------------------------------------------
var clientOption = {};
/* Only use in production environment */
if ('production' == app.get('env')) {
  var redis = require('redis');

  var redisPort = process.env.REDIS_PORT || 1337;
  var redisURI = process.env.REDIS_URI || "127.0.0.1";
  var redisAUTH = process.env.REDIS_URI || "super-secret";

  var client = redis.createClient(redisPort, redisURI);
  client.on("error", function(err) {
    console.log("Error " + err);
  });

  clientOption = {
    client: client
  };
  client.auth(redisAUTH, function(err) {
    if (err) {
      throw err;
    }
    // You are now connected to your redis.
    console.log("connected to redis");
  });
}

var RedisStore = require('connect-redis')(express);
var sessionStore = new RedisStore(clientOption);

// Database | MongoDB -----------------------------------------------------------
var mongoose = require('mongoose');
//var Schema = mongoose.Schema;
var mongoDBName = "sn"
var uri = "mongodb://localhost/" + mongoDBName;
if ('production' == app.get('env')) {
  var mongoURI = "mongodb://";
  mongoURI += (process.env.MONGO_URI || "localhost");
  mongoURI += (process.env.MONGO_PORT || "1338");
  mongoURI += "/" + mongoDBName;

  uri = mongoURI;
}
//var conn = mongoose.createConnection(uri, {server:{poolSize:2}}); // this doesn't seem to be working
mongoose.connect(uri);
mongoose.connection.on("open", function() {
  console.log(__filename + ": We have connected to mongodb");
});
mongoose.connection.on('error', function(err) {
  console.error('MongoDB error: %s', err);
});

// Passport | config -----------------------------------------------------------
// dependencies for authentication
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');

// Define local strategy for Passport
passport.use(new LocalStrategy({
  usernameField: "email"
}, function(email, password, done) {
  User.authenticate(email, password, function(err, user, info) {
    done(err, user, info);
  });
}));

// serialize user on login
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// deserialize user on logout / session lookup?
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// All | config -----------------------------------------------------------
// config - all environments
app.set('port', process.env.PORT || 3000);
app.set("views", __dirname + "/views");
//app.set('view engine', 'hbs');
app.set('view engine', 'jade');
app.set('view options', {
  doctype: 'html'
});
app.use(express.favicon(__dirname + '/public/assets/ico/favicon.ico'));
app.use(express.logger('dev'));
// Compress response data with gzip / deflate.
app.use(express.compress());
/*
    http://tjholowaychuk.com/post/18418627138/connect-2-0
    TODO: refactor? for Connect 2.0
    The cookieParser() middleware now supports signed cookies,
    and accepts a secret. This replaces the need to pass
    session({ secret: string }) to the session() middleware.
    Signed cookies are available via req.signedCookies, and
    unsigned as req.cookies.
    */
app.use(express.cookieParser(process.env.COOKIE_SECRET || "secret-token-key"));
app.use(express.bodyParser());
app.use(expressValidator());
app.use(express.methodOverride());
app.use(express.session({
  store: sessionStore
}));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions.
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  res.locals.session = req.session;
  res.locals.title = "Sandbox News";
  res.locals.nav = '';
  next();
});

// detect mobile
// probably not necessary if we do responsive design, but I'll stick it in here anyway
app.use(function(req, res, next) {
  res.locals.isMobile = false;
  var ua = req.headers['user-agent'].toLowerCase();
  if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0, 4))) {
    res.locals.isMobile = true;
  }
  next();
})

app.use(app.router);
app.use(express.static('public'));

// config - development
//if('development' == app.get('env')) {
app.use(express.errorHandler());
//}

console.log("Environment: " + app.get('env'));

// routes -----------------------------------------------------------------------
require('./routes/routes')(app);

app.use(function(req, res, next) {
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('error/page-not-found', {
      url: req.url
    });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({
      error: 'Not found'
    });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

// error-handling middleware, take the same form
// as regular middleware, however they require an
// arity of 4, aka the signature (err, req, res, next).
// when connect has an error, it will invoke ONLY error-handling
// middleware.

// If we were to next() here any remaining non-error-handling
// middleware would then be executed, or if we next(err) to
// continue passing the error, only error-handling middleware
// would remain being executed

app.use(function(err, req, res, next) {
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  if (typeof err.status !== 'undefined') {
    if (err.status == 401 || err.status == 404) {
      console.log(err);
      // respond with html page
      if (req.accepts('html')) {
        res.render('error/page-not-found', {
          url: req.url
        });
        return;
      }

      // respond with json
      if (req.accepts('json')) {
        res.send({
          error: 'Not found'
        });
        return;
      }

      // default to plain-text. send()
      return res.type('txt').send('Not found');
    }
  }
  return next(err);
});

app.use(function(err, req, res, next) {
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  console.log(err);
  res.status(err.status || 500);
  res.render('error/page-not-found', {
    error: err
  });
});

// server -----------------------------------------------------------------------
http.createServer(app).listen(app.get("port"), function() {
  console.log("Express server listening on port " + app.get("port"));
});