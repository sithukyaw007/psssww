'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CommentSchema = new Schema({
id: String,
from: String,
message: String,
created_time: String,
user_likes: Boolean
});

module.exports = mongoose.model('Comment', CommentSchema);