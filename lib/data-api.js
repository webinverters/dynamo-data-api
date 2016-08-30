/**
* @Author: Robustly.io <Auto>
* @Date:   2016-03-16T02:19:09-04:00
* @Email:  m0ser@robustly.io
* @Last modified by:   Auto
* @Last modified time: 2016-05-02T09:16:59-04:00
* @License: Apache-2.0
*/

"use strict";

var p = require('bluebird'),
  _ = require('lodash')

function DataAPI() {}
module.exports = function construct(config, log, docClient, awsClient) {
  var m = new DataAPI(), _log = log

  m.update = function(params, options) {
    var log = _log.goal('update()', {params: params, options: options})
    return p.resolve()
  };

  m.delete = function(params, options) {
    var log = _log.goal('delete()',  {params: params, options: options})
    return p.resolve()
  };

  /**
   * Supports params itself as "item" or params = { item: {item} }
   * @param table
   * @param params
   * @returns {*}
   */
  m.put = function(params, options, log) {
    // TODO: implement retry
    return docClient.putAsync(params)
  };

  m.query = function(table, filter, selection) {

  };

  var describeTable = p.promisify(awsClient.describeTable)
  m.describeTable = function(tableName) {
    var params = {
      TableName: tableName /* required */
    };
    return describeTable(params)
  }

  m.listTables = function() {
    var def = p.defer()
    var params = {
      //ExclusiveStartTableName: 'STRING_VALUE',
      //Limit: 0
    };
    awsClient.listTables(params, function(err, data) {
      if (err) {
        log.error('List tables failed', err)
        def.reject(err)
      }
      else {
        def.resolve(data.TableNames)
      }
    })
    return def.promise
  }

  m.deleteAllTables = function() {
    return m.listTables()
      .map(function(tableName) {
       log.log('Deleting table...', {tableName: tableName})
        return m.deleteTable(tableName)
          .then(function() {
           log.log('Successfully deleted table', {tableName: tableName})  // these are the types of logs I'd like to formalize...
          })
          .catch(function(err) {
           log.log(
            'Failed to delete table', {tableName: tableName})
            throw log.errorReport('DELETE_TABLE_FAILED', {tableName: tableName}, err)
          })
      }, {concurrency: 8})
  }

  /**
   * Wait for a given table to enter into a given state.
   *
   * @param  {[type]} tableName [description]
   * @param  {[type]} state     'tableExists' || 'tableNotExists'
   * @return {[type]}           [description]
   */
  m.waitForTable = function(tableName, state) {
    var def = p.defer()

    var params = {
      TableName: tableName
    };

    awsClient.waitFor(state, params, function(err, data) {
      if (err) {
        console.log(err, err.stack) // an error occurred
        def.reject(err)
      }
      else  {
        console.log(data)           // successful response
        def.resolve(data)
      }
    });

    return def.promise
  }

  m.createTable = function(table) {
    var ctx = _log.method('createTable()', {table: table})

    var opts = {
      TableName: table.tableName,
      AttributeDefinitions: [],
      KeySchema: [],
      ProvisionedThroughput: {ReadCapacityUnits: table.readUnits || 1, WriteCapacityUnits: table.writeUnits || 1}
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

    if (table.streams) {
      opts.StreamSpecification={
        StreamEnabled: true,
        StreamViewType: table.streams
      }
    }

    var def = p.defer();

    ctx.debug('Calling createTable', opts)
    awsClient.createTable(opts, function(err, r) {
      if (err) {
        ctx.error('Failed to create table.', err);
        return def.reject(err);
      }
      return m.waitForTable(table.tableName, 'tableExists')
        .then(function() {
          return def.resolve(ctx.result(r));
        })
    });

    return def.promise;
  };

  m.deleteTable = function(tableName) {
    log.log('deleteTable()', tableName)
    var def = p.defer();
    awsClient.deleteTable({TableName: tableName}, function(err, r) {
      log.log('deleteTable response:', err, r)

      if (err) return def.reject(err);

      return m.waitForTable(tableName, 'tableNotExists')
        .then(function() {
          return def.resolve(r);
        })
    })
    return def.promise;
  };

  m.seedTable = function (table, seedData, delay, noDelete) {
    delay = delay || 12000;
    var _result;

    function failHandler(err) {
     log.log('Initialization log: ', {err:err})
      if (!noDelete) {
        throw err
      }
    }

    var deleteTable = function(table) {
      return m.deleteTable(table.tableName)
        .catch(function(err) {
          // intentionally swallow error
        })
      };

    if (noDelete) deleteTable = function() { return p.resolve() }

    return deleteTable(table)
      .then(function() {
        return m.createTable(table)
      })
      .then(function(result) {
        _result = result
      })
      .catch(failHandler)
      .then(function() {
        if(table.after) return table.after(_result).delay(delay)
      })
      .then(function() {
        if (seedData)
          return m.insertMany(table.tableName, seedData || []);
      })
      .then(function() {
        return _result;
      })
      .catch(failHandler)
  };

  return m
}
