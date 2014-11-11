'use strict';

function PeriodosCtrl($rootScope, $scope, $routeParams) {
	$scope.meses = $rootScope.meses;
}

PeriodosCtrl.$inject = ['$rootScope','$scope','$routeParams'];

