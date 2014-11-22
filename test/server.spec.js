var assert = require('assert');
var io = require('socket.io-client');

var server = require('../src/server.js');

var url = 'http://localhost:8080';
var options = {
  transports: ['websocket'],
  'force new connection': true
};

describe('server', function () {

  it('accepts connections', function (done) {
    var client = io(url, options);
    client.emit('login', 'user1', function () {
      done();
    });
  })

  it('sends a message and receives it back after it\'s stored in the DB', function (done) {
    var client = io(url, options);
    client.emit('login', {id: 'user1'}, function () {
      client.emit('startSession', 'user2', function () {
        client.emit('message', {
          to: 'user2',
          text: 'Message text'
        })
        client.on('message', function (message) {
          assert.equal(message.from, 'user1');
          assert.equal(message.to, 'user2');
          assert.equal(message.text, 'Message text');
          client.disconnect();
          done();
        })
      })
    })
  });

  it('notifies the receiver about the message', function (done) {
    var client1 = io(url, options);
    var client2 = io(url, options);

    client1.emit('login', {id: 'user1'}, function () {
      client1.emit('startSession', 'user2', function () {
        client2.emit('login', {id: 'user2'}, function () {
          client2.emit('startSession', 'user1', function () {
            client1.emit('message', {
              to: 'user2',
              text: 'Message text'
            })
            client2.on('message', function (message) {
              assert.equal(message.from, 'user1');
              assert.equal(message.to, 'user2');
              assert.equal(message.text, 'Message text');
              client1.disconnect();
              client2.disconnect();
              done();
            })
          })
        })
      })
    })
  });

  describe('when the same user is connected multiple times', function () {
    it('notifies the other client logged in as sender about the message', function (done) {
      var client1 = io(url, options);
      var client2 = io(url, options);

      client1.emit('login', {id: 'user1'}, function () {
        client1.emit('startSession', 'user2', function () {
          client2.emit('login', {id: 'user1'}, function () {
            client2.emit('startSession', 'user2', function () {
              client1.emit('message', {
                to: 'user2',
                text: 'Message text'
              })
              client2.on('message', function (message) {
                assert.equal(message.from, 'user1');
                assert.equal(message.to, 'user2');
                assert.equal(message.text, 'Message text');
                client1.disconnect();
                client2.disconnect();
                done();
              })
            })
          })
        })
      });
    })
  })
})
