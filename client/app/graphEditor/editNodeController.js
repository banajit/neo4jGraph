'use strict';

(function (angular) {

  function editNodeCtrl($scope, nodeInfo, labelName) {
      $scope.nodeInfo = nodeInfo;
      $scope.labelName = labelName;
  }
  angular.module('neo4jApp')
    .controller('editNodeCtrl', editNodeCtrl);
})(angular)
