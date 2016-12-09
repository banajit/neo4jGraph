'use strict';

(function (angular) {

  function graphCtrl($scope, CONSTANTS, $timeout) {
    var data = CONSTANTS.getConfig();
    var neo4jConfig = data.neo4jConfig;
    var currentSchema = CONSTANTS.getSchema();
    var queryList = [];
    angular.forEach(currentSchema.nodes, function(value, key){
      var query = 'match (n:' + key + ') with n optional MATCH (n)-[r]-() RETURN n,r';
      queryList.push(query);
    });
    var queryStr = queryList.join(' UNION ');
    console.log('Query = ', queryStr);
    var graphMetaInfo = {serverConfig:neo4jConfig, neo4jQuery:queryStr};
    CONSTANTS.setStateVariable('serverConfig', neo4jConfig);
    $timeout(function () {
        $scope.$broadcast('renderGraph', graphMetaInfo);
        CONSTANTS.setStateVariable('searchState', graphMetaInfo);
    });
  }

  angular.module('neo4jApp')
    .controller('graphCtrl', graphCtrl);

})(angular)
