(function(angular, d3, $){
	'use strict';
	angular.module('sici')
		.controller('DetallesOrganicaCtrl', ['$q', '$rootScope', '$scope', '$routeParams', '$window', '$location', '$timeout', '$http', '$log', 'JerarquiaAncestros', 'Periodo', 'ExportarResultadosJerarquia', 'ResumenNodoJerarquia', 'Jerarquia',
			function ($q, $rootScope, $scope, $routeParams, $window, $location, $timeout, $http, $log, JerarquiaAncestros, Periodo, ExportarResultadosJerarquia, ResumenNodoJerarquia, Jerarquia) {
				$scope.actualizando = 0;
				$scope.numgraphs = 0;
				$scope.graficasbarras = false;
				$scope.mesActual = (new Date()).getMonth();
				$scope.graphs = false;
				$scope.padre = '';
				$scope.ancestros = [];

				const listener = $rootScope.$watch('anualidad', function(){
					$scope.updateGraphKeys();
				});

				$scope.$on('$destroy', function() {
					listener();
				});

				$scope.periodos = Periodo.query(function(){
					$scope.periodo = $scope.periodos[0];
				});

				$scope.getAncestros = function() {
					/* function(jerarquia) */
					return $scope.ancestros;
				};

				$scope.exists = function (attr) {
					
					return $rootScope.anualidad && $scope.resumenJerarquiaSeleccionada[$rootScope.anualidad] &&
						typeof $scope.resumenJerarquiaSeleccionada[$rootScope.anualidad][attr] !== 'undefined';
				};

				$scope.descargarExcel = function () {
					if ($scope.actualizando === 0){
						$scope.actualizando += 1;

						ExportarResultadosJerarquia.get({'jerarquia': $scope.jerarquiaSeleccionada.id}).$promise.then(function(token){
							$scope.actualizando -= 1;
							if (typeof token === 'object'){
								$rootScope.cbDownload(token);
							} else {
								$rootScope.toaster('Error al descargar el informe', 'Error', 'error');
							}
						}, function(){
							$scope.actualizando -= 1;
							$rootScope.toaster('Error al descargar el informe.', 'Error', 'error');
						});
					} else {
						$rootScope.toaster('Espere a que termine la generación y descarga del informe previo solicitado.', 'Error', 'error');
					}
				};
				function sparkline(){
					$('.sparkline>canvas').remove();
					$.each($('.sparkline'), function(k, v){
						const obj = String($(v).attr('data-value'));
						try {
							$(v).sparkline(JSON.parse(obj), {'type': 'bar', 'barColor': '#a94442'});
						} catch (e) {
							$(v).sparkline([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], {'type': 'bar', 'barColor': '#a94442'});
						}
					});
				}

				$scope.sparkline = function(){
					$timeout(sparkline, 100);
				};

				$scope.updateGraphKeys = function(){
					$scope.sparkline();

					const defaultOptions = {'legend': {'display': true}};

					const anualidad = $rootScope.getIntAnualidad();
					var anualidadAnterior = anualidad - 1;
					var graphskeys = [
						{
							'caption': 'RESUMEN DE DATOS DE GESTIÓN ' + anualidad,
							'keys': [
								{'caption': 'Solicitados', 'vals': 'periodos.a' + anualidad + '.solicitados', 'maxx': $scope.mesActual},
								{'caption': 'Iniciados', 'vals': 'periodos.a' + anualidad + '.iniciados', 'maxx': $scope.mesActual},
								{'caption': 'Pendientes', 'vals': 'periodos.a' + anualidad + '.pendientes', 'maxx': $scope.mesActual},
								{'caption': 'Total resueltos', 'vals': 'periodos.a' + anualidad + '.total_resueltos', 'maxx': $scope.mesActual},
								{'caption': 'Total resueltos ' + anualidadAnterior, 'vals': 'periodos.a' + anualidadAnterior + '.total_resueltos', 'maxx': 12}
							]
						},
						{
							'caption': 'RESUELTOS EN PLAZO ' + anualidad,
							'keys': [
								{'caption': 'En plazo', 'vals': 'periodos.a' + anualidad + '.en_plazo', 'maxx': $scope.mesActual},
								{'caption': 'Fuera de plazo', 'vals': 'periodos.a' + anualidad + '.fuera_plazo', 'maxx': $scope.mesActual}
							]
						},
						{
							'caption': 'DESESTIMIENTOS/RENUNCIAS Y PRESCRITOS/CADUCADOS ' + anualidad,
							'keys': [
								{'caption': 'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)', 'vals': 'periodos.a' + anualidad + '.resueltos_desistimiento_renuncia_caducidad', 'maxx': $scope.mesActual},
								{'caption': 'Resueltos por Prescripcion/Caducidad (Resp_Admon)', 'vals': 'periodos.a' + anualidad + '.resueltos_prescripcion', 'maxx': $scope.mesActual}
							]
						},
						{
							'caption': 'QUEJAS Y RECURSOS CONTRA LOS PROCEDIMIENTOS DE LA JERARQUÍA ' + anualidad,
							'keys': [
								{'caption': 'Quejas presentadas en el mes', 'vals': 'periodos.a' + anualidad + '.quejas', 'maxx': $scope.mesActual},
								{'caption': 'Recursos presentados en el mes', 'vals': 'periodos.a' + anualidad + '.recursos', 'maxx': $scope.mesActual}
							]
						}
					];
					$scope.graphskeys = graphskeys;
					$scope.graphs = [];
					$scope.numgraphs = 0;
					const labels = $rootScope.inicialesmeses;
					graphskeys.forEach(function (g, i) {
						let maxvalue = 0;
						const data = [];
						const series = [];
						const caption = g.caption;
						
						g.keys.forEach(function (key, indx) {
							const values = [];
							const indexes = key.vals.split('.');
							let k = $scope.resumenJerarquiaSeleccionada;
							series.push(key.caption);

							for (const j in indexes) {
								const index = indexes[j];
								if (typeof k[index] === 'undefined'){
									break;
								}
								k = k[index];
							}
							if (typeof k !== 'undefined' && k.length) {
								k.forEach(function (val, idx) {
									if ((idx <= graphskeys[i].keys[indx].maxx && anualidad === $rootScope.anualidad) || (anualidad !== $rootScope.anualidad)){
										values.push(val);
										if (maxvalue < val){
											maxvalue = val;
										}
									}
								});
								data.push(values);
							} else {
								$log.error('Index malo:' + indexes);
							}
						});

						if (maxvalue > 0){
							$scope.graphs.push({'data': data, 'labels': labels, 'series': series, 'caption': caption, 'options': defaultOptions});
						}
					});
					$scope.numgraphs = $scope.graphs.length;
				};

				$scope.resumenJerarquiaSeleccionada = ResumenNodoJerarquia.get({'jerarquia': $routeParams.idjerarquia}, function(){
					$scope.updateGraphKeys();
				});

				$scope.jerarquiaSeleccionada = Jerarquia.get({'id': $routeParams.idjerarquia}, function () {
					$rootScope.setTitle($scope.jerarquiaSeleccionada.nombrelargo);

					$scope.ancestros = JerarquiaAncestros.query({'idjerarquia': $routeParams.idjerarquia}, function(){
						if ($scope.ancestros && $scope.ancestros[0] && $scope.ancestros[0].id === 1){
							$scope.ancestros.reverse();//TODO: revisar este parche
						}
					});
				});

				$scope.attrspar = [
					'id', 'nombrelargo', 'numprocedimientos'
				];

				$scope.attrstabla = [
					'solicitados',
					'iniciados',
					'quejas', 'recursos',
					'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30', 'resueltos_45', 'resueltos_mas_45',
					'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion',
					'en_plazo',
					't_medio_habiles', 't_medio_naturales'
				];
				/* 'totalsolicitudes', */
				$scope.attrstablacalculados = ['total_resueltos', 'fuera_plazo', 'pendientes'];
				$scope.attrstabla = $scope.attrstabla.concat($scope.attrstablacalculados);

				$scope.meses = $rootScope.meses;
				$scope.colorText = $rootScope.colorText;

				$scope.graficasgrandes = false;

			}
		]);

})(angular, d3, $);
