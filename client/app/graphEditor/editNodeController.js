'use strict';

(function (angular) {

  function editNodeCtrl($scope, nodeInfo, labelName, $mdDialog, CONSTANTS, ngToast, $rootScope, propertyList, neo4jSrv, node) {
      $scope.node = node;
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
        if($scope.editNodeForm.$valid && $scope.propertyList.length>0) {
          if($scope.editMode) {
            updateNode();
          }
          else {
            addNode();
          }
        }
        else {
          ngToast.create({
            className: 'warning',
            content: 'At least one attribute must be defined before saving!'
          });
        }
      }

      function updateNode() {
        var neo4j_data = {};
        var properties = [];
        var iconExist = 0;
        angular.forEach($scope.propertyList, function(value, key){
           if(value !== null && key !== 'iconUrl') {
             properties.push('n.' + key + ' = "' + value + '"');
             neo4j_data[key] = value;
           }
           if(key === 'iconUrl' && node.url != undefined) {
            properties.push('n.' + key + ' = "' + node.url + '"');
            neo4j_data[key] = node.url;
            iconExist = 1;
           }
        });
        if(iconExist == 0 && node.url != undefined) {
           properties.push('n.iconUrl = "' + node.url + '"');
           neo4j_data['iconUrl'] = node.url;
        }
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
         var imageUrl = '';
         angular.forEach($scope.propertyList, function(value, key){
           if(value !== null) {
             properties.push(key + ':"' + value + '"');
             neo4j_data[key] = value;
           }
         });
          if(node.url !== undefined) {
            imageUrl = node.url;
            properties.push('iconUrl:"' + imageUrl + '"');
            neo4j_data['iconUrl'] = imageUrl;
          }
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
                 /*node.x = nodeInfo.pos.x;
                 node.y = nodeInfo.pos.y;*/
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
