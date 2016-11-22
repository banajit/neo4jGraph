/**
 * Created by Banajit on 11/11/2016
 */
'use strict';

(function (angular) {

  function constants($http) {
    var stateVariables = {};
    return {
      getConfig: function () {
        return $http.get('config.json');
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
