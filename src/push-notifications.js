var config = require('./config.js');

var gcm = require('node-gcm');
var apn = require('apn');

var db = require('redis').createClient();

function getAndroidKey (userId) {
  return config.prefix + '-android-' + userId;
}

function notifyAndroid (message) {
  var pushNotification = new gcm.Message();
  // This is the API Key that corresponds to the senderID that's used by the Cordova app
  // when registering for push notifications.
  // Both are obtained from Google when registering an app for Google Cloud Messaging.
  var sender = new gcm.Sender('AIzaSyBzvyi75XORxCdGkUlONPqJv0eCXyrTO1A');
  pushNotification.addDataWithObject({text: message.text});

  db.smembers(getAndroidKey(message.to), function (_, regIds) {
    sender.send(pushNotification, regIds, 4, function (err, result) {

    });
  });
}

function notifyIos (message) {
}

module.exports = {
  registerDevice: function (userId, regId) {
    db.sadd(getAndroidKey(userId), regId, function (err, res) {
    });
    // The key containing all user's devices will expire in a month
    // after user logged in for the last time.
    db.expire(getAndroidKey(userId), 1 * 30 * 24 * 60 * 60);
  },
  notify: function (message) {
    notifyAndroid(message);
    notifyIos(message);
  }
};
