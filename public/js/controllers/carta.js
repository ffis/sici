(function(angular, $){
	'use strict';
	angular.module('sici')
		.controller('CartaCtrl',
			['$q', '$rootScope', '$scope', '$location', '$window', '$routeParams', '$timeout', '$log', 'Arbol', 'Objetivo', 'EntidadObjeto',
			function ($q, $rootScope, $scope, $location, $window, $routeParams, $timeout, $log, Arbol, Objetivo, EntidadObjeto) {
				$rootScope.nav = 'carta';
				$scope.idjerarquia = ($routeParams.idjerarquia) ? parseInt( $routeParams.idjerarquia ) : false;
				$scope.arbol = Arbol.query(function(){ $scope.setJerarquiaById($scope.idjerarquia); });
				$scope.equivalencias = {
					'Agencia Tributaria de la Región de Murcia': 636,
					'Biblioteca Regional de Murcia': 279,
					'DG Seguridad Ciudadana y Emergencias.': 378,
					'DG de Ganadería y Pesca': 359,
					'DG de Juventud y Deportes-Área de Deportes': 637,
					'DG de Pensiones, Valoración y Programas de Inclusión': 1990,
					'DG de Trabajo': 1746,
					'DG de la Función Pública y Calidad de los Servicios': 18,
					'Carta de Servicios del Servicio de Atención al Ciudadano': 85
				};

				$scope.setJerarquiaById = function(idj){
					if (!idj){ return; }
					var setJ = function(nodo, idjerarquia){
						if (nodo.id === idjerarquia){
							$scope.setSeleccionado(nodo);
							return true;
						}
						if (!nodo.nodes) { return false; }
						for(var i = 0, j = nodo.nodes.length; i < j; i++){
							if (setJ(nodo.nodes[i], idjerarquia)) {
								return true;
							}
						}
						return false;
					};
					for(var idx = 0, idxmax = $scope.arbol.length; idx < idxmax; idx++){
						if (setJ( $scope.arbol[idx], idj)){ break; }
					}
				};
				$scope.filtro = function(elemento){
					return true;/* elemento.numobjetivos; */
				};
				var progresos = [0];
				$scope.getProgress = function(i){
					if (typeof progresos[i] === 'undefined'){
						progresos[i] = Math.floor(Math.random() * 99 + 1);
						$scope.gaugeChart[i].data.val = progresos[i];
					}
					return progresos[i];
				};
				$scope.getProgressClass = function(i){
					$scope.getProgress(i);
					if (progresos[i] < 25){
						return 'progress-bar-danger';
					}else if (progresos[i] < 50){
						return 'progress-bar-warning';
					}else if (progresos[i] < 70){
						return 'progress-bar-info';
					}
					return 'progress-bar-success';
				};

				$scope.gaugeChart = [];
				$scope.filtropartes = function(a){
					return a.indexOf('100') === -1;
				};
				$scope.claseComentarios = function(indicador){
					return indicador.i % 2 === 0 ? 'text-danger' : '';
				};
				$scope.setCartaServicio = function(cartaservicio){
					if (typeof cartaservicio !== 'undefined'){
						$rootScope.setTitle(cartaservicio.denominacion);
						$scope.cartaservicioseleccionada = cartaservicio;
						var restrictions = { idjerarquia: cartaservicio.idjerarquia, carta: cartaservicio._id };
						$scope.objetivos = Objetivo.query(restrictions, function(){
							$scope.gaugeChart = [];
							for(var i = 0, j = $scope.objetivos.length; i <= j; i++ ){
								$scope.gaugeChart.push({
									data: {
										maxValue: 100,
										animationSpeed: 40,
										val: 0
									},
									options: {
										lines: 12,
										angle: 0,
										lineWidth: 0.47,
										pointer: {
											length: 0.6,
											strokeWidth: 0.03,
											color: '#000000'
										},
										limitMax: 'false',
										colorStart: '#A3C86D',
										colorStop: '#A3C86D',
										strokeColor: '#E0E0E0',
										generateGradient: true,
										percentColors: [[0.0, "#ff0000" ], [0.50, "#f9c802"], [1.0, "#a9d70b"]]
									}
								});
								progresos[i] = Math.floor(Math.random() * 99 + 1);
								$scope.gaugeChart[i].data.val = progresos[i];
							}
						});
					}else{
						$scope.objetivos = [];
						delete $scope.cartaservicioseleccionada;
					}
				};
				$scope.setSeleccionado = function(selection){
					if (selection) {
						$scope.idjerarquia = selection.id;
						$scope.cartasservicio = EntidadObjeto.query({'tipoentidad': 'CS', 'idjerarquia': $scope.idjerarquia}, function(){
							for(var i = 0, j = $scope.cartasservicio.length; i < j; i++){
								$scope.cartasservicio[i].urledicion = '/carta/' + $scope.idjerarquia + '/' + $scope.cartasservicio[i]._id;
							}
							if ($scope.cartasservicio.length > 0){
								$scope.setCartaServicio($scope.cartasservicio[0]);
							}else{
								$scope.setCartaServicio();
							}
						});

						$scope.seleccionado = selection;

						$timeout(function(){
							$('body').animate({scrollTop: $('#detallesjerarquia').offset().top }, 'slow');
						}, 20);
					}
				};

			}
		]
	);
})(angular, $);
