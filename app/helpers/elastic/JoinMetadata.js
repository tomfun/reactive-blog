export default class JoinMetadata {
  constructor(name, cls, fieldName, type, options) {
    this.name = name;
    this.Class = cls;
    this.fieldName = fieldName;
    this.type = type;
    this.options = options || {};
  }
}
