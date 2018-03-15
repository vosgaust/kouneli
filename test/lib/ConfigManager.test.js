const ConfigManager = require('../../lib/ConfigManager');
const fs = require('fs');

jest.mock('fs');

describe('GetConfig', () => {
  test('Get configuration if only file provided', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const config = ConfigManager.getConfig();
    expect(config).toHaveLength(1);
    expect(config[0]).toHaveProperty('queue');
  });

  test('Get configuration if only env variable provided (single queue)', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    process.env.CONFIG = 'EchoQueue|1|10|5|10|default|Deployment|echo-node';
    const config = ConfigManager.getConfig();
    expect(config).toHaveLength(1);
    expect(config[0]).toHaveProperty('queue', 'EchoQueue');
  });

  test('Get configuration if only env variable provided (multiples queues)', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    process.env.CONFIG = 'EchoQueue|1|10|5|10|default|Deployment|echo-node;' +
                         'EchoQueue2|1|10|5|10|default|Deployment|echo-node';
    const config = ConfigManager.getConfig();
    expect(config).toHaveLength(2);
    expect(config[0]).toHaveProperty('queue', 'EchoQueue');
    expect(config[1]).toHaveProperty('queue', 'EchoQueue2');
  });

  test('Get configuration if both file and env provided', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    process.env.CONFIG = 'EchoQueue2|1|10|5|10|default|Deployment|echo-node';
    const config = ConfigManager.getConfig();
    expect(config).toHaveLength(2);
    expect(config[0]).toHaveProperty('queue', 'EchoQueue');
    expect(config[1]).toHaveProperty('queue', 'EchoQueue2');
  });
});
