/**
 * Created by Banajit on 11/11/2016
 */
'use strict';

(function (angular) {

  function constants($http, CONFIG, SCHEMA) {
    var stateVariables = {};
    return {
      getConfig: function () {
        return CONFIG;
      },
      getSchema: function () {
        return SCHEMA;
      },
      setStateVariable: function (name, value) {
          stateVariables[name] = value;
      },
      getStateVariable: function (name) {
          return stateVariables[name];
      }
    }
  }
  //factory declaration
  angular.module('neo4jApp')
    .factory('CONSTANTS', constants);

})(angular);
