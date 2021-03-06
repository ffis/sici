(function (angular, d3) {
	'use strict';

	angular.module('sici').controller('ObjetivoCtrl', ['$rootScope', '$scope', '$routeParams', '$window', 'Objetivo', 'Indicador', 'EntidadObjeto', 'Util', 'ProcedimientoList', 'COLORES_OBJETIVOS', '$log', '$location',
		function ($rootScope, $scope, $routeParams, $window, Objetivo, Indicador, EntidadObjeto, Util, ProcedimientoList, COLORES_OBJETIVOS, $log, $location) {
			$rootScope.nav = 'objetivo';
			$rootScope.setTitle('Objetivos');
			$scope.procedimientosById = {};
			$scope.indicadores = [];

			$scope.colores = COLORES_OBJETIVOS;
			$scope.camposProcedimientos = ['total_resueltos', 'solicitados', 'iniciados'];
			$scope.campoNuevoProcedimiento = $scope.camposProcedimientos[0];
			$scope.procedimientos = ProcedimientoList.query({'idjerarquia': 1, 'fields': ['codigo', 'denominacion'].join(' ')});
			$scope.procedimientos.$promise.then(function(procedimientos){
				for (let i = 0, j = procedimientos.length; i < j; i += 1){
					$scope.procedimientosById[procedimientos[i]._id] = procedimientos[i];
				}
			});
			$scope.idobjetivo = ($routeParams.idobjetivo) ? $routeParams.idobjetivo : false;
			$scope.objetivo = Objetivo.get({'id': $scope.idobjetivo}, function () {
				$scope.carta = EntidadObjeto.get({id: $scope.objetivo.carta}, function () {
					$scope.indicadoresNodo = Indicador.query({'idjerarquia': $scope.carta.idjerarquia});
				});
				for (let k = 0, l = $scope.objetivo.formulas.length; k < l; k += 1) {
					for (let i = 0, j = $scope.objetivo.formulas[k].indicadores.length; i < j; i += 1) {
						let indicador = $scope.objetivo.formulas[k].indicadores[i];
						if (typeof $scope.objetivo.formulas[k].indicadores[indicador] === 'undefined') {
							$scope.indicadores[indicador] = Indicador.get({id: indicador});
						}
					}
				}
			});
			$scope.nuevoProcedimiento = '';
			$scope.vincularProcedimiento = function(formula, nuevoProcedimiento, campoNuevoProcedimiento){
				if (typeof nuevoProcedimiento !== 'object'){
					$log.error(nuevoProcedimiento, ' no es un objeto');

					return;
				}

				if (typeof formula.procedimientos === 'undefined'){
					formula.procedimientos = [];
				}
				for (let i = 0, j = formula.procedimientos.length; i < j; i++){
					if (formula.procedimientos[i].procedimiento === nuevoProcedimiento._id && formula.procedimientos[i].campo === campoNuevoProcedimiento){
						$rootScope.toaster('No se puede añadir dos veces el mismo procedimiento con el mismo campo');
						$log.error('No se puede añadir dos veces el mismo procedimiento');

						return;
					}
				}
				formula.procedimientos.push({
					'procedimiento': nuevoProcedimiento._id,
					'campo': campoNuevoProcedimiento
				});
				$scope.nuevoProcedimiento = '';
			};

			$scope.desvincularProcedimiento = function (indexFormula, procedimientoid) {
				if ($window.confirm('¿Está seguro de desvincular el indicador?')) {
					$scope.objetivo.formulas[indexFormula].procedimientos.splice(procedimientoid, 1);
				}
			};

			$scope.crearNuevoIntervalo = function (formula) {
				if (typeof formula.intervalos === 'undefined') {
					formula.intervalos = [];
				}
				formula.intervalos.push({});
			};

			$scope.borrarIntervalo = function (formula, intervalo) {
				formula.intervalos.splice(intervalo, 1);
			};

			$scope.desvincular = function (indexFormula, indicadorid) {
				if ($window.confirm('¿Está seguro de desvincular el indicador?')) {
					$scope.objetivo.formulas[indexFormula].indicadores.splice(indicadorid, 1);
				}
			};

			$scope.actualizar = function () {
				$scope.objetivo.$update(function () {
					$rootScope.toaster('Objetivo actualizado correctamente', 'Éxito');
				}, function(err){
					$rootScope.toaster(err, 'Error', 'warning');
				});
			};

			$scope.newFormula = function(){
				const o = new Objetivo();
				o._id = $scope.objetivo._id;
				o.newFormula = 'newFormula';
				o.$update(function(){
					$window.location.href = '/objetivo/' + $scope.objetivo._id;
				});
			};

			$scope.vincularIndicador = function (formula, nuevo) {
				if (formula.indicadores.indexOf(nuevo._id) !== -1) {
					$rootScope.toaster('Ya existe ese indicador en la fórmula', 'Aviso', 'warning');
					return;
				}
				$scope.indicadores[nuevo._id] = nuevo;
				formula.indicadores.push(nuevo._id);
			};

			$scope.subirOrden = Util.subirOrden;
			$scope.bajarOrden = Util.bajarOrden;

			$scope.copyToClipboard = function (text) {
				$scope.clipboard = '/indicador/' + text + '/valores/[anualidad]/[mes]';
				$window.clipboardData.setData('indicador', text);
			};

			$scope.pasteFromClipboard = function (formula) {
				if (typeof $scope.clipboard !== 'undefined') {
					formula.computer += $scope.clipboard;
				}
			};

			$scope.insertarIndicador = function (formula, text) {
				formula.computer += '/indicador/' + text + '/valores/[anualidad]/[mes]';
			};

			const colorsOfIndicador = {};
			let lastColor = 0;
			const colors = d3.scale.category10();
			$scope.getColorIndicador = function(id, nocreate){
				if (typeof colorsOfIndicador[id] !== 'undefined'){
					return colorsOfIndicador[id];
				}

				if (nocreate){
					if (id.indexOf('/') >= 0){
						const parts = id.split('/');

						if (parts.length > 2){
							return $scope.getColorIndicador(parts[2], true);
						}
					}

					return '';
				}

				colorsOfIndicador[id] = colors(lastColor);
				lastColor = (lastColor + 1) % 10;

				return colorsOfIndicador[id];
			};
		}
	]);
})(angular, d3);
