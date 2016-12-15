'use strict';

(function (angular) {

  function suggestRelationCtrl($scope, $mdDialog, CONSTANTS, ngToast, $rootScope, neo4jSrv, activeNodes) {
    $scope.activeNodes = activeNodes;
    $scope.selectedRelationship = '';
    $scope.relationships = neo4jSrv.findRelationshipType($scope.activeNodes[0], $scope.activeNodes[1]);
    $scope.closeDialog = function() {
      $mdDialog.hide('cancel');
    }
    $scope.connectNodes = function() {
      if($scope.selectedRelationship == '') {
        ngToast.create({
          className: 'warning',
          content: 'Please select relationship types.'
        });
      }
      else {
        $mdDialog.hide('connect');
        $scope.selectedRelationship = $scope.selectedRelationship-1;
        var sourceNode = ($scope.activeNodes[0].labelType == $scope.relationships[$scope.selectedRelationship].from)?$scope.activeNodes[0]:$scope.activeNodes[1];
        var targetNode = ($scope.activeNodes[1].labelType == $scope.relationships[$scope.selectedRelationship].to)?$scope.activeNodes[1]:$scope.activeNodes[0];
        var data = {sourceNode:sourceNode, targetNode:targetNode, relationship:$scope.relationships[$scope.selectedRelationship]};
        $rootScope.$broadcast('addRelation', data);

      }
    }
  }
  angular.module('neo4jApp')
    .controller('suggestRelationCtrl', suggestRelationCtrl);
})(angular)
