'use strict';

(function (angular) {

  function graphCtrl($scope, CONSTANTS) {
   CONSTANTS.getConfig().success(function (data) {
     var neo4jConfig = data.neo4jConfig;
     var query = 'MATCH (n:SystemName) MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 25';
     var graphMetaInfo = {serverConfig:neo4jConfig, neo4jQuery:query};
     $scope.$broadcast('renderGraph', graphMetaInfo);
   });
  }

  angular.module('neo4jApp')
    .controller('graphCtrl', graphCtrl);

})(angular)
