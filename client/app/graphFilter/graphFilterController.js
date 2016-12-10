'use strict';

(function (angular) {

  function graphFilterCtrl($scope, $mdSidenav, CONSTANTS, $timeout, neo4jSrv) {
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

      /*var data = CONSTANTS.getConfig();
       CONSTANTS.setStateVariable('config', data);
       var serverConfig = data.neo4jConfig;
       var params = {};
       var query = 'CALL db.propertyKeys();'
       var neo4j = { url: serverConfig.serverUrl, user: serverConfig.user, password: serverConfig.password };
       var endpoint = '/db/data/transaction/commit', timeout = -1;
       var data = JSON.stringify({
         "statements": [
             {
                 "statement": query,
                 "params": {},
                 "includeStats": false
             }
         ]
       });
       sigma.neo4j.send(neo4j, endpoint, 'POST', data,
       function(data) {
          var tempKeys = [];
          angular.forEach(data.results[0].data, function(value, key){
            tempKeys.push(value.row[0]);
          });
          $scope.searchMaster['propertiesKeys'] = tempKeys;
       }, timeout);*/

      // ******************************
      // Search query for populating autocomplete box
      // ******************************
      $scope.loadValuesByProperty = function(queryStrn, propertyKey, labelType) {
         var config = CONSTANTS.getStateVariable('config');
         var serverConfig = config.neo4jConfig;
         var conditions = [], whereCond = '';
         angular.forEach($scope.selectedItem[labelType], function(value, key){
           if(value !== null) {
             var cond = 'n.' + key + ' = ' + '"' + value + '"';
             conditions.push(cond);
           }
         });
         conditions.push('n.' + propertyKey + ' =~ "' + queryStrn + '.*"');
         if(conditions.length>0) {
           whereCond = ' WHERE ' + conditions.join(' AND ');
         }
         var query = 'MATCH(n:' + labelType + ') ' + whereCond + ' return n;';
         console.log('Property Value Search = ', query);
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
      // ******************************
      // Filter graph on search form submit
      // ******************************
      $scope.selectedItem = {};
      $scope.filterGraph = function() {
        var searchQueries = [];
        angular.forEach($scope.selectedItem, function(labelVal, labelKey){
          var conditions = [], whereCond = '';
          angular.forEach(labelVal, function(value, key){
            if(value !== null) {
              var cond = 'n.' + key + ' = ' + '"' + value + '"';
              conditions.push(cond);
            }
          });
          if(conditions.length>0) {
            whereCond = ' WHERE ' + conditions.join(' AND ');
            //var query = 'MATCH (n:' + labelKey +')-[r]-() ' + whereCond + ' RETURN n,r';
            var query = 'MATCH (n:' + labelKey +') with n optional MATCH (n)-[r]-() with n,r'+ whereCond + ' RETURN n,r';
            searchQueries.push(query);
          }

        });
        var searchQueryStr = searchQueries.join(' UNION ');

        console.log('Search Query = ', searchQueryStr);
        if(searchQueryStr.length > 0) {
          var config = CONSTANTS.getStateVariable('config');
          var serverConfig = config.neo4jConfig;
          var graphMetaInfo = {serverConfig:serverConfig, neo4jQuery:searchQueryStr};
          CONSTANTS.setStateVariable('searchState', graphMetaInfo);
          $scope.toggleLeft('filter');
          $scope.$emit('refreshGraph', graphMetaInfo);
        }

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
        $timeout(function () {
           $scope.toggleLeft();
        }, 10);
        $scope.selectedItem = {};
      }

      //Refresh layout
      $scope.refreshLayout = function() {
        $scope.$broadcast('refreshLayout');
      }
  }
  angular.module('neo4jApp')
    .controller('graphFilterCtrl', graphFilterCtrl);
})(angular)