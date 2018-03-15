const Kube = require('../../lib/Kube');
const KubeApi = require('kubernetes-client');

describe('getState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('get state works', () => {
    const kube = new Kube();
    kube.getState();
    expect(KubeApi.getMock.mock.calls).toHaveLength(1);
  });
});

describe('scale', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('patch is called with proper arguments', () => {
    const newReplicas = 5;
    const patchArguments = { body: { spec: { replicas: newReplicas } } };
    const kube = new Kube();
    kube.scale(newReplicas);
    expect(KubeApi.patchMock.mock.calls).toHaveLength(1);
    expect(KubeApi.patchMock.mock.calls[0][0]).toEqual(patchArguments);
  });
});

describe('constructor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Initializes with default values', () => {
    const kube = new Kube({ target: 'testTarget' });
    expect(kube).toHaveProperty('kind', 'deployments');
    expect(KubeApi.config.fromKubeconfig.mock.calls).toHaveLength(1);
    expect(KubeApi.config.getInCluster.mock.calls).toHaveLength(0);
    expect(KubeApi.nsMock.mock.calls).toHaveLength(1);
    expect(KubeApi.nsMock.mock.calls[0][0]).toBe('default');
  });

  test('Initializes with incluster option', () => {
    const kube = new Kube({ incluster: true, target: 'testTarget' });
    expect(kube).toHaveProperty('kind', 'deployments');
    expect(KubeApi.config.fromKubeconfig.mock.calls).toHaveLength(0);
    expect(KubeApi.config.getInCluster.mock.calls).toHaveLength(1);
    expect(KubeApi.nsMock.mock.calls).toHaveLength(1);
    expect(KubeApi.nsMock.mock.calls[0][0]).toBe('default');
  });

  test('Initializes with valid resource kind', () => {
    const kube = new Kube({ kind: 'Deployment', incluster: true, target: 'testTarget' });
    expect(kube).toHaveProperty('kind', 'deployments');
    expect(KubeApi.config.fromKubeconfig.mock.calls).toHaveLength(0);
    expect(KubeApi.config.getInCluster.mock.calls).toHaveLength(1);
    expect(KubeApi.nsMock.mock.calls).toHaveLength(1);
    expect(KubeApi.nsMock.mock.calls[0][0]).toBe('default');
  });

  test('Initializes with invalid resource kind defalts to deployment', () => {
    const kube = new Kube({ kind: 'NotValidKind', incluster: true, target: 'testTarget' });
    expect(kube).toHaveProperty('kind', 'deployments');
    expect(KubeApi.config.fromKubeconfig.mock.calls).toHaveLength(0);
    expect(KubeApi.config.getInCluster.mock.calls).toHaveLength(1);
    expect(KubeApi.nsMock.mock.calls).toHaveLength(1);
    expect(KubeApi.nsMock.mock.calls[0][0]).toBe('default');
  });

  test('Initializes with custom namespace', () => {
    const namespace = 'testnamespace';
    const kube = new Kube({ namespace: namespace, kind: 'NotValidKind', incluster: true, target: 'testTarget' });
    expect(kube).toHaveProperty('kind', 'deployments');
    expect(KubeApi.config.fromKubeconfig.mock.calls).toHaveLength(0);
    expect(KubeApi.config.getInCluster.mock.calls).toHaveLength(1);
    expect(KubeApi.nsMock.mock.calls).toHaveLength(1);
    expect(KubeApi.nsMock.mock.calls[0][0]).toBe(namespace);
  });
});
