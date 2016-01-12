"use strict";

import _ from 'lodash';

import MetaData from './elastic/metadata';
import client from './elastic/client';

client.ping().then(function () {
  console.log('ping sucess')
})

var entities = [];
entities.findByName = function (name) {
  return _.findWhere(this, {name: name});
};
entities.findByClass = function (cls) {
  return _.findWhere(this, {class: cls});
};
entities.add = function (metaData) {
  if (!(metaData instanceof MetaData)) {
    throw new TypeError("metaData is not instanceof MetaData");
  }
  return this.push(metaData);
};

var manager = {
  indexName: 'reactive_blog',
  transformResult: function (data) {
    Object.defineProperty(obj, 'key', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: 'static'
    });
  },
  /**
   * @param {String} [opt.index]
   * @param {Class|String} opt.type
   * @param {Number} [opt.size]
   * @param {Object} [opt.body] Or we pass search body, or field(s) to build body
   * @return {Promise}
   */
  find: function (opt) {
    if (!opt.body) {
      opt.body = {
        query: {
          filtered: {
            filter: {
              and: [
                //{
                //  term: {
                //    "user.cityId": inputQuery.cityId
                //  }
                //},
                //{
                //  term: {
                //    "canWork": true
                //  }
                //}
              ]
            }
          }
        }
      };
      _.each(_.omit(opt, ['index', 'type', 'size', 'body']), function (val, fieldName) {
        opt.body.query.filtered.filter.and.push({
          term: {
            [fieldName]: val
          }
        });
      });
    }
    if (opt.type) {
      if (!_.isString(opt.type)) {
        opt.type = entities.findByClass(opt.type).name
      }
    }
    if (!opt.index) {
      opt.index = manager.indexName;
    }
    client.search(opt).then(manager.transformResult)
  },
  create: function (mappedObject) {

  },
  createType: function () {
    return _.map(entities, function (md) {
      /**
       * @type {MetaData}
       */
      return md.existType(client, manager.indexName).then(function (d) {
        return d ? md.putType(client, manager.indexName) : md.createType(client, manager.indexName);
      }).then(function (some) {
        console.log('ssssssss', some)
      }).catch(function (e) {
        console.error(e, e.stack)
      })
    })
  }
};

export function entity(name) {
  return function (target) {
    entities.add(new MetaData(name, target));
    console.log('test', target, name);
    return target;
  };
}

export function field(name, type) {
  return function (target) {
    console.log('test2', target, name);
    var md;
    if (!(md = entities.findByClass(target))) {
      throw new Error("target not found")
    }
    //_.set(md.mappings, name, type);
    name = _.isArray(name) ? name : name.split('.');
    let mp = md.mappings,
      len = name.length;
    _.each(name, function (v, i) {
      if (!mp[v]) {
        mp[v] = {
          "type": "object"
        };
      }
      if (i + 1 === len) {
        mp[v].type = type;
      } else {
        mp = !mp[v].properties ? mp[v].properties = {} : mp[v].properties;
      }
    });
    console.log('ddd', md.mappings)
    return target;
  };
}
/**
 * @url https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html
 */
const FIELD_TYPES = {
  "STRING": "string",
  "LONG": "long",
  "INTEGER": "integer",
  "SHORT": "short",
  "BYTE": "byte",
  "DOUBLE": "double",
  "FLOAT": "float",
  "DATE": "date",
  "BOOLEAN": "boolean",
  "BINARY": "binary",
  "OBJECT": "object",
  "NESTED": "nested",
  "GEO_POINT": "geo_point",
  "GEO_SHAPE": "geo_shape",
  "IP": "ip",
  "COMPLETION": "completion",
  "TOKEN_COUNT": "token_count",
  "MURMUR3": "murmur3"
};
field.TYPE = FIELD_TYPES;


export function join(name, cls) {
  return function (target) {
    //field(name, "object")
    Object.defineProperty(target.prototype, name, {
      configurable: true,
      enumerable: true,
      get: function () {
        if ('dataValues' in this && name in this.dataValues) {
          return Promise.resolve(this.dataValues[name]);
        } else {
          return manager.find({
            type: cls
            //todo: size
          }).then(function (transformedData) {
            this[name] = transformedData;
          });
        }
      },
      set: function (val) {
        if (!('dataValues' in this)) {
          Object.defineProperty(this, 'dataValues', {
            configurable: false,
            enumerable: false,
            writable: false
          });
        }
        this.dataValues[name] = val;
        return this;
      }
    });
    return target;
  };
}


export default manager;
