/**
 * @module myModule
 * @summary: This module's purpose is to:
 *
 * @description:
 *
 * Author: Justin Mooser
 * Created On: 2015-07-06.
 * @license Apache-2.0
 */

"use strict";

var p = require('bluebird'),
  _ = require('lodash');

var ModuleUnderTest = require('./data-api');

function createTable(db, tableName, hashKey, rangeKey) {
  var def = p.defer();
  var opts = {
    TableName: tableName,
    AttributeDefinitions: [
      {AttributeName: hashKey, AttributeType: "S"}
    ],
    KeySchema: [
      {AttributeName: hashKey, KeyType: "HASH"}
    ],
    ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1}
  };

  if (rangeKey) {
    opts.AttributeDefinitions.push({
      AttributeName: rangeKey,
      AttributeType: "S"
    });
    opts.KeySchema.push({
      AttributeName: rangeKey,
      KeyType: "RANGE"
    });
  }
  db.createTable(opts, function(err, data) {
    if (err) return def.reject(err);
    return def.resolve(data);
  });
  return def.promise;
}

describe('data-api', function() {
  var m, item;

  beforeEach(function () {
    item = {name: 'testname', date: '1000' };
    console.debug = console.log;
    m = ModuleUnderTest(global.config, console);
  });

  before(function() {
    return createTable(new AWS.DynamoDB(), 'test-table', 'name', 'date')
      .catch(function(err) {
        if (!(err.toString().indexOf('exists') >= 0)) {
          throw err;
        }
      });
  });

  describe('insert(tableName, params)', function() {
    it('resolves true on success.', function() {
      return m.insert('test-table', { item: {name: 'testRow', date: '1230920192' } })
        .then(function(result) {
          expect(result).to.deep.equal(true);
        });
    });

    it('can retrieve the object just inserted', function() {
      return m.insert('test-table', { item:item})
        .then(function(result) {
          return m.query('test-table', {name: item.name})
        })
        .then(function(result) {
          expect(result[0]).to.deep.equal(item);
        });
    });
  });

  describe('query(tableName, params)', function() {
    it('resolves an item by key.', function() {
      return m.query('test-table', {name: item.name})
        .then(function(result) {
          expect(result[0]).to.deep.equal(item);
        });
    });

    it('resolves null when key doesnt exist.', function() {
      return m.query('test-table', {"name": "nonexistent"})
        .then(function(result) {
          expect(result).to.equal(null);
        });
    })
  });

  describe('update(tableName, params)', function() {
    it('updates an item', function() {
      return m.update('test-table', {name: item.name, date: '1000'}, { test: '2000' })
        .then(function(result) {
          console.log('Update RESULT=', result);
          return m.query('test-table', {name: item.name});
        })
        .then(function(result) {
          expect(result).to.deep.equal([{name: 'testname', date: '1000', test: '2000'}]);
        });
    });

    // it doesnt support incrementing.
    xit('supports increment updates.', function() {
      return m.update('test-table', {name: item.name}, { date: 10 })
      .then(function(result) {
          console.log('IncUpdate RESULT=', result);
        return m.query('test-table', {name: item.name});
      })
      .then(function(result) {
        expect(result).to.deep.equal([{name: 'testname', date: '2010'}]);
      });
    });
  });

  describe('delete(tableName, params)', function() {
    it('deletes an item', function() {
      return m.delete('test-table', {name: item.name, date: '1000'})
      .then(function() {
        return m.query('test-table', {name: item.name});
      })
      .then(function(result) {
        expect(result).to.equal(null);
      });
    });
  });

  describe('scan(tableName, params)', function() {
    it('it returns params.limit rows', function() {
      return m.scan('log', {limit: 10})
        .then(function(rows) {
          expect(rows.length).to.equal(10);
        })
    });
  });
});