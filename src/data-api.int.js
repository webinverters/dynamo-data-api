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

describe('data-api', function() {
  var m, item;
  this.timeout(80000)

  beforeEach(function () {
    item = {name: 'testname', date: '1000' };
    m = ModuleUnderTest(global.config, global.log);
  });

  before(function() {
    return dynamo.seedTable({
      tableName: 'test-table',
      keySchema: [{name: 'name', type:'S', keyType: 'HASH'}, {name: 'date', type:'S', keyType: 'RANGE'}]
    }, null, 12000)
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
      return m.insertMany('test-table', [
        {name: 'testname0', date: '1001', team: 'xyz', player: 'bobby' },
        {name: 'testname1', date: '1002' },
        {name: 'testname2', date: '1003' },
        {name: 'testname3', date: '1004' },
        {name: 'testname4', date: '1005' },
        {name: 'testname5', date: '1006' },
        {name: 'testname6', date: '1007' },
        {name: 'testname7', date: '1008' },
        {name: 'testname8', date: '1009' },
        {name: 'testname9', date: '1010' }
      ])
      .then(function() {
        return m.scan('test-table', {limit: 10})
      })
      .then(function(rows) {
        //console.log('ROWS:', rows);
        expect(rows.length).to.equal(10);
      });
    });
  });

  describe('find(tableName, filters', function() {
    it('finds a single item', function() {
      return m.find('test-table', {name: 'testname0', date: '1001' })
        .then(function(item) {
          expect(item.name).to.equal('testname0');
        });
    });

    it('finds with projections.', function() {
      return m.find('test-table', {name: 'testname0', date: '1001'}, 'team')
        .then(function(item) {
          expect(item.team).to.equal('xyz');
          expect(item.player).to.be.undefined;
        });
    });
  });

  describe('listTables()', function() {
    it('fetches a list of all the tables', function() {
      return m.listTables()
        .then(function(result) {
          console.log('Table List:', result)
        })
    })
  })

  describe('getRowCount(tableName, filters)', function() {
    it('it returns the row count.', function() {
      return m.getRowCount('test-table')
        .then(function(rowCount) {
          console.log('ROWS:', rowCount);
          expect(rowCount).to.equal(11);
        });
    });
  });
});
