const _ = require("lodash");

import MetadataCollection from "./MetadataCollection";
import simpleCacher from "./simpleCacher";
import Uow from "./Uow";
import SchemaManager from "./SchemaManager";
import Repository from "./Repository";
import ClassDecorator from "./ClassDecorator";
import {importMetadata} from "./annotations";

class ElasticManager {
  /**
   * @param {Object} client elasticsearch client (connection)
   * @param {Object} configuration
   * @param {String} configuration.indexName
   * @param {Function} [loadFilter] filter annotation metadata
   */
  constructor(client, configuration, loadFilter) {
    this.client = client;
    this.configuration = configuration;
    this.uow = new Uow(this);
    this.sm = new SchemaManager(this);
    this.repo = new Repository(this);
    this.simpleCacher = simpleCacher;
    this.entityMetas = new MetadataCollection();
    this.decorator = new ClassDecorator(this, importMetadata(loadFilter));
  }

  /**
   * Find entity by id and Class
   * @param {Class|String} [opt.Class] override opt.type and opt.index
   * @param {String} [opt.type]
   * @param {String} [opt.index]
   * @param {String|Array<String>} opt.id
   * @return {Promise<Object|null>}
   */
  find(opt) {
    return this.repo.findById(opt);
  }

  persist(mappedObject) {
    return this.uow.persist(mappedObject);
  }

  remove(mappedObject) {
    return this.uow.remove(mappedObject);
  }

  detach(mappedObject) {
    return this.uow.detach(mappedObject);
  }

  refresh(mappedObject) {
    return this.uow.refresh(mappedObject);
  }

  //getEntityState

  createTypes() {
    return this.sm.createTypes();
  }
}

export default ElasticManager;
