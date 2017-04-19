(function(angular, $){
	'use strict';
	angular.module('sici').controller('InformesCtrl', ['$rootScope', '$scope', '$timeout', 'ExportarInforme', 'PeriodosStats', 'Arbol', 'Indicador', 'EntidadObjetoList', 'Objetivo', 'jerarquiaDescendientes', 'PlanMejoraList', 'COLORES_OBJETIVOS',
		function ($rootScope, $scope, $timeout, ExportarInforme, PeriodosStats, Arbol, Indicador, EntidadObjetoList, Objetivo, jerarquiaDescendientes, PlanMejoraList, COLORES_OBJETIVOS) {
			$scope.funcionalidades = [
				{'label': 'Informe global', 'fn': [{'label': 'Descargar Excel', 'cmd': 'descargarexcel'}]},
				{'label': 'Informe resumen procedimientos', 'fn': [{'label': 'Generar informe', 'cmd': 'periodosStats'}]},
				{'label': 'Informe resumen cartas', 'fn': [{'label': 'Generar informe', 'cmd': 'cartasStats'}]}
			];
			$rootScope.nav = 'recalculate';
			$rootScope.setTitle('Informes');
			$scope.colorEnabled = false;
			$scope.orderBy = '';
			$scope.reverse = false;
			$scope.actualizando = 0;
			$scope.respuestas = [];
			$scope.tienePermisoVar = false;
			$scope.informedetalladocarta = false;
			$scope.jerarquiasByAncestro = {};

			$scope.arbol = Arbol.query();
			$scope.jerarquiasByAncestro['1'] = jerarquiaDescendientes.query({'idjerarquia': 1});

			$scope.clasefuncionalidades = 'col-sm-' + (12 / $scope.funcionalidades.length).toFixed(0);
			$scope.oculto = false;
			$scope.columnasocultas = true;
			$scope.campos = [
				'en_plazo', 'fuera_plazo',
				'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion',
				'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30', 'resueltos_45', 'resueltos_mas_45',
				'quejas', 'recursos'
			];
			$scope.setOrderBy = function(field){ $scope.orderBy = field; $scope.reverse = !$scope.reverse; };
			$scope.getPorcentajeFormulasJerarquiaCumplimentadas = function(idjerarquia, anualidad){
				if (!$scope.formulasByJerarquia || typeof $scope.formulasByJerarquia[String(idjerarquia)] !== 'object' || $scope.formulasByJerarquia[String(idjerarquia)].length === 0){

					return 0;
				}
				const cumplimentados = $scope.formulasByJerarquia[String(idjerarquia)].reduce(function(prev, indicador){
					if (indicador.valores && indicador.valores[anualidad]){
						prev += indicador.valores[anualidad].some(function(c){ return c && c.resultado; }) ? 1 : 0;
					}

					return prev;
				}, 0);

				return cumplimentados / $scope.formulasByJerarquia[String(idjerarquia)].length;
			};

			$scope.getPorcentajeFormulasCumplimentadas = function(idcarta, anualidad){
				if (!$scope.formulasByCarta || typeof $scope.formulasByCarta[String(idcarta)] !== 'object' || $scope.formulasByCarta[String(idcarta)].length === 0){

					return 0;
				}
				const cumplimentados = $scope.formulasByCarta[String(idcarta)].reduce(function(prev, indicador){
					if (indicador.valores && indicador.valores[anualidad]){
						prev += indicador.valores[anualidad].some(function(c){ return c && c.resultado; }) ? 1 : 0;
					}

					return prev;
				}, 0);

				return cumplimentados / $scope.formulasByCarta[String(idcarta)].length;
			};

			$scope.getPorcentajeIndicadoresCumplimentados = function(idjerarquia, anualidad){
				if (!$scope.indicadoresByIdJerarquia || typeof $scope.indicadoresByIdJerarquia[String(idjerarquia)] !== 'object' || $scope.indicadoresByIdJerarquia[String(idjerarquia)].length === 0){

					return 0;
				}
				const cumplimentados = $scope.indicadoresByIdJerarquia[String(idjerarquia)].reduce(function(prev, indicador){
					if (indicador.valores && indicador.valores[anualidad]){
						prev += indicador.valores[anualidad].some(function(c){ return c; }) ? 1 : 0;
					}

					return prev;
				}, 0);

				return cumplimentados / $scope.indicadoresByIdJerarquia[String(idjerarquia)].length;
			};

			$scope.getPorcentajeIndicadoresRecursivoCumplimentados = function(idjerarquia, anualidad){
				if (!$scope.indicadoresByIdJerarquiaRecursivo || typeof $scope.indicadoresByIdJerarquiaRecursivo[String(idjerarquia)] !== 'object' || $scope.indicadoresByIdJerarquiaRecursivo[String(idjerarquia)].length === 0){

					return 0;
				}
				const cumplimentados = $scope.indicadoresByIdJerarquiaRecursivo[String(idjerarquia)].reduce(function(prev, indicador){
					if (indicador.valores && indicador.valores[anualidad]){
						prev += indicador.valores[anualidad].some(function(c){ return c; }) ? 1 : 0;
					}

					return prev;
				}, 0);

				return cumplimentados / $scope.indicadoresByIdJerarquiaRecursivo[String(idjerarquia)].length;
			};

			function calculateState(formula){
				if (typeof formula.valores !== 'object'){

					return;
				}

				for (const anualidad in formula.valores){
					if (!Array.isArray(formula.valores[anualidad]) || !formula.valores[anualidad].length === 13){
						
						formula.valores[anualidad] = [];
						formula.valores[anualidad][12] = {'color': ''};
					} else {
						const resultado = formula.valores[anualidad][12].resultado;
						if (isNaN(resultado)){
							formula.valores[anualidad][12].color = '';
						} else {
							const intervalos = formula.intervalos;
							let color = '';
							for (let i = 0, j = intervalos.length; i < j; i += 1){
								const intervalo = intervalos[i];
								if (intervalo.min <= resultado && resultado < intervalo.max){
									color = intervalo.color.toUpperCase();
									break;
								}
							}
							formula.valores[anualidad][12].color = color;
						}
					}
				}
			}

			$scope.colores = COLORES_OBJETIVOS;
			$scope.getValoracionGlobalJerarquia = function(idjerarquia, anualidad){
				const ponderacion = 10 / ($scope.colores.length);
				let valor = 0;
				let counttotal = 0;
				$scope.colores.forEach(function(color, i){
					const ponderacioncolor = (i + 1) * ponderacion;
					const cantidad = $scope.coloresFormulasPorJerarquia[idjerarquia] &&
						$scope.coloresFormulasPorJerarquia[idjerarquia][anualidad] &&
						$scope.coloresFormulasPorJerarquia[idjerarquia][anualidad][color.value] ? $scope.coloresFormulasPorJerarquia[idjerarquia][anualidad][color.value] : 0;
				
					valor += cantidad * ponderacioncolor;
					counttotal += cantidad;
				});

				return counttotal ? valor / counttotal : null;
			};

			$scope.getValoracionGlobalCarta = function(cartaid, anualidad){
				const ponderacion = 10 / ($scope.colores.length);
				let valor = 0;
				let counttotal = 0;
				$scope.colores.forEach(function(color, i){
					const ponderacioncolor = (i + 1) * ponderacion;
					const cantidad = $scope.coloresFormulasPorCarta[cartaid] &&
						$scope.coloresFormulasPorCarta[cartaid][anualidad] &&
						$scope.coloresFormulasPorCarta[cartaid][anualidad][color.value] ? $scope.coloresFormulasPorCarta[cartaid][anualidad][color.value] : 0;
				
					valor += cantidad * ponderacioncolor;
					counttotal += cantidad;
				});

				return counttotal ? valor / counttotal : null;
			};

			function loadStatsCartas(){

				Indicador.query({'fields': 'idjerarquia valores'}, function(indicadores){

					$scope.indicadoresByIdJerarquia = indicadores.reduce(function(prev, indicador){
						if (typeof prev[String(indicador.idjerarquia)] === 'undefined'){
							prev[String(indicador.idjerarquia)] = [];
						}
						prev[String(indicador.idjerarquia)].push(indicador);

						return prev;
					}, {});

					$scope.jerarquiasByAncestro['1'].forEach(function(nodo){

						if (typeof $scope.indicadoresByIdJerarquiaRecursivo[String(nodo.id)] === 'undefined'){
							$scope.indicadoresByIdJerarquiaRecursivo[String(nodo.id)] = [];
						}
						for (const idjerarquia in $scope.indicadoresByIdJerarquia){
							if (idjerarquia === String(nodo.id) || nodo.descendientes.indexOf(parseInt(idjerarquia, 10)) >= 0){
								$scope.indicadoresByIdJerarquiaRecursivo[String(nodo.id)] = $scope.indicadoresByIdJerarquiaRecursivo[String(nodo.id)].concat($scope.indicadoresByIdJerarquia[idjerarquia]);
							}
						}
					});

				});
				$scope.coloresFormulasPorCarta = {};
				Objetivo.query({'fields': 'carta formulas.intervalos formulas.valores'}, function(objetivos){
					$scope.objetivosByJerarquia = {};
					$scope.formulasByCarta = {};
					$scope.formulasByJerarquia = {};
					$scope.coloresFormulasPorJerarquia = {};
					
					$scope.objetivosByCarta = objetivos.reduce(function(prev, objetivo){
						if (typeof prev[objetivo.carta] === 'undefined'){
							prev[objetivo.carta] = [];
						}
						prev[objetivo.carta].push(objetivo);
						if (typeof $scope.coloresFormulasPorCarta[objetivo.carta] === 'undefined'){
							$scope.coloresFormulasPorCarta[objetivo.carta] = {};
						}

						if (typeof $scope.formulasByCarta[objetivo.carta] === 'undefined'){
							$scope.formulasByCarta[objetivo.carta] = [];
						}
						objetivo.formulas.forEach(function(formula){
							calculateState(formula);
							$scope.formulasByCarta[objetivo.carta].push(formula);

							for (const anualidad in formula.valores){
								if (typeof $scope.coloresFormulasPorCarta[objetivo.carta][anualidad] === 'undefined'){
									$scope.coloresFormulasPorCarta[objetivo.carta][anualidad] = {};
								}
								const color = formula.valores[anualidad][12].color;
								if (color && color !== ''){
									if (typeof $scope.coloresFormulasPorCarta[objetivo.carta][anualidad][color] === 'undefined'){
										$scope.coloresFormulasPorCarta[objetivo.carta][anualidad][color] = 0;
									}
									$scope.coloresFormulasPorCarta[objetivo.carta][anualidad][color] += 1;
								}
							}
						});

						return prev;
					}, {});

					$scope.jerarquiasByAncestro['1'].forEach(function(nodo){
						if (typeof $scope.objetivosByJerarquia[String(nodo.id)] === 'undefined'){
							$scope.objetivosByJerarquia[String(nodo.id)] = [];
						}
						if (typeof $scope.formulasByJerarquia[String(nodo.id)] === 'undefined'){
							$scope.formulasByJerarquia[String(nodo.id)] = [];
						}

						if (typeof $scope.coloresFormulasPorJerarquia[String(nodo.id)] === 'undefined'){
							$scope.coloresFormulasPorJerarquia[String(nodo.id)] = [];
						}

						for (const cartaid in $scope.objetivosByCarta){
							const carta = $scope.cartasById[String(cartaid)];
							if (carta){
								const idjerarquia = carta.idjerarquia;
								if (String(idjerarquia) === String(nodo.id) || nodo.descendientes.indexOf(idjerarquia) >= 0){
									$scope.objetivosByJerarquia[String(nodo.id)] = $scope.objetivosByJerarquia[String(nodo.id)].concat($scope.objetivosByCarta[cartaid]);
								}

							}
						}

						for (const cartaid in $scope.formulasByCarta){
							const carta = $scope.cartasById[String(cartaid)];
							if (carta){
								const idjerarquia = carta.idjerarquia;
								if (String(idjerarquia) === String(nodo.id) || nodo.descendientes.indexOf(idjerarquia) >= 0){
									$scope.formulasByJerarquia[String(nodo.id)] = $scope.formulasByJerarquia[String(nodo.id)].concat($scope.formulasByCarta[cartaid]);
								}
							}
						}


						$scope.formulasByJerarquia[String(nodo.id)].forEach(function(formula){
							for (const anualidad in formula.valores){
								if (typeof $scope.coloresFormulasPorJerarquia[String(nodo.id)][anualidad] === 'undefined'){
									$scope.coloresFormulasPorJerarquia[String(nodo.id)][anualidad] = {};
								}
								const color = formula.valores[anualidad][12].color;
								if (color && color !== ''){
									if (typeof $scope.coloresFormulasPorJerarquia[String(nodo.id)][anualidad][color] === 'undefined'){
										$scope.coloresFormulasPorJerarquia[String(nodo.id)][anualidad][color] = 0;
									}
									$scope.coloresFormulasPorJerarquia[String(nodo.id)][anualidad][color] += 1;
								}
							}
						});

					});
				});
				PlanMejoraList.query({'idjerarquia': 1, 'recursivo': true, 'fields': 'idjerarquia carta numeroacciones anualidad'}, function(planesmejora){
					$scope.planesmejoraByCarta = planesmejora.reduce(function(prev, plan){
						if (typeof prev[plan.carta] === 'undefined'){
							prev[plan.carta] = {};
						}
						if (typeof prev[plan.carta][String(plan.anualidad)] === 'undefined'){
							prev[plan.carta][String(plan.anualidad)] = [];
						}
						prev[plan.carta][String(plan.anualidad)].push(plan);

						return prev;
					}, {});

					$scope.jerarquiasByAncestro['1'].forEach(function(nodo){

						if (typeof $scope.planesmejoraByJerarquia[String(nodo.id)] === 'undefined'){
							$scope.planesmejoraByJerarquia[String(nodo.id)] = {};
						}
						planesmejora.forEach(function(planmejora){
							
							if (planmejora.idjerarquia === String(nodo.id) || nodo.descendientes.indexOf(parseInt(planmejora.idjerarquia, 10)) >= 0){
								if (typeof $scope.planesmejoraByJerarquia[String(nodo.id)][planmejora.anualidad] === 'undefined'){
									$scope.planesmejoraByJerarquia[String(nodo.id)][planmejora.anualidad] = {'count': 1, 'numeroacciones': planmejora.numeroacciones};
								} else {
									$scope.planesmejoraByJerarquia[String(nodo.id)][planmejora.anualidad].numeroacciones += planmejora.numeroacciones;
									$scope.planesmejoraByJerarquia[String(nodo.id)][planmejora.anualidad].count += 1;
								}
							}
						});
					});
				});
			}


			$scope.invoke = function (cmd) {
				if ($scope.actualizando) {
					$rootScope.toaster('Espere a que termine la actualización previa', 'Error', 'error');

					return;
				}
				switch (cmd) {
					case 'descargarexcel':
						$scope.actualizando += 1;
						ExportarInforme.get({'year': $rootScope.anualidad}, function (token) {
							$scope.actualizando -= 1;
							if (typeof token === 'object'){
								$rootScope.cbDownload(token);
							} else {
								$rootScope.toaster('Error al descargar el informe', 'Error', 'error');
							}
						});
					break;
					case 'periodosStats':
						$scope.actualizando += 1;
						$scope.stats = PeriodosStats.query(function(){
							$scope.actualizando -= 1;
						});
					break;
					case 'cartasStats':

						$scope.objetivosByJerarquia = {};
						$scope.formulasByJerarquia = {};
						$scope.indicadoresByIdJerarquiaRecursivo = {};
						$scope.coloresFormulasPorJerarquia = {};
						$scope.planesmejoraByJerarquia = {};
						$scope.cartasByJerarquia = {};

						$scope.cartas = EntidadObjetoList.query({'tipoentidad': 'CS', 'idjerarquia': 1, 'recursivo': true}, function(cartas){
							$scope.cartasById = cartas.reduce(function(prev, carta){
								prev[carta._id] = carta;

								return prev;
							}, {});

							$scope.jerarquiasByAncestro['1'].forEach(function(nodo){
								if (typeof $scope.cartasByJerarquia[String(nodo.id)] === 'undefined'){
									$scope.cartasByJerarquia[String(nodo.id)] = [];
								}
								cartas.forEach(function(carta){
									const idjerarquia = carta.idjerarquia;
									if (String(idjerarquia) === String(nodo.id) || nodo.descendientes.indexOf(idjerarquia) >= 0){
										$scope.cartasByJerarquia[String(nodo.id)].push(carta);
									}
								});
							});


							loadStatsCartas();
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
				if (!$scope.stats){

					return null;
				}
				if (cached && cached._id && cached._id.idjerarquia === nodoid && cached._id.anualidad === anualidad){

					return cached;
				}
				for (let i = 0, j = $scope.stats.length; i < j; i += 1){
					if ($scope.stats[i]._id.idjerarquia === nodoid && $scope.stats[i]._id.anualidad === anualidad){

						return $scope.stats[i];
					}
				}

				return null;
			};
			$scope.getTotales = function(nodoid, anualidad, campo){
				const nodo = $scope.fnGetStatsNode(nodoid, anualidad);
				if (!nodo){ return ''; }
				if (!nodo.value[campo]){ return '0'; }

				return nodo.value[campo].reduce(function(prev, current){ return prev + current; }, 0);
			};
			$scope.mutextoculto = function(){ $scope.oculto = !$scope.oculto; };
			$scope.mostrarcolumnasocultas = function(){
				$scope.columnasocultas = !$scope.columnasocultas;
			};

			function toRGBA(colorcss, min, max){
				const components = [
					parseInt(colorcss.substring(1, 3), 16),
					parseInt(colorcss.substring(3, 5), 16),
					parseInt(colorcss.substring(5, 7), 16),
					(min / max).toFixed(2)
				];

				return 'rgba(' + components.join(', ') + ')';
			}

			$scope.getCellStyle = function(colorEnabled, colorbase, min, max){
				if (colorEnabled && typeof colorbase === 'string' && colorbase.length === 7 && typeof min !== 'undefined' && typeof max === 'number' && max !== 0){
					console.log('background-color:' + toRGBA(colorbase, min, max) + ' !important')
					return 'background-color:' + toRGBA(colorbase, min, max) + ' !important';
				}

				return '';
			};
		}
	]);
})(angular, $);
