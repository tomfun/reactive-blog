const _ = require("lodash");

import {FIELD_TYPES, JOIN_TYPES, CASCADE_REMOVE_TYPE} from "./consts";
import Metadata from "./Metadata";
import MetadataCollection from "./MetadataCollection";
import JoinMetadata from "./JoinMetadata";

/**
 * Throw TypeError when val is invalid
 * @param {String} type JOIN_TYPES
 * @param {Class|Function} cls
 * @param {*} val
 * @param {Object} options
 * @param {String} options.wrongJoinTypeErrorMessage
 * @param {Boolean} options.nullable
 */
function validateJoinSet(type, cls, val, options) {
  function validateSameType() {
    return !(val instanceof cls);
  }

  function validateArrayType() {
    return _.some(val,
      (item) => {
        return !(item instanceof cls);//must be array of class
      });
  }

  let typeError = !options.nullable && val === null;// must not be null
  if (!typeError && val !== null) {
    if (type === JOIN_TYPES.ONE_TO_ANY_NESTED || type === JOIN_TYPES.ONE_TO_ANY_OWNING) {
      //may be array
      if (_.isArray(val)) {
        typeError = validateArrayType();
      } else {
        typeError = validateSameType();//not array => must be instance of class
      }
    } else if (
      type === JOIN_TYPES.ONE_TO_ONE_INVERSE
      || type === JOIN_TYPES.ONE_TO_ONE_NESTED
      || type === JOIN_TYPES.ONE_TO_ONE_OWNING
      || type === JOIN_TYPES.MANY_TO_ONE
    ) {
      typeError = validateSameType();
    } else if (
      type === JOIN_TYPES.MANY_TO_MANY_INVERSE
      || type === JOIN_TYPES.MANY_TO_MANY_OWNING
      || type === JOIN_TYPES.MANY_TO_MANY_UNIDIRECTIONAL
      || type === JOIN_TYPES.ONE_TO_MANY
      || type === JOIN_TYPES.ONE_TO_MANY_NESTED
    ) {
      typeError = validateSameType();//not array => must be instance of class
    }
  }
  if (typeError) {
    throw new TypeError(options.wrongJoinTypeErrorMessage);
  }
}

export default class ClassDecorator {
  /**
   * @param {ElasticManager} em
   * @param {Array} annotationData
   * @param {String} annotationData.annotationName
   * @param {Object} annotationData.args
   */
  constructor(em, annotationData) {
    this.em = em;
    _.each(_.filter(annotationData, {annotationName: "entity"}), (aData) => {
      const args = aData.args;
      this.entity(args.name, args.index, args.type, args.stalledTime)(aData.Class);
    });
    _.each(_.filter(annotationData, {annotationName: "id"}), (aData) => {
      const args = aData.args;
      this.id(args.generator, args.fieldName)(aData.Class);
    });
    _.each(_.filter(annotationData, {annotationName: "field"}), (aData) => {
      const args = aData.args;
      this.field(args.name, args.type, args.index)(aData.Class);
    });
    _.each(annotationData, (aData) => {
      this.configureIdField()(aData.Class);
    });
    _.each(_.filter(annotationData, {annotationName: "join"}), (aData) => {
      const args = aData.args;
      this.join(args.name, args.cls, args.fieldName, args.type, args.options)(aData.Class);
    });
  }

  entity(entityName, indexName, type, stalledTime = 300000, findByIdCacheTime = 100) {
    return (target) => {
      const mData = this.em.entityMetas.findByClass(target);
      const name = entityName || target.constructor.name;
      if (!name && !mData) {
        throw new Error("Name of entity id required");
      }
      const findByIndexAndType = MetadataCollection.findByIndexAndType.bind(this.em.entityMetas);
      if (mData) {
        const extend = {
          name:              name || mData.name,
          index:             indexName || mData.name,
          type:              type || mData.type,
          stalledTime:       stalledTime || mData.stalledTime,
          findByIdCacheTime: findByIdCacheTime || mData.findByIdCacheTime
        };
        if (findByIndexAndType(extend.index, extend.type) !== mData) { //cache
          throw new Error("Entity with same index and type exist");
        }
        if (this.em.entityMetas.findByName(extend.name) !== mData) {
          throw new Error("Entity with same name exist");
        }
        _.extend(mData, extend);
        return target;
      }

      const index = indexName || this.em.configuration.indexName + name;
      if (findByIndexAndType(index, type)) { //cache
        throw new Error("Entity with same index and type exist");
      }
      if (this.em.entityMetas.findByName(name)) {
        throw new Error("Entity with same name exist");
      }
      this.em.entityMetas.add(new Metadata(name, target, {}, index, type, stalledTime));
      return target;
    };
  }

