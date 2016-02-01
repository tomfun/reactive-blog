import _ from "lodash";
import {FIELD_TYPES, JOIN_TYPES, CASCADE_REMOVE_TYPE} from "./consts";

const collection = new Map();

function save(Class, annotationName, args) {
  let data;
  if (!collection.has(Class)) {
    collection.set(Class, []);
  }
  data = collection.get(Class);
  data.push({
    annotationName,
    args,
  });
  return Class;
}

export function entity(name, index, type, stalledTime) {
  return function (target) {
    return save(target, "entity", {name, index, type, stalledTime});
  };
}
/**
 * @param {Function} generator
 * @param {Boolean|String} [fieldName=id] if false id will be hidden
 * @returns {Function}
 */
export function id(generator, fieldName) {
  return function (target) {
    return save(target, "id", {generator, fieldName});
  };
}

/**
 * @param {String} name
 * @param {String} [type]
 * @param {String} [index]
 * @returns {Function}
 */
export function field(name, type, index) {
  return function (target) {
    return save(target, "field", {name, index, type});
  };
}
field.TYPE = FIELD_TYPES;

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
 * @param {Boolean} [options.cascade.merge=true]
 * @param {Boolean} [options.cascade.detach=true]
 * @param {Boolean} [options.cascade.refresh=true]
 * @param {Boolean} [options.cascade.create=true] if false -> may be error
 * @param {Boolean} [options.orphanRemoval=false]
 * @param {String} [options.wrongJoinTypeErrorMessage]
 * @returns {Function}
 */
export function join(name, cls, fieldName, type, options) {
  return function (target) {
    return save(target, "join", {name, cls, fieldName, type, options});
  };
}
join.TYPE = JOIN_TYPES;
join.CASCADE_REMOVE_TYPE = CASCADE_REMOVE_TYPE;

export function importMetadata(filter) {
  let res = [];
  for (const [Class, aDataArray] of collection) {
    _.each(aDataArray, function (aData) {
      let data = _.cloneDeep(aData);
      data.Class = Class;
      res.push(data);
    });
  }
  if (filter) {
    res = _.filter(res, filter);
  }
  return res;
}
