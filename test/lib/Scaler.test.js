const Scaler = require('../../lib/Scaler');
const winston = require('winston');
const config = require('../../__mocks__/config-example.json');

const RabbitManager = jest.genMockFromModule('../../lib/RabbitManager');
const Kube = jest.genMockFromModule('../../lib/Kube');

jest.useFakeTimers();


describe('Scaler constructor', () => {
  test('It should create the scaler with default values', () => {
    const rabbitManager = new RabbitManager();
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: 5, unacked: 0 }));
    const scaler = new Scaler({}, rabbitManager, winston);
    expect(scaler).toHaveProperty('interval', 30);
    expect(scaler).toHaveProperty('minCount', 1);
    expect(scaler).toHaveProperty('maxCount', 0);
    expect(scaler).toHaveProperty('maxNew', 0);
  });

  test('It should create the scaler with default values if no opts passed', () => {
    const rabbitManager = new RabbitManager();
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: 5, unacked: 0 }));
    const scaler = new Scaler(null, rabbitManager, null, winston);
    expect(scaler).toHaveProperty('interval', 30);
    expect(scaler).toHaveProperty('minCount', 1);
    expect(scaler).toHaveProperty('maxCount', 0);
    expect(scaler).toHaveProperty('maxNew', 0);
  });

  test('It should catch the error if get promise failed', () => {
    const messagesPending = 4;
    const rabbitManager = new RabbitManager();
    Kube.prototype.getState = jest.fn().mockRejectedValue();
    Kube.prototype.scale = jest.fn().mockResolvedValue(true);
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: messagesPending, unacked: 0 }));
    const kube = new Kube({});
    const scaler = new Scaler(config[0], rabbitManager, kube, winston);

    scaler.monitor();
    jest.advanceTimersByTime(config[0].interval * 1000);
    return scaler.stop()
    .then(() => {
      expect(rabbitManager.getMessagesInQueue.mock.calls).toHaveLength(1);
      expect(Kube.prototype.getState.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls).toHaveLength(0);
    });
  });

  test('Single error should not make fail followings checks', () => {
    const messagesPending = 4;
    const deployedReplicas = 5;
    const rabbitManager = new RabbitManager();
    Kube.prototype.getState = jest.fn()
                                  .mockRejectedValueOnce()
                                  .mockResolvedValue({ status: { replicas: deployedReplicas } });
    Kube.prototype.scale = jest.fn().mockResolvedValue(true);
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: messagesPending, unacked: 0 }));
    const kube = new Kube({});
    const scaler = new Scaler(config[0], rabbitManager, kube, winston);

    scaler.monitor();
    const intervalsPassed = 3;
    jest.advanceTimersByTime(config[0].interval * intervalsPassed * 1000);
    return scaler.stop()
    .then(() => {
      expect(rabbitManager.getMessagesInQueue.mock.calls).toHaveLength(intervalsPassed);
      expect(Kube.prototype.getState.mock.calls).toHaveLength(intervalsPassed);
      expect(Kube.prototype.scale.mock.calls).toHaveLength(intervalsPassed - 1);
    });
  });

  test('Should make successive checks', () => {
    const messagesPending = 4;
    const deployedReplicas = 5;
    const rabbitManager = new RabbitManager();
    Kube.prototype.getState = jest.fn().mockResolvedValue({ status: { replicas: deployedReplicas } });
    Kube.prototype.scale = jest.fn().mockResolvedValue(true);
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: messagesPending, unacked: 0 }));
    const kube = new Kube({});
    const scaler = new Scaler(config[0], rabbitManager, kube, winston);

    scaler.monitor();
    const intervalsPassed = 5;
    jest.advanceTimersByTime(config[0].interval * intervalsPassed * 1000);
    return scaler.stop()
    .then(() => {
      expect(rabbitManager.getMessagesInQueue.mock.calls).toHaveLength(intervalsPassed);
      expect(Kube.prototype.getState.mock.calls).toHaveLength(intervalsPassed);
      expect(Kube.prototype.scale.mock.calls).toHaveLength(intervalsPassed);
    });
  });

  test('It should scale up (below max)', () => {
    const messagesPending = 4;
    const deployedReplicas = 5;
    const rabbitManager = new RabbitManager();
    Kube.prototype.getState = jest.fn().mockResolvedValue({ status: { replicas: deployedReplicas } });
    Kube.prototype.scale = jest.fn().mockResolvedValue(true);
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: messagesPending, unacked: 0 }));
    const kube = new Kube({});
    const scaler = new Scaler(config[0], rabbitManager, kube, winston);

    scaler.monitor();
    jest.advanceTimersByTime(config[0].interval * 1000);
    return scaler.stop()
    .then(() => {
      expect(rabbitManager.getMessagesInQueue.mock.calls).toHaveLength(1);
      expect(Kube.prototype.getState.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls[0][0]).toBe(messagesPending + deployedReplicas);
    });
  });

  test('It should scale up (using max new)', () => {
    const messagesPending = 6;
    const deployedReplicas = 5;
    const rabbitManager = new RabbitManager();
    Kube.prototype.getState = jest.fn().mockResolvedValue({ status: { replicas: deployedReplicas } });
    Kube.prototype.scale = jest.fn().mockResolvedValue(true);
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: messagesPending, unacked: 0 }));
    const kube = new Kube({});
    const scaler = new Scaler(config[0], rabbitManager, kube, winston);

    scaler.monitor();
    jest.advanceTimersByTime(config[0].interval * 1000);
    return scaler.stop()
    .then(() => {
      expect(rabbitManager.getMessagesInQueue.mock.calls).toHaveLength(1);
      expect(Kube.prototype.getState.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls[0][0]).toBe(config[0].maxNew + deployedReplicas);
    });
  });

  test('It should scale up to a limit if maxCount is surpassed', () => {
    const messagesPending = 5;
    const deployedReplicas = 7;
    const rabbitManager = new RabbitManager();
    Kube.prototype.getState = jest.fn().mockResolvedValue({ status: { replicas: deployedReplicas } });
    Kube.prototype.scale = jest.fn().mockResolvedValue(true);
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: messagesPending, unacked: 0 }));
    const kube = new Kube({});
    const scaler = new Scaler(config[0], rabbitManager, kube, winston);

    scaler.monitor();
    jest.advanceTimersByTime(config[0].interval * 1000);
    return scaler.stop()
    .then(() => {
      expect(rabbitManager.getMessagesInQueue.mock.calls).toHaveLength(1);
      expect(Kube.prototype.getState.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls[0][0]).toBe(config[0].maxCount);
    });
  });

  test('It should not scale (up or down) if no pending and still working', () => {
    const messagesPending = 0;
    const deployedReplicas = 5;
    const rabbitManager = new RabbitManager();
    Kube.prototype.getState = jest.fn().mockResolvedValue({ status: { replicas: deployedReplicas } });
    Kube.prototype.scale = jest.fn().mockResolvedValue(true);
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: messagesPending, unacked: 1 }));
    const kube = new Kube({});
    const scaler = new Scaler(config[0], rabbitManager, kube, winston);

    scaler.monitor();
    jest.advanceTimersByTime(config[0].interval * 1000);
    return scaler.stop()
    .then(() => {
      expect(rabbitManager.getMessagesInQueue.mock.calls).toHaveLength(1);
      expect(Kube.prototype.getState.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls).toHaveLength(0);
    });
  });

  test('It should not scale up if already at maximum', () => {
    const messagesPending = 4;
    const deployedReplicas = config[0].maxCount;
    const rabbitManager = new RabbitManager();
    Kube.prototype.getState = jest.fn().mockResolvedValue({ status: { replicas: deployedReplicas } });
    Kube.prototype.scale = jest.fn().mockResolvedValue(true);
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: messagesPending, unacked: 1 }));
    const kube = new Kube({});
    const scaler = new Scaler(config[0], rabbitManager, kube, winston);

    scaler.monitor();
    jest.advanceTimersByTime(config[0].interval * 1000);
    return scaler.stop()
    .then(() => {
      expect(rabbitManager.getMessagesInQueue.mock.calls).toHaveLength(1);
      expect(Kube.prototype.getState.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls).toHaveLength(0);
    });
  });

  test('It should not scale down if max already deployed and there are new messages', () => {
    const messagesPending = 4;
    const deployedReplicas = config[0].maxCount;
    const rabbitManager = new RabbitManager();
    Kube.prototype.getState = jest.fn().mockResolvedValue({ status: { replicas: deployedReplicas } });
    Kube.prototype.scale = jest.fn().mockResolvedValue(true);
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: messagesPending, unacked: 0 }));
    const kube = new Kube({});
    const scaler = new Scaler(config[0], rabbitManager, kube, winston);

    scaler.monitor();
    jest.advanceTimersByTime(config[0].interval * 1000);
    return scaler.stop()
    .then(() => {
      expect(rabbitManager.getMessagesInQueue.mock.calls).toHaveLength(1);
      expect(Kube.prototype.getState.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls).toHaveLength(0);
    });
  });

  test('It should scale down (to min) if no messages pending and all finished', () => {
    const messagesPending = 0;
    const deployedReplicas = 5;
    const rabbitManager = new RabbitManager();
    Kube.prototype.getState = jest.fn().mockResolvedValue({ status: { replicas: deployedReplicas } });
    Kube.prototype.scale = jest.fn().mockResolvedValue(true);
    rabbitManager.getMessagesInQueue.mockImplementation(() => Promise.resolve({ ready: messagesPending, unacked: 0 }));
    const kube = new Kube({});
    const scaler = new Scaler(config[0], rabbitManager, kube, winston);

    scaler.monitor();
    jest.advanceTimersByTime(config[0].interval * 1000);
    return scaler.stop()
    .then(() => {
      expect(rabbitManager.getMessagesInQueue.mock.calls).toHaveLength(1);
      expect(Kube.prototype.getState.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls).toHaveLength(1);
      expect(Kube.prototype.scale.mock.calls[0][0]).toBe(config[0].minCount);
    });
  });
});
