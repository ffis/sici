'use strict';

function PeriodosCtrl($rootScope, $scope, $routeParams, $window, Periodo, Anualidad) {
	$rootScope.nav = 'periodos';
	$window.document.title ='SICI: Períodos';
	$scope.meses = $rootScope.meses;
	$scope.periodo = false;

	$scope.load = function(){
		$scope.periodos = Periodo.query( function(){
			if ($scope.periodos.length)
				$scope.periodo = $scope.periodos[0];
		});	
	}
	$scope.load();
	$scope.actualizar = function(periodo,clave,index){
		periodo[clave][index]=parseInt(''+periodo[clave][index]);
		periodo.$update(function(){
			$scope.cambios = [];
		});
	};
	$scope.checkNumber = function(number){
		return parseInt(number)==0 ||parseInt(number)==1;
	}
	
	$scope.nuevaAnualidad = function() {
		var d = new Date();
		var n = d.getFullYear();
		var ultima_anualidad=-1;
		var periodo = $scope.periodos[0];
		for(var ua_aux in periodo) {
			var ua = ua_aux + "";			
			ua = ua.replace('a','');		
			if (!isNaN(parseInt(ua)) && parseInt(ua) >= parseInt(ultima_anualidad)) {			
				ultima_anualidad = parseInt(ua)+1;
			}		
		}
		console.log('ultima anualidad '+ultima_anualidad);
		if (ultima_anualidad<2014) return;
		
		if (ultima_anualidad>n && confirm('Si confirma se creará la anualidad correspondiente al año '+ultima_anualidad+'')){
			var a = new Anualidad();
			a.anualidad = ultima_anualidad;
			a.$save($scope.load);
		}
	}
}

PeriodosCtrl.$inject = ['$rootScope','$scope','$routeParams', '$window', 'Periodo','Anualidad'];

