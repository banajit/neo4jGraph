/**
 * Created by Banajit on 11/11/2016
 */
'use strict';

(function (angular) {

  function neo4jSrv($http, $q) {
    return {
      executeCypherQuery: function (serverConfig, query) {
         var neo4j = { url: serverConfig.serverUrl, user: serverConfig.user, password: serverConfig.password };
         var endpoint = '/db/data/transaction/commit', timeout = -1;
         var data = JSON.stringify({
            "statements": [
             {
                 "statement": query,
                 "params": {},
                 "includeStats": false
             }
           ]
         });
         var deferred = $q.defer();
         sigma.neo4j.send(neo4j, endpoint, 'POST', data,
           function(data) {
              deferred.resolve(data);
           }, timeout);
         return deferred.promise;
      }
    }
  }
  //factory declaration
  angular.module('neo4jApp')
    .factory('neo4jSrv', neo4jSrv);

})(angular);
