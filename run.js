if (!process.env.NODE_ENV) {
  require('dotenv').load();
}

var log = require('win-with-logs')({
  debug: true,
  name: 'test',
  component: 'run.js',
  app: 'dynamo-data-api',
  env: 'local',
  enableTrackedEvents: false
})

var config = {}
config.secrets = {
  TOKEN_SECRET: process.env.TOKEN_SECRET,
  AWS_KEY: process.env.AWS_KEY,
  AWS_SECRET: process.env.AWS_SECRET
}

config.aws = {
  region: "us-east-1",
  apiVersions: {
    dynamodb: "2012-08-10"
  },
  accessKeyId: config.secrets.AWS_KEY,
  secretAccessKey: config.secrets.AWS_SECRET,
  //sslEnabled: false, //process.env.DYNAMO_CONNSTR.indexOf('localhost') >= 0 ? true : false,
  //endpoint: 'http://localhost:4567'// process.env.DYNAMO_CONNSTR == 'dynamo' ? undefined : process.env.DYNAMO_CONNSTR
  //retryHandler: function (method, table) {
  //  console.log('AWS Retrying: ', method, table)
  //}
}

var dynamo = require('./index')(config, log)

dynamo.deleteAllTables()
.then(function() {
  console.log('Completed successfully')
})
.catch(function(err) {
  console.log(err)
  console.log('Failed to delete tables.')
})
