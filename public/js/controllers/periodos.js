(function(angular){
	'use strict';
	angular.module('sici').controller('PeriodosCtrl', ['$rootScope', '$scope', '$routeParams', '$window', 'Periodo', 'Anualidad',
		function ($rootScope, $scope, $routeParams, $window, Periodo, Anualidad) {
			$rootScope.nav = 'periodos';
			$rootScope.setTitle('Períodos');
			$scope.meses = $rootScope.meses;
			$scope.periodo = false;

			$scope.load = function(){
				$scope.periodos = Periodo.query( function(){
					if ($scope.periodos.length){
						$scope.periodo = $scope.periodos[0];
					}
				});
			};
			$scope.load();
			$scope.actualizar = function(periodo, clave, index){
				periodo[clave][index] = parseInt(periodo[clave][index], 10);
				periodo.$update(function(){
					$scope.cambios = [];
				});
			};
			$scope.checkNumber = function(number){

				return parseInt(number, 10) === 0 || parseInt(number, 10) === 1;
			};

			$scope.nuevaAnualidad = function() {
				var d = new Date();
				var n = d.getFullYear();
				var ultimaAnualidad = -1;
				var periodo = $scope.periodos[0];
				for (var uaAux in periodo) {
					var ua = uaAux.replace('a', '');
					if (!isNaN(parseInt(ua, 10)) && parseInt(ua, 10) >= parseInt(ultimaAnualidad, 10)) {
						ultimaAnualidad = parseInt(ua, 10) + 1;
					}
				}
				if (ultimaAnualidad < 2014 || ultimaAnualidad < n){

					return;
				}

				if ($window.confirm('Si confirma se creará la anualidad correspondiente al año ' + ultimaAnualidad)){
					var a = new Anualidad();
					a.anualidad = ultimaAnualidad;
					a.$save($scope.load);
				}
			};
		}
	]);
})(angular);
