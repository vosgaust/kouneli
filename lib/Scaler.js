class Scaler {
  constructor(opts, rabbitManager, kube, logger) {
    this.queue = opts.queue;
    this.targetName = opts.targetName;
    this.rabbitManager = rabbitManager;
    this.logger = logger;
    this.kube = kube.ns(opts.namespace || 'default');
    this.interval = opts.interval || 30;
    this.kind = opts.targetKind || 'Deployment';
    this.minCount = opts.minCount || 1;
    this.maxCount = opts.maxCount || 0;
    this.maxNew = opts.maxNew || 0;
  }

  monitor() {
    this.interval = setInterval(() => this._checkQueueStatus(), this.interval * 1000);
  }

  _checkQueueStatus() {
    this.rabbitManager.getMessagesInQueue(this.queue)
    .then(response => this.kube.deployments(this.targetName).get()
    .then((result) => {
      this.logger.info(`Messages ready: ${response.ready}`);
      const currentReplicas = result.status.replicas;
      if(response.ready > 0 && currentReplicas < this.maxCount) {
        let newReplicas = response.ready > this.maxNew ? this.maxNew : response.ready;
        newReplicas = newReplicas + currentReplicas > this.maxCount ? this.maxCount - currentReplicas : newReplicas;
        this.logger.info(`Scaling to: ${currentReplicas + newReplicas}`);
        const patch = { spec: { replicas: currentReplicas + newReplicas } };
        return this.kube.deployments(this.targetName).patch({ body: patch });
      } else if(response.unacked === 0 && currentReplicas > this.minCount) {
        this.logger.info(`Scaling down to: ${this.minCount}`);
        const patch = { spec: { replicas: this.minCount } };
        return this.kube.deployments(this.targetName).patch({ body: patch });
      }
      return Promise.resolve();
    }))
    .catch(err => this.logger.error(`Error monitoring replicas ${err}`));
  }
}

module.exports = Scaler;
