'use strict';

(function (angular) {

  function graphBrowserCtrl($scope, $mdSidenav, CONSTANTS, $timeout, neo4jSrv) {
    $scope.graphMode = 'browser';
    $scope.toggleLeft = buildToggler('filter');
    $scope.toggleEditor = buildToggler('editor');
    function buildToggler(componentId) {
      return function() {
        $mdSidenav(componentId).toggle();
      }
    }
  }

  angular.module('neo4jApp')
    .controller('graphBrowserCtrl', graphBrowserCtrl);

})(angular)
