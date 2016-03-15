(function(angular, saveAs){
	'use strict';
	angular.module('sici')
		.controller('CartaInformeCtrl',
			['EntidadObjeto', 'Objetivo', 'Indicador', '$scope', '$routeParams', '$rootScope', 'Jerarquia', 'InformeCarta', '$http', '$window',
			function(EntidadObjeto, Objetivo, Indicador, $scope, $routeParams, $rootScope, Jerarquia, InformeCarta, $http, $window){
				$scope.indicadores = {};
				$scope.jerarquias = {};
				var loadJerarquia = function(idjerarquia){
					if (typeof $scope.jerarquias[idjerarquia] === 'undefined'){
						$scope.jerarquias[idjerarquia] = Jerarquia.get({id: idjerarquia});
					}
				};
				$scope.cartaservicio = EntidadObjeto.get({'id': $routeParams.idcarta}, function(){
					$rootScope.setTitle($scope.cartaservicio.denominacion);

					$scope.jerarquia = Jerarquia.get({id: $scope.cartaservicio.idjerarquia}, function(){
						$scope.jerarquias[$scope.cartaservicio.idjerarquia] = $scope.jerarquia;
						$scope.jerarquia.ancestros.forEach(loadJerarquia);
					});
				});
				$scope.showAccion = function(){
					$scope.accion = {};
				};
				$scope.anualidad = $routeParams.anualidad;
				$scope.restricciones = [
					'Presupuestos',
					'Personal',
					'Tecnología: Software',
					'Tecnología: Equipos',
					'Medios materiales',
					'Mod. legislación',
					'Organizativas'
				];
				$scope.plazos = [
					'1 semana',
					'15 días',
					'1 mes',
					'2 meses',
					'3 meses',
					'4 meses',
					'5 meses',
					'6 meses',
					'8 meses',
					'Más de 8 meses'
				];
				$scope.afectables = [
					'Incremento Capacidad de Respuesta Mejora de la atención, seguridad, empatia facilidades',
					'Acortamiento de Plazos (Disminuye tiempo de atención o Resolución de asuntos)',
					'Mejora de la Responsabilidad y garantías de cumplimiento.',
					'Nuevos compromisos o reformulación de los existentes',
					'Nuevos compromisos, Nuevos indicadores (más claros y concisos)',
					'Nuevos procesos',
					'Mejora de la eficacia - Mejora de procesos o procedimientos',
					'Simplificación',
					'Informatización y e-Administración',
					'Eficiencia en mayor ahorro de costes, incremento de productividad o racionalización',
					'Buenas practicas: Definir la buena práctica',
					'Para solucionar cuestiones planteadas en quejas o sugerencias'
				];
				$scope.restricciones.sort();
				$scope.afectables.sort();
				$scope.downloadDocx = function(){

					$http.get('/api/v2/public/informeCarta/' + $scope.cartaservicio._id + '/' + $scope.anualidad)
						.then(function (res) {
							var url = '/download/' + res.data.time + '/' + res.data.hash + '?extension=' + res.data.extension;
							$window.location = url;
						}, function() {
							$rootScope.toaster('Error  al descargar el informe', 'Error', 'error');
						});
				};
			}]
		);
})(angular, saveAs);