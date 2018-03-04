const request = require('request-promise-native');

class RabbitManager {
  constructor(opts) {
    this.host = opts.host || 'localhost';
    this.user = opts.user || 'user';
    this.pass = opts.pass || 'pass';
    this.port = opts.port || '15672';
    this.url = `http://${this.host}:${this.port}`;
  }

  getQueueInfo(queue, vhost) {
    if(!vhost) {
      vhost = '%2f';
    }
    return request.get(`${this.url}/api/queues/${vhost}/${queue}`, {
      auth: {
        user: 'user',
        pass: 'user',
        sendImmediately: true
      }
    });
  }

  getMessagesInQueue(queue, vhost) {
    return this.getQueueInfo(queue, vhost)
    .then((response) => {
      const queueInfo = JSON.parse(response);
      return { total: queueInfo.messages, unacked: queueInfo.messages_unacknowledged, ready: queueInfo.messages_ready };
    });
  }
}

module.exports = RabbitManager;
