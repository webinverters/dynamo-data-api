/**
* @summary: ______.
* @description: _____.
*
* @author: Robustly.io <m0ser>
* @date:   2016-02-26T01:32:00-05:00
* @email:  m0ser@robustly.io
* @lastAuthor:   m0ser
* @lastModified: 2016-02-28T00:59:18-05:00
* @license: Apache-2.0
*/

var config = require('../config')({component: 'unit-test'})
global.ioc = require('../setup')(config, null, {})

// TODO: Register all mocks here:
ioc.register('serviceOne', function() {
  return {
    interfaceOne: sinon.stub().returns(11)
  }
})
