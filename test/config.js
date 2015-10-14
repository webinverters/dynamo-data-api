if (!process.env.NODE_ENV) {
  require('dotenv').load();
}

require('win-common')({
  useTestGlobals: true
});

global.config = {};
config.aws ={
  region: "us-east-1",
  apiVersion: "2012-08-10",
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  sslEnabled: false,
  endpoint: 'localhost:4567'
  //retryHandler: function (method, table) {
  //  console.log('AWS Retrying: ', method, table)
  //}
};


global.AWS = require('aws-sdk');
console.log('Initializing AWS:', config.aws)
AWS.config.update(config.aws);

module.exports = config;

global.log = require('win-with-logs')(
  {enableTrackedEvents: false, name: 'dynamo-data-api', env: 'test', app: 'dynamo-data-api', debug: true}
);

global.dynamo = require('../index')(global.config, global.log);
