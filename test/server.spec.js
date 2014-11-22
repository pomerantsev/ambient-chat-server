var io = require('socket.io-client');
var connection;

var server = require('../src/server.js');

describe('server', function () {
  beforeEach(function () {
    connection = io.connect('http://localhost:8080', {
      transports: ['websocket'],
      'force new connection': true
    })
  });

  it('accepts connections', function (done) {
    connection.emit('login', 'user1', function () {
      done();
    });
  })
  it('accepts a second connection', function (done) {
    connection.emit('login', 'user1', function () {
      done();
    });
  })
})
