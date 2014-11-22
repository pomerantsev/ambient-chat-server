var assert = require('assert');
var client = require('socket.io-client')('http://localhost:8080');

var server = require('../src/server.js');

describe('server', function () {
  it('accepts connections', function (done) {
    client.emit('login', 'user1', function () {
      done();
    });
  })
})
