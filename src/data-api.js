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


module.exports = function construct(config, log) {
  var m = {};
  config = config ? config : {};
  config = _.defaults(config, {});

  log = log || {log: _.empty, error: _.empty};
  var Dynamite = require('dynamite');
  var dynamite = new Dynamite.Client(config.aws);

  var aws = global.AWS || require('aws-sdk');
  var awsClient = new aws.DynamoDB(); // May need to pass it apiVersion: {apiVersion: '2012-08-10'}
  var dynamo = awsClient;
  var docClient = new require('dynamodb-doc').DynamoDB(awsClient);

  /**
   * Stores data about tables in the database so that keys and indexes can be queried effectively.
   * @type {{}}
   */
  config.tables = {};

  m.update = function (table, filter, item) {
    var query = dynamite.newUpdateBuilder(table);
    return m.init(table)
      .then(function(tableMeta) {
        log.debug('Processing filters...');
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


  /**
   * Supports params itself as "item" or params = { item: {item} }
   * @param table
   * @param params
   * @returns {*}
   */
  m.insert = function(table, params) {
    _.omit(params, _.filter(_.keys(params), function(key) { return _.isUndefined(params[key]) }))

    log.log('dynamo.insert()', table, params);
    var def = p.defer();
    docClient.putItem({
      TableName: table,
      Item: params.item || params
    }, function(err, data) {
      log.debug('dynamo-data-api.insert() RESULT:', {err:err, data:data});
      if (err) return def.reject(err);
      else {
        def.resolve(true);
      }
    });
    return def.promise;
  };
  m.save = m.insert;

  m.insertMany = function(table, items) {
    // TODO: implement using BatchWriteItem
    return p.map(items, function(item) {
      return m.insert(table, item);
    });
  };

  m.scan = function(table, params) {
    //var query = dynamite.newScanBuilder(table);
    //if(params.limit) {
    //  query.setLimit(params.limit);
    //}
    //return executeQuery(query, function(result) {
    //  return result.result;
    //});

    params = _.defaults(params || {}, {
      limit: 1000
    });

    var def = p.defer();
    docClient.scan({
      TableName: table,
      Limit: params.limit
    }, function(err, data) {
      if (err) return def.reject(err);
      else     {
        def.resolve(data.Items);
        console.log(data);
      }           // successful response
    });
    return def.promise;
  };

  m.query = function(table, filter, selection) {
    log.debug('Starting query...');
    var query = dynamite.newQueryBuilder(table);
    return m.init(table)
      .then(function(tableMeta) {
        log.debug('Processing filters...');
        processFilter(tableMeta, query, filter);
        if (filter.limit) {
          query.setLimit(filter.limit);
        }
        if (filter.sort == 'desc') {
          query.scanBackward();
        }
        if (filter.sort == 'asc') {
          query.scanForward();
        }

        if (selection) query.selectAttributes(selection);

        // optional. Checkout `QueryBuilder.js` for all supported comp operators.
        // .indexLessThan('GSI range key name', value)
        return executeQuery(query, function(result) {
          if (result.result && result.result.length > 0) return result.result;
          else return null;
        });
      });
  };

  m.getRowCount = function(table, params) {
    log.debug('Starting getRowCount()...', table, params);

    var def = p.defer();

    awsClient.scan({
      TableName: table
    }, function(err, result) {
      if (err) {
        def.reject(err);
      }
      else {
        def.resolve(result.Count);
      }
    });
    return def.promise;
  };

  function expressionify(query,commaSeperatedString) {
    var selectors = commaSeperatedString.split(',');

    if (selectors.length < 1) {
      // TODO: replace with return robustError()
      log.error('@BAD_PARAMETER', {details: {commaSeperatedString: commaSeperatedString}});
      throw "dynamo-data-api.find(): selection should be a comma separated string";
    }
    var expression = "";

    _.each(selectors, function(selector) {
      var expressionKey = '#'+selector;

      query.ExpressionAttributeNames = query.ExpressionAttributeNames || {}

      query.ExpressionAttributeNames[expressionKey] = selector;
      expression+=expressionKey+',';
    });

    var projectionExpression =  expression.substr(0, expression.length-1);
    log.debug('dynamo-data-api.find(): projectionExpression', projectionExpression)
    return projectionExpression
  }

  m.find = function(table, filter, selection) {
    log.debug('Running dynamo-data-api.find()...');
    var query = {TableName: table};

    return m.init(table)
      .then(function(tableMeta) {
        log.debug('Processing filters...');
        docFilter(tableMeta, query, filter);

        if (selection) {
          query.ProjectionExpression = expressionify(query,selection);
        }

        // optional. Checkout `QueryBuilder.js` for all supported comp operators.
        // .indexLessThan('GSI range key name', value)
        return execute('query',query, function(result) {
          console.log('RESULT', result);
          return result.Items[0];
        });
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
    log.log('describeTable: ', tableName);
    return dynamite.describeTable(tableName)
      .execute()
      .then(function(result) {
        var table = {gsi:[]};
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
        //log.log('Table Meta:', result.Table.GlobalSecondaryIndexes[0]);
        table.hash = _.result(_.find(result.Table.KeySchema, {KeyType: 'HASH'}), 'AttributeName');
        table.range = _.result(_.find(result.Table.KeySchema, {KeyType: 'RANGE'}), 'AttributeName');
        _.each(result.Table.GlobalSecondaryIndexes, function(index) {
          var gsi = {indexName: index.IndexName };
          _.each(index.KeySchema, function(key) {
            if (key.KeyType == 'HASH') {
              gsi.hash = key;
            } else if (key.KeyType == 'RANGE') {
              gsi.range = key;
            }
          });
          table.gsi.push(gsi);
        });

        config.tables[tableName] = table;
        log.log('MetaTable:', JSON.stringify(table));
        return table;
      });
  }

  m.createTable = function(table) {
    var opts = {
      TableName: table.tableName,
      AttributeDefinitions: [],
      KeySchema: [],
      ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1}
    };

    var attributeNames = {};

    _.each(table.keySchema, function(attr) {
      if (!attributeNames[attr.name]) {
        attributeNames[attr.name] = 1;
        opts.AttributeDefinitions.push({
          AttributeName: attr.name,
          AttributeType: attr.type
        });
      }

      opts.KeySchema.push({
        AttributeName: attr.name,
        KeyType: attr.keyType
      });
    });

    _.each(table.gsiSchema, function(attrs) {
      opts.GlobalSecondaryIndexes = opts.GlobalSecondaryIndexes || [];
      var gsi = {
        "IndexName": attrs.name,
        "KeySchema": [
          {
            "AttributeName": attrs.hash,
            "KeyType": 'HASH'
          }
        ],
        "Projection": {
          "ProjectionType": attrs.projectionType || 'KEYS_ONLY'
        },
        "ProvisionedThroughput": {
          "ReadCapacityUnits": attrs.readUnits,
          "WriteCapacityUnits": attrs.writeUnits
        }
      };
      if (gsi.Projection.ProjectionType=='INCLUDE') {
        gsi.Projection["NonKeyAttributes"] = attrs.includeAttributes;
      }

      if (attrs.range) {
        gsi.KeySchema.push({
          "AttributeName": attrs.range,
          "KeyType": 'RANGE'
        });
        if (!attributeNames[attrs.range]) {
          attributeNames[attrs.range] = 1;
          opts.AttributeDefinitions.push({
            AttributeName: attrs.range,
            AttributeType: attrs.rangeType
          });
        }
      }

      if (!attributeNames[attrs.hash]) {
        attributeNames[attrs.hash] = 1;
        opts.AttributeDefinitions.push({
          AttributeName: attrs.hash,
          AttributeType: attrs.hashType
        });
      }

      opts.GlobalSecondaryIndexes.push(gsi);
    });

    var def = p.defer();

    dynamo.createTable(opts, function(err, r) {
      if (err) return def.reject(err);
      return def.resolve(r);
    });

    return def.promise;
  };

  m.deleteTable = function(tableName) {
    var def = p.defer();
    dynamo.deleteTable({TableName: tableName}, function(err, r) {
      if (err) return def.reject(err);
      return def.resolve(r);
    });
    return def.promise;
  };

  m.execute = execute;

  function executeQuery(q, resultAdapter) {
    log.debug('Executing query...');
    var def = p.defer();
    q.execute()
      .then(function(result) {
        log.debug('Query finished:', {QUERY_RESULT: result});
        if (resultAdapter) def.resolve(resultAdapter(result));
        return def.resolve(result);
      })
      .fail(function(err) {
        log.debug('Query failed.', err);
        return def.reject(err);
      });

    return def.promise;
  }

  function execute(action, params, resultAdapter) {
    log.debug('Executing', action, '...');
    var def = p.defer();

    log.debug('Executing Query:', params);

    docClient[action](params, function(err, result) {
      console.log('DYNAMORESULT=', result);
      if (err) return def.reject(err);
      return def.resolve(resultAdapter ? resultAdapter(result) : result);
    });

    return def.promise;
  }

  function processFilter(table, query, filter) {
    _.each(filter, function(val, key) {
      var gsiUsed = false;
      _.each(table.gsi, function(gsi) {
        var hashUsed=false;
        if (key == gsi.hash.AttributeName) {
          hashUsed = true;
          if (!gsi.range) {
            gsiUsed = true;
          }
          log.debug('ADDING GSI.HASH', gsi.hash, gsi.indexName)
          query.setIndexName(gsi.indexName);
          query.setHashKey(key, val);
        } else if (key==gsi.range.AttributeName) {
          if (hashUsed) gsiUsed = true;
          log.debug('ADDING GSI.RANGE', gsi.range, gsi.indexName)
          query.setRangeKey(key, val);
        }
      });

      if (!gsiUsed) {
        if (table.hash == key) {
          log.log('SETTING HASH', key, val);
          query.setHashKey(key, val);
        }
        if (table.range == key) {
          if (_.isObject(val)) {
            if (val['LESS_THAN_OR_EQUAL']) {
              query.indexLessThanEqual(key, val['LESS_THAN_OR_EQUAL']);
            }
          } else {
            query.setRangeKey(key, val);
          }
        }
      }
      // optional. Checkout `QueryBuilder.js` for all supported comp operators.
      // .indexLessThan('GSI range key name', value)
    });
  }

  function docFilter(table, query, filter) {
    _.each(filter, function(val, key) {
      var gsiUsed = false;
      _.each(table.gsi, function(gsi) {
        var hashUsed=false;
        if (key == gsi.hash.AttributeName) {
          hashUsed = true;
          if (!gsi.range) {
            gsiUsed = true;
          }
          log.debug('ADDING GSI.HASH', gsi.hash, gsi.indexName)
          query.IndexName = gsi.indexName;
          addCondition(query, key, 'EQ', val);
        } else if (key==gsi.range.AttributeName) {
          if (hashUsed) gsiUsed = true;
          log.debug('ADDING GSI.RANGE', gsi.range, gsi.indexName)
          addCondition(query, key, 'EQ', val)
        }
      });

      if (!gsiUsed) {
        if (table.hash == key) {
          log.debug('SETTING HASH', key, val);
          addCondition(query, key, 'EQ', val)
        }
        if (table.range == key) {
          if (_.isObject(val)) {
            if (val['LESS_THAN_OR_EQUAL']) {
              addCondition(query, key, 'LTE', val['LESS_THAN_OR_EQUAL']);
            }
          } else {
            log.debug('SETTING RANGE:', key,val);
            addCondition(query, key, 'EQ', val);
          }
        }
      }
    });
}

  // assumes all the words are reserved and uses attribute names for everything...
  function addCondition(query, key, operator, val) {
    var expressionKey = '#'+key;
    var expressionVal = ':'+key;

    query.ExpressionAttributeNames = query.ExpressionAttributeNames || {}
    query.ExpressionAttributeValues= query.ExpressionAttributeValues || {}
    if (!query.ExpressionAttributeNames[expressionKey]) {
      query.ExpressionAttributeNames[expressionKey] = key;
      query.ExpressionAttributeValues[expressionVal] = val;
      if (query.KeyConditionExpression)
        query.KeyConditionExpression += " and " + expressionKey + " = " + expressionVal
      else query.KeyConditionExpression = expressionKey + " = " + expressionVal
    }
  }

  return m;
};