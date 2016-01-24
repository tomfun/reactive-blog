import _ from "lodash";
import MetaData from "./Metadata";

export default class MetadataCollection extends Array {
  constructor(array) {
    arguments.length > 0 ? super(array) : super();
    this.findByIndexAndType = _.memoize(
      MetadataCollection.findByIndexAndType.bind(this),
      MetadataCollection.findByIndexAndTypeCacheResolver
    );
    console.log("\n\n\n##@@@@##\n", MetadataCollection)

  }
  findByName(name) {
    return _.find(this, {
      name
    });
  }
  findByClass(Class) {
    return _.find(this, {Class});
  }
  static findByIndexAndType(index, type) {
    return _.find(this, {
      index,
      type
    });
  }
  static findByIndexAndTypeCacheResolver(index, type) {
    return index + type;
  }
  add(metaData) {
    return this.push(metaData);
  }
  push(metaData) {
    if (!(metaData instanceof MetaData)) {
      throw new TypeError("metaData is not instanceof MetaData");
    }
    return super.push(metaData);
  }
}
