'use strict';

var _ = require('lodash');
var Comment = require('./comment.model');
var Feed = require('../feed/feed.model');
var graph = require('fbgraph');
var Q = require('q');


// Get list of comments
exports.index = function(req, res) {

  Feed.find(function (err, feeds) {
    if(err) { return handleError(res, err); }
    // return res.json(200, feeds);

    var options = {
    pool:     { maxSockets:  Infinity } ,
    headers:  { connection:  'keep-alive' }
    };

    // for(var i = 2; i >= 0; i--) {
    //   console.log('feed id ' + feeds[i].id);
    //   Q.nfcall(graph.setOptions(options).get(feeds[i].id + '/comments?fields=id,from,message,created_time,user_likes&limit=250')).then(function (res, cmts) {
    //         console.log('comes into Q');
    //        cmts.data.forEach(function(c) {
    //         Comment.create(c, function(err, cmt) {
    //           if(err) { return handleError(res, err); }
    //         });
    //     });
    //     });
    // }

    for(var i = 2; i >= 0; i--) {
      console.log('feed id ' + feeds[i].id);
     graph
     .setOptions(options)
        .get(feeds[i].id + '/comments?fields=id,from,message,created_time,user_likes&limit=250', function(err, cmts) {
          // console.log(cmts.data.length);
          cmts.data.forEach(function(c) {
            Comment.create(c, function(err, cmt) {
              if(err) { return handleError(res, err); }
            });
          });
        });
    }
    return res.json(200,  'done');
  });




};

// Get a single comment
exports.show = function(req, res) {
  Comment.findById(req.params.id, function (err, comment) {
    if(err) { return handleError(res, err); }
    if(!comment) { return res.send(404); }
    return res.json(comment);
  });
};

// Creates a new comment in the DB.
exports.create = function(req, res) {
  Comment.create(req.body, function(err, comment) {
    if(err) { return handleError(res, err); }
    return res.json(201, comment);
  });
};

// Updates an existing comment in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Comment.findById(req.params.id, function (err, comment) {
    if (err) { return handleError(res, err); }
    if(!comment) { return res.send(404); }
    var updated = _.merge(comment, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, comment);
    });
  });
};

// Deletes a comment from the DB.
exports.destroy = function(req, res) {
  Comment.findById(req.params.id, function (err, comment) {
    if(err) { return handleError(res, err); }
    if(!comment) { return res.send(404); }
    comment.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}