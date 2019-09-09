'use strict';

require('dotenv').config();

let Mongo = require('mongodb').MongoClient;
let ObjectId = require('mongodb').ObjectID;
let DB = process.env.DB;
let URL = process.env.URL;

console.log(URL, DB);

// GET an entire thread with all its replies from /api/replies/{board}?thread_id={thread_id}.
let listThread = (req, res) => {
  let board = req.params.board;
  let t_id = ObjectId(req.query.thread_id);

  Mongo.connect(URL, (err, client) => {
    if (err) {
      console.error(err);
      return res.status(500).send('fail');
    }

    let db = client.db(process.env.DB);
    db
      .collection('boards')
      .findOne({
        board
      }, {
        sort: {
          bumped_on: -1
        },
        limit: 10,
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
        if (Object.keys(doc).length === 0)
          return res.status(500).send('fail');
        doc.threads.forEach(function(d) {
          d.replyCount = d.replies.length;
          if (d.replies.length > 3)
            d.replies = d.replies.slice(0, 3);
        });
        res.json(doc.threads);
      })
      .catch(e => {
        console.error(e);
        return res.status(500).send('fail');
      })
  })
}

// POST a thread to a specific message board by passing form data text and delete_password to /api/threads/{board}.
// Recomend res.redirect to board page /b/{board})
// Saved will be _id, text, created_on(date&time), bumped_on(date&time, starts same as created_on),
// reported(boolean), delete_password, & replies(array).
let createThread = (req, res) => {
  let board = req.params.board;
  let date = new Date();
  let thread = {
    _id: ObjectId(),
    text: req.body.text,
    created_on: date,
    bumped_on: date,
    reported: false,
    password: req.body.delete_password,
    replies: []
  };

  Mongo.connect(URL, (err, client) => {
    if (err)
      return res.status(500).send('fail');

    let db = client.db(process.env.DB);
    db
      .collection('boards')
      .findOneAndUpdate({
        board
      }, {
        $push: {
          threads: thread
        }
      }, {
        upsert: true,
        returnOriginal: false
      })
      .then(r => {
        if (r.value)
          return res.redirect(`/b/${board}/`);
        res.sendStatus(500);

      })
      .catch(e => {
        return res.status(500).send('fail');
      })
  })
}

// Change reported value to true by sending a PUT request to /api/threads/{board} with thread_id.
let reportThread = (req, res) => {
  let board = req.params.board;
  let t_id = ObjectId(req.body.thread_id);

  Mongo.connect(URL, (err, client) => {
    let db = client.db(DB);
    db
      .collection('boards')
      .findOneAndUpdate({
        board
      }, {
        $set: {
          'threads.$[t].reported': true
        }
      }, {
        arrayFilters: [{
          't._id': t_id
        }],
        returnOriginal: false
      })
      .then(r => {
        if (r.value)
          return res.send('success');
        res.send('failed reporting ', t_id);
      })
      .catch(e => {
        res.send('error');
      })
  })
}

// DELETE request to /api/threads/{board} and pass along the thread_id & delete_password.
// (Text response will be 'incorrect password' or 'success')
let deleteThread = (req, res) => {
  let board = req.params.board;
  let _id = ObjectId(req.body.thread_id);
  let t_pass = req.body.delete_password;

  Mongo.connect(URL, (err, client) => {
    if (err) {
      return res.sendStatus(500);
    }
    let db = client.db(process.env.DB);
    db
      .collection('boards')
      .findOneAndUpdate({
        board,
        threads: {
          $elemMatch: {
            _id,
            password: t_pass
          }
        }
      }, {
        $pull: {
          threads: {
            _id
          }
        }
      })
      .then(r => {
        if (r.value)
          return res.send('success');
        res.send('incorrect password')
      })
      .catch(e => {
        res.sendStatus(500);
      })
  })
}

module.exports = {
  listThread,
  createThread,
  reportThread,
  deleteThread
};
