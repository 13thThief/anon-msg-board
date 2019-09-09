'use strict';

let thread = require('../controllers/threadHandler');
let reply = require('../controllers/replyHandler');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get(thread.listThread)
    .post(thread.createThread)
    .put(thread.reportThread)
    .delete(thread.deleteThread)
    
  app.route('/api/replies/:board')
    .get(reply.listReply)
    .post(reply.createReply)
    .put(reply.reportReply)
    .delete(reply.deleteReply)

};
