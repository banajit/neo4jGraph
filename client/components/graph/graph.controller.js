'use strict';

(function (angular) {

  function graphCtrl($scope, CONSTANTS, $timeout) {
    var data = CONSTANTS.getConfig();
    var neo4jConfig = data.neo4jConfig;
    //var query = 'MATCH (n:SystemName) MATCH (n)-[r]-() RETURN n,r';
    var query = 'MATCH (n)-[r]-() RETURN n,r';
    var graphMetaInfo = {serverConfig:neo4jConfig, neo4jQuery:query};
    CONSTANTS.setStateVariable('serverConfig', neo4jConfig);
    $timeout(function () {
        $scope.$broadcast('renderGraph', graphMetaInfo);
    });
  }

  angular.module('neo4jApp')
    .controller('graphCtrl', graphCtrl);

})(angular)
