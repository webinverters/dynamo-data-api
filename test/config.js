if (!process.env.NODE_ENV) {
  require('dotenv').load();
}

require('win-common')({
  useTestGlobals: true
});

console.log('FUCKERS', process.env.AWS_KEY);
global.config = {};
config.aws ={
  region: "us-east-1",
  apiVersion: "2012-08-10",
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET
  //,sslEnabled: false,
  //endpoint: 'localhost:4567'
  //retryHandler: function (method, table) {
  //  console.log('AWS Retrying: ', method, table)
  //}
};

global.AWS = require('aws-sdk');
AWS.config.update(config.aws);

module.exports = config;