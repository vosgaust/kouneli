# kouneli
[![Build Status](https://travis-ci.org/vosgaust/kouneli.svg?branch=master)](https://travis-ci.org/vosgaust/kouneli)
[![Coverage Status](https://coveralls.io/repos/github/vosgaust/kouneli/badge.svg?branch=master)](https://coveralls.io/github/vosgaust/kouneli?branch=master)

Kubernetes autoscaler based on rabbit queue length written in node.

### Configuration
#### Queues
To set the queues to be watched and the resources to be scaled you have these variables:

- **queue**: name of the queue to watched
- **minCount**: minimun number of the resource that need to be deployed always
- **maxCount**: maximun number of the resource kouneli will scale to
- **maxNew**: maximun number of new resources kouneli will create when scaling up
- **interval**: time interval in seconds between kouneli checks the queue status
- **namespace**: namespace where the resource is deployed
- **targetKind**: kind of the resource (at this momment only Deployment is allowed)
- **targetName**: name of the deployed resource

You can configure kouneli using two different methods (both can work at the same time):

- Setting a `config.json` file. You can find an example at `config.json.example`. The downside of this method is that you will have to build the image each time you want to change the configuration.

- Setting the environment variable named `CONFIG`. You can find an example at `autoscaler-deployment.yaml`. You can use `;` as separator of different queues config and `|` as separator of each queue config parameters. The sintaxis is the following:

```
queue|minCount|maxCount|maxNew|interval|namespace|targetKind|targetName
```

The downside of this method is that you cannot watch queues with `|` or `;` in its names.

#### K8s
If you are deploying kouneli in the same cluster as the resources you want to watch, you have to set the environment variable `INCLUSTER` to true. Otherwise kouneli will take the configuration from your kubeconfig file.

#### Rabbit
To configure rabbit connection you can use these variables:

- **KUBERNETES_RABBITMQ_SERVICE_NAME**: name of the rabbitmq service if you have it deployed in the same cluster as kouneli
- **RABBITMQ_HOST**: hostname for rabbitmq

NOTE: you can provide one of these. If you provide both, `RABBITMQ_HOST` will prevail over `KUBERNETES_RABBITMQ_SERVICE_NAME`. If you provide none, the defalt value is `localhost`
- **RABBITMQ_PORT**: port for rabbitmq admin (default: `15672`)
- **RABBITMQ_USER**: user for rabbitmq
- **RABBITMQ_PASS**: password for rabbitmq
