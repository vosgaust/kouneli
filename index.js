const RabbitManager = require('./lib/RabbitManager');
const Scaler = require('./lib/Scaler');
const Kube = require('./lib/Kube');
const winston = require('winston');
const ConfigManager = require('./lib/ConfigManager');

const config = ConfigManager.getConfig();
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

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
  const kube = new Kube({
    namespace: scaleConfig.namespace,
    target: scaleConfig.targetName,
    kind: scaleConfig.targetKind,
    incluster: process.env.INCLUSTER
  });
  const scaler = new Scaler(scaleConfig, rabbitManager, kube, logger);
  scaler.monitor();
});
