/**
* @summary: Test setup that loads before any tests.
* @description:
*
* @author: Robustly.io <m0ser>
* @date:   2016-02-26T00:32:37-05:00
* @email:  m0ser@robustly.io
* @lastAuthor:   m0ser
* @lastModified: 2016-02-27T23:45:15-05:00
* @license: Apache-2.0
*/

require('dotenv').load()

var config = config || require('./config')({app: 'dynamo-data-api', component: 'dynamo-data-api', env: 'api-test'}),
  log = log || require('win-with-logs')(config.logging)
require('../setup')(config)
global.m = require('../../index')(config,log)
