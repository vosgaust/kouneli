const RabbitManager = require('../../lib/RabbitManager');
const request = require('request-promise-native');

jest.mock('request-promise-native');
request.get.mockResolvedValue(true);

describe('constructor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('init with default values', () => {
    const rabbit = new RabbitManager();
    expect(rabbit).toHaveProperty('host', 'localhost');
    expect(rabbit).toHaveProperty('user', 'user');
    expect(rabbit).toHaveProperty('pass', 'pass');
    expect(rabbit).toHaveProperty('port', '15672');
  });

  test('init with custom values', () => {
    const host = 'testhost';
    const user = 'testuser';
    const pass = 'testpass';
    const port = '10';
    const rabbit = new RabbitManager({ host, user, pass, port });
    expect(rabbit).toHaveProperty('host', host);
    expect(rabbit).toHaveProperty('user', user);
    expect(rabbit).toHaveProperty('pass', pass);
    expect(rabbit).toHaveProperty('port', port);
  });
});

describe('getMessagesInQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getMessages with given queue and default vhost', () => {
    const host = 'testhost';
    const user = 'testuser';
    const pass = 'testpass';
    const port = '10';
    const queue = 'testqueue';
    const expectedURL = `http://${host}:${port}/api/queues/%2f/${queue}`;
    const expectedPayload = { auth: { user: user, pass: pass, sendImmediately: true } };
    const rabbit = new RabbitManager({ host, user, pass, port });
    return rabbit.getMessagesInQueue(queue)
    .then(() => {
      expect(request.get.mock.calls).toHaveLength(1);
      expect(request.get.mock.calls[0][0]).toBe(expectedURL);
      expect(request.get.mock.calls[0][1]).toEqual(expectedPayload);
    });
  });

  test('getMessages with given queue and vhost', () => {
    const host = 'testhost';
    const user = 'testuser';
    const pass = 'testpass';
    const port = '10';
    const queue = 'testqueue';
    const vhost = 'testvhost';
    const expectedURL = `http://${host}:${port}/api/queues/${vhost}/${queue}`;
    const expectedPayload = { auth: { user: user, pass: pass, sendImmediately: true } };
    const rabbit = new RabbitManager({ host, user, pass, port });
    return rabbit.getMessagesInQueue(queue, vhost)
    .then(() => {
      expect(request.get.mock.calls).toHaveLength(1);
      expect(request.get.mock.calls[0][0]).toBe(expectedURL);
      expect(request.get.mock.calls[0][1]).toEqual(expectedPayload);
    });
  });
});
