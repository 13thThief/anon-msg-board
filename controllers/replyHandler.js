'use strict';

require('dotenv').config();

let Mongo = require('mongodb').MongoClient;
let ObjectId = require('mongodb').ObjectID;
let DB = process.env.DB;
let URL = process.env.URL;

let listReply = (req, res) => {
  let board = req.params.board;
  let t_id = ObjectId(req.query.thread_id);

  Mongo.connect(URL, function(err, client) {
    let db = client.db(DB).collection('boards')
    db
      .findOne({
        board
      }, {
        projection: {
          _id: 0,
          board: 0,
          text: 0,
          password: 0,
          created_on: 0,
          bumped_on: 0,
          'threads.password': 0,
          'threads.reported': 0,
          'threads.replies.password': 0,
          'threads.replies.reported': 0
        }
      })
      .then(doc => {
        let result = doc.threads.filter(d => d._id.equals(t_id));
        if (!result.length)
          return res.status(500).send('error');
        let response = {
          _id: result[0]._id,
          text: result[0].text,
          created_on: result[0].created_on,
          bumped_on: result[0].bumped_on,
          replies: result[0].replies
        }
        res.json(response)
      })
      .catch(e => {
        return res.status(500).send('fail');
      })
  })
}

// POST a reply to a thead on a specific board by passing form data text, delete_password,
// thread_id to /api/replies/{board} and it will also update the bumped_on date to the comments date.
// res.redirect to thread page /b/{board}/{thread_id})
// In the thread's 'replies' array will be saved _id, text, created_on, delete_password, & reported.
let createReply = (req, res) => {
  let board = req.params.board;
  let t_id = ObjectId(req.body.thread_id);
  let date = new Date();

  let reply = {
    _id: ObjectId(),
    text: req.body.text,
    created_on: date,
    password: req.body.delete_password,
    reported: false
  }

  Mongo.connect(URL, function(err, client) {
    if (err)
      throw err;

    let db = client.db(DB)

    db
      .collection('boards')
      .findOneAndUpdate({
        board
      }, {
        $push: {
          'threads.$[t].replies': reply
        },
        $set: {
          'threads.$[t].bumped_on': date
        }
      }, {
        arrayFilters: [{
          't._id': t_id
        }],
        returnOriginal: false
      })
      .then(r => {
        if (r.value)
          res.redirect(`/b/${board}/${t_id}`);
      })
      .catch(e => {
        return res.status(500).send('fail');
      })
  })
}

//  Reported value to true by sending a PUT request to /api/replies/{board} and pass along the thread_id & reply_id.
// (Text response will be 'success')
let reportReply = (req, res) => {
  let board = req.params.board;
  let t_id = ObjectId(req.body.thread_id);
  let r_id = ObjectId(req.body.reply_id);

  Mongo.connect(URL, (err, client) => {
    let db = client.db(DB);
    db
      .collection('boards')
      .findOneAndUpdate({
        board,
      }, {
        $set: {
          'threads.$[t].replies.$[r].reported': true
        }
      }, {
        arrayFilters: [{
          't._id': t_id
        }, {
          'r._id': r_id
        }],
        returnOriginal: false
      })
      .then(r => {
        if (r.value)
          return res.send('success');
        else res.send('fail')
      })
      .catch(e => {
        res.sendStatus(500);
      })
  })
}

// thread_id, reply_id, & delete_password
let deleteReply = async (req, res) => {
  let board = req.params.board;
  let t_id = ObjectId(req.body.thread_id);
  let r_id = ObjectId(req.body.reply_id);
  let pass = req.body.delete_password;

  if (!board || !pass || !t_id || !r_id) {
    return res.send('incorrect password');
  }

  Mongo.connect(URL, async (err, client) => {
    if (err) {
      res.status(500).send('fail');
      return;
    }
    let db = client.db(DB);
    // Check if password exists
    let exists = await db
      .collection('boards')
      .findOne({
        board,
        threads: {
          $elemMatch: {
            _id: t_id,
            replies: {
              $elemMatch: {
                _id: r_id,
                password: pass
              }
            }
          }
        }
      })
      .then(doc => {
        if (!doc)
          return false;
        // Password exists!
        return true;
      })
      .catch(e => {
        return false;
      })


    if (!exists) {
      return res.send('incorrect password');
    }

    db
      .collection('boards')
      .findOneAndUpdate({
        board
      }, {
        $set: {
          'threads.$[t].replies.$[r].text': '[deleted]'
        }
      }, {
        arrayFilters: [{
          't._id': t_id
        }, {
          'r._id': r_id
        }],
        returnOriginal: false
      })
      .then(r => {
        if (r.value)
          return res.send('success')
        else res.status(500).send('fail');
      })
      .catch(e => {
        res.sendStatus(500);
      })
  })
}

module.exports = {
  listReply,
  createReply,
  reportReply,
  deleteReply,
};
