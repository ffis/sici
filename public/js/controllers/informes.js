(function(angular, $){
	'use strict';
	angular.module('sici')
		.controller('InformesCtrl', ['$rootScope', '$scope', '$window', '$http', '$timeout', '$log', 'ExportarInforme', 'PeriodosStats', 'Arbol', '$q',
			function ($rootScope, $scope, $window, $http, $timeout, $log, ExportarInforme, PeriodosStats, Arbol, $q) {

				$rootScope.nav = 'recalculate';
				$scope.actualizando = 0;
				$rootScope.setTitle('Informes');
				$scope.respuestas = [];
				$scope.tienePermisoVar = false;
				$scope.anyos = [];
				$scope.funcionalidades = [
					{label: 'Informe global', selectanyo: true, fn: [{label: 'Descargar Excel', cmd: 'descargarexcel', anyo: true}]},
					{label: 'Informe resumen', selectanyo: false, fn: [{label: 'Generar Resumen', cmd: 'periodosStats', anyo: true}]}
				];

				$scope.pjerarquia = $q.defer();

				$q.all([$rootScope.jerarquialectura(), $rootScope.jerarquiaescritura()], $rootScope.superuser).then(
					function(data) {
						if (typeof data[2] !== 'undefined' && data[2] > 0){
							return;
						}

						$scope.jerarquia = data[0].concat(data[1]);
						$scope.pjerarquia.resolve($scope.jerarquia);
						/*$scope.filtrojerarquia*/
					},
					function(err){
						$log.error(err);
					}
				);


				$scope.fj = function(item) {
					if ($scope.jerarquia.indexOf(item.id) !== -1 ){ return true;	}
					if (item.nodes){
						for (var i = 0; i < item.nodes.length; i++){
							if ($scope.filtrojerarquia(item.nodes[i])){
								return true;
							}
						}
					}
					return false;
				};

				$scope.filtrojerarquia = function(item) {
					var def = $q.defer();
					$scope.pjerarquia.promise.then( function(){
						def.resolve($scope.fj(item));
						$scope.filtrojerarquia = $scope.fj;
					}, function(err){ def.reject(err); });
					return def.promise;
				};

				var maxAnyo = new Date().getFullYear();

				for (var anyo = 2014; anyo <= maxAnyo; anyo++){
					$scope.anyos.push( {code: 'a' + anyo, name: '' + anyo, value: anyo});
				}
				$scope.anyoSelected = $scope.anyos[ $scope.anyos.length - 1 ];
				$scope.anualidad = parseInt($scope.anyos[ $scope.anyos.length - 2 ].name);
				$scope.clasefuncionalidades = 'col-md-' + (12 / $scope.funcionalidades.length).toFixed(0);

				$scope.invoke = function (cmd, anyoSelected) {
					if ($scope.actualizando) {
						$window.alert('Espere a que termine la actualización previa');
						return;
					}
					$scope.actualizando++;
					switch (cmd) {
						case 'descargarexcel':
							if (!anyoSelected || !anyoSelected.code || anyoSelected.code === '') {
								$scope.actualizando--;
								$scope.respuestas.push({
									clase: 'alert-warning', mensaje: 'Debe seleccionar un año.'
								});
								return;
							}
							ExportarInforme.get({year: anyoSelected.code},
								function (token) {
									$scope.actualizando--;
									$scope.respuestas.push({
										clase: 'alert-success', mensaje: 'Ha funcionado perfectamente.'
									});
									var url = '/download/' + token.time + '/' + token.hash;
									$window.location = url;
								}, function() {
									$scope.actualizando--;
									$scope.respuestas.push({
										clase: 'alert-warning', mensaje: 'Error al descargar el informe.'
									});
								}
							);
						break;
						case 'periodosStats':
							$scope.arbol = Arbol.query();
							$scope.stats = PeriodosStats.query(function(){
								$scope.actualizando--;
							});
						break;
					}
				};
				$scope.setSeleccionado = function(seleccionad){
					if (seleccionad) {
						$scope.seleccionado = seleccionad;
						$rootScope.setTitle(seleccionad.title);
						$scope.cumplimentados = 0;
						$scope.count = 1;
						$timeout(function(){
							$('body').animate({scrollTop: $('#detallesjerarquia').offset().top}, 'slow');
						}, 20);
					}
				};
				$scope.detallado = false;
				$scope.setDetallado = function( detallad){
					if (detallad){
						if ($scope.detallado && detallad.id === $scope.detallado.id)
						{
							$scope.detallado = false;
						} else {
							$scope.detallado = detallad;
							$timeout(function(){
								$('body').animate({scrollTop: $('#detallesNodo').offset().top}, 'slow');
							}, 20);
						}
					}
				};

				var cached = null;

				$scope.tienePermiso = function(seleccionado) {

					if (!$rootScope.permisoscalculados.$resolved){
						return false;
					}

					$scope.tienePermisoVar =
						$rootScope.permisoscalculados.jerarquialectura.indexOf(seleccionado.id) >= 0 ||
						$rootScope.permisoscalculados.jerarquiaescritura.indexOf(seleccionado.id) >= 0;
					return $scope.tienePermisoVar;
				};

				$scope.fnGetStatsNode = function(nodoid, anualidad){
					if (cached && cached._id && cached._id.idjerarquia === nodoid && cached._id.anualidad === anualidad){
						return cached;
					}
					for (var i = 0, j = $scope.stats.length; i < j; i++){
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
				$scope.mostrarcolumnasocultas = function(){ $scope.columnasocultas = !$scope.columnasocultas; };
				$scope.oculto = false;
				$scope.columnasocultas = true;
				$scope.campos = [
					'en_plazo', 'fuera_plazo',
					'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion',
					'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30', 'resueltos_45', 'resueltos_mas_45',
					'quejas', 'recursos'
				];
			}
	]);
})(angular, $);
