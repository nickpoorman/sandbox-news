/**
 * Topic Schema
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TopicSchema = new Schema({
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  name: String,
  // Register boats to divisions
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  username: String,
  voteup: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  votedown: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  title: String,
  url: String,
  hostname: String,
  text: String,
  numComments: {
    type: Number,
    default: 0
  }
});

TopicSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (!this.createdAt) {
    this.createdAt = new Date();
  }
  next();
});

module.exports = mongoose.model("Topic", TopicSchema);