(function(angular, $, Math){
	'use strict';
	angular.module('sici')
		.controller('CartaCtrl',
			['$q', '$rootScope', '$scope', '$location', '$window', '$routeParams', '$timeout', '$log', '$http', 'Arbol', 'Objetivo', 'EntidadObjeto', 'PastelColor', 'ImportarObjetivo', 'Indicador',
			function ($q, $rootScope, $scope, $location, $window, $routeParams, $timeout, $log, $http, Arbol, Objetivo, EntidadObjeto, PastelColor, ImportarObjetivo, Indicador) {
				$rootScope.nav = 'carta';
				$scope.idjerarquia = ($routeParams.idjerarquia) ? parseInt( $routeParams.idjerarquia ) : false;
				$scope.arbol = Arbol.query(function(){ $scope.setJerarquiaById($scope.idjerarquia); });
				$scope.indicadores = {};
				$scope.showformulas = false;
				$scope.superuser = $rootScope.superuser();
				$scope.mutexFormulas = function(){
					$scope.showformulas = !$scope.showformulas;
				};
				$scope.setJerarquiaById = function(idj){
					if (!idj){ return; }
					var setJ = function(nodo, idjerarquia){
						if (nodo.id === idjerarquia){
							$scope.setSeleccionado(nodo);
							return true;
						}
						if (!nodo.nodes) { return false; }
						for (var i = 0, j = nodo.nodes.length; i < j; i++){
							if (setJ(nodo.nodes[i], idjerarquia)) {
								return true;
							}
						}
						return false;
					};
					for (var idx = 0, idxmax = $scope.arbol.length; idx < idxmax; idx++){
						if (setJ( $scope.arbol[idx], idj)){ break; }
					}
				};
				$scope.filtro = function(){
					return true;/*elemento elemento.numobjetivos; */
				};


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
						var loadIndicador = function(indicador){
							if (typeof $scope.indicadores[indicador] === 'undefined'){
								$scope.indicadores[indicador] = Indicador.get({id: indicador});
							}
						};
						$scope.objetivos = Objetivo.query(restrictions, function(){
							var maxValuePerFormula = 0;
							for (var i = 0, j = $scope.objetivos.length; i < j; i++) {
								for (var k = 0, l = $scope.objetivos[i].formulas.length; k < l; k++) {
									$scope.objetivos[i].formulas[k].indicadores.forEach(loadIndicador);
									$scope.objetivos[i].formulas[k].valor = {};
									for (var anu in $scope.objetivos[i].formulas[k].valores){
										$scope.objetivos[i].formulas[k].valor[anu] = $scope.objetivos[i].formulas[k].valores[anu][ $scope.objetivos[i].formulas[k].valores[anu].length - 1 ].resultado;
									}
									maxValuePerFormula = 0;
									for (var y = 0, u = $scope.objetivos[i].formulas[k].intervalos.length; y < u; y++){
										if ( $scope.objetivos[i].formulas[k].intervalos[y].max > maxValuePerFormula){
											maxValuePerFormula = $scope.objetivos[i].formulas[k].intervalos[y].max;
										}
									}
									$scope.objetivos[i].formulas[k].uppervalue = Math.max($scope.objetivos[i].formulas[k].valor[anu], $scope.objetivos[i].formulas[k].meta, maxValuePerFormula);
								}
							}
						});
					} else {
						$scope.objetivos = [];
						delete $scope.cartaservicioseleccionada;
					}
				};
				$scope.anualidad = new Date().getFullYear(); //temporalmente */
				$scope.aanualidad = 'a' + $scope.anualidad;
				$scope.goToJerarquia = function(selection){
					$location.path('/carta/' + selection.id);
				};
				$scope.setSeleccionado = function(selection){
					if (selection) {
						$scope.idjerarquia = selection.id;
						$scope.cartasservicio = EntidadObjeto.query({'tipoentidad': 'CS', 'idjerarquia': $scope.idjerarquia}, function(){
							for (var i = 0, j = $scope.cartasservicio.length; i < j; i++){
								$scope.cartasservicio[i].urledicion = '/carta/' + $scope.idjerarquia + '/' + $scope.cartasservicio[i]._id;
								$scope.cartasservicio[i].urlprintable = '/carta-printable/' + $scope.idjerarquia + '/' + $scope.cartasservicio[i]._id;
							}
							if ($scope.cartasservicio.length > 0){
								$scope.setCartaServicio($scope.cartasservicio[0]);
							} else {
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
					$http.post('/api/v2/public/testDownloadCarta/' + $scope.cartaservicioseleccionada._id, {}).then(function(dato){
						$rootScope.toaster('Carta de servicios importada correctamente. Registrados ' + dato.data.objetivos.length + ' objetivos y ' + dato.data.indicadoresobtenidos.length + ' indicador/es.');
						$scope.setCartaServicio( $scope.cartaservicioseleccionada );
					}, function(e){
						if (typeof e.data !== 'undefined' && typeof e.data.error !== 'undefined'){
							$rootScope.toaster('Error durante la importación: ' + e.data.error, 'Error', 'error');
						} else {
							$rootScope.toaster('Error durante la importación', 'Error', 'error');
						}
					});
				};

				$scope.recargarObjetivo = function(i){
					var loadAndSetValores = function(obj){
						return function(loaded){
							var maxValuePerFormula = 0;
							if (typeof loaded.formulas !== 'undefined'){
								for (var i = 0, j = loaded.formulas.length; i < j; i++){
									obj.formulas[i].valores = loaded.formulas[i].valores;
									for (var anu in obj.formulas[i].valores){
										obj.formulas[i].valor[anu] = obj.formulas[i].valores[anu][ obj.formulas[i].valores[anu].length - 1 ].resultado;
									}
									maxValuePerFormula = 0;
									for (var k = 0, l = obj.formulas[i].intervalos.length; k < l; k++){
										if ( obj.formulas[i].intervalos[k].max > maxValuePerFormula){
											maxValuePerFormula = obj.formulas[i].intervalos[k].max;
										}
									}
									obj.formulas[i].uppervalue = Math.max(obj.formulas[i].valor[anu], obj.formulas[i].meta, maxValuePerFormula);
								}
							}
						};
					};
					Objetivo.get( {id: $scope.objetivos[i]._id}, loadAndSetValores($scope.objetivos[i]) );
				};
				$scope.updateIndicador = function(indicadorid){
					var f = function(indicadorid, desplegado){
						return function() {
							$scope.indicadores[indicadorid].desplegado = desplegado;
							var indicadoresARecargar = [];
							for (var i = 0, j = $scope.objetivos.length; i < j; i++){
								for (var k = 0, l = $scope.objetivos[i].formulas.length; k < l; k++){
									if ($scope.objetivos[i].formulas[k].indicadores.indexOf(indicadorid) > -1){
										indicadoresARecargar.push(i);
										break;
									}
								}
							}

							indicadoresARecargar.filter(function (e, idx, arr) {
								return arr.lastIndexOf(e) === idx;
							}).forEach($scope.recargarObjetivo);
						};
					};
					$scope.indicadores[indicadorid].$update(f(indicadorid, $scope.indicadores[indicadorid].desplegado), function(e){
						if (typeof e.data !== 'undefined' && typeof e.data.error !== 'undefined'){
							$rootScope.toaster('Error durante la actualización: ' + e.data.error, 'Error', 'error');
						} else {
							$rootScope.toaster('Error durante la actualización', 'Error', 'error');
						}
					});
				};
				$scope.existeComentario = function(observaciones) {
					if (typeof observaciones === 'undefined') {
						return false;
					}
					for (var i = 0, j = observaciones.length; i < j; i++) {
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
					$location.path(url);
				};
				$scope.bgColorResultado = function(resultado, formula){
					var result = '';
					if (!resultado || resultado === 0 || resultado === ''){
						return '';
					}
					for (var i = 0, j = formula.intervalos.length; i < j; i++){
						if (resultado >= formula.intervalos[i].min && resultado <= formula.intervalos[i].max){
							result = formula.intervalos[i].color;
						}
					}
					return {'background-color': result};
				};
				$scope.mini = function(){
					var minval = arguments[i];
					for (var i = 1; i < arguments.length; i++) {
						if (minval > arguments[i]){
							minval = arguments[i];
						}
					}
					return minval;
				};

				$scope.unit = '';
				$scope.precision = 2;
			}
		]
	);
})(angular, $, Math);
