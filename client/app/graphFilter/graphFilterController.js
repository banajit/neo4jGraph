'use strict';

(function (angular) {

  function graphFilterCtrl($scope, $mdSidenav, CONSTANTS, $timeout, neo4jSrv, $rootScope, $q) {
      $scope.searchMaster = {};
      // ******************************
      // Load all configurations for graphdb access and leftsidebar
      // ******************************
      var currentSchema = CONSTANTS.getSchema();
      $scope.selectedLabels = {};
      angular.forEach(currentSchema.nodes, function(value, key){
        $scope.searchMaster[key] = value;
        $scope.selectedLabels[key] = true;
      });

      var data = CONSTANTS.getConfig();
      var maxHops = data.maxHops;
      CONSTANTS.setStateVariable('config', data);
      var serverConfig = data.neo4jConfig;


      // ******************************
      // Search query for populating autocomplete box
      // ******************************
      $scope.loadValuesByProperty = function(queryStrn, propertyKey, labelType) {
         var config = CONSTANTS.getStateVariable('config');
         var serverConfig = config.neo4jConfig;
         var conditions = [], whereCond = '';
         angular.forEach($scope.selectedItem[labelType], function(value, key){
           if(value !== null && key!== propertyKey) {
             var cond = (neo4jSrv.getDataType(labelType, key) == 'string')?'lower(n.' + key + ') = ' + '"' + value.toLowerCase() + '"':'n.' + key + ' = ' + value;
             conditions.push(cond);
           }
         });
         if(neo4jSrv.getDataType(labelType, propertyKey) == 'string') {
            conditions.push('lower(n.' + propertyKey + ') =~ ".*' + queryStrn.toLowerCase() + '.*"');
         }
         else {
            conditions.push('n.' + propertyKey + ' = ' + queryStrn);
         }

         if(conditions.length>0) {
           whereCond = ' WHERE ' + conditions.join(' AND ');
         }
         var query = 'MATCH(n:' + labelType + ') ' + whereCond + ' return n;';
         console.log('Typeahead - Property Value Search = ', query);

         return neo4jSrv.executeCypherQuery(serverConfig, query).then(function(data) {
           var results = [];
           angular.forEach(data.results[0].data, function(Rvalue, Rkey){
             results.push(Rvalue.row[0][propertyKey]);
           });
           var unique = results.filter(function(elem, index, self) {
               return index == self.indexOf(elem);
           })
           return unique;
         });

      }
      $scope.selectedItem = {};
      $scope.changeSelectedItem = function(label, key, text) {
        $timeout(function () {
          $scope.selectedItem[label][key] = text;
        }, 100);

      }
      // ******************************
      // Filter graph on search form submit
      // ******************************
      $rootScope.searchFilters = {};
      $rootScope.masterQuery = [];

      $scope.searchInGraph = function(insert) {
        if($scope.masterQuery.length == 0) {
          $scope.filterGraph();
        }
        else {
          if(insert == undefined) {
             $rootScope.masterQuery.push({data:$scope.selectedItem});
          }
          $scope.selectedItem = {};
          var searchQueries = [];
          angular.forEach($rootScope.masterQuery, function(labelVal, labelKey){
              angular.forEach(labelVal.data, function(InnerValue, InnerKey){
                var conditions = [], whereCond = '';
                $scope.selectedLabels[InnerKey] = true;
                angular.forEach(InnerValue, function(value, key){
                  if(value !== null) {
                    var cond = (neo4jSrv.getDataType(InnerKey, key) == 'string')?'n.' + key + ' = ' + '"' + value + '"':'n.' + key + ' = ' + value;
                    conditions.push(cond);
                  }
                });
                if(conditions.length>0) {
                  whereCond = ' WHERE ' + conditions.join(' AND ');
                  var query = 'MATCH (n:' + InnerKey +') '+ whereCond + ' RETURN n';
                  searchQueries.push(query);
                }
              });
          });
          var searchQueryStr = searchQueries.join(' UNION ');
          if(searchQueryStr.length > 0) {
            var config = CONSTANTS.getStateVariable('config');
            var serverConfig = config.neo4jConfig;
            var nids = [];
            console.log(searchQueryStr);
            sigma.neo4j.cypher(
                { url: serverConfig.serverUrl, user: serverConfig.user, password: serverConfig.password },
                searchQueryStr,
              function(graph) {
                angular.forEach(graph.nodes, function(value, key){
                   nids.push(parseInt(value.id));
                });

                if(nids.length > 0) {
                   var nidParam = '[' + nids.join(',') + ']';
                   var neo4jQuery = 'MATCH (a)-[r*..' + maxHops + ']->(b) WHERE id(a) IN ' + nidParam + ' AND id(b) IN ' + nidParam + ' RETURN r;';
                   console.log(neo4jQuery);
                   var graphMetaInfo = {serverConfig:serverConfig, neo4jQuery:neo4jQuery, existGraph:graph};
                   $scope.$emit('refreshGraph', graphMetaInfo);
                 }
              }
            );
          }

        }
      }


      $scope.filterGraph = function(insert) {
        var searchQueries = [];
        if(insert == undefined) {
           $rootScope.masterQuery.push({data:$scope.selectedItem});
        }
        angular.forEach($scope.selectedItem, function(labelVal, labelKey){
          var conditions = [], whereCond = '';
          var innerElems = {};
          $scope.selectedLabels[labelKey] = true;
          angular.forEach(labelVal, function(value, key){
            if(value !== null) {
              var cond = (neo4jSrv.getDataType(labelKey, key) == 'string')?'n.' + key + ' = ' + '"' + value + '"':'n.' + key + ' = ' + value;
              conditions.push(cond);
              innerElems[key] = labelKey + '.' + key + '=' + value;
            }
          });
          if(conditions.length>0) {
            whereCond = ' WHERE ' + conditions.join(' AND ');
            var query = 'MATCH (n:' + labelKey +') with n optional MATCH (n)-[r]-() with n,r'+ whereCond + ' RETURN n,r';
            searchQueries.push(query);
            $rootScope.searchFilters[labelKey] = innerElems;
          }
        });

        var searchQueryStr = searchQueries.join(' UNION ');
        if(searchQueryStr.length > 0) {
          var config = CONSTANTS.getStateVariable('config');
          var serverConfig = config.neo4jConfig;
          var graphMetaInfo = {serverConfig:serverConfig, neo4jQuery:searchQueryStr};
          CONSTANTS.setStateVariable('searchState', graphMetaInfo);
          $scope.$emit('refreshGraph', graphMetaInfo);
        }
        if(searchQueryStr.length == 0) {
          $scope.resetGraph();
        }
        $scope.selectedItem = {};

      }

      $rootScope.removeFilter = function(searchKey,labelKey, PropKey) {
        delete $rootScope.masterQuery[searchKey]['data'][labelKey][PropKey];
        var count = 0
        angular.forEach($rootScope.masterQuery, function(value, key){
          var countFlag = 0
          angular.forEach(value.data, function(valueL, keyL){
            if(Object.keys(valueL).length>0) {
              countFlag = 1;
              return 1;
            }
          });
          if(countFlag == 1) {
            $scope.selectedItem = $rootScope.masterQuery[key]['data'];
            count++;
          }
        });

        if(count==1) {
         $scope.filterGraph(0);
        }
        else if(count == 0) {
          $rootScope.resetGraph();
        }
        else {
           $scope.searchInGraph(0);
        }
      }
      //Reset graph
      var neo4jConfig = data.neo4jConfig;
      var currentSchema = CONSTANTS.getSchema();
      $rootScope.resetGraph = function() {
        var data = CONSTANTS.getConfig();
        var queryList = [];
        $rootScope.masterQuery = [];
        angular.forEach(currentSchema.nodes, function(value, key){
          var query = 'match (n:' + key + ') with n optional MATCH (n)-[r]-() RETURN n,r';
          queryList.push(query);
          $scope.selectedLabels[key] = true;
        });
        var queryStr = queryList.join(' UNION ');
        console.log('Query = ', queryStr);
        var graphMetaInfo = {serverConfig:neo4jConfig, neo4jQuery:queryStr};
        $scope.$emit('refreshGraph', graphMetaInfo);
        $scope.selectedItem = {};
        $rootScope.searchFilters = {};
        angular.element('#search-form input').val("");
        angular.element('#search-form input').attr('aria-expanded', 'false');
        searchForm.$pristine = true
        searchForm.$valid = true
      }

      //Refresh layout
      $scope.refreshLayout = function() {
        $scope.$broadcast('refreshLayout');
      }

      //update graph
      $scope.updateGraph = function($event, key) {
        $scope.searchMaster[key].open = ($scope.searchMaster[key].open == true)?false:true;
        if(Object.keys($scope.selectedLabels).length == 1 && $scope.selectedLabels[key] != undefined) {
          return true;
        }
        $timeout(function () {
          var checkbox = $event.target;
          var action = (checkbox.checked ? 'add' : 'remove');
          if($scope.selectedLabels[key] == undefined) {
            $scope.selectedLabels[key] = true;
          }
          else {
            $scope.searchMaster[key].open = false;
            delete $scope.selectedLabels[key];
          }
          var queryList = [];
          angular.forEach($scope.selectedLabels, function(value, key){
            var query = 'match (n:' + key + ') with n optional MATCH (n)-[r]-() RETURN n,r';
            queryList.push(query);
          });
          var queryStr = queryList.join(' UNION ');
          console.log('Query = ', queryStr);
          var graphMetaInfo = {serverConfig:neo4jConfig, neo4jQuery:queryStr, clearGraph:true};
          $scope.$emit('refreshGraph', graphMetaInfo);
        });
      }
  }
  angular.module('neo4jApp')
    .controller('graphFilterCtrl', graphFilterCtrl);
})(angular)
