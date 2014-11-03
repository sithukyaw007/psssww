'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var FeedSchema = new Schema({
  id: String,
  type: String,
  message: String,
  link: String,
  month: {type: Number},
  created_time: String,
  share_count: {type: Number},
  likes_count: {type: Number}
});

module.exports = mongoose.model('Feed', FeedSchema);