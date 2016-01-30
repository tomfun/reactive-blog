import _ from "lodash";
/**
 * @param {Object} obj entity
 * @param {Object} oldObj plain object
 * @param {Object} newObj plain object
 * @param {MetadataCollection} entityMetas
 */
export default function tripleBad(obj, oldObj, newObj, entityMetas) {
  let passedKeys = new Set();
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      let curValue = obj[key];
      if (_.isObject(curValue)) {//?
        if (_.isObject(oldObj[key])) {
          if (_.isObject(newObj[key]) && !_.isArray(newObj[key])) {
            tripleBad(obj[key], oldObj[key], newObj[key], entityMetas);
          } else if (_.isEqual(obj[key], oldObj[key])) {
            obj[key] = newObj[key];
          }
        }
      } else {
        if (curValue === oldObj[key] && curValue !== newObj[key]) {
          if (key in newObj) {
            obj[key] = newObj[key];
          } else {
            delete obj[key];
          }
        }
      }
      passedKeys.add(key);
    }
  }
  for (let key in newObj) {
    if (!passedKeys.has(key)) {//todo: md? nested objects
      if (!(key in oldObj)) {
        obj[key] = newObj[key];
      }
    }
  }
}
