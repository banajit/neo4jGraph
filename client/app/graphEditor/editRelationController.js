'use strict';

(function (angular) {

  function editRelationCtrl($scope, $mdDialog, CONSTANTS, ngToast, $rootScope, neo4jSrv, sourceNode, targetNode, propertyList, editMode, propertyValues, relationName, edge) {
    $scope.editMode = editMode;
    $scope.sourceNode = sourceNode;
    $scope.targetNode = targetNode;
    $scope.propertyList = propertyList;
    $scope.propertyValues = propertyValues;
    $scope.editMode = (Object.keys(propertyValues).length>0)?true:false;
    var data = CONSTANTS.getConfig();
    var serverConfig = data.neo4jConfig;
    $scope.closeDialog = function() {
      $mdDialog.hide();
    }

    $scope.saveRelation = function() {
      if($scope.editNodeForm.$valid) {
        if($scope.editMode) {
          updateRelation();
        }
        else {
          addRelation();
        }
      }
    }
    //update relation
    function updateRelation() {
      var neo4j_data = {};
      var properties = [];
      angular.forEach($scope.propertyValues, function(value, key){
         if(value !== null) {
           properties.push('r.' + key + ' = "' + value + '"');
           neo4j_data[key] = value;
         }
      });
      console.log(edge, properties)
      if(properties.length>0) {
         properties = properties.join(',');
         var query = 'MATCH (:' + sourceNode.labelType + ')-[r]->(:' + targetNode.labelType + ') where id(r)=' + edge.id + ' set ' + properties + ' return r';
         console.log('Update Query', query);
         neo4jSrv.executeCypherQuery(serverConfig, query).then(function(data) {
            if(data.errors.length == 0) {
               ngToast.create({
                 className: 'success',
                 content: 'Relation updated successfully.'
               });
               var edge = angular.merge(data.results[0].data[0].meta[0], data.results[0].data[0].row[0]);
               edge.neo4j_data = neo4j_data;
               $rootScope.$broadcast('updateEdgeToGraph', edge);
               $mdDialog.hide();
            }
         });
      }
    }

    //Add relationship
    function addRelation() {
       var properties = [];
       var neo4j_data = {};
       angular.forEach($scope.propertyValues, function(value, key){
         if(value !== null) {
           properties.push(key + ':"' + value + '"');
           neo4j_data[key] = value;
         }
       });
       if(properties.length>0) {
        console.log(sourceNode, targetNode)
          properties = '{' + properties.join(',') + '}';
          var query = 'MATCH (frm:' + sourceNode.labelType + '),(to:' + targetNode.labelType + ') where id(frm) = ' + sourceNode.id + ' and id(to) = ' + targetNode.id + ' create (frm)-[r:' + relationName + ' ' +  properties + ']->(to) return r';
           console.log('Relation Add Query', query);
          neo4jSrv.executeCypherQuery(serverConfig, query).then(function(data) {
             if(data.errors.length == 0) {
               ngToast.create({
                 className: 'success',
                 content: 'Relation added successfully.'
               });
               var edge = angular.merge(data.results[0].data[0].meta[0], data.results[0].data[0].row[0]);
               edge.source = sourceNode.id;
               edge.target = targetNode.id;
               edge.neo4j_data = neo4j_data;
               edge.neo4j_type = relationName;
               edge.label = relationName;
               $rootScope.$broadcast('addEdgeToGraph', edge);
               $mdDialog.hide();
             }
          });
       }
    }

  }
  angular.module('neo4jApp')
    .controller('editRelationCtrl', editRelationCtrl);
})(angular)
