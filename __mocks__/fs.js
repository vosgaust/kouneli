const fs = jest.genMockFromModule('fs');
const config = require('./config-example.json');

fs.readFileSync = function () {
  return JSON.stringify(config);
};

module.exports = fs;
