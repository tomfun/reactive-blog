var _ = require('lodash');
var elasticsearch = require('elasticsearch');
var path = require('path');

//var config = require(path.join(__dirname, '..', 'app', 'config.js')); todo

//var console = config.elasticsearch.log ? new config.elasticsearch.log() : global.console;

//var client = new elasticsearch.Client(config.elasticsearch); todo
var client = new elasticsearch.Client({
  host:           'localhost:9200',//todo: !
    requestTimeout: 10000,
    apiVersion:     '2.1',
    log: 'trace'
    //log: logging ? require('./helpers/loggerFactory').extend("elastica") : undefined,
});

export default client;
