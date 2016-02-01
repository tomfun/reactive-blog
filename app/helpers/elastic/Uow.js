import _ from "lodash";
import tripleBad from "./tripleBad";

class Uow {
  constructor(em) {
    this.em = em;
    this.indexName = em.configuration.indexName;
    this.entityMetas = this.em.entityMetas;
    this.rawSources = new WeakMap();
    this.cacheKeys = new WeakMap();
    this.alreadyCreated = new WeakMap();//?!!
    this.relations = new WeakMap();
  }

  transformSingleResult(data, refreshEntity) {
    const cacheKey = "transformSingleResult_" + data._index + "/_/" + data._type + data._id;
    let resultObject = simpleCacher.get(cacheKey);
    if (resultObject && !refreshEntity) {
      const oldSource = this.rawSources.get(cacheKey);
      console.log(typeof resultObject, typeof oldSource, typeof data)
      tripleBad(resultObject, oldSource, data, entityMetas);
      this.rawSources.set(resultObject, data);
      return resultObject;
    }
    const md = this.em.entityMetas.findByIndexAndType(data._index, data._type);
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
      this.relations.set(resultObject, relatedValues);
    }

    if (!refreshEntity) {
      simpleCacher.set(cacheKey, resultObject, md.stalledTime);
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
    let metadata = this.entityMetas.findByClass(mappedObject.constructor);
    if (!metadata) {
      throw new TypeError("Type not found");
    }
    const cacheKey = "transformSingleResult_" + data._index + "/_/" + data._type + data._id;
    this.cacheKeys.set(mappedObject, cacheKey);
  }

  remove(mappedObject) {
    let metadata = this.entityMetas.findByClass(mappedObject.constructor);
    if (!metadata) {
      throw new TypeError("Type not found");
    }
    return metadata.remove(client, mappedObject.id);
    //todo: cascade delete, update
  }

  detach(mappedObject) {
    let cacheKey = this.cacheKeys.get(mappedObject);
    if (cacheKey) {
      this.rawSources.delete(mappedObject);
      this.cacheKeys.delete(mappedObject);
      this.em.simpleCacher.delete(cacheKey);
    }
  }

  refresh(mappedObject, stalledTime) {
    let source = this.rawSources.get(mappedObject);
    let cacheKey = this.cacheKeys.get(mappedObject);
    if (!source) {
      throw new Error("Nothing to refresh");
    }
    stalledTime = stalledTime || this.entityMetas.findByClass(mappedObject.constructor).stalledTime;
    simpleCacher.set(cacheKey, mappedObject, stalledTime);
    return client.get({
      index: source._index,
      type:  source._type,
      id:    source._id,
    }).then(function (data) {
      this.transformSingleResult(data, true);
    });
  }

  update(mappedObject) {
    //filter id
  }

}

export default Uow;
