'use strict';

(function (angular) {

  function graphEditorCtrl($scope, $mdSidenav, CONSTANTS, $timeout, neo4jSrv, ngToast, $mdDialog) {
      $scope.toggleLeft = buildToggler('filter');
      $scope.toggleEditor = buildToggler('editor');
      $scope.graphMode = 'editor';
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
      $scope.nodeLabels = currentSchema.nodes;
      /*sigma.neo4j.getLabels(
          neo4j,
          function(labels) {
              $scope.nodeLabels = labels;
          }
      );*/

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
            var propertyList = {};
            $scope.openNodeEditor(nodeType, item, propertyList, {});
          }
        }
      }

      //Dialog box
      $scope.openNodeEditor = function(nodeType, labelName, propertyList, node) {
        $mdDialog.show({
          locals: {nodeInfo: nodeType, labelName: labelName, propertyList:propertyList, node:node},
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
      //Listen for node update
      $scope.$on('nodeUpdate', function (event, data) {
        var propertyList = {};
        angular.forEach(data.neo4j_data, function(value, key){
           propertyList[key] = value;
        });
        console.log();
        var nodeType = currentSchema.nodes[data.labelType];
        $scope.openNodeEditor(nodeType, data.labelType, propertyList, data);
      });
  }
  angular.module('neo4jApp')
    .controller('graphEditorCtrl', graphEditorCtrl);
})(angular)
