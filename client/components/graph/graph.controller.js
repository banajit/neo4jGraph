'use strict';

(function (angular) {

  function graphCtrl($scope, CONSTANTS) {
   CONSTANTS.getConfig().success(function (data) {
     var neo4jConfig = data.neo4jConfig;
     //var query = 'MATCH (n:SystemName) MATCH (n)-[r]->(m) RETURN n,r,m';
     var query = 'MATCH (n) MATCH ()-[r]->() RETURN n,r';
     var graphMetaInfo = {serverConfig:neo4jConfig, neo4jQuery:query};
     CONSTANTS.setStateVariable('serverConfig', neo4jConfig);
     $scope.$broadcast('renderGraph', graphMetaInfo);
   });
  }

  angular.module('neo4jApp')
    .controller('graphCtrl', graphCtrl);

})(angular)
