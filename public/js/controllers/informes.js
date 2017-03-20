(function(angular, $){
	'use strict';
	angular.module('sici').controller('InformesCtrl', ['$rootScope', '$scope', '$window', '$http', '$timeout', 'ExportarInforme', 'PeriodosStats', 'Arbol',
		function ($rootScope, $scope, $window, $http, $timeout, ExportarInforme, PeriodosStats, Arbol) {
			$scope.funcionalidades = [
				{'label': 'Informe global', 'selectanyo': true, 'fn': [{'label': 'Descargar Excel', 'cmd': 'descargarexcel', 'anyo': true}]},
				{'label': 'Informe resumen', 'selectanyo': false, 'fn': [{'label': 'Generar Resumen', 'cmd': 'periodosStats', 'anyo': true}]}
			];
			$rootScope.nav = 'recalculate';
			$rootScope.setTitle('Informes');
			$scope.actualizando = 0;
			$scope.respuestas = [];
			$scope.tienePermisoVar = false;
			$scope.anyos = [];
			var maxAnyo = new Date().getFullYear();

			for (var anyo = 2014; anyo <= maxAnyo; anyo += 1){
				$scope.anyos.push({'code': 'a' + anyo, 'name': String(anyo), 'value': anyo});
			}
			
			/* TODO: CHANGE MESSAGES TO TOASTER */

			$scope.anyoSelected = $scope.anyos[$scope.anyos.length - 1];
			$scope.anualidad = parseInt($scope.anyos[$scope.anyos.length - 2].name, 10);
			$scope.clasefuncionalidades = 'col-md-' + (12 / $scope.funcionalidades.length).toFixed(0);
			$scope.oculto = false;
			$scope.columnasocultas = true;
			$scope.campos = [
				'en_plazo', 'fuera_plazo',
				'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion',
				'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30', 'resueltos_45', 'resueltos_mas_45',
				'quejas', 'recursos'
			];

			$scope.invoke = function (cmd, anyoSelected) {
				if ($scope.actualizando) {
					$window.alert('Espere a que termine la actualización previa');

					return;
				}
				switch (cmd) {
					case 'descargarexcel':
						if (!anyoSelected || !anyoSelected.code || anyoSelected.code === '') {
							
							$scope.respuestas.push({
								'clase': 'alert-warning',
								'mensaje': 'Debe seleccionar un año.'
							});

							return;
						}
						$scope.actualizando += 1;
						ExportarInforme.get({year: anyoSelected.code},
							function (token) {
								$scope.actualizando -= 1;
								$scope.respuestas.push({
									'clase': 'alert-success',
									'mensaje': 'Ha funcionado perfectamente.'
								});
								var url = '/api/download/' + token.time + '/' + token.hash;
								$window.location = url;
							}, function() {
								$scope.actualizando -= 1;
								$scope.respuestas.push({
									'clase': 'alert-warning',
									'mensaje': 'Error al descargar el informe.'
								});
							}
						);
					break;
					case 'periodosStats':
						$scope.arbol = Arbol.query();
						$scope.actualizando += 1;
						$scope.stats = PeriodosStats.query(function(){
							$scope.actualizando -= 1;
						});
					break;
					default:
				}
			};
			$scope.setSeleccionado = function(seleccionad){

				if (seleccionad) {
					$scope.seleccionado = seleccionad;
					$rootScope.setTitle(seleccionad.title);
					$scope.cumplimentados = 0;
					$scope.count = 1;
					$timeout(function(){
						$('body').animate({'scrollTop': $('#detallesjerarquia').offset().top}, 'slow');
					}, 20);
				}
			};
			$scope.detallado = false;
			$scope.setDetallado = function( detallad){
				if (detallad){
					if ($scope.detallado && detallad.id === $scope.detallado.id){
						$scope.detallado = false;
					} else {
						$scope.detallado = detallad;
						$timeout(function(){
							$('body').animate({'scrollTop': $('#detallesNodo').offset().top}, 'slow');
						}, 20);
					}
				}
			};

			var cached = null;

			$scope.tienePermiso = function(seleccionado) {

				if (!$rootScope.permisoscalculados.$resolved){
					return false;
				}

				$scope.tienePermisoVar = $rootScope.permisoscalculados.superuser ||
					$rootScope.permisoscalculados.jerarquialectura.indexOf(seleccionado.id) >= 0 ||
					$rootScope.permisoscalculados.jerarquiaescritura.indexOf(seleccionado.id) >= 0;

				return $scope.tienePermisoVar;
			};

			$scope.fnGetStatsNode = function(nodoid, anualidad){
				if (cached && cached._id && cached._id.idjerarquia === nodoid && cached._id.anualidad === anualidad){

					return cached;
				}
				for (var i = 0, j = $scope.stats.length; i < j; i += 1){
					if ($scope.stats[i]._id.idjerarquia === nodoid && $scope.stats[i]._id.anualidad === anualidad){
						cached = $scope.stats[i];

						return cached;
					}
				}

				return null;
			};
			$scope.getTotales = function(nodoid, anualidad, campo){
				var nodo = $scope.fnGetStatsNode(nodoid, anualidad);
				if (!nodo){ return ''; }
				if (!nodo.value[campo]){ return '0'; }

				return nodo.value[campo].reduce(function(prev, current){ return prev + current; }, 0);
			};
			$scope.mutextoculto = function(){ $scope.oculto = !$scope.oculto; };
			$scope.mostrarcolumnasocultas = function(){
				$scope.columnasocultas = !$scope.columnasocultas;
			};

		}
	]);
})(angular, $);
