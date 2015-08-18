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

var dynamo = require('../index')(global.config, require('win-with-logs')(
  {enableTrackedEvents: false, name: 'dynamo-data-api', env: 'test', app: 'dynamo-data-api', debug: true}
));

global.seedTable = function (table, seedData) {
  return dynamo.createTable(table)
    .catch(function() {
      return dynamo.deleteTable(table.tableName)
        .delay(10000)
    })
    .then(function() {
      return dynamo.createTable(table)
    })
    .catch(function(err){
      console.log(err);
    })
    .then(function() {
      return dynamo.insertMany(table.tableName, seedData || []);
    });
};