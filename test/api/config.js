/**
* @summary: Test configuration file used by all types of tests.
* @description: _____.
*
* @author: Robustly.io <m0ser>
* @date:   2016-02-26T00:00:58-05:00
* @email:  m0ser@robustly.io
* @lastAuthor:   Auto
* @lastModified: 2016-03-10T20:45:09-05:00
* @license: Apache-2.0
*/



module.exports = function(params) {
  return {
    logging: {
      component: params.component || 'api-tests',
      app: params.app || 'module-base',
      env: params.env || 'test',
      debug: true
    },
    aws: {
      region: "us-east-1",
      apiVersions: {
        dynamodb: "2012-08-10"
      },
      accessKeyId: params.AWS_KEY || process.env.AWS_ACCESS_KEY,
      secretAccessKey: params.AWS_SECRET || process.env.AWS_SECRET
    }
  }
}
