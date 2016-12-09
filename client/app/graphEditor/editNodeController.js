'use strict';

(function (angular) {

  function editNodeCtrl($scope, nodeInfo, labelName, $mdDialog, CONSTANTS, ngToast, $rootScope, propertyList, neo4jSrv, node) {
      $scope.nodeInfo = nodeInfo;
      $scope.labelName = labelName;
      $scope.propertyList = propertyList;
      var data = CONSTANTS.getConfig();
      var serverConfig = data.neo4jConfig;
      $scope.closeDialog = function() {
        $mdDialog.hide();
      }
      $scope.editMode = (Object.keys(propertyList).length>0)?true:false;

      $scope.deleteNode = function() {
        var query = 'MATCH (n:' + labelName + ') WHERE id(n)=' + node.id + ' DELETE n';
         console.log('Delete Query', query);
         neo4jSrv.executeCypherQuery(serverConfig, query).then(function(data) {
            if(data.errors.length == 0) {
              ngToast.create({
                className: 'success',
                content: 'Node Deleted successfully.'
              });
              $rootScope.$broadcast('deleteNodeToGraph', node);
              $mdDialog.hide();
            }
         });
      }

      $scope.saveNode = function() {
        if($scope.editNodeForm.$valid) {
          if($scope.editMode) {
            updateNode();
          }
          else {
            addNode();
          }
        }
      }

      function updateNode() {
        var neo4j_data = {};
        var properties = [];
        angular.forEach($scope.propertyList, function(value, key){
           if(value !== null) {
             properties.push('n.' + key + ' = "' + value + '"');
             neo4j_data[key] = value;
           }
        });
        if(properties.length>0) {
           properties = properties.join(',');
           var query = 'match (n:' + labelName + ') where id(n) = ' + node.id + ' set ' + properties + ' return n';
           console.log('Update Query', query);
           neo4jSrv.executeCypherQuery(serverConfig, query).then(function(data) {
              if(data.errors.length == 0) {
                ngToast.create({
                  className: 'success',
                  content: 'Node updated successfully.'
                });
                var node = angular.merge(data.results[0].data[0].meta[0], data.results[0].data[0].row[0]);
                node.neo4j_data = neo4j_data;
                node.labelType = labelName;
                $rootScope.$broadcast('updateNodeToGraph', node);
                $mdDialog.hide();
              }
           });
        }

      }

      function addNode() {
         var properties = [];
         var neo4j_data = {};
         angular.forEach($scope.propertyList, function(value, key){
           if(value !== null) {
             properties.push(key + ':"' + value + '"');
             neo4j_data[key] = value;
           }
         });
         if(properties.length>0) {
            properties = properties.join(',');
            var query = 'CREATE (n:' + labelName + ' {' + properties + '}) return n';
            console.log(query)
            neo4jSrv.executeCypherQuery(serverConfig, query).then(function(data) {
               if(data.errors.length == 0) {
                 ngToast.create({
                   className: 'success',
                   content: 'Node added successfully.'
                 });
                 var node = angular.merge(data.results[0].data[0].meta[0], data.results[0].data[0].row[0]);
                 node.neo4j_data = neo4j_data;
                 node.labelType = labelName;
                 $rootScope.$broadcast('addNodeToGraph', node);
                 $mdDialog.hide();
               }
            });
         }
      }
  }
  angular.module('neo4jApp')
    .controller('editNodeCtrl', editNodeCtrl);
})(angular)
