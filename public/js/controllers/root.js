'use strict';

/* Controllers */

function AppCtrl($scope,$rootScope,Session) {
	$rootScope.setTitle = function (title){ $scope.name = title; };
	$rootScope.setLogeado=function(t){ $rootScope.logeado =t; };
	$rootScope.session = Session;
	$rootScope.nav = '';
	$rootScope.logeado = false;
}

AppCtrl.$inject = ['$scope','$rootScope','Session'];