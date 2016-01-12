export default class MetaData {
  constructor(name, cls, mappings) {
    this.name = name;
    this.class = cls;
    this.mappings = mappings || {};
  }

  getMappings() {
    return {
      [this.name]: {
        properties: this.mappings
      }
    };
  }

  createType(client, indexName) {
    let args = {
      index: indexName,
      type: this.name,
      body: {
        mappings: this.getMappings()
      }
    };
    return client.indices.create(args);
  }

  putType(client, indexName) {
    let args = {
      index: indexName,
      type: this.name,
      body: this.getMappings()
    };
    return client.indices.putMapping(args);
  }

  existType(client, indexName) {
    return client.indices.exists({
      index: indexName,
      type: this.name,
    });
  }
}
