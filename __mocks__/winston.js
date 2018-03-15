const winston = jest.genMockFromModule('winston');

winston.transports = {
  Console: jest.fn(),
  File: jest.fn()
};

module.exports = winston;
