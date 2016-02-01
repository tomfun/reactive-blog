import _ from "lodash";

import ElasticManager from "./elastic/ElasticManager";

const elasticsearch = require("elasticsearch");

const client = new elasticsearch.Client({
  host:           "localhost:9200", //todo: !
  requestTimeout: 10000,
  apiVersion:     "2.2",
  //log:            "trace"
  //log: logging ? require('./helpers/loggerFactory').extend("elastica") : undefined,
});

client.ping().then(function () {
  console.log('ping sucess')
})

class DefaultManager extends ElasticManager {
  constructor() {
    super(client, {indexName: "reactive_blog_"});
  }
}


export default DefaultManager;
