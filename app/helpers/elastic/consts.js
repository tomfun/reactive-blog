/**
 * @url https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html
 */
export const FIELD_TYPES = {
  STRING:      "string",
  LONG:        "long",
  INTEGER:     "integer",
  SHORT:       "short",
  BYTE:        "byte",
  DOUBLE:      "double",
  FLOAT:       "float",
  DATE:        "date",
  BOOLEAN:     "boolean",
  BINARY:      "binary",
  OBJECT:      "object",
  NESTED:      "nested",
  GEO_POINT:   "geo_point",
  GEO_SHAPE:   "geo_shape",
  IP:          "ip",
  COMPLETION:  "completion",
  TOKEN_COUNT: "token_count",
  MURMUR3:     "murmur3",
  //todo: VIRTUAL
};

export const JOIN_TYPES = {
  ONE_TO_MANY:                 "i 1:m",
  MANY_TO_ONE:                 "o m:1",
  ONE_TO_ONE_OWNING:           "o 1:1",
  ONE_TO_ONE_INVERSE:          "i 1:1",
  MANY_TO_MANY_UNIDIRECTIONAL: "u m:m",
  MANY_TO_MANY_OWNING:         "o m:m",
  MANY_TO_MANY_INVERSE:        "i m:m",
  ONE_TO_MANY_NESTED:          "n 1:m",
  ONE_TO_ONE_NESTED:           "n 1:1",
  ONE_TO_ANY_NESTED:           "n 1:x",
  ONE_TO_ANY_OWNING:           "o 1:x",
};

/**
 * @enum {String}
 * @type {{SET_NULL: string, RESTRICT: string, CASCADE: string}}
 */
export const CASCADE_REMOVE_TYPE = {
  SET_NULL: "SET_NULL",
  RESTRICT: "RESTRICT",
  CASCADE:  "CASCADE",
};
