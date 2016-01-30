import shortid from "shortid";
import _ from "lodash";

import MetaData from "./elastic/Metadata";
import MetadataCollection from "./elastic/MetadataCollection";
import JoinMetadata from "./elastic/JoinMetadata";
import client from "./elastic/client";
import simpleCacher from "./elastic/simpleCacher";
import tripleBad from "./elastic/tripleBad";

client.ping().then(function () {
  console.log('ping sucess')
})

/**
 * @url https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html
 */
const FIELD_TYPES = {
  STRING:      "string",
  LONG:        "long",
  INTEGER:     "integer",
  SHORT:       "short",
  BYTE:        "byte",
  DOUBLE:      "double",
  FLOAT:       "float",
  DATE:        "date",
  BOOLEAN:     "boolean",
  BINARY:      "binary",
  OBJECT:      "object",
  NESTED:      "nested",
  GEO_POINT:   "geo_point",
  GEO_SHAPE:   "geo_shape",
  IP:          "ip",
  COMPLETION:  "completion",
  TOKEN_COUNT: "token_count",
  MURMUR3:     "murmur3",
  //todo: VIRTUAL
};
field.TYPE = FIELD_TYPES;

const entityMetas = new MetadataCollection();
const rawSources = new WeakMap();
const cacheKeys = new WeakMap();
const relations = new WeakMap();

