'use strict';

var _ = require('lodash');
var Feed = require('./feed.model');
var graph = require('fbgraph');
var jf = require('jsonfile');
var moment = require('moment');


// Get list of feeds

var filePath =  'server/files/feed.json';
var feedData = [];

var getNextBatchPost = function (pagination, res) {
  console.log('pagination ' + pagination.next);
  console.log('comes into getNextBatchPost');
  console.log('before paging ' + feedData.length);
   // var options = {
   //  pool:     { maxSockets:  Infinity } ,
   //  headers:  { connection:  "keep-alive" }
   //  };

    var test = {};
    graph
    // .setOptions(options)
    .get(pagination.next, function(err, feeds) {

      // var count = 1;
      feeds.data.forEach(function(f) {
        // console.log('adding in first push ' + count++);
        // console.log('f status ' + f.status_type);

        if (f.status_type !== 'shared_story') {
            var day = moment(f.created_time).format('YYYY MM DD');
            var feed = {
              id: f.id,
              type: f.type,
              message: f.message,
              link: f.link,
              month: day.substring(5, 7),
              created_time: f.created_time,
              share_count: f.shares.count,
              likes_count: f.likes.summary.total_count
            };
            feedData.push(feed);
          }
      });
      console.log('AFTER paging ' + feedData.length);
      // console.log(feedData[feedData.length-1]);

      Feed.create(feedData, function(err, feed) {
        if(err) { return handleError(res, err); }
        // return res.json(201, feed);
      });

      res.json({ 'feed': feedData});

  });
};

exports.index = function(req, res) {
  Feed.find(function (err, feeds) {
    if(err) { return handleError(res, err); }
    // return res.json(200, feeds);

    feedData = [];

    var options = {
    pool:     { maxSockets:  Infinity } ,
    headers:  { connection:  "keep-alive" }
    };

    var test = {};
    graph
    .setOptions(options)
    // .get("barackobama/feed?fields=id,type,message,link,created_time,shares,likes.limit(1).summary(true),status_type", function(err, feeds) {
    .get("barackobama/feed?fields=id,type,message,status_type,link,created_time,shares,likes.limit(1).summary(true)&since=1296626400&limit=250", function(err, feeds) {

      var feed;
      feedData = [];
      // console.log(feeds);
      // console.log(typeof(feeds));
      // res.json({ 'feed': feeds.data[0].id});

      // var paging = {};

      feeds.data.forEach(function(f) {
        if (f.status_type !== 'shared_story') {
           console.log(f.status_type);
           var day = moment(f.created_time).format('YYYY MM DD');
           console.log(day);
           var feed = {
            id: f.id,
            type: f.type,
            message: f.message,
            link: f.link,
            month: day.substring(5, 7),
            created_time: f.created_time,
            share_count: f.shares.count,
            likes_count: f.likes.summary.total_count
          };
          feedData.push(feed);
        }
      });

      // res.json({ 'feed': feedData});

      getNextBatchPost(feeds.paging, res);

  //     graph.get(feeds.paging.next, function(err, feeds) {
  //         graph.get(feeds.paging.next, function(err, feeds) {
  //               feeds.data.forEach(function(f) {
  //                 var feed = {
  //                   id: f.id,
  //                   type: f.type,
  //                   message: f.message,
  //                   link: f.link,
  //                   month: 1,
  //                   created_time: '2014-02-09T17:02:36+0000',
  //                   shares: 10,
  //                   likes_count: 100
  //                 };
  //                 feedData.push(feed);
  //               });
  //               console.log('AFTER paging ' + feedData.length);

  //               Feed.create(feedData, function(err, feed) {
  //                 if(err) { return handleError(res, err); }
  //                 // return res.json(201, feed);
  //                 });
  //               res.json({ 'feed': feedData});
  //         });
  //     });
  });
  });
};

// Get a single feed
exports.show = function(req, res) {
  Feed.findById(req.params.id, function (err, feed) {
    if(err) { return handleError(res, err); }
    if(!feed) { return res.send(404); }
    return res.json(feed);
  });
};

// Creates a new feed in the DB.
exports.create = function(req, res) {
  Feed.create(req.body, function(err, feed) {
    if(err) { return handleError(res, err); }
    return res.json(201, feed);
  });
};

// Updates an existing feed in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Feed.findById(req.params.id, function (err, feed) {
    if (err) { return handleError(res, err); }
    if(!feed) { return res.send(404); }
    var updated = _.merge(feed, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, feed);
    });
  });
};

// Deletes a feed from the DB.
exports.destroy = function(req, res) {
  Feed.findById(req.params.id, function (err, feed) {
    if(err) { return handleError(res, err); }
    if(!feed) { return res.send(404); }
    feed.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}