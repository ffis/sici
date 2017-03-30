(function(angular, $, Math){
	'use strict';
	angular.module('sici').controller('CartaCtrl',
			['$q', '$rootScope', '$scope', '$location', '$window', '$routeParams', '$timeout', '$log', '$http', 'Arbol', 'Objetivo', 'EntidadObjeto', 'PastelColor', 'ImportarObjetivo', 'Indicador', 'ProcedimientoList', 'Jerarquia',
			function ($q, $rootScope, $scope, $location, $window, $routeParams, $timeout, $log, $http, Arbol, Objetivo, EntidadObjeto, PastelColor, ImportarObjetivo, Indicador, ProcedimientoList, Jerarquia) {
				$rootScope.nav = 'carta';
				$scope.idjerarquia = ($routeParams.idjerarquia) ? parseInt($routeParams.idjerarquia, 10) : false;
				$scope.arbol = Arbol.query(function(){ $scope.setJerarquiaById($scope.idjerarquia); });
				$scope.indicadores = {};
				$scope.procedimientos = {};
				$scope.showformulas = false;
				$scope.superuser = $rootScope.superuser();
				
				$scope.goToJerarquia = function(selection){
					$location.path('/carta/' + selection.id);
				};

				$scope.WIndicador = false;
				$scope.RIndicador = false;
				
				$scope.mutexFormulas = function(){
					$scope.showformulas = !$scope.showformulas;
				};
				$scope.jerarquias = [];
				function loadJerarquia(idjerarquia){
					if (typeof $scope.jerarquias[idjerarquia] === 'undefined'){
						$scope.jerarquias[idjerarquia] = Jerarquia.get({'id': idjerarquia});
					}
				}

				function setJ(nodo, idjerarquia){
					if (nodo.id === idjerarquia){
						$scope.setSeleccionado(nodo);

						return true;
					}
					if (!nodo.nodes){

						return false;
					}
					for (var i = 0, j = nodo.nodes.length; i < j; i += 1){
						if (setJ(nodo.nodes[i], idjerarquia)){

							return true;
						}
					}

					return false;
				}

				$scope.setJerarquiaById = function(idj){
					if (!idj){

						return;
					}
					

					for (let idx = 0, idxmax = $scope.arbol.length; idx < idxmax; idx += 1){
						if (setJ($scope.arbol[idx], idj)){
							break;
						}
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

				function loadIndicador(indicador){
					if (typeof $scope.indicadores[indicador] === 'undefined'){
						$scope.indicadores[indicador] = Indicador.get({'id': indicador});
					}
				}
				function loadProcedimiento(procedimiento){
					var clave = procedimiento.procedimiento;
					if (typeof $scope.procedimientos[clave] === 'undefined'){
						ProcedimientoList.query({'id': procedimiento.procedimiento, fields: 'codigo denominacion periodos'}).$promise.then(function(procs){
							if (procs.length > 0){
								$scope.procedimientos[clave] = procs[0];
							}
						}, function(/* err */){
							$rootScope.toaster('Error durante la importación', 'Error', 'error');
						});
					}
				}

				function postLoadObjetivo(objetivo){
					var maxValuePerFormula = 0;
					for (var k = 0, l = objetivo.formulas.length; k < l; k += 1) {
						if (typeof loadIndicador === 'function' && typeof objetivo.formulas[k].indicadores === 'object'){
							objetivo.formulas[k].indicadores.forEach(loadIndicador);
						}
						if (typeof loadProcedimiento === 'function' && typeof objetivo.formulas[k].procedimientos === 'object'){
							objetivo.formulas[k].procedimientos.forEach(loadProcedimiento);
						}
						maxValuePerFormula = 0;
						for (var y = 0, u = objetivo.formulas[k].intervalos.length; y < u; y += 1){
							if (objetivo.formulas[k].intervalos[y].max > maxValuePerFormula){
								maxValuePerFormula = objetivo.formulas[k].intervalos[y].max;
							}
						}
						objetivo.formulas[k].valor = {};
						for (var anu in objetivo.formulas[k].valores){
							objetivo.formulas[k].valor[anu] = objetivo.formulas[k].valores[anu][objetivo.formulas[k].valores[anu].length - 1].resultado;
							if (typeof objetivo.formulas[k].gaugevalue === 'undefined'){
								objetivo.formulas[k].gaugevalue = {};
							}
							objetivo.formulas[k].gaugevalue[anu] = !objetivo.formulas[k].valor[anu] ? 0 :
								(objetivo.formulas[k].valor[anu] > maxValuePerFormula ? maxValuePerFormula : objetivo.formulas[k].valor[anu]);
							/*: objetivo.formulas[k].valor[anu];*/
						}
						objetivo.formulas[k].uppervalue = Math.max(/* objetivo.formulas[k].valor[anu],*/ objetivo.formulas[k].meta, maxValuePerFormula);
					}
				}

				function postLoadObjetivos(){
					$scope.objetivos.forEach(postLoadObjetivo);
				}

				$scope.setCartaServicio = function(cartaservicio){
					if (typeof cartaservicio === 'object'){
						$rootScope.setTitle(cartaservicio.denominacion);
						$scope.cartaservicioseleccionada = cartaservicio;
						var restrictions = {'idjerarquia': cartaservicio.idjerarquia, 'carta': cartaservicio._id};

						$scope.objetivos = Objetivo.query(restrictions, postLoadObjetivos);
					} else {
						$scope.objetivos = [];
						Reflect.deleteProperty($scope, 'cartaservicioseleccionada');
					}
				};

				$scope.setSeleccionado = function(selection){
					if (selection){
						$scope.WIndicador = false;
						$scope.RIndicador = false;
						$rootScope.superuser().then(function(isSuper){
							$scope.WIndicador = isSuper || $scope.WIndicador;
							$scope.RIndicador = isSuper || $scope.RIndicador;
						});
						$rootScope.jerarquiaescritura().then(function(jerarquiaescritura){
							$scope.WIndicador = $scope.WIndicador || jerarquiaescritura.indexOf(selection.id) >= 0;
						});
						$rootScope.jerarquialectura().then(function(jerarquialectura){
							$scope.RIndicador = $scope.RIndicador || jerarquialectura.indexOf(selection.id) >= 0;
						});
						$scope.idjerarquia = selection.id;
						$scope.jerarquia = Jerarquia.get({id: $scope.idjerarquia}, function(){
							$scope.jerarquias[$scope.idjerarquia] = $scope.jerarquia;
							$scope.jerarquia.ancestros.forEach(loadJerarquia);
						});
						$scope.cartasservicio = EntidadObjeto.query({'tipoentidad': 'CS', 'idjerarquia': $scope.idjerarquia}, function(){
							$scope.cartasservicio.forEach(function(cartasservicio){
								cartasservicio.urledicion = '/carta/' + $scope.idjerarquia + '/' + cartasservicio._id;
								cartasservicio.urlprintable = '/carta/' + $scope.idjerarquia + '/' + cartasservicio._id;
							});

							if ($scope.cartasservicio.length > 0){
								var seleccionada = $scope.cartasservicio[0];
								if (typeof $routeParams.idcarta !== 'undefined'){
									var seleccionadas = $scope.cartasservicio.filter(function(a){ return a._id === $routeParams.idcarta; });
									if (seleccionadas.length > 0){
										seleccionada = seleccionadas[0];
									}
								}

								$scope.setCartaServicio(seleccionada);
							} else {
								$scope.setCartaServicio();
							}
						});

						$scope.seleccionado = selection;

						$timeout(function(){
							$('body').animate({'scrollTop': $('#detallesjerarquia').offset().top}, 'slow');
							$scope.oculto = true;
						}, 20);
					}
				};

				$scope.sumatorioParcial = function(valores, $index){

					let sum = 0;
					for (let i = 0; i <= $index; i += 1){
						if (typeof valores[i] !== 'undefined' && valores[i]){
							sum += parseFloat(valores[i]);
						}
					}

					return (sum === 0) ? '' : sum;
				};

				$scope.bgColorResultadoParcial = function(sumatorio, metaparcial, meta, formula){
					if (sumatorio === null || sumatorio === '' || isNaN(sumatorio)){

						return '';
					}

					let result = false;
					const coef = meta / metaparcial;
					for (let i = 0, j = formula.intervalos.length; i < j; i += 1){
						if (sumatorio * coef >= formula.intervalos[i].min && sumatorio * coef <= formula.intervalos[i].max){
							result = formula.intervalos[i].color;
						}
					}
					if (result === '' && formula.intervalos.length > 0 && formula.intervalos[formula.intervalos.length - 1].max){
						result = formula.intervalos[formula.intervalos.length - 1].color;
					}

					return result ? 'background-color:' + result + '!important' : '';
				};

				$scope.getPastel = function(i){
					return PastelColor(i);
				};

				$scope.importarObjetivos = function(){
					$http.post('/api/v2/public/testDownloadCarta/' + $scope.cartaservicioseleccionada._id, {}).then(function(dato){
						$rootScope.toaster('Carta de servicios importada correctamente. Registrados ' + dato.data.objetivos.length + ' objetivos y ' + dato.data.indicadoresobtenidos.length + ' indicador/es.');
						$scope.setCartaServicio($scope.cartaservicioseleccionada);
					}, function(e){
						if (typeof e.data !== 'undefined' && typeof e.data.error !== 'undefined'){
							$rootScope.toaster('Error durante la importación: ' + e.data.error, 'Error', 'error');
						} else {
							$rootScope.toaster('Error durante la importación', 'Error', 'error');
						}
					});
				};

				$scope.recargarObjetivo = function(counter){
					var loadAndSetValores = function(obj){
						return function(loaded){
							postLoadObjetivo(loaded);
							if (typeof loaded.formulas !== 'undefined'){
								for (var i = 0, j = loaded.formulas.length; i < j; i += 1){
									obj.formulas[i].valores = loaded.formulas[i].valores;
									if (typeof loaded.formulas[i].gaugevalue !== 'undefined'){
										for (var anu in loaded.formulas[i].gaugevalue){
											obj.formulas[i].gaugevalue[anu] = loaded.formulas[i].gaugevalue[anu];
										}
									}
									obj.formulas[i].uppervalue = loaded.formulas[i].uppervalue;
								}
							}
						};
					};
					Objetivo.get({'id': $scope.objetivos[counter]._id}, loadAndSetValores($scope.objetivos[counter]));
				};

				function postUpdateIndicador(indicadorid, desplegado){
					return function() {
						$scope.indicadores[indicadorid].desplegado = desplegado;
						var indicadoresARecargar = [];
						for (var i = 0, j = $scope.objetivos.length; i < j; i += 1){
							for (var k = 0, l = $scope.objetivos[i].formulas.length; k < l; k += 1){
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
				}

				$scope.updateIndicador = function(indicadorid){
					
					$scope.indicadores[indicadorid].$update(postUpdateIndicador(indicadorid, $scope.indicadores[indicadorid].desplegado), function(e){
						if (typeof e.data !== 'undefined' && typeof e.data.error !== 'undefined'){
							$rootScope.toaster('Error durante la actualización: ' + e.data.error, 'Error', 'error');
						} else {
							$rootScope.toaster('Error durante la actualización', 'Error', 'error');
						}
					});
				};

				$scope.existeComentario = function(observaciones) {
					return Array.isArray(observaciones) && observaciones.some(function(observacion){ return observacion && typeof observacion === 'string' && observacion.length > 0; });
				};

				$scope.setIndicadorSeleccionado = function(indicadorSeleccionado) {
					$scope.indicadorSeleccionado = indicadorSeleccionado;
				};
				$scope.navigate = function(url) {
					$location.path(url);
				};
				$scope.bgColorResultado = function(resultado, formula){
					if (resultado === null || resultado === '' || isNaN(resultado)){
						
						return '';
					}

					let result = '';
					for (let i = 0, j = formula.intervalos.length; i < j; i += 1){
						if (resultado >= formula.intervalos[i].min && resultado <= formula.intervalos[i].max){
							result = formula.intervalos[i].color;
							break;
						}
					}

					return 'background-color:' + result + ' !important';
				};

				$scope.downloadxls = function(){
					$scope.descargando = true;
					$http.get('/api/v2/public/exportadorCarta/' + $scope.cartaservicioseleccionada._id + '/' + $rootScope.getIntAnualidad()).then(function (res) {
						$scope.descargando = false;
						if (typeof res.data === 'object'){
							$rootScope.cbDownload(res.data);
						} else {
							$rootScope.toaster('Error al descargar el informe', 'Error', 'error');
						}
					}, function() {
						$scope.descargando = false;
					});
				};
				$scope.mini = function(){
					let minval = arguments[0];
					for (let i = 1; i < arguments.length; i += 1) {
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
