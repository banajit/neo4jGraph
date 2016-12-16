/**
 * Created by Banajit on 11/11/2016
 */
'use strict';

(function (angular) {

  function neo4jSrv($http, $q, CONSTANTS) {
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
      },
      uploadFile: function (file, uploadUrl) {
        var formdata = new FormData();
        formdata.append('file', file);
        console.log(file);
        var request = {
            method: 'POST',
            url: '/graph/upload',
            data: formdata,
            headers: {
                'Content-Type': undefined
            }
        };
        // SEND THE FILES.
        $http(request)
            .success(function (d) {
                console.log(d)
            })
            .error(function () {
            });
      },
      findRelationshipType: function (sourceNode, targetNode) {
        var currentSchema = CONSTANTS.getSchema();
        var relationship = currentSchema.relationships;
        var relationKey = [];
        angular.forEach(relationship, function(value, key){
          var found = 0;
          angular.forEach(value._appliesTo, function(Rvalue, Rkey){
              if((sourceNode.labelType == Rvalue.from && targetNode.labelType == Rvalue.to) || (sourceNode.labelType == Rvalue.to && targetNode.labelType == Rvalue.from)) {
                relationKey.push({name:key, relationship:relationship[key], index:Rkey, from:Rvalue.from, to:Rvalue.to});
              }
          });
        });
        return relationKey;
      }
    }
  }
  //factory declaration
  angular.module('neo4jApp')
    .factory('neo4jSrv', neo4jSrv);

})(angular);
