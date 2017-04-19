(function(angular, d3, $){
	'use strict';
	angular.module('sici')
		.controller('DetallesCtrl', ['$q', '$rootScope', '$scope', '$routeParams', '$window', '$location', '$timeout', '$http', '$log', 'toaster', 'Procedimiento', 'DetalleCarmProcedimiento', 'DetalleCarmProcedimiento2', 'Raw', 'Aggregate', 'ProcedimientoHasChildren', 'ProcedimientoList', 'ArbolWithEmptyNodes', 'ExportarResultadosProcedimiento',
			function ($q, $rootScope, $scope, $routeParams, $window, $location, $timeout, $http, $log, toaster, Procedimiento, DetalleCarmProcedimiento, DetalleCarmProcedimiento2, Raw, Aggregate, ProcedimientoHasChildren, ProcedimientoList, ArbolWithEmptyNodes, ExportarResultadosProcedimiento) {

				$scope.detallesCarm = DetalleCarmProcedimiento.get({'codigo': $routeParams.codigo});
				$scope.detallesCarm2 = DetalleCarmProcedimiento2.get({'codigo': $routeParams.codigo});
				$scope.numgraphs = 0;
				$scope.graficasbarras = false;
				$scope.mesActual = (new Date()).getMonth();
				$scope.detallesCarmHTML = true;
				$scope.graphs = false;
				$scope.padre = '';
				$scope.mostrarAutocompletePadre = false;
				$scope.nombrePadre = false;
				$scope.procedimientoSeleccionado = null;
				$scope.filtrosocultos = false;
				$scope.seleccionado = null;
				$scope.mensajeMoviendo = '';
				$scope.msjBase = 'Moviendo (Esta operación puede tardar un tiempo)...';

				const listener = $rootScope.$watch('anualidad', function(){
					$scope.updateGraphKeys();
				});

				$scope.$on('$destroy', function() {
					listener();
				});

				$scope.exists = function (attr) {
					return $rootScope.anualidad && $scope.procedimientoSeleccionado && $scope.procedimientoSeleccionado.periodos &&
						$scope.procedimientoSeleccionado.periodos[$rootScope.anualidad] &&
						typeof $scope.procedimientoSeleccionado.periodos[$rootScope.anualidad][attr] !== 'undefined';

				};

				$scope.showProcedimiento = function (procedimiento) {

					return (procedimiento && procedimiento.denominacion && procedimiento.codigo) ? ('[' + procedimiento.codigo + '] ' + procedimiento.denominacion) : '';
				};

				$scope.updatePadre = function (value) {
					if (!$scope.procedimientoSeleccionado){
					
						return;
					}
					$scope.procedimientoSeleccionado.padre = value.codigo;
					$scope.nombrePadre = value.denominacion;
					$scope.procedimientoSeleccionado.$update();
					$scope.mostrarAutocompletePadre = false;
				};

				$scope.ocultarProcedimiento = function (procedimientoSeleccionado){
					if (!$scope.procedimientoSeleccionado){
					
						return;
					}
					procedimientoSeleccionado.oculto = !procedimientoSeleccionado.oculto;
					$scope.procedimientoSeleccionado.$update(function(){
						const mensaje = procedimientoSeleccionado.oculto ? 'El procedimiento ha sido ocultado' : 'El procedimiento vuelve a ser visible';
						$rootScope.toaster(mensaje);
					}, function (){
						procedimientoSeleccionado.oculto = !procedimientoSeleccionado.oculto;
						$rootScope.toaster('Se ha producido un error', 'Error', 'error');
					});
				};

				$scope.eliminarProcedimiento = function (procedimientoSeleccionado) {
					procedimientoSeleccionado.eliminado = true;
					$scope.procedimientoSeleccionado.$delete(function () {
						const mensaje = procedimientoSeleccionado.eliminado ? 'El procedimiento ha sido eliminado' : 'El procedimiento ha sido recuperado';
						$rootScope.toaster(mensaje);
					}, function () {
						procedimientoSeleccionado.eliminado = !procedimientoSeleccionado.eliminado;
						$rootScope.toaster('Se ha producido un error', 'Error', 'error');
					});
				};

				$scope.editarPadre = function () {
					$scope.mostrarAutocompletePadre = true;
				};

				$scope.ocultarEditarPadre = function () {
					$scope.mostrarAutocompletePadre = false;
				};

				$scope.periodosOk = function(anualidad, procedimiento){
					if (!procedimiento || !anualidad || !procedimiento.periodos){ return false; }

					return (procedimiento.periodos[anualidad].plazo_CS_ANS_habiles || procedimiento.periodos[anualidad].plazo_CS_ANS_naturales) &&
						(procedimiento.periodos[anualidad].plazo_maximo_resolver || procedimiento.periodos[anualidad].plazo_maximo_responder);
				};

				$scope.deletePadre = function(){
					if (!$scope.procedimientoSeleccionado){
					
						return;
					}
					$scope.procedimientoSeleccionado.padre = null;
					$scope.procedimientoSeleccionado.$update(function (response) {
						$log.error(response);
					});
					$scope.nombrePadre = 'Sin definir';
				};
				function sparkline(){
					$('.sparkline>canvas').remove();
					$.each($('.sparkline'), function(k, v){
						const obj = String($(v).attr('data-value'));
						try {
							$(v).sparkline(JSON.parse(obj), {'type': 'bar', 'barColor': '#a94442'});
						} catch (e) {
							/*$log.error('sparkline mal formed VALUE WAS:' + t , obj);*/
							$(v).sparkline([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], {'type': 'bar', 'barColor': '#a94442'});
						}
					});
				}

				$scope.sparkline = function(){
					$timeout(sparkline, 100);
				};
				$scope.updateGraphKeys = function(){
					if (!$scope.procedimientoSeleccionado) return;
					$scope.sparkline();
					const defaultOptions = {'legend': {'display': true}};
					const anualidad = $rootScope.getIntAnualidad();
					const anualidadAnterior = anualidad - 1;
					const graphskeys = [
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
								{'caption': 'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)', vals: 'periodos.a' + anualidad + '.resueltos_desistimiento_renuncia_caducidad', 'maxx': $scope.mesActual},
								{'caption': 'Resueltos por Prescripcion/Caducidad (Resp_Admon)', vals: 'periodos.a' + anualidad + '.resueltos_prescripcion', 'maxx': $scope.mesActual}
							]
						},
						{
							'caption': 'QUEJAS Y RECURSOS CONTRA EL PROCEDIMIENTO ' + anualidad,
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
							let k = $scope.procedimientoSeleccionado;
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

				Procedimiento.get({'codigo': $routeParams.codigo}, function (procedimiento){
					if (!procedimiento){
						$rootScope.toaster('Procedimiento no encontrado', 'Alerta', 'warning');

						return;
					}
					$scope.procedimientoSeleccionado = procedimiento;
					$rootScope.setTitle($scope.procedimientoSeleccionado.denominacion);
					$rootScope.procedimiento = $scope.procedimientoSeleccionado.codigo;
					
					$scope.procedimientosPadre = [];

					$scope.mostrarAutocompletePadre = false;
					if ($scope.procedimientoSeleccionado.padre) {
						var procPad = Procedimiento.get({codigo: $scope.procedimientoSeleccionado.padre}, function () {
							$scope.nombrePadre = procPad.denominacion;
						});
					} else {
						$scope.nombrePadre = 'Sin definir';
					}

					if ($scope.procedimientoSeleccionado.ancestros && $scope.procedimientoSeleccionado.ancestros[0].id === 1){
						$scope.procedimientoSeleccionado.ancestros.reverse();//TODO: revisar este parche
					}

					$rootScope.W($scope.procedimientoSeleccionado).then(function (val) {
						$scope.procedimientosPadre = ProcedimientoList.query({'idjerarquia': 1, 'recursivo': true, 'fields': 'codigo denominacion' });
						if (val){
							ProcedimientoHasChildren.query({'codigo': $scope.procedimientoSeleccionado.codigo}, function (data) {
								$scope.tieneHijos = data.count;
							});
						} else {
							$rootScope.superuser().then(function (val2) {
								$scope.W = val || val2;
								if ($scope.W){
									$scope.tieneHijos = false;
									ProcedimientoHasChildren.query({'codigo': $scope.procedimientoSeleccionado.codigo}, function (data){
										$scope.tieneHijos = data.count;
									});
								}
							}, function () {
								$scope.W = false;
							});
						}
					}, function () {
						$scope.W = false;
					});

					$scope.updateGraphKeys();
				});
					
				$scope.checkInconsistencias = function(){
					if ($scope.procedimientoSeleccionado && $scope.inconsistencias && $scope.inconsistencias.length > 0){
						var fnWarning = function(idx){
							/*
							Querido lector, bienvenido al mundo de la incertidumbre.
							Sé valiente y revisa este código en momento de lucidez.
							Tiene sentido que este código sea inconsistente mientras trata inconsistencias.
							Un timeout, todo lo cura.
							*/
							var fn = function(idx){
								return function(){

									if ($scope.inconsistencias[idx].datos && $scope.inconsistencias[idx].datos &&
										(
											(typeof $scope.inconsistencias[idx].$resolved !== 'undefined' && $scope.inconsistencias[idx].$resolved ) ||
											typeof $scope.inconsistencias[idx].$resolved === 'undefined'
										) && $scope.inconsistencias[idx].datos.length > 0){
										toaster.pop('warning', 'Aviso', $scope.inconsistencias[idx].titulo);
									}
								};
							};
							$timeout(fn(idx), 500);

						};
						$scope.inconsistencias.forEach(function (i, idx) {
							var campo = {'codigo': '$codigo'};
							try {
								var restriccion = JSON.parse(i.restriccion);
								restriccion.codigo = $scope.procedimientoSeleccionado.codigo;
								var parametros = {'anualidad': $rootScope.anualidad, 'campo': JSON.stringify(campo), 'restriccion': JSON.stringify(restriccion)};
								$scope.inconsistencias[idx].datos = Aggregate.query(parametros, fnWarning(idx) );
							} catch (exception) {
								$log.error(exception);
								$log.error('La restricción ' + i.restriccion + ' no es correcta');
							}
						});
					}
				};

				$scope.inconsistencias = Raw.query({model: 'reglasinconsistencias'}, function () { $scope.checkInconsistencias(); });

				$scope.nextField = function(index) {
					if (!$scope.procedimientoSeleccionado.periodos[$rootScope.anualidad] || !$scope.procedimientoSeleccionado.periodos[$rootScope.anualidad].periodoscerrados){

						return index;
					}

					const periodoscerrados = $scope.procedimientoSeleccionado.periodos[$rootScope.anualidad].periodoscerrados;
					let newindex = (index + 1) % 12;
					while (periodoscerrados[index] === true && index !== newindex) {
						newindex = (newindex + 1) % 12;
					}

					return newindex;
				};

				$scope.changeFocus = function (form, index, attr, data) {
					if (isNaN(parseInt(data, 10)) || !/^\d+$/.test(data) || parseInt(data, 10) < 0) {
						form.$setError('Error', 'Formato no v&aacute;lido.');

						return;
					}
					form.$submit();
					let attrib = '';
					var newindex = $scope.nextField(index);
					if (newindex < index) {
						attrib = $scope.attrstabla[$scope.attrstabla.indexOf(attr) + 1];
					} else {
						attrib = attr;
					}
					var formulario = $scope.forms[newindex][attrib];
					if (typeof formulario === 'object'){
						formulario.$show();
					}
				};

				$scope.forms = [];
				$scope.addForm = function (attr, index, form) {
					if (typeof $scope.forms[index] === 'undefined'){
						$scope.forms[index] = {};
					}
					$scope.forms[index][attr] = form;
				};

				/***** CAMBIO DE JERARQUIA ****/

				var defjerarquia = $q.defer();
				$scope.pjerarquia = defjerarquia.promise;
				$rootScope.jerarquialectura().then(function (j) {
					$rootScope.jerarquiaescritura().then(function (j2) {
						$scope.jerarquia = j.concat(j2);
						defjerarquia.resolve($scope.jerarquia);
					});
				});

				/*$scope.filtrojerarquia*/
				$scope.fj = function (item) {
					if ($scope.jerarquia.indexOf(item.id) !== -1){

						return true;
					}
					if (item.nodes) {

						return item.nodes.some($scope.filtrojerarquia);
					}

					return false;
				};


				$scope.filtrojerarquia = function (item) {
					var def = $q.defer();
					$scope.pjerarquia.then(function () {
						def.resolve($scope.fj(item));
						$scope.filtrojerarquia = $scope.fj;
					}, def.reject);

					return def.promise;
				};

				$scope.setSeleccionado = function (elemento) {
					$scope.seleccionado = elemento;
				};

				$rootScope.superuser().then(function () {
					$log.log('Obteniendo arbol para funcionalidad cambio de jerarquia');
					$scope.arbol = ArbolWithEmptyNodes.query();
				});

				$scope.execCmd = function (cmds, i) {
					cmds[i - 1].defer.promise.then(function () {
						$scope.mensajeMoviendo = $scope.msjBase + cmds[i].msj;
						$http.get(cmds[i].cmd).then(function () {
							$scope.mensajeMoviendo += ' ¡OK!';
							cmds[i].defer.resolve({'index': i, 'msj': 'Comando ' + cmds[i].cmd + ' OK'});
						}, function () {
							cmds[i].defer.reject('Error al solicitar un recalculo ' + i);
						});
					}, function () {
						cmds[i].defer.reject('No se ha ejecutado el comando previo ' + i);
					});
					
					return cmds[i].defer.promise;
				};

				function fnMovimiendoOrganicaError(err){
					$scope.mensajeMoviendo = 'Error. Ocurrió un error realizando la operación. Si es posible ejecute manualmente las operaciones de mantenimiento y recálculo. ';
					$log.log(err);
				}

				$scope.changeOrganica = function (){
					// cambiamos idjerarquia.
					$scope.procedimientoSeleccionado.idjerarquia = $scope.seleccionado.id;
					$scope.procedimientoSeleccionado.$update(function() {
						if (!$window.confirm('Esta operación requiere reajustar el sistema y puede tardar varios minutos, si confirma se realizará este ajuste ahora mismo. En otro caso, podrá hacerlo más adelante o manualmente desde el panel de administración correspondiente.')) {
							$scope.mensajeMoviendo = 'PARA QUE EL CAMBIO TENGA EFECTO, EJECUTE MANUALMENTE EL RECÁLCULO DE PROCEDIMIENTO CACHE, JERARQUÍA Y PERMISOS AL TÉRMINO DE TODAS LAS OPERACIONES DE CAMBIO DE ORGÁNICA.';
							
							return;
						}

						//$log.log(response);
						// salvamos y ordenamos el recalculo.
						var cmds = [
							{cmd: '', defer: $q.defer()},
							{cmd: '/api/v1/restricted/fprocedimiento', defer: $q.defer(), msj: 'Ajustando procedimiento'},
							{cmd: '/api/v1/restricted/fjerarquia', defer: $q.defer(), msj: 'Ajustando organica'},
							{cmd: '/api/v1/restricted/fpermiso', defer: $q.defer(), msj: 'Comprobando permisos'}
						];
						cmds[0].defer.resolve();
						$scope.mensajeMoviendo = $scope.msjBase;
						var fn = function (data) {
							$log.log(data.msj);
							if (data.index === cmds.length - 1) {
								$scope.mensajeMoviendo = $scope.msjBase + ' ¡¡Listo!!';
								$timeout($scope.cancelChangeOrganica, 1500);
							} else {
								$scope.mensajeMoviendo += '.';
							}
						};
						
						for (let i = 1; i < cmds.length; i += 1) {
							$scope.execCmd(cmds, i).then(fn, fnMovimiendoOrganicaError);
						}
					});
				};

				$scope.cancelChangeOrganica = function () {
					$scope.seleccinado = null;
					$scope.showArbol = false;
					$scope.mensajeMoviendo = '';
					$scope.recalculate();
				};

				$scope.setShowArbol = function () {
					$scope.showArbol = true;
				};

				$scope.isShowArbol = function () {
					return $scope.showArbol;
				};

				$scope.attrspar = [
					'codigo', 'denominacion', 'tipo', 'cod_plaza', 'fecha_creacion', 'fecha_version' /* 'fecha_fin', */
				];

				$scope.attrsanualidad = ['pendientes_iniciales', 'plazo_CS_ANS_habiles', 'plazo_CS_ANS_naturales', 'plazo_maximo_resolver', 'plazo_maximo_responder'];
				$scope.attrsanualidad_permisos = ['w', 'w', 'w', 'w', 'w'];

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
				$scope.attrsresp = ['codplaza', 'login', 'nombre', 'apellidos', 'telefono'];

				$scope.meses = $rootScope.meses;
				$scope.colorText = $rootScope.colorText;

				$scope.graficasgrandes = false;
				$scope.xAxisTickValuesFunction = function () {
					return function () {
						return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
					};
				};
				$scope.xAxisTickFormatFunction = function () {
					return function (d) {
						return $scope.meses[d];
					};
				};
				$scope.colorFunction2 = function () {
					return function (d, i) {
						return $rootScope.colorToHex($rootScope.colorText(i, 5, 60));
					};
				};
				var colorCategory = d3.schemeCategory20;
				$scope.colorFunction = function () {
					return function (d, i) {
						return colorCategory[i];
					};
				};

				$scope.recalculate = function (force) {
					if (force || $scope.cellChanged) {
						$scope.procedimientoSeleccionado.$update(function (response) {
							$scope.updateGraphKeys();
							$scope.checkInconsistencias();
							$log.error(response);
						});
					}
				};

				$scope.checkNumber = function (data, anualidad, attr, index) {
					
					$scope.cellChanged = ($scope.procedimientoSeleccionado.periodos[anualidad][attr][index] !== data);
					var valor = parseInt(data, 10);
					if (isNaN(valor) || !/^\d+$/.test(data)) {

						return 'Esto no es un número';
					} else if (valor < 0) {

						return 'No se admiten valores menores de 0';
					}

					return true;
				};

				function fnSetZero(procedimiento, anualidad, attr){
					for (let i = 0, j = procedimiento.periodos[anualidad][attr].length; i < j; i += 1){
						procedimiento.periodos[anualidad][attr][i] = 0;
					}
				}

				$scope.resetData = function(){
					if ($scope.procedimientoSeleccionado && $scope.W){
						if ($window.confirm('¿Está seguro de querer borrar los datos introducidos PARA ESTE PROCEDIMIENTO PARA ESTA ANUALIDAD ' + $scope.anualidad + '?')){
							
							$scope.attrstabla.forEach(function(attr){
								fnSetZero($scope.procedimientoSeleccionado, $scope.anualidad, attr);
							});
							$scope.recalculate(true);
						}
					}
				};

				$scope.descargarExcel = function(){
					ExportarResultadosProcedimiento.get({'codigo': $scope.procedimientoSeleccionado.codigo, 'year': $scope.anualidad}, $rootScope.cbDownload);
				};
			}
		]
	);
})(angular, d3, $);
