/* eslint-disable global-require */
const Scaler = require('../lib/Scaler');
const ConfigManager = require('../lib/ConfigManager');
const config = require('../__mocks__/config-example.json');

jest.mock('../lib/Scaler');
Scaler.prototype.monitor = jest.fn();
jest.mock('../lib/ConfigManager');
ConfigManager.getConfig.mockReturnValue(config);

describe('index', () => {
  test('it starts monitoring the queues', () => {
    require('../index');
    expect(Scaler.prototype.monitor.mock.calls).toHaveLength(1);
  });
});
