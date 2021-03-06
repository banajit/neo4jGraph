/**
 * Created by Banajit on 11/11/2016
 */
'use strict';

(function (angular) {

  function neo4jSrv($http, $q, CONSTANTS, $rootScope) {
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
        var request = {
            method: 'POST',
            url: uploadUrl,
            data: formdata,
            headers: {
                'Content-Type': undefined
            }
        };
        return $http(request);
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
      },
      getIntersection: function (object1, object2) {
        return Object.keys(object1).concat(Object.keys(object2)).sort().reduce(function (r, a, i, aa) {
            if (i && aa[i - 1] === a) {
                r.push(a);
            }
            return r;
        }, []);
      },
      getDataType: function (nodeType, property) {
        var currentSchema = CONSTANTS.getSchema();
        return (currentSchema['nodes'][nodeType]['properties'][property]['dataType'])?currentSchema['nodes'][nodeType]['properties'][property]['dataType']:'string';
      },
      getMicaNodeKey: function (nodeType, property) {
        var currentSchema = CONSTANTS.getSchema();
        return (currentSchema['nodes'][nodeType]['properties'][property]['micaName'])?currentSchema['nodes'][nodeType]['properties'][property]['micaName']:false;
      },
      getMicaEdgeKey: function (edgeType, property) {
        var currentSchema = CONSTANTS.getSchema();
        return (currentSchema['relationships'][edgeType][property]['micaName'])?currentSchema['relationships'][edgeType][property]['micaName']:false;
      },
      getMicaUrl: function () {
         var currentSchema = CONSTANTS.getConfig();
         return CONSTANTS.getConfig().micaUrl;

      }
    }
  }
  //factory declaration
  angular.module('neo4jApp')
    .factory('neo4jSrv', neo4jSrv);

})(angular);
