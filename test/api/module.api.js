/**
* @Author: Robustly.io <Auto>
* @Date:   2016-05-01T23:20:15-04:00
* @Email:  m0ser@robustly.io
* @Last modified by:   Auto
* @Last modified time: 2016-05-02T09:13:09-04:00
* @License: Apache-2.0
*/

describe('data-api', function() {
  var _testData = [];
  this.timeout(80000)

  beforeEach(function () {
    _testData = []
    for(var i=0; i<30;i++) {
      _testData.push({name: 'testname'+i, date: '10'+i, age: i })
    }
  })

  before(function() {
    var seedData = [{name: 'testname', date: '1', age: 1 }]
    return m.seedTable({
      tableName: 'test-table',
      keySchema: [{name: 'name', type:'S', keyType: 'HASH'}, {name: 'date', type:'S', keyType: 'RANGE'}]
    }, seedData)
  })

  describe('listTables()', function() {
    it('fetches a list of all the tables', function() {
      return m.listTables()
        .then(function(result) {
          expect(result).to.contain('test-table')
        })
    })
  })

  describe('describeTable(tableName)', function() {
    it('it returns info about table.', function() {
      return m.describeTable('test-table')
        .then(function(info) {
          expect(info.size).to.equal(0)
        })
    })
  })

  describe('put(params,opts)', function() {
    it('can retrieve the object just inserted')
    describe('If WriteCapacityUnits exceeded', function() {
      it('will retry until success')
      it('will not retry if opts.retry == false')
      it('will use opts.retry object (if supplied) as retry options.')
    })
  })

  describe('query(params,opts)', function() {
    it('pages query results if results.length > 1000')
    describe('If ReadCapacityUnits exceeded', function() {
      it('will retry until success')
      it('will not retry if opts.retry == false')
      it('will use opts.retry object (if supplied) as retry options.')
    })
  })

  describe('batchWrite(params)', function() {
    describe('If WriteCapacityUnits exceeded', function() {
      it('will retry until success')
      it('will not retry if opts.retry == false')
      it('will use opts.retry object (if supplied) as retry options.')
    })
  })

  describe('update(params,opts)', function() {
    it('updates an item')
    it('supports increment updates.')
    describe('If WriteCapacityUnits exceeded', function() {
      it('will retry until success')
      it('will not retry if opts.retry == false')
      it('will use opts.retry object (if supplied) as retry options.')
    })
  })

  describe('delete(params,opts)', function() {
    it('deletes an item')
  })

  describe('scan(tableName, params)', function() {
    it('it returns params.limit rows even if it exceeds api default (1000)')
    it('can be used to fetch all rows regardless of how many')
  })

  describe('get(params)', function() {
    describe('If ReadCapacityUnits exceeded', function() {
      it('will retry until success')
      it('will not retry if opts.retry == false')
      it('will use opts.retry object (if supplied) as retry options.')
    })
  })

  describe('lock(mutex)', function() {
    // http://vilkeliskis.com/blog/2015/08/27/distributed_locks_with_dynamodb.html
  })

  describe('unlock(mutex)', function() {

  })
})
