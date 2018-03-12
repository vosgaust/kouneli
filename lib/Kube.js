const KubeApi = require('kubernetes-client');

const KINDS = {
  Deployment: 'deployments'
};

class Kube {
  constructor(opts) {
    const incluster = typeof opts.incluster !== 'undefined' ? opts.incluster : false;
    const namespace = opts.namespace || 'default';
    this.kind = KINDS[opts.kind] || 'deployments';
    this.target = opts.target;
    let kubeConfig;
    if(incluster) {
      kubeConfig = KubeApi.config.getInCluster();
    } else {
      kubeConfig = KubeApi.config.fromKubeconfig();
    }
    Object.assign(kubeConfig, { promises: true });
    const extensions = new KubeApi.Extensions(kubeConfig);
    this.kube = extensions.ns(namespace);
  }

  scale(newReplicas) {
    const payload = {
      body: {
        spec: { replicas: newReplicas }
      }
    };
    return this.kube[this.kind].patch(payload);
  }

  getState() {
    return this.kube[this.kind].get();
  }
}

module.exports = Kube;
