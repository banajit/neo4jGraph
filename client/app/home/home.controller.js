'use strict';

(function (angular) {

  function homeCtrl($scope, $mdSidenav, CONSTANTS, Helper, $window, $timeout) {
    /**
     * Controller variables
     */

    //Stop caraousal on mouseover
    angular.element("#main-wrapper").hover(function(){
        $scope.slickConfig.method.slickPause();
    });

    //get config data
    var slideConfig = {};


    var data = CONSTANTS.getConfig();
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
    $scope.slickConfigLoaded  = true;
    /*$timeout(function () {
       angular.forEach($scope.slides, function(value, key){
         angular.element('#caraousal-wrapper-' + key).width(value.siteWidth+100);
       });
    }, 100);*/


    //adjust width for less resolution frame
    $scope.getCaraousalWidth = function(key,width) {
      if(width != undefined) {
        $timeout(function () {
          angular.element('#caraousal-wrapper-' + key).width(width+100);
        },3000);
      }
    }

  };

  angular.module('neo4jApp')
    .controller('HomeCtrl', homeCtrl)

})(angular)

