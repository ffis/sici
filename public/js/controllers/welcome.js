(function(angular){
	'use strict';
	angular.module('sici')
		.controller('WelcomeCtrl', [ '$rootScope', '$scope', '$window', 'Aggregate', 'ProcedimientoCount', 'TramitesCount', 'PorcentajeTramitesResultos', 'ProcedimientosSinExpedientes', 'Objetivo',
			function ($rootScope, $scope, $window, Aggregate, ProcedimientoCount, TramitesCount, PorcentajeTramitesResultos, ProcedimientosSinExpedientes, Objetivo){

				$rootScope.nav = 'inicio';
				$rootScope.setTitle('Portada');

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

				$scope.mesPeriodoAnterior = $scope.mesActual === 0 ? 11 : $scope.mesActual - 1;
				$scope.anyoPeriodoAnterior = $scope.mesActual === 0 ? $scope.anyoActual - 1 : $scope.anyoActual;

				$scope.pendientes = Aggregate.query({
						anualidad: $scope.anyoActual,
						campo: JSON.stringify({'codigo': '$codigo', 'denominacion': '$denominacion'}),
						restriccion: '{"periodos.a' + $scope.anyoPeriodoAnterior + '.actualizado.' + $scope.mesPeriodoAnterior + '" : {"$lt":1}}'
				});
				$scope.inconsistencias = Aggregate.query({
						anualidad: $scope.anyoActual,
						campo: JSON.stringify({'codigo': '$codigo', 'denominacion': '$denominacion'}),
						restriccion: '{"periodos.a' + $scope.anyoActual + '.pendientes":{"$lt":0}}'
				});
				Objetivo.get({id: "56716258771ad7a247dcede9"});
		}
	]);
})(angular);
