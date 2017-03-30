(function (angular) {
	'use strict';
	angular.module('sici')
			.controller('FormulaCtrl', ['$http', '$q', '$rootScope', '$scope', '$routeParams', 'EntidadObjeto', 'Objetivo', 'Operador', 'Indicador', 'ProcedimientoList', '$log',
				function ($http, $q, $rootScope, $scope, $routeParams, EntidadObjeto, Objetivo, Operador, Indicador, ProcedimientoList, $log) {

					const MAX_ELEMENTS_FORMULA = 24;
					const COLORES = {
						indicadores: '#2A7FFF',
						procedimientos: '#7F2AFF',
						operadores: '#7FFF2A',
						vacio: 'grey'
					};

					$scope.indexFormula = typeof $routeParams.index === 'undefined' ? 0 : parseInt($routeParams.index);
					$scope.idobjetivo = $routeParams.idobjetivo;

					$scope.draggableObjects = Operador.query(function () {
						$scope.operators = $scope.draggableObjects.slice();
					});

					$scope.indicadores = [];
					$scope.indicadoresObjeto = {};
					$scope.procedimientosObjeto = {};
					$scope.formulaObjects = [];
					$scope.procedimientos = [];

					var fn = function (defer) {
						return function (data) {
							$scope.indicadores.push({'texto': data.nombre, 'valor': data._id, 'color': COLORES.indicadores, 'indicador': true});
							$scope.indicadoresObjeto[data._id] = data;
							defer.resolve();
						};
					};
					var fn2 = function (defer, campo){
						return function(data){
							if (data.length > 0){
								$scope.procedimientos.push({'texto': data[0].denominacion + '.' + campo, 'valor': data[0]._id, 'color': COLORES.procedimientos, 'procedimiento': true, 'campo': campo});
								$scope.procedimientosObjeto[data[0]._id] = data[0];
								defer.resolve();
							} else {
								defer.reject({error: 'No ha conseguido cargar un procedimiento.'});
							}
						};
					};
					var defers = [];
					$scope.objetivo = Objetivo.get({id: $scope.idobjetivo}, function () {

						$scope.formula = $scope.objetivo.formulas[$scope.indexFormula];
						for (let i = 0, j = $scope.formula.indicadores.length; i < j; i += 1) {
							const defer = $q.defer();
							defers.push(defer.promise);
							Indicador.get({id: $scope.formula.indicadores[i]}, fn(defer));
						}
						if (typeof $scope.formula.procedimientos === 'object'){
							for (let i = 0, j = $scope.formula.procedimientos.length; i < j; i += 1) {
								const defer = $q.defer();
								defers.push(defer.promise);
								ProcedimientoList.query({'id': $scope.formula.procedimientos[i].procedimiento, 'fields': 'codigo denominacion'}, fn2(defer, $scope.formula.procedimientos[i].campo));
							}
						}
						$q.all(defers).then(function () {
							$scope.parseFormula();
						});
						$scope.carta = EntidadObjeto.get({id: $scope.objetivo.carta});
					});

					$scope.parseFormula = function () {
						if (typeof $scope.formula.computer !== 'undefined' && $scope.formula.computer.trim() !== '') {
							const formula = JSON.parse($scope.formula.computer);

							formula.filter(function(elem) { return (elem.trim() !== ''); }).forEach(function (elem) {
									
									let encontrado = false;
									if (elem.charAt(0) === '/'){
										const campos = elem.split('/');
										if (campos[1] === 'indicador'){
											for (let i = 0; i < $scope.formula.indicadores.length; i += 1) {
												const id = $scope.formula.indicadores[i];
												if (campos[2] === id) {
													$scope.formulaObjects.push({'texto': $scope.indicadoresObjeto[id].nombre, 'valor': elem, 'color': COLORES.indicadores, 'indicador': true});
													encontrado = true;
													break;
												}
											}
										} else if (campos[1] === 'procedimiento'){
											const campo = campos[5];

											for (let i = 0; i < $scope.formula.procedimientos.length; i += 1) {
												const id = $scope.formula.procedimientos[i].procedimiento;
												$log.log(id, campos[2], $scope.procedimientosObjeto);
												if (campos[2] === id) {
													$scope.formulaObjects.push({'texto': $scope.procedimientosObjeto[id].denominacion, 'valor': elem, 'color': COLORES.procedimientos, 'procedimiento': true, 'campo': campo});
													encontrado = true;
													break;
												}
											}
										}
									} else {
										if (elem === '* 100'){
											$scope.formulaObjects.push({'texto': '*', 'valor': '*', 'indicador': false, 'procedimiento': false, 'color': COLORES.operadores});
											$scope.formulaObjects.push({'texto': '100', 'valor': '100', 'indicador': false, 'procedimiento': false, 'color': COLORES.operadores});
											encontrado = true;
										}
									}
									if (!encontrado) {
										$scope.formulaObjects.push({'texto': elem, 'valor': elem, 'indicador': false, 'procedimiento': false, 'color': 'red'});
									}
								});
						}
						for (let i = $scope.formulaObjects.length; i < MAX_ELEMENTS_FORMULA; i += 1) {
							$scope.formulaObjects.push({'texto': '', 'color': COLORES.vacio, 'indicador': false});
						}
					};

					$scope.onDropFormula = function (index, data) {
						if (data._id) {
							$scope.formulaObjects[index] = {'texto': data.texto, 'valor': data.valor, 'indicador': data.indicador};
						} else {
							const otherObj = $scope.formulaObjects[index];
							const otherIndex = $scope.formulaObjects.indexOf(data);
							$scope.formulaObjects[index] = data;
							$scope.formulaObjects[otherIndex] = otherObj;
						}
					};

					$scope.onDropEliminar = function (data) {
						const index = $scope.formulaObjects.indexOf(data);
						$scope.formulaObjects[index] = {'texto': '', 'color': COLORES.vacio, 'indicador': false};
					};

					$scope.guardarFormula = function () {
						var formula = [];
						var fnFilter = function (elem) {
							if (!elem || !elem.texto){
								return false;
							}

							return (elem.texto !== '');
						};

						$scope.formulaObjects.filter(fnFilter).forEach(function (elem) {
							if (elem.indicador) {
								if (elem.valor.indexOf('/') < 0){
									formula.push('/indicador/' + elem.valor + '/valores/[anualidad]/[mes]');
								} else {
									formula.push(elem.valor);
								}
							} else if (elem.procedimiento) {
								if (elem.valor.indexOf('/') < 0){
									formula.push('/procedimiento/' + elem.valor + '/periodos/[anualidad]/' + elem.campo + '/[mes]');
								} else {
									formula.push(elem.valor);
								}
							} else {
								formula.push(elem.valor);
							}
						});

						const parameters = {'idobjetivo': $scope.idobjetivo, 'indiceformula': $scope.indexFormula, 'formula': JSON.stringify(formula)};
						$http.put('/api/v2/public/updateformula', parameters).then(function() {
							$rootScope.toaster('Fórmula actualizada correctamente', 'Éxito', 'success');
						}, function(err) {
							if (typeof err.error !== 'undefined'){
								err = err.error;
							}
							$rootScope.toaster('No se ha podido actualizar la fórmula. ' + err, 'Error', 'error');
						});
					};

				}]);
})(angular);
