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
				$scope.aanualidad = '';
				$scope.W_Indicador = false;
				$scope.R_Indicador = false;
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
				$scope.refreshAnualidad = function(anualidad){
					$scope.anualidad = anualidad;
					$scope.aanualidad = 'a' + $scope.anualidad;
				};
				var postLoadObjetivo = function(objetivo, loadIndicador){
					var maxValuePerFormula = 0;
					for (var k = 0, l = objetivo.formulas.length; k < l; k++) {
						if (typeof loadIndicador === 'function'){
							objetivo.formulas[k].indicadores.forEach(loadIndicador);
						}
						maxValuePerFormula = 0;
						for (var y = 0, u = objetivo.formulas[k].intervalos.length; y < u; y++){
							if (objetivo.formulas[k].intervalos[y].max > maxValuePerFormula){
								maxValuePerFormula = objetivo.formulas[k].intervalos[y].max;
							}
						}
						objetivo.formulas[k].valor = {};
						for (var anu in objetivo.formulas[k].valores){
							$scope.anualidadesKeys[anu] = parseInt(anu.replace('a', ''));
							objetivo.formulas[k].valor[anu] = objetivo.formulas[k].valores[anu][ objetivo.formulas[k].valores[anu].length - 1 ].resultado;
							if (typeof objetivo.formulas[k].gaugevalue === 'undefined'){
								objetivo.formulas[k].gaugevalue = {};
							}
							objetivo.formulas[k].gaugevalue[anu] = !objetivo.formulas[k].valor[anu] ? 0 :
								(objetivo.formulas[k].valor[anu] > maxValuePerFormula ? maxValuePerFormula : objetivo.formulas[k].valor[anu]);
							/*: objetivo.formulas[k].valor[anu];*/
						}
						objetivo.formulas[k].uppervalue = Math.max(/* objetivo.formulas[k].valor[anu],*/ objetivo.formulas[k].meta, maxValuePerFormula);
					}
					getAnualidades();
				};
				function getAnualidades(){
					if (Object.keys($scope.anualidadesKeys).length > 0){
						$scope.anualidades = [];
						var max = false;
						for (var a in $scope.anualidadesKeys){
							$scope.anualidades.push($scope.anualidadesKeys[a]);
							if (!max || max < a){
								max = a;
							}
						}
						/*
						$scope.aanualidad = max;
						$scope.anualidad = parseInt(max.replace('a', ''));
						*/
					}
				}
				var loadIndicador = function(indicador){
					if (typeof $scope.indicadores[indicador] === 'undefined'){
						$scope.indicadores[indicador] = Indicador.get({id: indicador});
					}
				};
				var postLoadObjetivos = function(loadIndicador){
					return function(){
						$scope.anualidadesKeys = {};
						for (var i = 0, j = $scope.objetivos.length; i < j; i++) {
							postLoadObjetivo($scope.objetivos[i], loadIndicador);
						}
					};
				};

				$scope.setCartaServicio = function(cartaservicio){
					if (typeof cartaservicio !== 'undefined'){
						$rootScope.setTitle(cartaservicio.denominacion);
						$scope.cartaservicioseleccionada = cartaservicio;
						var restrictions = { idjerarquia: cartaservicio.idjerarquia, carta: cartaservicio._id };

						$scope.objetivos = Objetivo.query(restrictions, postLoadObjetivos(loadIndicador));
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
						$rootScope.jerarquiaescritura().then(function(jerarquiaescritura){
							$scope.W_Indicador = jerarquiaescritura.indexOf(selection.id) >= 0;
						});
						$rootScope.jerarquialectura().then(function(jerarquialectura){
							$scope.R_Indicador = jerarquialectura.indexOf(selection.id) >= 0;
						});
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
							$scope.oculto = true;
						}, 20);
					}
				};
				$scope.sumatorioParcial = function(valores, $index){
					var sum = 0;
					for (var i = 0; i <= $index; i++){
						if (typeof valores[i] !== 'undefined' && valores[i] ){
							sum += parseFloat(valores[i]);
						}
					}
					if (sum === 0){
						return '';
					}
					return sum;
				};
				$scope.bgColorResultadoParcial = function(sumatorio, metaparcial, meta, formula){
					if (sumatorio === ''){
						return {};
					}
					var result = '';
					if (!sumatorio || sumatorio === 0 || sumatorio === ''){
						return '';
					}
					var coef = meta / metaparcial;
					for (var i = 0, j = formula.intervalos.length; i < j; i++){
						if (sumatorio * coef >= formula.intervalos[i].min && sumatorio * coef <= formula.intervalos[i].max){
							result = formula.intervalos[i].color;
						}
					}
					if (result === '' && formula.intervalos.length > 0 && formula.intervalos[ formula.intervalos.length - 1 ].max ){
						result = formula.intervalos[ formula.intervalos.length - 1 ].color;
					}
					return {'background-color': result};
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
							postLoadObjetivo(loaded);
							if (typeof loaded.formulas !== 'undefined'){
								for (var i = 0, j = loaded.formulas.length; i < j; i++){
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
