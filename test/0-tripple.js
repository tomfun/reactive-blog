'use strict';

//var test = require('unit.js');
//var expect = require('expect');
var should = require('should');
var _ = require('lodash');

import tripleBad from "../app/helpers/elastic/tripleBad.js";
import MetadataCollection from "../app/helpers/elastic/MetadataCollection.js";

describe("elastic tripleBad module", function () {
  it('noop', function () {
    var obj    = {},
        oldObj = {},
        newObj = {},
        result = {};
    tripleBad(obj, oldObj, newObj, {});
    obj.should.deepEqual(result)
  });
  it('must add simple', function () {
    var obj    = {},
        oldObj = {},
        newObj = {a: 1},
        result = {a: 1};
    tripleBad(obj, oldObj, newObj, {});
    obj.should.deepEqual(result)
  });
  it('must change simple', function () {
    var obj    = {a: 1},
        oldObj = {a: 1},
        newObj = {a: 2},
        result = {a: 2};
    tripleBad(obj, oldObj, newObj, {});
    obj.should.deepEqual(result)
  });
  it('must delete simple', function () {
    var obj    = {a: 1},
        oldObj = {a: 1},
        newObj = {},
        result = {};
    tripleBad(obj, oldObj, newObj, {});
    obj.should.deepEqual(result)
  });
  it('noop lvel 1', function () {
    var obj    = {a: {b: "b"}},
        oldObj = {a: {b: "b"}},
        newObj = {a: {b: "b"}},
        result = {a: {b: "b"}};
    tripleBad(obj, oldObj, newObj, {});
    obj.should.deepEqual(result)
  });
  it('must add lvel 1', function () {
    var obj    = {a: {b: "b"}},
        oldObj = {a: {b: "b"}},
        newObj = {a: {b: "b", c: "c"}},
        result = {a: {b: "b", c: "c"}};
    tripleBad(obj, oldObj, newObj, {});
    obj.should.deepEqual(result)
  });
  it('must change lvel 1', function () {
    var obj    = {a: {b: "b"}},
        oldObj = {a: {b: "b"}},
        newObj = {a: {b: "bb", c: "c"}},
        result = {a: {b: "bb", c: "c"}};
    tripleBad(obj, oldObj, newObj, {});
    obj.should.deepEqual(result)
  });
  it('must delete lvel 1', function () {
    var obj    = {a: {b: "b"}},
        oldObj = {a: {b: "b"}},
        newObj = {a: {c: "c"}},
        result = {a: {c: "c"}};
    tripleBad(obj, oldObj, newObj, {});
    obj.should.deepEqual(result)
  });
  it('must change lvel 1 -> 0', function () {
    var obj    = {a: {b: "b"}},
        oldObj = {a: {b: "b"}},
        newObj = {a: "aa"},
        result = {a: "aa"};
    tripleBad(obj, oldObj, newObj, {});
    obj.should.deepEqual(result)
  });
  it('must change to array', function () {
    var obj    = {a: "b"},
        oldObj = {a: "b"},
        newObj = {a: ["b"]},
        result = {a: ["b"]};
    tripleBad(obj, oldObj, newObj, {});
    obj.should.deepEqual(result)
  });
  it('must change object to array', function () {
    var obj    = {a: {b: "b"}},
        oldObj = {a: {b: "b"}},
        newObj = {a: [{b: "b"}]},
        result = {a: [{b: "b"}]};
    tripleBad(obj, oldObj, newObj, new MetadataCollection());
    obj.should.deepEqual(result)
  });
  it('lodash isEqual', function () {
    var obj    = {a: {b: "b"}},
        compore = {a: {b: "b"}};
    _.isEqual(obj, compore).should.be.True();
    obj.__proto__.proto = 1;
    _.isEqual(obj, compore).should.be.True();
    obj.prototype = {
      aaa: "a"
    };
    _.isEqual(obj, compore).should.be.False();
  });
  //it('validate simple', function () {
  //  timeValidator.validate("12:53").should.be.Object();
  //});
  //it('safeValidate fail', function () {
  //  timeValidator.safeValidate("48:53").should.be.equal(false);
  //});
  //it('validate tz fail', function () {
  //  should.throws(function () {
  //    timeValidator.validate("12:53-12:00");
  //  });
  //});
  //it('parse empty tz', function () {
  //  obj.utcTimestamp.should.be.NaN();
  //});
});
