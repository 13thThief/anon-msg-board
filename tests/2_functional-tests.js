var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
      test('POST', done =>{
      chai.request(server)
          .post('/api/threads/test')
          .send({text:'test', delete_password:'test'})
          .end(function(err,res){
            assert.equal(res.status, 200);
            done();
          })
        });
    
      test('GET', done =>{
        chai.request(server)
          .get('/api/threads/test')
          .end((err, res)=>{
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], '_id');
            assert.property(res.body[0], 'text');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'bumped_on');
            assert.property(res.body[0], 'replies');
            done();
          })
      })

    // PUT first before DELETE
      test('PUT', done => {
        chai.request(server)
            .put('/api/threads/test')
            .send({thread_id:'5d87f502ccb9710d6ca54896'})
            .end((err,res) => {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'success');
              done();
            });
    
      test('DELETE', done =>{
        chai.request(server)
            .delete('/api/threads/test')
            .send({thread_id:'5d87f502ccb9710d6ca54896', delete_password:'chai'})
            .end(function(err,res){
              assert.equal(res.status,200);
              assert.equal(res.text,'success')
              done();
            })
      });
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    test('POST', done => {
      chai.request(server)
          .post('/api/replies/test')
          .send({thread_id:'5d87f502ccb9710d6ca54896',text:'reply test',delete_password:'test'})
          .end(function(err,res){
            assert.equal(res.status, 200);
            done();
          })
    });
    
    test('GET', done => {
      chai.request(server)
          .get('/api/replies/test?thread_id=5d87f502ccb9710d6ca54896')
          .end(function(err,res){
            assert.equal(res.status,200);
            assert.property(res.body,'_id');
            assert.property(res.body,'text');
            assert.property(res.body,'created_on');
            assert.property(res.body,'bumped_on');
            assert.property(res.body,'replies');
            assert.isArray(res.body.replies);
            done();
          });
    });
    
    test('PUT', done =>{
      chai.request(server)
          .put('/api/replies/test')
          .send({thread_id:'5ca9e7a70560730be834eebf',reply_id: '5d87fc88412ad20f58d058f3'})
          .end(function(err,res){
            assert.equal(res.status,200);
            assert.equal(res.text,'success')
            done();
          })  
    });
    
    test('DELETE', done => {
      chai.request(server)
          .put('/api/replies/test')
          .send({thread_id:'5d87f502ccb9710d6ca54896',reply_id: '5d87fc88412ad20f58d058f3',delete_password:'test'})
          .end(function(err,res){
            assert.equal(res.status,200);
            console.log(res.body)
            assert.equal(res.text,'success')
            done();
          });
    });
    
  });

});
