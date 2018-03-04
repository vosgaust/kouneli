const RabbitManager = require('./lib/RabbitManager');
const Scaler = require('./lib/Scaler');
const KubeApi = require('kubernetes-client');
const winston = require('winston');
const fs = require('fs');

const CONFIG_FILE = './config.json';

let config = [];
if(fs.existsSync(CONFIG_FILE)) {
  config = config.concat(JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')));
}

if(process.env.CONFIG) {
  const extraConfig = process.env.CONFIG.split(';').map((queueConfig) => {
    const parameters = queueConfig.trim().split('|');
    return {
      queue: parameters[0],
      minCount: parameters[1],
      maxCount: parameters[2],
      maxNew: parameters[3],
      interval: parameters[4],
      namespace: parameters[5],
      targetKind: parameters[6],
      targetName: parameters[7]
    };
  });
  config = config.concat(extraConfig);
}

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

let kubeConfig;
if(process.env.INCLUSTER) {
  kubeConfig = KubeApi.config.getInCluster();
} else {
  kubeConfig = KubeApi.config.fromKubeconfig();
}
Object.assign(kubeConfig, { promises: true });

const kube = new KubeApi.Extensions(kubeConfig);

const k8sRabbitServiceName = process.env.KUBERNETES_RABBITMQ_SERVICE_NAME;
let rabbitHost = 'localhost';
if(k8sRabbitServiceName) {
  rabbitHost = process.env[`${k8sRabbitServiceName}_SERVICE_HOST`];
}

const rabbitManager = new RabbitManager({
  host: process.env.RABBITMQ_HOST || rabbitHost,
  port: process.env.RABBITMQ_PORT || '15672',
  user: process.env.RABBITMQ_USER || 'user',
  pass: process.env.RABBITMQ_PASS || 'user'
});

config.forEach((scaleConfig) => {
  const scaler = new Scaler(scaleConfig, rabbitManager, kube, logger);
  scaler.monitor();
});
