var storage = require('./storage.js');
var pushNotifications = require('./push-notifications.js');
var redis = require('redis');
var publisher = redis.createClient();

var channelPrefix = 'ambient-chat-message-';

function channelId (userId1, userId2) {
  return channelPrefix + userId1 + '-' + userId2;
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
      console.log('Client is being notified');
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
        console.log('Sending a push notification to the receiver');
      }
    })
  }
};
