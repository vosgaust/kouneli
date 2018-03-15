const kubeApi = jest.genMockFromModule('kubernetes-client');

const get = jest.fn(() => Promise.resolve({ status: { replicas: 5 } }));
const patch = jest.fn(() => Promise.resolve());
const deployments = jest.fn().mockImplementation(() => {
  const response = {
    get: get,
    patch: patch
  };
  return response;
});
const ns = jest.fn().mockReturnValue({ deployments: deployments });
const Extensions = jest.fn(function() {
  this.ns = ns;
});


kubeApi.Extensions = Extensions;

kubeApi.getMock = get;
kubeApi.patchMock = patch;
kubeApi.nsMock = ns;

kubeApi.config.getInCluster.mockReturnValue({});
kubeApi.config.fromKubeconfig.mockReturnValue({});

module.exports = kubeApi;
