'use strict';

function PeriodosCtrl($rootScope, $scope, $routeParams, Periodo) {
	$rootScope.nav = 'periodos';
	$scope.meses = $rootScope.meses;
	$scope.periodo = false;
	$scope.periodos = Periodo.query( function(){
		if ($scope.periodos.length)
			$scope.periodo = $scope.periodos[0];
	});
	$scope.actualizar = function(periodo){
		periodo.$update(function(){
			$scope.cambios = [];
		});
	};
	$scope.checkNumber = function(number){
		return parseInt(number)==0 ||parseInt(number)==1;
	}
}

PeriodosCtrl.$inject = ['$rootScope','$scope','$routeParams', 'Periodo'];

