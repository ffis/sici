'use strict';

function PeriodosCtrl($rootScope, $scope, $routeParams, $window, Periodo) {
	$rootScope.nav = 'periodos';
	$window.document.title ='SICI: Períodos';
	$scope.meses = $rootScope.meses;
	$scope.periodo = false;
	$scope.periodos = Periodo.query( function(){
		if ($scope.periodos.length)
			$scope.periodo = $scope.periodos[0];
	});
	$scope.actualizar = function(periodo,clave,index){
		periodo[clave][index]=parseInt(''+periodo[clave][index]);
		periodo.$update(function(){
			$scope.cambios = [];
		});
	};
	$scope.checkNumber = function(number){
		return parseInt(number)==0 ||parseInt(number)==1;
	}
}

PeriodosCtrl.$inject = ['$rootScope','$scope','$routeParams', '$window', 'Periodo'];

