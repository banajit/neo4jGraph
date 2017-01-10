'use strict';

(function (angular) {

  function homeCtrl($scope, $mdSidenav, CONSTANTS, Helper, $window, $timeout, $interval) {
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
      variableWidth: true,
      dots: true,
      autoplay: true,
      initialSlide: 0,
      infinite: false,
      autoplaySpeed: slideConfig.slideInterval,
      method: {}
    };
    $scope.slickConfigLoaded  = true;


    //adjust width for less resolution frame
    var sliderTracker = {};
    $scope.getCaraousalWidth = function(key,width) {
      width = (width == undefined)?$(document).width():width;
      if($('#caraousal-wrapper-' + key).is(':visible')) {
        angular.element('#caraousal-wrapper-' + key).width(width);
      }
      else {
        setCaraousalWidth(key,width);
      }
    }

    function setCaraousalWidth(key,width) {
      if($('#caraousal-wrapper-' + key).is(':visible')) {
       angular.element('#caraousal-wrapper-' + key).width(width);
       angular.element('.neo4j-slider').width($(document).width());
       delete sliderTracker[key];
      }
      else {
        sliderTracker[key] = $timeout(function () {
          setCaraousalWidth(key,width);
        });
      }
    }



  };

  angular.module('neo4jApp')
    .controller('HomeCtrl', homeCtrl)

})(angular)

