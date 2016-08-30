/**
* @summary: Wires up module.
* @description: Registers all services and returns an ioc container.
*
* @author: Robustly.io <m0ser>
* @date:   2016-02-25T23:42:08-05:00
* @email:  m0ser@robustly.io
* @lastAuthor:   Auto
* @lastModified: 2016-03-11T23:38:44-05:00
* @license: Apache-2.0
*/

var p = require('bluebird'),
  _ = require('lodash'),
  aws = require('aws-sdk');

module.exports = function(config, log) {
  if (!log) {
    log = muzzledlog
  }

  log = log.module('setup')

  return function(containerName) {
    var ioc = require('robust-ioc')({container: containerName, bail: true}, log)
    ioc.singleton('log', log)
    ioc.singleton('config', config)

    var awsClient = new aws.DynamoDB(config.aws)
    ioc.singleton('awsClient', awsClient)
    ioc.singleton('docClient', p.promisifyAll(new aws.DynamoDB.DocumentClient({service: awsClient})))
    ioc.register('data-api', require('./lib/data-api'))

    return ioc
  }
}

function muzzledlog() {}
muzzledlog.method = muzzledlog.module = muzzledlog.goal = function() {
  return muzzledlog
}
muzzledlog.info = muzzledlog.debug = muzzledlog.log = muzzledlog
muzzledlog.result = muzzledlog.succeed = muzzledlog.fail = muzzledlog.setResult = muzzledlog.rejectWithCode = muzzledlog
muzzledlog.error = muzzledlog.warn = muzzledlog.fatal = console.error.bind(console, '[ISSUE]')
