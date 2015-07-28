/**
 * @module data-api
 * @summary: This module's purpose is to: abstract the underlying persistence layer
 * from the business logic.
 *
 * @description:
 * If you don't always use DynamoDB here is where that would be abstracted.  Conditionals on tableName
 * and other parameters would route data through a different transport to be stored or retrieved from
 * a different persistent medium.  In that case, this should be moved to a module "dynamo" and
 * included here seperately to abstract the dynamo specific logic and let this module simply
 * call the correct "database driver" methods and return results.
 *
 * Author: Justin Mooser
 * Created On: 2015-07-06.
 * @license Apache-2.0
 */

"use strict";

var p = require('bluebird'),
  _ = require('lodash');


module.exports = function construct(config, logger) {
  var m = {};
  config = config ? config : {};
  config = _.defaults(config, {});

  logger = logger || {log: _.empty, error: _.empty};
  var Dynamite = require('dynamite');
  var dynamite = new Dynamite.Client(config.aws);

  /**
   * Stores data about tables in the database so that keys and indexes can be queried effectively.
   * @type {{}}
   */
  config.tables = {};

  m.update = function (table, filter, item) {
    var query = dynamite.newUpdateBuilder(table);
    return m.init(table)
      .then(function(tableMeta) {
        logger.debug('Processing filters...');
        processFilter(tableMeta, query, filter);
        query.enableUpsert();
        _.each(item, function(val, key) {
          query.putAttribute(key, val);
        });
        //_.each(params.addItem, function(val, key) {
        //  query.addToAttribute(key, val);
        //});
        return executeQuery(query);
      });
  };

  m.delete = function(table, filter) {
    var query = dynamite.deleteItem(table);
    return m.init(table)
      .then(function(tableMeta) {
        processFilter(tableMeta, query, filter);
        return executeQuery(query);
      });
  };

  m.insert = function(table, params) {
    var query = dynamite.putItem(table, params.item);

    return executeQuery(query);
  };
  m.save = m.insert;

  m.insertMany = function(table, items) {

  };

  m.scan = function(table, params) {
    var query = dynamite.newScanBuilder(table);
    if(params.limit) {
      query.setLimit(params.limit);
    }
    return executeQuery(query, function(result) {
      return result.result;
    });
  };

  m.query = function(table, filter) {
    logger.debug('Starting query...');
    var query = dynamite.newQueryBuilder(table);
    return m.init(table)
      .then(function(tableMeta) {
        logger.debug('Processing filters...');
        processFilter(tableMeta, query, filter);
        // optional. Checkout `QueryBuilder.js` for all supported comp operators.
        // .indexLessThan('GSI range key name', value)
        return executeQuery(query, function(result) {
          if (result.result && result.result.length > 0) return result.result;
          else return null;
        });
      });
  };

  m.find = function(table, filter) {
    logger.debug('Starting find...');
    var query = dynamite.newQueryBuilder(table);
    return m.init(table)
      .then(function(tableMeta) {
        logger.debug('Processing filters...');
        processFilter(tableMeta, query, filter);
        // optional. Checkout `QueryBuilder.js` for all supported comp operators.
        // .indexLessThan('GSI range key name', value)
        return executeQueryOne(query);
      });
  };

  m.init = function(tableName) {
    var def = p.defer();
    if (!config.tables[tableName]) {
      recoverInfoAboutTable(tableName)
        .then(function(result) {
          return def.resolve(result);
        })
        .fail(function(err) {
          return def.reject(err);
        });
      return def.promise;
    }
    return p.resolve(config.tables[tableName]);
  };

  function recoverInfoAboutTable(tableName) {
    logger.log('describeTable: ', tableName);
    return dynamite.describeTable(tableName)
      .execute()
      .then(function(result) {
        var table = {gsi:{}};
        //GlobalSecondaryIndexes:
        //  [ { IndexName: 'userId-index',
        //    IndexSizeBytes: 0,
        //    IndexStatus: 'ACTIVE',
        //    ItemCount: 0,
        //    KeySchema: [Object],
        //    Projection: [Object],
        //    ProvisionedThroughput: [Object] } ],
        //    ItemCount: 0,
        //  KeySchema: [ { AttributeName: 'email', KeyType: 'HASH' } ],
        //logger.log('Table Meta:', result.Table.GlobalSecondaryIndexes[0]);
        table.hash = _.result(_.find(result.Table.KeySchema, {KeyType: 'HASH'}), 'AttributeName');
        table.range = _.result(_.find(result.Table.KeySchema, {KeyType: 'RANGE'}), 'AttributeName');
        _.each(result.Table.GlobalSecondaryIndexes, function(index) {
          table.gsi[index.IndexName.replace('-index','')] = true
        });

        config.tables[tableName] = table;
        logger.log('MetaTable:', tableName, table);
        return table;
      });
  }

  /**
   * executeQueryOne: resolves the first row returned from the query results.
   * @param q
   * @param resultAdapter - override the default result transform (which returns first row.)
   * @returns {*}
   */
  function executeQueryOne(q) {
    return executeQuery(q, function(result) {
      return result.result[0];
    });
  }

  function executeQuery(q, resultAdapter) {
    logger.debug('Executing query...');
    var def = p.defer();
    q.execute()
      .then(function(result) {
        logger.debug('Query finished:', result);
        if (resultAdapter) def.resolve(resultAdapter(result));
        return def.resolve(result);
      })
      .fail(function(err) {
        logger.debug('Query failed.', err);
        return def.reject(err);
      });
    return def.promise;
  }

  function processFilter(table, query, filter) {
    _.each(filter, function(val, key) {
      if (table.hash == key) {
        console.log('SETTING HASH', key, val);
        query.setHashKey(key, val);
      }
      if (table.range == key) {
        query.setRangeKey(key, val);
      }
      if (table.gsi[key]) {
        query.setIndexName(key+'-index');
        query.setHashKey(key, val);
      }
      // optional. Checkout `QueryBuilder.js` for all supported comp operators.
      // .indexLessThan('GSI range key name', value)
    });
  }

  return m;
};