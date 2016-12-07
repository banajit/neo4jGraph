'use strict';

(function (angular) {

  function graphEditorCtrl($scope, $mdSidenav, CONSTANTS, $timeout, neo4jSrv, ngToast, $mdDialog) {
      $scope.toggleLeft = buildToggler('filter');
      $scope.toggleEditor = buildToggler('editor');
      function buildToggler(componentId) {
        return function() {
          $mdSidenav(componentId).toggle();
        }
      }
      var configData = CONSTANTS.getConfig();
      var serverConfig = configData.neo4jConfig;
      var neo4j = { url: serverConfig.serverUrl, user: serverConfig.user, password: serverConfig.password };

      var currentSchema = CONSTANTS.getSchema();
      // Calling neo4j to get all its node label
      $scope.nodeLabels = [];
      sigma.neo4j.getLabels(
          neo4j,
          function(labels) {
              $scope.nodeLabels = labels;
          }
      );

      //drop callback
      $scope.addNodeToGraph = function(event, index, item, external, type, allowedType) {
        if(allowedType == 'allowed') {
          var nodeType = currentSchema.nodes[item];
          if(nodeType == undefined) {
            ngToast.create({
              className: 'warning',
              content: item + ' does not exist in schema, please contact system administrator to update the schema'
            });
          }
          else {
            $scope.openNodeEditor(nodeType, item);
          }
        }
      }

      //Dialog box
      $scope.openNodeEditor = function(nodeType, labelName) {
        $mdDialog.show({
          locals: {nodeInfo: nodeType, labelName: labelName},
          controller: 'editNodeCtrl',
          templateUrl: 'app/graphEditor/editNode.html',
          parent: angular.element(document.body),
          //targetEvent: ev,
          clickOutsideToClose:true
        })
        .then(function(answer) {
          $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
          $scope.status = 'You cancelled the dialog.';
        });
      };
  }
  angular.module('neo4jApp')
    .controller('graphEditorCtrl', graphEditorCtrl);
})(angular)
