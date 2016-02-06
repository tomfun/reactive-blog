const _ = require("lodash");

class Repository {
  constructor(em) {
    this.em = em;
  }

  transformResult(data) {
    return _.isArray(data)
      ? _.map(data, (item) => this.em.uow.transformSingleResult(item))
      : this.em.uow.transformSingleResult(data);
  }

  transformGetResult(data) {
    return this.transformResult(data.docs ? data.docs : data);
  }

  transformSearchResult(data) {
    return this.transformResult(data.hits.hits);
  }

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
      mData = this.em.entityMetas[_.isString(q.Class) ? "findByName" : "findByClass"](q.Class);
      q.type = mData.type;
      q.index = mData.index;
      delete q.Class;
    } else {
      mData = this.em.entityMetas.findByIndexAndType(q.index, q.type);
    }

    const cacheKeyIsREq = "findById_isRequested_" + JSON.stringify(q);
    const isRequested = this.em.simpleCacher.get(cacheKeyIsREq);
    const time = mData.findByIdCacheTime;
    if (isRequested === undefined) {
      let res;
      if (_.isArray(q.id)) {
        q.body = {
          ids: q.id
        };
        delete q.id;
        res = this.em.client.mget(q).then(this.transformGetResult);
      } else {
        res = this.em.client.get(q).then(this.transformGetResult);
      }

      this.em.simpleCacher.set(cacheKeyIsREq, res, time);
      return res;
    }
    return isRequested;
  }

  /**
   * @param {Class|String} [opt.Class] override opt.type and opt.index
   * @param {String} [opt.type]
   * @param {String} [opt.index]
   * @param {Object} [opt.body] Or we pass search body, or field(s) to build body
   * @return {Promise<Object|null>}
   */
  findOne(opt) {
    const options = _.clone(opt);
    options.size = 1;
    return this.find(opt).then(function (entites) {
      return _.isArray(entites) && entites.length ? entites.pop() : null;
    });
  }

  /**
   * @param {Class|String} [opt.Class] override opt.type and opt.index
   * @param {String} [opt.type]
   * @param {String} [opt.index]
   * @param {Number} [opt.size]
   * @param {Object} [opt.body] Or we pass search body, or field(s) to build body
   * @return {Promise<Object[]>}
   */
  find(opt) {
    const options = _.clone(opt);
    if (!options.body) {
      const and = [];
      _.each(_.omit(options, ["Class", "index", "type", "size", "body"]), (val, fieldName) => {
        and.push({
          term: {
            [fieldName]: val
          }
        });
        delete options[fieldName];
      });
      if (and.length) {
        options.body = {
          query: {
            filtered: {
              filter: {
                and, /*[
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
    if (options.Class) {
      const mData = this.em.entityMetas[_.isString(options.type) ? "findByName" : "findByClass"](options.Class);
      options.type = mData.type;
      options.index = mData.index;
      delete options.Class;
    }
    return this.em.client.search(options).then(this.transformSearchResult);
  }
}

export default Repository;
