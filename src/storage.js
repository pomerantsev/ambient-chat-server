var db = require('redis').createClient();
var Promise = require('promise');
var _ = require('lodash');

var prefix = 'ambient-chat-';

function getDialogKey(userId1, userId2) {
  return prefix + (userId1 < userId2 ? userId1 + '-' + userId2 : userId2 + '-' + userId1);
}

function getUserKey(userId) {
  return prefix + userId;
}

module.exports = {
  authenticate: function (userId) {
    return Promise.resolve({id: userId});
  },
  storeMessage: function (message) {
    message.time = new Date();
    var commandSequence = db.multi()
      .rpush(getDialogKey(message.from, message.to), JSON.stringify(message))
      .hset(getUserKey(message.from), message.to, 0)
      .hincrby(getUserKey(message.to), message.from, 1);
    return Promise.denodeify(commandSequence.exec).call(commandSequence)
      .then(function () {
        return message;
      });
  },
  markDialogAsReceived: function (fromUser, toUser) {
    return Promise.denodeify(db.hset).call(
      db,
      getUserKey(toUser), fromUser, 0
    );
  },
  getDialog: function (userId1, userId2) {
    return Promise.denodeify(db.lrange).call(
      db,
      getDialogKey(userId1, userId2), 0, -1
    ).then(function (messages) {
      return messages.map(function (message) {
        return JSON.parse(message);
      });
      return messages;
    });
  },
  getDialogs: function (userId) {
    return Promise.denodeify(db.hgetall).call(
      db,
      getUserKey(userId)
    ).then(function (result) {
      return _.map(result, function (value, key) {
        return {
          _id: key,
          unreadMessageCount: parseInt(value, 10)
        };
      });
    });
  }
};
