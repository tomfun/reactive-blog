export default class MetaData {
  constructor(name, cls, mappings, index, type) {
    this.name = name;
    this.Class = cls;
    this.index = index;
    this.type = type || name;
    this.mappings = mappings || {};
    this.joins = [];
  }

  getMappings() {
    return {
      [this.name]: {
        properties: this.mappings
      }
    };
  }

  createType(client) {
    let args = {
      index: this.index,
      type: this.type,
      body: {
        mappings: this.getMappings()
      }
    };
    return client.indices.create(args);
  }

  putType(client) {
    let args = {
      index: this.index,
      type: this.type,
      body: this.getMappings()
    };
    return client.indices.putMapping(args);
  }

  existType(client) {
    return client.indices.exists({
      index: this.index,
      type: this.type,
    });
  }

  create(client, json) {
    return client.create({
      index: this.index,
      type: this.type,
      id: json.id,
      body: json
    });
  }

  remove(client, json) {
    return client.delete({
      index: this.index,
      type: this.type,
      id: json.id,
    });
  }
}
