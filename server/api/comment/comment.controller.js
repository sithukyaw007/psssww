'use strict';

var _ = require('lodash');
var Comment = require('./comment.model');
var Feed = require('../feed/feed.model');
var graph = require('fbgraph');
var when = require('when');
var syncFor=require('./syncFor');

var options = {
  pool:     { maxSockets:  Infinity } ,
  headers:  { connection:  'keep-alive' }
};

var nextURL = '';

// Get list of comments

function finishQuery(){
  console.log('query finished!!!!!!!!!!!!!!!!!!!!!!!');
}

exports.index = function(req, res) {

  Feed.find(function (err, feeds) {
    if(err) { return handleError(res, err); }
    // return res.json(200, feeds);

    for(var i = feeds.length-1; i >= 0; i--) {
      console.log('feed id ' + feeds[i].id);

      var reqURL = feeds[i].id + '/comments?fields=id,from,message,created_time,user_likes&summary=1';
      // var reqURL =  '6815841748_10151986355271749/comments?fields=id,from,message,created_time,user_likes&summary=1';

      graph.setOptions(options).get(reqURL, function(err, cmts) {
         if(err) { console.log('error in first graph call'); }
           syncFor(1,cmts.summary.total_count,"start",function(i,status,call){
               if(status === "done")
                console.log("array iteration is done")
              else {
                  if(nextURL === '') {
                    console.log('comes to normal URL');
                    getComments(reqURL,function(){
                       call('next') // this acts as increment (i++)
                     })
                  } else {
                      console.log('comes into next URL');
                      if (nextURL !== 'no_next_url') {
                            getComments(nextURL,function(){
                           call('next') // this acts as increment (i++)
                         })
                      } else {
                          call('next');
                      }
                  }
              }
            })
      });
    }
    return res.json(200,  'done');
  });
};

var count = 1;
function getComments(reqURL, callback) {
  var promise = when.promise(function(resolve, reject, notify) {
      graph.setOptions(options).get(reqURL, function(err, cmts) {
         if(err) { reject(err) }
          resolve(cmts)
      });
  });

  promise.then(function(cmts){
    console.log(count++ + '.) Comes into promise. comments length is ' + cmts.data.length);
    cmts.data.forEach(function(c) {
      Comment.create(c, function(err, cmt) {
        if(err) { console.log('error in creating comment'); }
      });
    });
    if(cmts.paging.next !== undefined) {
          console.log('there is next content');
          nextURL = cmts.paging.next;
    } else {
      console.log('there comes to else blockkkkkk');
      console.log(JSON.stringify(cmts.paging));
      nextURL = 'no_next_url';
    }
    callback();
  });

  promise.catch(function(err){
    console.log('error in promise catch');
    console.log(err);
  });
}


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