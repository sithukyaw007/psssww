'use strict';

var _ = require('lodash');
var Comment = require('./comment.model');
var Feed = require('../feed/feed.model');
var graph = require('fbgraph');
var when = require('when');
var syncFor=require('./syncFor');
var LanguageDetect = require('languagedetect');
var lngDetector = new LanguageDetect();

var savecount = 0;
var notSaveCount = 0;

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

    for(var i = feeds.length-1 ; i >= 0; i--) {
      (function(cntr) {
          // console.log('CNTR is ' + cntr);
          console.log('feed id ' + feeds[i].id);

          var reqURL = feeds[i].id + '/comments?fields=id,from,message,created_time,user_likes&summary=1';
          // var reqURL =  '6815841748_10151986355271749/comments?fields=id,from,message,created_time,user_likes&summary=1';

          graph.setOptions(options).get(reqURL, function(err, cmts) {
             if(err) { console.log('error in first graph call'); }
              var feed_id_position = reqURL.indexOf('/');
              var feed_id_content = reqURL.slice(0, feed_id_position);
              console.log('FEED ID CONTENT IS  ' + feed_id_content);
               syncFor(0,cmts.summary.total_count,"start", feed_id_content, function(i,status,post_id,call){
                   if(status === "done") {
                    console.log("array iteration is done");
                    console.log('Save Count is  ' + savecount);
                    console.log('Not Save Count is ' + notSaveCount);
                  }
                  else {
                      if(nextURL === '') {
                        console.log('comes to normal URL');
                        // console.log('FEED INDEX IS  ' + i);
                        getComments(reqURL, post_id, function(){
                           call('next') // this acts as increment (i++)
                         })
                      } else {
                          console.log('comes into next URL');
                          // console.log('FEED INDEX IS  ' + i);
                          // console.log('NEXT URL IS ' + nextURL);
                          if (nextURL !== 'no_next_url') {
                                // console.log('FEED INDEX IS  ' + i);
                                getComments(nextURL, post_id, function(){
                               call('next') // this acts as increment (i++)
                             })
                          } else {
                              call('next');
                          }
                      }
                  }
                })
          });
      })(i);
    }
    return res.json(200,  'done');
  });
};

var count = 1;

function getComments(reqURL, post_id, callback) {
  var promise = when.promise(function(resolve, reject, notify) {
      graph.setOptions(options).get(reqURL, function(err, cmts) {
         if(err) { reject(err) }
          resolve(cmts)
      });
  });

  promise.then(function(cmts){
    console.log(count++ + '.) Comes into promise. comments length is ' + cmts.data.length);
    cmts.data.forEach(function(c) {
      if(c.message.length > 20 && !isUrl(c.message)) {
        var langList = lngDetector.detect(c.message, 1);
        for (var m = 0; m < langList.length; m++) {
          var tmpArr = langList[m];
          // console.log('TYPE OF LANG ' + tmpArr[0]);
          if(tmpArr[0] === 'english') {
            // console.log('content is english ' + c.message);
            savecount++;
              c = {
                id : c.id,
                post_id: post_id,
                from: {
                  id: c.from.id,
                  name: c.from.name
                },
                message: c.message,
                created_time: c.created_time,
                user_likes: c.user_likes
              };
              Comment.create(c, function(err, cmt) {
                if(err) { console.log('error in creating comment'); }
              });

          } else {
            notSaveCount++;
            // console.log('content is other language ' + c.message);
          }
        }
      }
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


function isUrl(s) {
  var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
  return regexp.test(s);
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