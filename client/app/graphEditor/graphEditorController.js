'use strict';

(function (angular) {

  function graphEditorCtrl($scope, $mdSidenav, CONSTANTS, $timeout, neo4jSrv, ngToast, $mdDialog, Auth, $state, $rootScope) {
      $scope.toggleLeft = buildToggler('filter');
      $scope.toggleEditor = buildToggler('editor');
      $scope.graphMode = 'editor';
      $scope.loggedIn = false;
      Auth.isLoggedInAsync(function(loggedIn) {
        $scope.loggedIn = loggedIn;
      });

      $scope.logOutSession = function() {
        Auth.logout();
        $state.go('login');
      }

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
      $scope.getBackgroundIcon = function(nodeType) {
        return currentSchema.nodes[nodeType]._default['defaultIcon'];
      }
      //Get node color
      $scope.getNodeStyle = function(nodeType) {
        return {
          "background-color" : currentSchema.nodes[nodeType]._default['defaultColor'],
          "color" : currentSchema.nodes[nodeType]._default['defaultColor'],
          //"background-image" : 'url("' + currentSchema.nodes[nodeType]._default['defaultIcon'] + '")',
        }
      }

      //drop callback
      $scope.addNodeToGraph = function(event, index, item, external, type, allowedType) {
        if(allowedType == 'allowed') {
          var pos = {x:event.screenX, y:event.screenY};
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

      //Dialog box for node editor
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
        var nodeType = currentSchema.nodes[data.labelType];
        $scope.openNodeEditor(nodeType, data.labelType, propertyList, data);
      });

      //Listen for node delete
      $scope.$on('nodeDelete', function (event, node) {
         var query = 'MATCH (n:' + node.labelType + ') WHERE id(n)=' + node.id + ' DELETE n';
         console.log('Delete Query', query);
         neo4jSrv.executeCypherQuery(serverConfig, query).then(function(data) {
            if(data.errors.length == 0) {
              ngToast.create({
                className: 'success',
                content: 'Node Deleted successfully.'
              });
              $scope.$broadcast('deleteNodeToGraph', node);
            }
            else {
              ngToast.create({
                className: 'danger',
                content: data.errors[0].message
              });
            }
         });
      });


      //Listen for relation add
      $scope.relationShipAttr = {};
      var relationship = currentSchema.relationships;


      $scope.$on('addRelation', function (event, data) {
        var sourceNode = data.sourceNode;
        var targetNode = data.targetNode;
        var relation = data.relationship;
        $scope.relationshipProperties = angular.copy(relation.relationship, $scope.relationshipProperties);
        var relationName = relation.name;
        delete $scope.relationshipProperties['_appliesTo'];
        delete $scope.relationshipProperties['_default'];
        $scope.openRelationEditor(sourceNode, targetNode, $scope.relationshipProperties, {}, relationName, {});
      });

      //Dialog box for node editor
      $scope.openRelationEditor = function(sourceNode, targetNode, propertyList, propertyValues, relationName, edge) {
        $mdDialog.show({
          locals: {sourceNode: sourceNode, targetNode: targetNode, propertyList:propertyList, editMode:false, propertyValues:propertyValues, relationName:relationName, edge:edge},
          controller: 'editRelationCtrl',
          templateUrl: 'app/graphEditor/editRelationship.html',
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
      $scope.$on('edgeUpdate', function (event, data) {
        var relationKey = data.edge.neo4j_type;
        if(relationKey !== '') {
          $scope.relationshipProperties = angular.copy(relationship[relationKey], $scope.relationshipProperties);
          delete $scope.relationshipProperties['_appliesTo'];
          delete $scope.relationshipProperties['_default'];
          var propertyValues = {};
          angular.forEach(data.edge.neo4j_data, function(value, key){
             propertyValues[key] = value;
          });
          $scope.openRelationEditor(data.sourceNode, data.targetNode, $scope.relationshipProperties, propertyValues, relationKey, data.edge);
        }
      });
      //Listen for edge delete
      $scope.$on('edgeDelete', function (event, data) {
         var query = 'MATCH (:'+ data.sourceNode.labelType +')-[r]->(:' + data.targetNode.labelType + ') where id(r)=' + data.edge.id + ' DELETE r';
         console.log('Delete Query', query);
         var edge = data.edge;
         neo4jSrv.executeCypherQuery(serverConfig, query).then(function(data) {
            if(data.errors.length == 0) {
              ngToast.create({
                className: 'success',
                content: 'Edge Deleted successfully.'
              });
              $scope.$broadcast('deleteEdgeToGraph', edge);
            }
            else {
              ngToast.create({
                className: 'danger',
                content: data.errors[0].message
              });
            }
         });
      });
      $scope.getPillStyle = function(key, searchKey) {
        angular.forEach($rootScope.masterQuery[searchKey]['data'][key], function(valueL, keyL){
          if(valueL == null) {
            delete $rootScope.masterQuery[searchKey]['data'][key][keyL];
          }
          if(Object.keys($rootScope.masterQuery[searchKey]['data'][key]).length == 0) {
            delete $rootScope.masterQuery[searchKey]['data'][key];
          }
        });
        if($rootScope.masterQuery[searchKey]['data'] !== undefined && $rootScope.masterQuery[searchKey]['data'][key] !== undefined && Object.keys($rootScope.masterQuery[searchKey]['data'][key]).length > 0) {
          return 'facet-border-1';
        }
        else {
          return 'facet-border-0';
        }
      }
  }
  angular.module('neo4jApp')
    .controller('graphEditorCtrl', graphEditorCtrl);
})(angular)
