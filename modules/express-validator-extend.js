var expressValidator = require('express-validator');
var check = require('validator').check;

expressValidator.Validator.prototype.notUrl = function() {
  var isUrl = true;
  try {
    check(this.str).isUrl();
  } catch (e) {
    if(typeof e !== 'undefined' || e.name === 'ValidatorError'){
      isUrl = false;
    }
  }
  if(isUrl){
    this.error(this.msg);
  }
  return this;
};

expressValidator.Validator.prototype.notContainsUrl = function() {
  var containsUrl = true;
  // loop through
  var spl = this.str.split(/\s+/);
  console.log("split");
  console.log(spl);
  for (var i = spl.length - 1; i >= 0; i--) {
    containsUrl = true;
    try {
      check(spl[i]).isUrl();
    } catch (e) {
      if(typeof e !== 'undefined' || e.name === 'ValidatorError'){
        // this gets called if it's not a url
        containsUrl = false;
      }
    }
    if(containsUrl){
      return this.error(this.msg);
    }
  };
  
  return this;
};

module.exports = expressValidator;