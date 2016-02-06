const _ = require("lodash");

import MetaData from "./Metadata";

export default class MetadataCollection  {
  constructor(...args) {
    this.array = new Array(...args);
    this.findByIndexAndType = _.memoize(
      MetadataCollection.findByIndexAndType.bind(this),
      MetadataCollection.findByIndexAndTypeCacheResolver
    );
  }
  /**
   * @param {String} name
   * @returns {MetaData}
   */
  findByName(name) {
    return _.find(this.array, {
      name
    });
  }
  /**
   * @param {String} type
   * @returns {MetaData}
   */
  findByType(type) {
    return _.find(this.array, {
      type
    });
  }
  /**
   * @param {Object} object
   * @returns {MetaData}
   */
  findByObject(object) {
    return this.findByClass(object.constructor);
  }
  /**
   * @param {Class|Function} Class
   * @returns {MetaData}
   */
  findByClass(Class) {
    return _.find(this.array, {Class});
  }
  /**
   * @param {String} index
   * @param {String} type
   * @returns {MetaData}
   */
  static findByIndexAndType(index, type) {
    return _.find(this.array, {
      index,
      type
    });
  }
  static findByIndexAndTypeCacheResolver(index, type) {
    return index + type;
  }
  /**
   * @param {MetaData} metaData
   * @returns {Number}
   */
  add(metaData) {
    return this.push(metaData);
  }
  /**
   * @param {MetaData} metaData
   * @returns {Number}
   */
  push(metaData) {
    if (!(metaData instanceof MetaData)) {
      throw new TypeError("metaData is not instanceof MetaData");
    }
    return this.array.push(metaData);
  }
  /**
   * @param {Function|Object|string} [iteratee=_.identity] The function invoked
   *  per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  map(iteratee) {
    return _.map(this.array, iteratee)
  }
}
