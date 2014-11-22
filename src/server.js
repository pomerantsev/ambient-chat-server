var config = require('./config.js');
var storage = require('./storage.js');
var notifications = require('./notifications.js');
var pushNotifications = require('./push-notifications.js');

var io = require('socket.io')(config.port);

io.on('connection', function (client) {
  function deleteClientConnection () {
    if (client.user) {
      unsubscribe();
      client.user = null;
    }
  }

  function unsubscribe () {
    if (client.subscriberClient) {
      notifications.unsubscribe(client.subscriberClient);
      client.subscriberClient = null;
    }
  }

  client.on('login', function (user, successCallback) {
    if (!client.user) {
      storage.authenticate(user.id)
        .then(function (authenticatedUser) {
          if (!authenticatedUser) {
            client.disconnect();
          } else {
            client.user = authenticatedUser;
            pushNotifications.registerDevice(user.id, user.regId);
            successCallback();
          }
        });
    }
  });
  client.on('logout', function (successCallback) {
    deleteClientConnection();
    successCallback();
  });
  client.on('getDialogs', function (successCallback) {
    if (client.user) {
      storage.getDialogs(client.user.id)
        .then(function (dialogs) {
          successCallback(dialogs);
        });
    } else {
      // handle error
    }
  });
  client.on('startSession', function (userId, successCallback) {
    if (client.user) {
      storage.getDialog(userId, client.user.id)
        .then(function (messages) {
          unsubscribe();
          client.subscriberClient = notifications.subscribe(client.user.id, userId, function (message) {
            client.emit('message', message);
          });
          successCallback(messages);
          storage.markDialogAsReceived(userId, client.user.id);
        });
    } else {
      // handle error
    }
  });
  client.on('endSession', function (successCallback) {
    if (client.user) {
      unsubscribe();
    } else {
      // handle error
    }

  });

  client.on('disconnect', function () {
    deleteClientConnection();
  });

  client.on('message', function (message, successCallback) {
    if (client.user) {
      if (message.to && message.text && message.to !== client.user.id) {
        message.from = client.user.id;
        return storage.storeMessage(message)
          .then(function (storedMessage) {
            notifications.publish(storedMessage);
          });
      }
    } else {
      // handle error
    }
  });
});
