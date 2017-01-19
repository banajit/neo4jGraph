'use strict';

(function (angular) {

  function graphBrowserCtrl($scope, $mdSidenav, CONSTANTS, $timeout, neo4jSrv, $rootScope) {
    $scope.graphMode = 'browser';
    $scope.toggleLeft = buildToggler('filter');
    $scope.toggleEditor = buildToggler('editor');
    function buildToggler(componentId) {
      return function() {
        $mdSidenav(componentId).toggle();
      }
    }
    $scope.getPillStyle = function(key, searchKey) {
      angular.forEach($rootScope.masterQuery[searchKey]['data'][key], function(valueL, keyL){
        if(valueL == null) {
          delete $rootScope.masterQuery[searchKey]['data'][key][keyL];
        }
        if(Object.keys($rootScope.masterQuery[searchKey]['data'][key]).length == 0) {
          delete $rootScope.masterQuery[searchKey]['data'][key];
        }
      });
    }
  }

  angular.module('neo4jApp')
    .controller('graphBrowserCtrl', graphBrowserCtrl);

})(angular)