  id(generator, fieldName, dataType) {
    return (target) => {
      const mData = this.em.entityMetas.findByClass(target);
      if (!mData) {
        throw new Error("target not found");
      }
      if (generator) {
        mData.idGenerator = generator;
      }
      if (fieldName) {
        mData.idFieldName = fieldName;
      }
      if (fieldName) {
        mData.idDataType = dataType;
      }
      return target;
    };
  }

  configureIdField() {
    return (target) => {
      const mData = this.em.entityMetas.findByClass(target);
      return this.field(mData.idFieldName, mData.idDataType, "not_analyzed")(target)
    };
  }

  field(name, type, index) {
    return (target) => {
      const mData = this.em.entityMetas.findByClass(target);
      if (!mData) {
        throw new Error("target not found");
      }
      //_.set(md.mappings, name, type);
      name = _.isArray(name) ? name : name.split(".");
      let mp = mData.mappings;
      const len = name.length;
      _.each(name, function (v, i) {
        if (!mp[v]) {
          mp[v] = {
            type: "object"
          };
        }
        if (i + 1 === len) {
          mp[v].type = type;
          if (index) {
            mp[v].index = index;
          }
        } else {
          mp = !mp[v].properties ? mp[v].properties = {} : mp[v].properties;
        }
      });
      return target;
    };
  }


  /**
   * @param {String} name
   * @param {Class|String} cls
   * @param {String|Boolean} [fieldName=name + 'Id']
   * @param {String} [type=JOIN_TYPES.ONE_TO_ANY_OWNING]
   * @param {Object} [options={}]
   * @param {Boolean} [options.nullable=true]
   * @param {Object} [options.cascade]
   * @param {String|CASCADE_REMOVE_TYPE} [options.cascade.remove=CASCADE_REMOVE_TYPE.CASCADE] One of SET_NULL, CASCADE, RESTRICT
   * If X is removed and persist operations are configured to cascade on the relationship,
   * an exception will be thrown as this indicates a programming error (X would be re-persisted by the cascade).
   * If X is detached and persist operations are configured to cascade on the relationship,
   * an exception will be thrown (This is semantically the same as passing X to persist()).
   * No cascade options are relevant for removed entities on flush, the cascade remove option is already executed during
   * @param {Boolean} [options.cascade.update=true]
   * @param {Boolean} [options.cascade.merge=true] TODO
   * @param {Boolean} [options.cascade.detach=true]
   * @param {Boolean} [options.cascade.refresh=true]
   * @param {Boolean} [options.cascade.create=true] if false -> may be error
   * @param {Boolean} [options.orphanRemoval=false]
   * @param {String} [options.wrongJoinTypeErrorMessage]
   * //todo: EAGER collection loading
   * @returns {Function}
   */
  join(name, cls, fieldName = name + "Id", type = JOIN_TYPES.ONE_TO_ANY_OWNING, options = {}) {
    /*
     inverse many - массив айдишников хранится в другом объекте (включая наш айдишник)
     owning many - массив айдишников хранится в объекте (включая наш айдишник)
     omni-directional - массива нет, есть отдельный индекс и/или тип
     i 1:m - id в другом объекте
     o m:1 - id в объекте
     i 1:1 - id в другом объекте
     o 1:1 - id в объекте
     */
    _.defaultsDeep(options, {
      nullable:      true,
      cascade:       {
        remove:  CASCADE_REMOVE_TYPE.CASCADE,
        update:  true,
        merge:   true,
        detach:  true,
        refresh: true,
        create:  true,
      },
      orphanRemoval: false,
    });
    const relations = this.em.uow.relations;
    const manager = this.em;
    return (target) => {
      const targetMetadata = this.em.entityMetas.findByClass(target);
      if (!options.wrongJoinTypeErrorMessage) {
        options.wrongJoinTypeErrorMessage = "Wrong type of value for " + name + " field in " + targetMetadata.name;
      }
      //todo: str cls -> class
      targetMetadata.joins.push(new JoinMetadata(name, cls, fieldName, type, options));
      Object.defineProperty(target.prototype, name, {
        configurable: true,
        enumerable:   true,
        get:          function () {
          const relatedValues = relations.get(this);
          if (relatedValues && name in relatedValues) {
            return Promise.resolve(relatedValues[name]);
          }
          if (relatedValues && relatedValues.has(fieldName)) {
            return manager.findById({
              Class: cls,
              id:    relatedValues.get(fieldName),
            }).then(function (transformedData) {
              this[name] = transformedData;
              return transformedData;
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

          validateJoinSet(type, cls, val, options);

          relatedValues[name] = val;
          return this;
        }
      });
      return target;
    };
  }
}
