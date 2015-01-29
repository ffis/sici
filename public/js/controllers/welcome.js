(function(angular){
	'use strict';
	angular.module('sici')
		.controller('WelcomeCtrl', [ '$rootScope', '$scope', '$window', 'Aggregate', 'ProcedimientoCount', 'TramitesCount', 'PorcentajeTramitesResultos', 'ProcedimientosSinExpedientes',
			function ($rootScope, $scope, $window, Aggregate, ProcedimientoCount, TramitesCount, PorcentajeTramitesResultos, ProcedimientosSinExpedientes){

				$rootScope.nav = 'inicio';
				$window.document.title = 'SICI - Portada';

				$scope.indicadores = [ ];
				$scope.welcomeDetailsEnabled = false;

				if ($scope.welcomeDetailsEnabled)
				{
					$scope.procedimientos = ProcedimientoCount.get(function(){
						$scope.indicadores.push( { bg: 'red-soft', descripcion: 'Procedimientos', number: $scope.procedimientos.count, icon: 'fa-folder-open'});
					});
					$scope.tramites = TramitesCount.get(function(){
						$scope.indicadores.push( { bg: 'green-soft', descripcion: 'Expedientes', number: $scope.tramites.suma, icon: 'fa-comments'});
					});
					$scope.ratio = PorcentajeTramitesResultos.get(function(){
						$scope.indicadores.push( { bg: 'blue-soft', descripcion: 'Cumplimiento', number: ($scope.ratio.ratio * 100) + '%', icon: 'fa-pie-chart'});
					});
					$scope.sinexpediente = ProcedimientosSinExpedientes.get(function(){
						$scope.indicadores.push( { bg: 'purple-soft', descripcion: 'Procedimientos sin expedientes', number: $scope.sinexpediente.total, icon: 'fa-bar-chart'});
					});
				}

				var date = new Date();
				$scope.mesActual = date.getMonth();
				$scope.anyoActual = date.getFullYear();

				$scope.pendientes = Aggregate.query({
						anualidad: $scope.anyoActual,
						campo: JSON.stringify({'codigo': '$codigo', 'denominacion': '$denominacion'}),
						restriccion: "{\"periodos.a" + $scope.anyoActual + ".totalsolicitudes\":{\"$lt\":1}}"
				});
				$scope.inconsistencias = Aggregate.query({
						anualidad: $scope.anyoActual,
						campo: JSON.stringify({'codigo': '$codigo', 'denominacion': '$denominacion'}),
						restriccion: "{\"periodos.a" + $scope.anyoActual + ".pendientes\":{\"$lt\":0}}"
				});
		}
	]);
})(angular);
