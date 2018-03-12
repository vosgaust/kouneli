
class Scaler {
  constructor(opts, rabbitManager, kube, logger) {
    opts = opts || {};
    this.queue = opts.queue;
    this.rabbitManager = rabbitManager;
    this.logger = logger;
    this.kube = kube;
    this.interval = opts.interval || 30;
    this.minCount = opts.minCount || 1;
    this.maxCount = opts.maxCount || 0;
    this.maxNew = opts.maxNew || 0;
  }

  monitor() {
    this.interval = setInterval(() => this._checkQueueStatus(), this.interval * 1000);
  }

  _checkQueueStatus() {
    this.rabbitManager.getMessagesInQueue(this.queue)
    .then(response => this.kube.getState()
    .then((result) => {
      this.logger.info(`Messages ready: ${response.ready}`);
      const currentReplicas = result.status.replicas;
      if(response.ready > 0 && currentReplicas < this.maxCount) {
        let newReplicas = response.ready > this.maxNew ? this.maxNew : response.ready;
        newReplicas = newReplicas + currentReplicas > this.maxCount ? this.maxCount - currentReplicas : newReplicas;
        this.logger.info(`Scaling to: ${currentReplicas + newReplicas}`);
        return this.kube.scale(currentReplicas + newReplicas);
      } else if(response.unacked === 0 && currentReplicas > this.minCount) {
        this.logger.info(`Scaling down to: ${this.minCount}`);
        return this.kube.scale(this.minCount);
      }
      return Promise.resolve();
    }))
    .catch(err => this.logger.error(`Error monitoring replicas ${err}`));
  }

  stop() {
    clearInterval(this.interval);
  }
}

module.exports = Scaler;
