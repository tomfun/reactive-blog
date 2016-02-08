const _ = require("lodash");

import tripleBad from "./tripleBad";

class Uow {
  /**
   * @param {ElasticManager} em
   */
  constructor(em) {
    this.em = em;
    this.indexName = em.configuration.indexName;
    this.entityMetas = em.entityMetas;
    this.rawSources = new WeakMap();
    this.cacheKeys = new WeakMap();
    this.relations = new WeakMap();
    this.markedForCreate = new Set();//?!!
    this.markedForRemove = new Set();//?!!
    this.markedForUpdate = new Set();//?!!
  }

  flush(entites) {
    const scheduledForRemove = this.getForUpdate(entites)
    const scheduledForCreate = this.getForUpdate(entites)
    //check removed entity create
    const scheduledForUpdate = this.getForUpdate(entites)
    //check updating entity create, remove

    //check different object with same id
    doWork
  }

  /**
   * Transform json data from elastci to instance of entity or return source
   * @param {Object} data
   * @param {String} data._index
   * @param {String} data._type
   * @param {String} data._id
   * @param {Object} data._source
   * @param {Boolean} [refreshEntity=false]
   * @returns {*}
   */
  transformSingleResult(data, refreshEntity = false) {
    const cacheKey = "transformSingleResult_" + data._index + "/_/" + data._type + data._id;
    let resultObject = this.em.simpleCacher.get(cacheKey);
    if (resultObject && !refreshEntity) {
      const oldSource = this.rawSources.get(cacheKey);
      tripleBad(resultObject, oldSource, data, this.em.entityMetas);
      this.rawSources.set(resultObject, data);
      return resultObject;
    }
    const mData = this.em.entityMetas.findByIndexAndType(data._index, data._type);
    if (!mData) {
      return data._source;
    }
    if (!refreshEntity) {
      resultObject = new mData.Class();
    }
    const relationFields = _.map(mData.joins, "fieldName");
    _.extend(resultObject, _.omit(data._source, _.union(relationFields, [mData.idFieldName])));
    Object.defineProperty(resultObject, mData.idFieldName, {
      enumerable:   true,
      configurable: true,
      writable:     false,
      value:        data._id
    });
    const relatedValues = new Map();
    _.each(relationFields, function (fieldName) {
      if (data._source[fieldName] !== undefined) {
        relatedValues.set(fieldName, data._source[fieldName]);
      }
    });
    if (relatedValues.size) {
      this.relations.set(resultObject, relatedValues);
    }

    if (!refreshEntity) {
      this.em.simpleCacher.set(cacheKey, resultObject, mData.stalledTime);
    }
    this.em.rawSources.set(resultObject, data);
    this.em.cacheKeys.set(resultObject, cacheKey);

    return resultObject;
  }

