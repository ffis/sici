(function(angular, $){
	'use strict';
	angular.module('sici')
		.controller('CartaCtrl',
			['$q', '$rootScope', '$scope', '$location', '$window', '$routeParams', '$timeout', '$log', 'Arbol', 'Objetivo', 'EntidadObjeto', 'PastelColor', 'ImportarObjetivo', 'Indicador',
			function ($q, $rootScope, $scope, $location, $window, $routeParams, $timeout, $log, Arbol, Objetivo, EntidadObjeto, PastelColor, ImportarObjetivo, Indicador) {
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
				$scope.indicadores = {};

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
							$scope.drawGauges();
                                                        for (var i = 0, j = $scope.objetivos.length; i < j; i++) {
                                                            for (var k = 0, l = $scope.objetivos[i].formulas.length; k < l; k++) {
                                                                $scope.objetivos[i].formulas[k].indicadores.forEach(function(indicador){
                                                                    if (typeof $scope.indicadores[indicador] === 'undefined'){
                                                                        $scope.indicadores[indicador] = Indicador.get({id: indicador});    
                                                                    }
                                                                });
                                                            }
                                                        }
						});
					}else{
                                            $scope.objetivos = [];
                                            delete $scope.cartaservicioseleccionada;
					}
				};
				$scope.anualidad = new Date().getFullYear(); //temporalmente */
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
				$scope.getPastel = function(i){
					return PastelColor(i);
				};
				$scope.importarObjetivos = function(){
					ImportarObjetivo.get({idjerarquia: $scope.idjerarquia});
				};
				$scope.drawGauges = function(){
					$scope.gaugeChart = [];
					for(var i = 0, j = $scope.objetivos.length; i < j; i++ ){
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
								percentColors: [[0.0, '#ff0000' ], [0.50, '#f9c802'], [1.0, '#a9d70b']]
							}
						});
						progresos[i] = Math.floor(Math.random() * 99 + 1);
						$scope.gaugeChart[i].data.val = progresos[i];
					}
				};
				$scope.generarIndicador = function(anterior){
					var idrandom = parseInt(parseFloat(Math.random()* 10 + 1).toFixed(0));
					if (anterior === idrandom){
						idrandom++;
					}
					if (typeof $scope.indicadores[idrandom] === 'undefined'){
						$scope.indicadores[idrandom] = Indicador.get({id: idrandom});
					}
					return idrandom;
				};
				$scope.mockIndicadores = function(){
					for(var i = 0, j = $scope.objetivos.length; i < j; i++ ){
						for(var k = 0, l = $scope.objetivos[i].formulas.length; k < l; k++){
							var ind = $scope.generarIndicador(0), ind2 = $scope.generarIndicador(ind);
							$scope.objetivos[i].formulas[k].indicadores.push(ind);
							$scope.objetivos[i].formulas[k].indicadores.push(ind2);
						}
					}
				};
                                $scope.recargarObjetivo = function(i){
                                    console.log(i);
                                    $scope.objetivos[i] = Objetivo.get( {id: $scope.objetivos[i]._id} );
                                };
				$scope.updateIndicador = function(indicadorid){
					console.log($scope.indicadores[indicadorid], indicadorid);
                                        var f = function(indicadorid, desplegado){
                                            return function() {
                                                console.log('tras actualizar ', indicadorid);
                                                $scope.indicadores[indicadorid].desplegado = desplegado;
                                                var indicadoresARecargar = [];
                                                for (var i = 0, j = $scope.objetivos.length; i < j; i++){
                                                    for(var k = 0, l = $scope.objetivos[i].formulas.length; k < l; k++){
                                                        console.log($scope.objetivos[i].formulas[k].indicadores, indicadorid)
                                                        console.log(typeof indicadorid)
                                                        console.log(typeof $scope.objetivos[i].formulas[k].indicadores[0]);
                                                        if ($scope.objetivos[i].formulas[k].indicadores.indexOf(indicadorid) > -1){
                                                            indicadoresARecargar.push(i);
                                                            break;
                                                        }
                                                    }
                                                }
                                                console.log(indicadoresARecargar);
                                                indicadoresARecargar.filter(function (e, i, arr) {
    return arr.lastIndexOf(e) === i;
}).forEach($scope.recargarObjetivo);
                                            };
                                        };
					$scope.indicadores[indicadorid].$update(f(indicadorid, $scope.indicadores[indicadorid].desplegado));
				};
                                $scope.existeComentario = function(observaciones) {
                                    if (typeof observaciones === 'undefined') {
                                        return false;
                                    }
                                    for(var i = 0, j = observaciones.length; i < j; i++) {
                                        if (typeof observaciones[i] !== 'undefined') {
                                            if (observaciones[i].length !== 0) {
                                                return true;
                                            }
                                        }
                                    }
                                    return false;
                                };
                                $scope.setIndicadorSeleccionado = function(indicadorSeleccionado) {
                                    $scope.indicadorSeleccionado = indicadorSeleccionado;
                                };
                                $scope.navigate = function(url) {
                                    console.log(url);
                                    $location.path(url);
                                };
			}
		]
	);
})(angular, $);
