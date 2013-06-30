/**
 * Module dependencies.
 */
var moment = require('moment');

/**
 * Expose `score`.
 */

module.exports = new Score();

function Score(){
  // any setup?
}

/*
 * Set the score of anything using lower bound of
 *  Wilson score confidence interval for a Bernoulli parameter.
 *  NOTE: This function is async because it's being used lot's and could be slow.
 */
Score.prototype.ciLowerBound = function ciLowerBound(positive, negative, cb) {
  process.nextTick(function(){
    var total = positive + negative;
    var ciLowerBound = ((positive + 1.9208) / total - 1.96 * Math.sqrt((positive * negative) / total + 0.9604) / total) / (1 + 3.8416 / total);
    cb(ciLowerBound);
  });
}

/*
 * Decay algorithm
 * Score should come from ciLowerBound
 * Time is the elapsed time in hours
 * NOTE: This function is async
 */
Score.prototype.decay = function decay(score, time, cb) {
  process.nextTick(function(){
    var now = moment();
    var created = moment(time);
    var t = now.diff(created, 'hours');
    var newScore = (score - 1) / Math.pow((t + 2), 1.8);
    cb(newScore);
  });
}

/*
 * This is how Reddit does their rankings
 */
Score.prototype.hotsort = function hotsort(){
  
}