  create(mappedObject, force = true) {//todo: move -> uow
    if (_.isArray(mappedObject)) {
      return Promise.all(_.map(mappedObject, (v) => this.create(v, force)));
    }
    if (!force && !this.cacheKeys.get(mappedObject)) {
      throw new Error("You try to create not mapped object");
    }
    let metadata = this.entityMetas.findByObject(mappedObject);
    if (!metadata) {
      throw new TypeError("Target type not found");
    }
    let result = Promise.resolve();
    if (!mappedObject.id) {
      mappedObject.id = metadata.generateId(mappedObject);
      let genIdPromise = mappedObject.id;
      if (genIdPromise instanceof Promise || _.isFunction(genIdPromise.then)) {
        result = genIdPromise.then(function (id) {
          mappedObject.id = id;
          return id;
        });
      }
    }
    let body = {};
    let excludeFields = [];
    if (this.relations.has(mappedObject) && metadata.joins.length) {
      let cascadeCreatePromises = [];
      let relatedValues = this.relations.get(mappedObject);
      _.each(metadata.joins, function (joinMetadata) {
        let relatedObject = relatedValues[joinMetadata.name];
        if (!relatedObject || !joinMetadata.fieldName) {
          return;
        }
        excludeFields.push(joinMetadata.fieldName);
        /*
         ONE_TO_MANY:                 "i 1:m", foreach not created...
         MANY_TO_ONE:                 "o m:1", if not created
         ONE_TO_ONE_OWNING:           "o 1:1", if not created
         ONE_TO_ONE_INVERSE:          "i 1:1", if not created
         MANY_TO_MANY_UNIDIRECTIONAL: "u m:m",
         MANY_TO_MANY_OWNING:         "o m:m",
         MANY_TO_MANY_INVERSE:        "i m:m",
         ONE_TO_MANY_NESTED:          "n 1:m",
         ONE_TO_ONE_NESTED:           "n 1:1",
         ONE_TO_ANY_NESTED:           "n 1:x",
         ONE_TO_ANY_OWNING:           "o 1:x",
         */

        function singleDecision(relatedObject) {
          if (alreadyCreated.has(relatedObject)) {
            if (joinMetadata.options.cascade.update) {
              cascadeCreatePromises.push(this.update(relatedObject, force));
            }
          } else {

          }
          if (!relatedObject.id) {
            cascadeCreatePromises.push(Promise.reject(new Error("Related object has no id")));
            return false;
          }
        }

        if (!relatedObject.id) {
          cascadeCreatePromises.push(this.create(relatedObject));//todo: check cascade persist joinMetadata...
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
      return metadata.create(client, body).then((response) => {
        this.alreadyCreated.set(mappedObject, true);
        this.rawSources.set(mappedObject, body);
        return response;
      });
    });
    return result;
  }

  persist(mappedObject) {
    if (!this.entityMetas.findByClass(mappedObject.constructor)) {
      throw new TypeError("Type not found");
    }
    if (this.cacheKeys.get(mappedObject)) {
      //todo: cascade persist except this entity
      /*
       The semantics of the persist operation, applied on an entity X, are as follows:

       If X is a new entity, it becomes managed. The entity X will be entered into the database as a result of the flush operation.
       If X is a preexisting managed entity, it is ignored by the persist operation. However, the persist operation is cascaded to entities referenced by X, if the relationships from X to these other entities are mapped with cascade=PERSIST or cascade=ALL (see “Transitive Persistence”).
       If X is a removed entity, it becomes managed.

       */
      return;
    }
    this.markedForCreate.add(mappedObject);
  }

  remove(mappedObject) {
    if (!this.entityMetas.findByClass(mappedObject.constructor)) {
      throw new TypeError("Type not found");
    }
    /*
     The semantics of the remove operation, applied to an entity X are as follows:

     If X is a new entity, it is ignored by the remove operation. However, the remove operation is cascaded to entities referenced by X, if the relationship from X to these other entities is mapped with cascade=REMOVE or cascade=ALL (see “Transitive Persistence”).
     If X is a managed entity, the remove operation causes it to become removed. The remove operation is cascaded to entities referenced by X, if the relationships from X to these other entities is mapped with cascade=REMOVE or cascade=ALL (see “Transitive Persistence”).
     If X is a detached entity, an InvalidArgumentException will be thrown.
     If X is a removed entity, it is ignored by the remove operation.
     A removed entity X will be removed from the database as a result of the flush operation.
     */
    this.markedForRemove.add(mappedObject);
  }

  isNeedUpdate(mappedObject) {
    //todo: check need update
    return true;
  }

  getForUpdate(mappedObject, excludeSet = new Set()) {
    let startObjects;

    function startUpdate(obj, key) {
      if (
        /*_.isString(key)
         && key.indexOf("transformSingleResult_") === 0
         &&*/ this.cacheKeys.has(obj)
      ) {
        if (this.markedForRemove.has(obj)) {
          return;
        }
        startObjects.push(obj);
        if (!this.isNeedUpdate(obj)) {
          excludeSet.add(obj);
        }
      }
    }

    if (!mappedObject) {
      startObjects = [];
      this.em.simpleCacher.forEach(startUpdate, this);
      this.markedForUpdate.forEach(startUpdate, this);
    } else {
      startObjects = mappedObject;
    }

    if (startObjects && _.isArray(startObjects)) {
      const result = _.reduce(startObjects, (acc, obj) => {
        return _.union(acc, this.getForUpdate(obj, excludeSet));
      }, []);
      return _.filter(result, (obj) => {
        return excludeSet.has(obj);
      });
    }

    const mData = this.entityMetas.findByClass(mappedObject.constructor);
    const relatedValues = this.relations.get(mappedObject);
    const needUpdate = this.isNeedUpdate(mappedObject);
    if (!relatedValues || !relatedValues.size || !mData.joins.length) { // :)
      return needUpdate ? [mappedObject] : [];
    }

    return _.chain(mData.joins)
      .filter((join) => join.options.cascade.update)
      .filter((join) => relatedValues.has(join.name))
      .map((join) => {
        const rVal = relatedValues.get(join.name);
        return _.isArray(rVal) ? rVal : [rVal];
      })
      .reduce((acc, objArr) => {
        const filteredObjArray = _.filter(objArr, (obj) => {
          return !excludeSet.has(obj);
        });
        return _.union(acc, filteredObjArray);
      }, [])
      .reduce((acc, obj) => {
        //todo: recursive
        //return !excludeSet.has(obj) && this.isNeedUpdate(obj);
        excludeSet.add(obj);//todo
        return _.union(acc, this.getForUpdate(obj, excludeSet));
      }, [])
      .value()
      .concat(needUpdate ? [mappedObject] : []);//todo
  }

  update(mappedObject) {
    if (!this.entityMetas.findByClass(mappedObject.constructor)) {
      throw new TypeError("Type not found");
    }
    this.markedForUpdate.add(mappedObject);
  }

  detach(mappedObject) {
    const cacheKey = this.cacheKeys.get(mappedObject);
    if (cacheKey) {
      this.rawSources.delete(mappedObject);
      this.cacheKeys.delete(mappedObject);
      this.em.simpleCacher.delete(cacheKey);
    }
    this.markedForCreate.delete(mappedObject);
    this.markedForRemove.delete(mappedObject);
    this.markedForUpdate.delete(mappedObject);
  }

  refresh(mappedObject, stalledTime) {
    const source = this.rawSources.get(mappedObject);
    const cacheKey = this.cacheKeys.get(mappedObject);
    if (!source) {
      throw new Error("Nothing to refresh");
    }
    const ttl = stalledTime || this.entityMetas.findByClass(mappedObject.constructor).stalledTime;
    this.em.simpleCacher.set(cacheKey, mappedObject, ttl);
    return this.em.client.get({
      index: source._index,
      type:  source._type,
      id:    source._id,
    }).then(function (data) {
      this.transformSingleResult(data, true);
    });
  }
}

export default Uow;
