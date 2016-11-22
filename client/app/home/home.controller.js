'use strict';

(function (angular) {

  function homeCtrl($scope, $mdSidenav, CONSTANTS, Helper, $window) {
    /**
     * Controller variables
     */

    //Stop caraousal on mouseover
    angular.element("#main-wrapper").hover(function(){
        $scope.slickConfig.method.slickPause();
    });

    //get config data
    var slideConfig = {};
    $scope.slickConfigLoaded  = true;
    CONSTANTS.getConfig().success(function (data) {
      CONSTANTS.setStateVariable('neo4jConfig', data.neo4jConfig);
      slideConfig = data.slideConfig;
      $scope.slides = data.slideUrls;
        $scope.slickConfig = {
          dots: true,
          autoplay: true,
          initialSlide: 0,
          infinite: false,
          autoplaySpeed: slideConfig.slideInterval,
          method: {}
        };
    });

    //adjust width for less resolution frame
    $scope.getCaraousalWidth = function(width) {
      if(width !== undefined) {
        return { width:width+100 + 'px' };
      }

    }

  };

  angular.module('neo4jApp')
    .controller('HomeCtrl', homeCtrl)

})(angular)

