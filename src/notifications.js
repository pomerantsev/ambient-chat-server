var config = require('./config.js');
var storage = require('./storage.js');
var pushNotifications = require('./push-notifications.js');
var redis = require('redis');
var publisher = redis.createClient();

function channelId (userId1, userId2) {
  return config.prefix + '-message-' + userId1 + '-' + userId2;
}

function senderChannelId (senderId, recipientId) {
  return channelId(senderId, recipientId);
}

function recipientChannelId (senderId, recipientId) {
  return channelId(recipientId, senderId);
}

module.exports = {
  subscribe: function (subscribingUserId, otherUserId, callback) {
    var client = redis.createClient();
    client.subscribe(senderChannelId(subscribingUserId, otherUserId));
    client.on('message', function (channel, message) {
      callback(JSON.parse(message));
    });
    return client;
  },
  unsubscribe: function (client) {
    client.unsubscribe();
    client.end();
  },
  publish: function (message) {
    publisher.publish(senderChannelId(message.from, message.to), JSON.stringify(message));
    publisher.publish(recipientChannelId(message.from, message.to), JSON.stringify(message), function (_, subscriberCount) {
      if (subscriberCount) {
        storage.markDialogAsReceived(message.from, message.to);
      } else {
        pushNotifications.notify(message);
      }
    })
  }
};
