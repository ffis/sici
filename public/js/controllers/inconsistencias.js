(function(angular){
	'use strict';
	angular.module('sici').controller('InconsistenciasCtrl', ['$rootScope', '$scope', '$routeParams', 'Raw', 'Aggregate',
		function ($rootScope, $scope, $routeParams, Raw, Aggregate) {
			$scope.inconsistencias = Raw.query({model: 'reglasinconsistencias'}, function(){ $scope.update(); });
			$rootScope.nav = 'inconsistencias';
			$scope.oneAtATime = true;
			$scope.camposamostrar = ['codigo', 'denominacion'];
			$scope.camposmostrados = $scope.camposamostrar;
			$scope.seleccionados = {};
			$scope.camposamostrar.forEach(function(campo){
				$scope.seleccionados[campo] = $scope.camposmostrados.indexOf(campo) >= 0;
			});
			$scope.anualidad = new Date().getFullYear();
			$scope.$watch('seleccionados.$', function(){ $scope.update(); });

			$scope.update = function(){
				$scope.inconsistencias.forEach(function(inconsistencia, i){
					var c = {};
					for (var campoM in $scope.seleccionados){
						c[campoM] = '$' + campoM;
					}
					$scope.inconsistencias[i].datos = Aggregate.query({'anualidad': $scope.anualidad, 'campo': JSON.stringify(c), 'restriccion': inconsistencia.restriccion});
				});
			};
		}
	]);
})(angular);
