'use strict';

(function (angular) {

  function graphFilterCtrl($scope, $mdSidenav, CONSTANTS, $timeout, neo4jSrv, $rootScope) {
      $scope.searchMaster = {};
      // ******************************
      // Load all configurations for graphdb access and leftsidebar
      // ******************************
      var currentSchema = CONSTANTS.getSchema();
      angular.forEach(currentSchema.nodes, function(value, key){
        $scope.searchMaster[key] = value;
      });

      var data = CONSTANTS.getConfig();
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
            conditions.push('lower(n.' + propertyKey + ') =~ "' + queryStrn.toLowerCase() + '.*"');
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
      $scope.filterGraph = function() {
        var searchQueries = [];
        $rootScope.searchFilters = {};
        angular.forEach($scope.selectedItem, function(labelVal, labelKey){
          var conditions = [], whereCond = '';
          var innerElems = {};
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
        console.log(searchQueryStr);

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

      }

      $rootScope.removeFilter = function(labelKey, PropKey) {
        delete $scope.selectedItem[labelKey][PropKey];
        $scope.filterGraph();
      }
      //Reset graph
      $scope.resetGraph = function() {
        var data = CONSTANTS.getConfig();
        var neo4jConfig = data.neo4jConfig;
        var currentSchema = CONSTANTS.getSchema();
        var queryList = [];
        angular.forEach(currentSchema.nodes, function(value, key){
          var query = 'match (n:' + key + ') with n optional MATCH (n)-[r]-() RETURN n,r';
          queryList.push(query);
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
  }
  angular.module('neo4jApp')
    .controller('graphFilterCtrl', graphFilterCtrl);
})(angular)
