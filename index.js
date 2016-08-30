/**
* DynamoDataAPI provides a simple, promisified, and robust interface to DynamoDB.
*
* @module DynamoDataAPI
* @summary: a simple, promisified, and robust interface to DynamoDB.
* @description: wrapper of the DynamoDB api http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property
* which provides additional features and added robustness via automatic retry with exponential backoff.
* @author: Robustly.io <m0ser>
* @date:   2016-02-26T00:17:26-05:00
* @email:  m0ser@robustly.io
* @lastAuthor:   m0ser
* @lastModified: 2016-02-28T02:58:50-05:00
* @license: Apache-2.0
*/



function DynamoDataAPI() {}

/**
 * example - this module has an exampleAPI method that does nothing.
 *
 * @param  {type} config       description
 * @param  {type} log          description
 * @return {type}              description
 */
module.exports = function(config, log) {
  if (!config.aws || !config.aws.accessKeyId || !config.aws.secretAccessKey) {
    log.error('Missing aws config', config.aws)
    throw "Dynamo-Data-API: missing config.aws credentials."
  }
  config.aws.region = config.aws.region || 'us-east-1'

  var m = new (function DynamoDataAPI(){})(),
    _log = log.module('dynamo-data-api')

  var ioc = require('./setup')(config, log)('dynamo-data-api')
  var ddb = ioc.get('data-api')
  var m = new DynamoDataAPI()


  /**
   * seedTable - creates and optionally seeds a table with data.
   *
   * @param  {Object} table   table descriptor object
   * @param  {Array} seedData array of objects to insert into table.
   * @return {type} TODO: what does it return?
   */
  m.seedTable = function(table, seedData) {
    var log = _log.method('seedTable()', {table: table, seedData: seedData})
    return ddb.seedTable(table, seedData)
      .then(log.result)
      .catch(log.fail)
  }


  /**
   * listTables - gets a list of tables that are in the aws account.
   *
   * @return {Array}  A list of table names.
   */
  m.listTables = function() {
    var log = _log.method('listTables()', {})
    return ddb.listTables()
      .then(log.result)
      .catch(log.fail)
  }

  m.describeTable = function(tableName) {
    var log = _log.method('describeTable()', {})
    return ddb.describeTable()
      .then(log.result)
      .catch(log.fail)
  }

  /**
   * put - Creates a new item, or replaces an old item with a new item by delegating to AWS.DynamoDB.putItem().
   * @param  {Object} params A putItem parameter object.  Usually "TableName" and "Item".  See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
   * @return {type}   TODO: what does this return?
   */
  m.put = function(params, opts) {
    var log = _log.method('put()', {params: params, opts: opts})
    return ddb.put(params, opts)
      .then(log.result)
      .catch(log.fail)
  }


  /**
   * batchWrite - Puts or deletes multiple items in one or more tables by delegating to AWS.DynamoDB.batchWriteItem()
   *
   * @param  {type} params description
   * @param  {type} opts   description
   * @return {type}        description
   */
  m.batchWrite = function(params, opts) {
    var log = _log.method('batchWrite()', {params: params, opts: opts})
    return ddb.batchWrite(params, opts)
      .then(log.result)
      .catch(log.fail)
  }


  /**
   * delete - Deletes a single item in a table by primary key by delegating to AWS.DynamoDB.deleteItem().
   *
   * @param  {type} params description
   * @param  {type} opts   description
   * @return {type}        description
   */
  m.delete = function(params, opts) {
    var log = _log.method('delete()', {params: params, opts: opts})
    return ddb.delete(params, opts)
      .then(log.result)
      .catch(log.fail)
  }


  /**
   * get - Returns a set of attributes for the item with the given primary key by delegating to AWS.DynamoDB.getItem().
   *
   * @param  {type} params description
   * @param  {type} opts   description
   * @return {type}        description
   */
  m.get = function(params, opts) {
    var log = _log.method('get()', {params: params, opts: opts})
    return ddb.get(params, opts)
      .then(log.result)
      .catch(log.fail)
  }


  /**
   * query - Directly access items from a table by primary key or a secondary index.
   *
   * @param  {type} params description
   * @param  {type} opts   description
   * @return {type}        description
   */
  m.query = function(params, opts) {
    var log = _log.method('query()', {params: params, opts: opts})
    return ddb.query(params, opts)
      .then(log.result)
      .catch(log.fail)
  }


  /**
   * scan - Returns one or more items and item attributes by accessing every item in a table or a secondary index.
   *
   * @param  {type} params description
   * @param  {type} opts   description
   * @return {type}        description
   */
  m.scan = function(params, opts) {
    var log = _log.method('scan()', {params: params, opts: opts})
    return ddb.scan(params, opts)
      .then(log.result)
      .catch(log.fail)
  }


  /**
   * update - Edits an existing item's attributes, or adds a new item to the table if it does not already exist by delegating to AWS.DynamoDB.updateItem()
   *
   * @param  {type} params description
   * @param  {type} opts   description
   * @return {type}        description
   */
  m.update = function(params, opts) {
    var log = _log.method('update()', {params: params, opts: opts})
    return ddb.update(params, opts)
      .then(log.result)
      .catch(log.fail)
  }

  return m
}
