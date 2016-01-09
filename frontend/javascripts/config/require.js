(function () {
  'use strict';
  requirejs.config({
    //TODO: bust
    "urlArgs": "bust=" + (new Date(1)).getTime(),
    "baseUrl": '/dependencies/js',
    "waitSeconds": 30,
    "paths": {},
    "map": {
      "*": {
        twig: 'config/twig',
        underscore: 'lodash'
      },
      "config/twig": {
        'twig': 'twig'
      }
    }
  });
}());
