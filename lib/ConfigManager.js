const fs = require('fs');

const CONFIG_FILE = './config.json';

module.exports.getConfig = function () {
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

  return config;
};