var manager = {
  indexName:             "reactive_blog_", //todo
  transformSingleResult: function (data, refreshEntity) {
    const cacheKey = 'transformSingleResult_' + data._index + '/_/' + data._type + data._id;
    let resultObject = simpleCacher.get(cacheKey);
    if (resultObject && !refreshEntity) {
      const oldSource = rawSources.get(cacheKey);
      console.log(typeof resultObject,typeof oldSource,typeof data)
      tripleBad(resultObject, oldSource, data, entityMetas);
      rawSources.set(resultObject, data);
      return resultObject;
    }
    const md = entityMetas.findByIndexAndType(data._index, data._type);
    if (!md) {
      return data._source;
    }
    if (!refreshEntity) {
      resultObject = new md.Class();
    }
    const relationFields = _.map(md.joins, "fieldName");
    _.extend(resultObject, _.omit(data._source, relationFields));
    const relatedValues = new Map();
    _.each(relationFields, function (fieldName) {
      if (data._source[fieldName] !== undefined) {
        relatedValues.set(fieldName, data._source[fieldName]);
      }
    });
    if (relatedValues.size) {
      relations.set(resultObject, relatedValues);
    }

    if (!refreshEntity) {
      simpleCacher.set(cacheKey, resultObject, md.stalledTime);
    }
    rawSources.set(resultObject, data);
    cacheKeys.set(resultObject, cacheKey);

    return resultObject;
  },
  transformResult(data) {
    return _.isArray(data)
      ? _.map(data, (item) => manager.transformSingleResult(item))
      : manager.transformSingleResult(data);
  },
  transformGetResult(data) {
    return manager.transformResult(data.docs ? data.docs : data);
  },
  transformSearchResult(data) {
    return manager.transformResult(data.hits.hits);
  },
  /**
   * @param {Class|String} [opt.Class] override opt.type and opt.index
   * @param {String} [opt.type]
   * @param {String} [opt.index]
   * @param {String|Array<String>} opt.id
   * @return {Promise<Object|null>}
   */
  findById(opt) {
    let mData;
    const q = _.clone(opt);
    if (q.Class) {
      mData = entityMetas[_.isString(q.Class) ? "findByName" : "findByClass"](q.Class);
      q.type = mData.type;
      q.index = mData.index;
      delete q.Class;
    } else {
      mData = entityMetas.findByIndexAndType(q.index, q.type);
    }

    const cacheKeyIsREq = "findById_isRequested_" + JSON.stringify(q);
    const isRequested = simpleCacher.get(cacheKeyIsREq);
    const time = mData.findByIdCacheTime;
    if (isRequested === undefined) {
      let res;
      if (_.isArray(q.id)) {
        q.body = {
          ids: q.id
        };
        delete q.id;
        res = client.mget(q).then(manager.transformGetResult);
      } else {
        res = client.get(q).then(manager.transformGetResult);
      }

      simpleCacher.set(cacheKeyIsREq, res, time);
      return res;
    }
    return isRequested;
  },
  /**
   * @param {Class|String} [opt.Class] override opt.type and opt.index
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
   * @param {Class|String} [opt.Class] override opt.type and opt.index
   * @param {String} [opt.type]
   * @param {String} [opt.index]
   * @param {Number} [opt.size]
   * @param {Object} [opt.body] Or we pass search body, or field(s) to build body
   * @return {Promise<Object[]>}
   */
  find:                  function (opt) {
    if (!opt.body) {
      let and = [];
      _.each(_.omit(opt, ['Class', 'index', 'type', 'size', 'body']), function (val, fieldName) {
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
    if (opt.Class) {
      let mData = entityMetas[_.isString(opt.type) ? 'findByName' : 'findByClass'](opt.Class)
      opt.type = mData.type;
      opt.index = mData.index;
      delete opt.Class;
    }
    return client.search(opt).then(manager.transformSearchResult);
  },
  create:                function (mappedObject, force = true) {
    if (_.isArray(mappedObject)) {
      return Promise.all(_.map(mappedObject, (v) => manager.create(v, force)));
    }
    if (!force && !cacheKeys.get(mappedObject)) {
      throw new Error("You try to create not mapped object");
    }
    let metadata = entityMetas.findByClass(mappedObject.constructor);
    if (!metadata) {
      throw new TypeError("Target type not found");
    }
    mappedObject.id = shortid.generate();
    let body = {};
    let excludeFields = [];
    let result = Promise.resolve();
    if (relations.has(mappedObject) && metadata.joins.length) {
      let cascadeCreatePromises = [];
      let relatedValues = relations.get(mappedObject);
      _.each(metadata.joins, function (joinMetadata) {
        let relatedObject = relatedValues[joinMetadata.name];
        if (!relatedObject || !joinMetadata.fieldName) {
          return;
        }
        excludeFields.push(joinMetadata.fieldName);
        if (!relatedObject.id) {
          cascadeCreatePromises.push(manager.create(relatedObject));//todo: check cascade persist joinMetadata...
        }
        if (_.isArray(relatedObject)) {
          body[joinMetadata.fieldName] = _.map(relatedObject, (v) => v.id);
        } else {
          body[joinMetadata.fieldName] = relatedObject.id;
        }
      });
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
  remove(mappedObject) {
    let metadata = entityMetas.findByClass(mappedObject.constructor);
    if (!metadata) {
      throw new TypeError("Type not found");
    }
    return metadata.remove(client, mappedObject.id);
    //todo: cascade delete, update
  },
  detach(mappedObject) {
    let cacheKey = cacheKeys.get(mappedObject);
    if (cacheKey) {
      rawSources.delete(mappedObject);
      cacheKeys.delete(mappedObject);
      simpleCacher.delete(cacheKey);
    }
  },
  refresh(mappedObject, stalledTime) {
    let source = rawSources.get(mappedObject);
    let cacheKey = cacheKeys.get(mappedObject);
    if (!source) {
      throw new Error("Nothing to refresh");
    }
    stalledTime = stalledTime || entityMetas.findByClass(mappedObject.constructor).stalledTime;
    simpleCacher.set(cacheKey, mappedObject, stalledTime);
    return client.get({
      index: source._index,
      type:  source._type,
      id:    source._id,
    }).then(function (data) {
      manager.transformSingleResult(data, true);
    });
  },
  update(mappedObject, noRecursive) {

  },
  createTypes() {
    return Promise.all(entityMetas.map(function (md) {
      return md.existType(client).then(function (d) {
        return d ? md.putType(client) : md.createType(client);
      }).catch(function (e) {
        console.error(e, e.stack);
      });
    }));
  }
};

export function entity(name, index, type, stalledTime) {
  return function (target) {
    index = index || manager.indexName + name;
    entityMetas.add(new MetaData(name, target, {id: {type: FIELD_TYPES.STRING, index: "not_analyzed"}}, index, type, stalledTime));
    return target;
  };
}

export function field(name, type) {
  return function (target) {
    let md;
    if (!(md = entityMetas.findByClass(target))) {
      throw new Error("target not found");
    }
    //_.set(md.mappings, name, type);
    name = _.isArray(name) ? name : name.split(".");
    let mp  = md.mappings,
        len = name.length;
    _.each(name, function (v, i) {
      if (!mp[v]) {
        mp[v] = {
          type: "object"
        };
      }
      if (i + 1 === len) {
        mp[v].type = type;
      } else {
        mp = !mp[v].properties ? mp[v].properties = {} : mp[v].properties;
      }
    });
    console.log("ddd", md.mappings)
    return target;
  };
}

/**
 * @param {String} name
 * @param {Class|String} cls
 * @param {String|Boolean} [fieldName=name + 'Id']
 * @returns {Function}
 */
export function join(name, cls, fieldName, type) {
  /*
   inverse many - массив айдишников хранится в другом объекте (включая наш айдишник)
   owning many - массив айдишников хранится в объекте (включая наш айдишник)
   omni-directional - массива нет, есть отдельный индекс и/или тип
   i 1:m - id в другом объекте
   o m:1 - id в объекте
   i 1:1 - id в другом объекте
   o 1:1 - id в объекте
   */
  if (fieldName === undefined) {
    fieldName = name + "Id";
  }
  return function (target) {
    const targetMetadata = entityMetas.findByClass(target);
    targetMetadata.joins.push(new JoinMetadata(name, cls, fieldName));
    Object.defineProperty(target.prototype, name, {
      configurable: true,
      enumerable:   true,
      get:          function () {
        let relatedValues = relations.get(this);
        if (relatedValues && name in relatedValues) {
          return Promise.resolve(relatedValues[name]);
        }
        if (relatedValues && relatedValues.has(fieldName)) {
          return manager.findById({
            Class: cls,
            id:    relatedValues.get(fieldName),
          }).then(function (transformedData) {
            return this[name] = transformedData;
          }.bind(this));
        }
        return Promise.resolve(null);
      },
      set:          function (val) {
        let relatedValues = relations.get(this);
        if (!relatedValues) {
          relatedValues = new Map();
          relations.set(this, relatedValues);
        }
        if (val !== null && !(val instanceof cls)) {//todo: nullable validation?
          if (!_.isArray(val) || _.some(val,
              (item) => {
                return !(item instanceof cls);
              })) {
            throw new TypeError("Wrong type of value for " + name + " field in " + targetMetadata.name);
          }
        }
        relatedValues[name] = val;
        return this;
      }
    });
    return target;
  };
}


export default manager;
