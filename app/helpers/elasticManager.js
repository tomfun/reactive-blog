import shortid from 'shortid';
import _ from 'lodash';

import MetaData from './elastic/Metadata';
import JoinMetadata from './elastic/JoinMetadata';
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
  indexName:             'reactive_blog_',//todo
  transformResult: function (data) {
    return data;
  },
  transformGetResult: function (data) {
    return manager.transformResult(data._source);
  },
  transformSearchResult: function (data) {
    return manager.transformResult(_.pluck(data.hits.hits, '_source'));
  },
  /**
   * @param {Class|String} [opt.class] override opt.type and opt.index
   * @param {String} [opt.type]
   * @param {String} [opt.index]
   * @param {String} opt.id
   * @return {Promise<Object|null>}
   */
  findById:              function (opt) {
    if (opt.class) {
      let mData = entities[_.isString(opt.type) ? 'findByName' : 'findByClass'](opt.class)
      opt.type = mData.type;
      opt.index = mData.index;
      delete opt.class;
    }
    return client.get(opt).then(manager.transformGetResult);
  },
  /**
   * @param {Class|String} [opt.class] override opt.type and opt.index
   * @param {String} [opt.type]
   * @param {String} [opt.index]
   * @param {Number} [opt.size]
   * @param {Object} [opt.body] Or we pass search body, or field(s) to build body
   * @return {Promise<Object|null>}
   */
  findOne:               function (opt) {
    opt.size = 1;
    return manager.find(opt).then(function (entites) {
      return _.isArray(entites) && entites.length ? entites.pop() : null;
    });
  },
  /**
   * @param {Class|String} [opt.class] override opt.type and opt.index
   * @param {String} [opt.type]
   * @param {String} [opt.index]
   * @param {Number} [opt.size]
   * @param {Object} [opt.body] Or we pass search body, or field(s) to build body
   * @return {Promise<Object[]>}
   */
  find:                  function (opt) {
    if (!opt.body) {
      let and = [];
      _.each(_.omit(opt, ['class', 'index', 'type', 'size', 'body']), function (val, fieldName) {
        and.push({
          term: {
            [fieldName]: val
          }
        });
        delete opt[fieldName];
      });
      if (and.length) {
        opt.body = {
          query: {
            filtered: {
              filter: {
                and: and/*[
                  {
                    term: {
                      "user.cityId": inputQuery.cityId
                    }
                  },
                  {
                    term: {
                      "canWork": true
                    }
                  }
                ]*/
              }
            }
          }
        };
      }
    }
    if (opt.class) {
      let mData = entities[_.isString(opt.type) ? 'findByName' : 'findByClass'](opt.class)
      opt.type = mData.type;
      opt.index = mData.index;
      delete opt.class;
    }
    return client.search(opt).then(manager.transformSearchResult);
  },
  create:                function (mappedObject) {
    //todo: check Object is mapped
    let metadata = entities.findByClass(mappedObject.constructor);
    if (!metadata) {
      throw new TypeError('Target type not found');
    }
    mappedObject.id = shortid.generate();
    let body = {};
    let excludeFields = [];
    let result = Promise.resolve();
    if ('dataValues' in mappedObject && metadata.joins.length) {
      let cascadeCreatePromises = [];
      _.each(metadata.joins, function (joinMetadata) {
        let relatedObject = this.dataValues[joinMetadata.name];
        if (!relatedObject || !joinMetadata.fieldName) {
          return;
        }
        excludeFields.push(joinMetadata.fieldName);
        if (!relatedObject.id) {
          cascadeCreatePromises.push(manager.create(relatedObject));
        }
        body[joinMetadata.fieldName] = relatedObject.id;
      }, mappedObject);
      result = Promise.all(cascadeCreatePromises);
    }
    result.then(function () {
      _.each(mappedObject, function (val, key) {
        if (excludeFields.indexOf(key) !== -1) {
          return;
        }
        body[key] = val;
      });
      metadata.create(client, body);
    });
    return result;
  },
  createTypes: function () {
    return Promise.all(_.map(entities, function (md) {
      /**
       * @type {MetaData}
       */
      return md.existType(client).then(function (d) {
        return d ? md.putType(client) : md.createType(client);
      }).catch(function (e) {
        console.error(e, e.stack);
      });
    }));
  }
};

export function entity(name, index, type) {
  return function (target) {
    index = index || manager.indexName + name;
    entities.add(new MetaData(name, target, {}, index, type));
    console.log('test', target, name);
    return target;
  };
}

export function field(name, type) {
  return function (target) {
    console.log('test2', target, name);
    var md;
    if (!(md = entities.findByClass(target))) {
      throw new Error("target not found");
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

/**
 * @param {String} name
 * @param {Class|String} cls
 * @param {String|Boolean} [fieldName=name + 'Id']
 * @returns {Function}
 */
export function join(name, cls, fieldName) {
  if (fieldName === undefined) {
    fieldName = name + 'Id';
  }
  return function (target) {
    let targetMetadata = entities.findByClass(target);
    targetMetadata.joins.push(new JoinMetadata(name, cls, fieldName));
    Object.defineProperty(target.prototype, name, {
      configurable: true,
      enumerable: true,
      get: function () {
        if ('dataValues' in this && name in this.dataValues) {
          return Promise.resolve(this.dataValues[name]);
        }
        if ('dataValues' in this && fieldName in this.dataValues) {
          return manager.findById({
            class: cls,
            id: this.dataValues[fieldName],
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
            writable: false,
            value: {}
          });
        }
        if (!(val instanceof cls)) {
          throw new TypeError('Wrong type of value for ' + name + ' field in ' + targetMetadata.name);
        }
        this.dataValues[name] = val;
        return this;
      }
    });
    return target;
  };
}


export default manager;
