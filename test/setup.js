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


global.p = require('bluebird');
global._ = require('lodash');

global.chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
global.sinon = require("sinon");
global.sinonChai = require("sinon-chai");
global.sinonAsPromised = require('sinon-as-promised')(p);

var chaiSubset = require('chai-subset');
chai.use(chaiSubset);
chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.config.includeStack = true;

global.expect = chai.expect;

module.exports = function(config, log) {
  config = config || require('./config')()
  log = log || require('win-with-logs')(config.logging)

  global.ioc = require('../setup')(config, log)('testcontainer')
  return global.ioc
}
