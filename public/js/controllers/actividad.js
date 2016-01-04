(function(angular, $){
	'use strict';
	angular.module('sici')
		.controller('ActividadCtrl',
			['$q', '$rootScope', '$scope', '$location', '$window', '$routeParams', '$timeout', '$log', 'Arbol', 'ProcedimientoList', 'DetalleCarmProcedimiento', 'DetalleCarmProcedimiento2', 'PersonasByPuesto', 'Etiqueta', 'ExportarResultadosJerarquia',
		function ($q, $rootScope, $scope, $location, $window, $routeParams, $timeout, $log, Arbol, ProcedimientoList, DetalleCarmProcedimiento, DetalleCarmProcedimiento2, PersonasByPuesto, Etiqueta, ExportarResultadosJerarquia) {
			$rootScope.nav = 'actividad';
			$rootScope.setTitle('Actividad');
			$scope.idjerarquia = ($routeParams.idjerarquia) ? parseInt( $routeParams.idjerarquia ) : false;
			$scope.arbol = Arbol.query(function(){ $scope.setJerarquiaById($scope.idjerarquia); });

			$scope.camposfiltros = ['cod_plaza'];
			$scope.filtros = {};
			$scope.filtro = {};
			$scope.camporesponsable = 'Nombre responsable';
			$scope.responsables = {};
			$scope.procedimientosocultos = false;
			$scope.meses = $rootScope.meses;
			$scope.reverse = false;
			$scope.itemsPerPage = 20;
			$scope.currentPage = 0;

			var fecha = new Date();
			$scope.anualidad = 'a' + fecha.getFullYear();
			$scope.mesanterior = fecha.getMonth() - 1;
			if ($scope.mesanterior < 0){
				$scope.mesanterior = 11;
			}

			$scope.anyos = [];
			for (var anyo = 2013, maxanyo = fecha.getFullYear; anyo <= maxanyo; anyo++){
				$scope.anyos.push( { code: 'a' + anyo, name: '' + anyo });
			}

			$scope.etiquetas = Etiqueta.query(function(){
				$scope.etiquetasPorTipo	= {};
				$scope.etiquetas.forEach(function(etiqueta){
					if (typeof $scope.etiquetasPorTipo[etiqueta.familia] === 'undefined')
					{
						$scope.etiquetasPorTipo[etiqueta.familia] = [];
					}
					$scope.etiquetasPorTipo[etiqueta.familia].push(etiqueta);
				});
			});


			var camposProcedimientos = [
				'codigo', 'denominacion', 'cod_plaza',
				'ancestros.id', 'ancestros.nombrelargo',
				'periodos.' + $scope.anualidad + '.totalsolicitudes',
				'periodos.' + $scope.anualidad + '.solicitados'
			];

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
					if (setJ( $scope.arbol[idx], idj)){
						break;
					}
				}
			};

			if ($scope.idjerarquia){
				$timeout(function() { $scope.setJerarquiaById($scope.idjerarquia); }, 100);
			}

			$scope.oculto = false;
			$scope.procedimientos = [];

			var defjerarquia = $q.defer();
			$scope.pjerarquia = defjerarquia.promise;
			$rootScope.jerarquialectura().then(function(j){
				$rootScope.jerarquiaescritura().then(function(j2){
					$scope.jerarquia = j.concat(j2);
					defjerarquia.resolve($scope.jerarquia);
				});
			});

			/*$scope.filtrojerarquia*/
			$scope.fj = function(item) {
				if ($scope.jerarquia.indexOf(item.id) !== -1 ){ return true; }
				if (item.nodes){
					for(var i = 0; i < item.nodes.length; i++){
						if ($scope.filtrojerarquia(item.nodes[i])){
							return true;
						}
					}
				}
				return false;
			};

			$scope.filtrojerarquia = function(item) {
				var def = $q.defer();
				$scope.pjerarquia.then( function(){
					def.resolve($scope.fj(item));
					$scope.filtrojerarquia = $scope.fj;
				}, function(err){ def.reject(err); });
				return def.promise;
			};

			$scope.filtrosocultos = false;
			$scope.setSeleccionado = function(selection){
				if (selection) {
					$scope.seleccionado = selection;
					$rootScope.setTitle(selection.title);
					$scope.procedimientos = ProcedimientoList.query({idjerarquia: selection.id, fields: camposProcedimientos.join(' ')});
					$scope.cumplimentados = 0;
					$scope.count = 1;
					$timeout(function(){
						$('body').animate({scrollTop: $('#detallesjerarquia').offset().top }, 'slow');
					}, 20);
				}
			};

			$scope.colorText = $rootScope.colorText;

			$scope.cumplimentado = function(procedimiento){
				return (typeof procedimiento.periodos[$scope.anualidad].solicitados === 'object' && Math.max.apply(Math, procedimiento.periodos[$scope.anualidad].solicitados) > 0);
			};
			$scope.isFiltroSelected = function(filtro, key, fa){
				return (typeof filtro[key] !== 'undefined' && fa.name === filtro[key]);
			};
			$scope.sparkline = function(){
				$timeout( function(){
					$('.sparkline').each( function(){
						var obj = $(this).data('value');
						var t;
						try{
							t = JSON.parse( obj );
							$(this).sparkline( t, {type: 'bar', barColor: '#a94442'});
						}catch(e){
							/*$log.error('sparkline mal formed VALUE WAS:' + t , obj);*/
							$(this).sparkline( [0,0,0,0,0,0,0,0,0,0,0,0], {type: 'bar', barColor: '#a94442'});
						}
					});
				}, 5);
			};

			$scope.filtrotxtprocedimiento = {};
			$scope.$watch('filtrotxtprocedimiento.$', function(){ $scope.sparkline(); });
			$scope.$watch('procedimientosocultos', function(){ $scope.sparkline(); });

			$scope.procedimientosfiltrados = [];
			$scope.$watch('filtro', function(){
				var result = [];
				$scope.procedimientos.forEach(function(p){
					var ok = true;
					for(var campofiltro in $scope.filtro){
						if ($scope.filtro[campofiltro] !== 'TODOS' && p[campofiltro] !== $scope.filtro[campofiltro]){
							ok = false; break;
						}
					}
					if (ok){
						result.push(p);
					}
				});
				$scope.procedimientosfiltrados = result;

				$scope.sparkline();
				$scope.procedimientosocultos = false;
			}, true);


			$scope.cumplimentados = 0;
			$scope.count = 1;
			$scope.$watch('procedimientos.$resolved', function() {

				$scope.procedimientosfiltrados = $scope.procedimientos;
				if ($scope.procedimientos.length > 0)
				{
					$scope.currentPage = 0;
					$scope.responsables = {};
					$scope.filtros = {};
					$scope.filtro = {};
					$scope.cumplimentados = 0;
					$scope.count = $scope.procedimientos.length;
					$scope.procedimientos.forEach(function(p){
						var cumplimentado = $scope.cumplimentado(p);
						if (cumplimentado) {
							$scope.cumplimentados++;
						}
						for(var idxfiltro in $scope.camposfiltros){
							var campo = $scope.camposfiltros[idxfiltro], value = p[campo], name = p[campo], count = 1;
							if (typeof $scope.filtros[campo] === 'undefined'){
								$scope.filtros[campo] = {};
							}
							if (typeof $scope.filtros[campo][value] === 'undefined')
							{
								$scope.filtros[campo][value] = { name: name, value: value, count: count, cumplimentados: cumplimentado ? 1 : 0};
							}else{
								$scope.filtros[campo][value].count = $scope.filtros[campo][value].count + 1;
								if (cumplimentado){
									$scope.filtros[campo][value].cumplimentados = $scope.filtros[campo][value].cumplimentados + 1;
								}
							}
							$scope.filtros[campo][value].name = $scope.filtros[campo][value].value + ' (' + ($scope.filtros[campo][value].cumplimentados) + '/' + ($scope.filtros[campo][value].count) + ')';
						}
					});

					for(var i in $scope.camposfiltros){
						var campofiltro = $scope.camposfiltros[i];
						if (Object.keys($scope.filtros[campofiltro]).length > 1)
						{
							$scope.filtros[campofiltro].TODOS = { name: 'TODOS', value: 'TODOS', count: 0};
							$scope.filtro[campofiltro] = 'TODOS';
						}else{
							for(var a in $scope.filtros[campofiltro])
								$scope.filtro[campofiltro] = $scope.filtros[campofiltro][a].value;
						}
					}

					if (Object.keys($scope.responsables).length > 1)
					{
						$scope.responsables.TODOS = { name: 'TODOS', value: 'TODOS', count: 0};
						$scope.responsable = $scope.responsables.TODOS;
					}else{
						for(var only in $scope.responsables)
							$scope.responsable = $scope.responsables[only];
					}
					$scope.sparkline();
				}
			});

			$scope.range = function() {
				var rangeSize = 5;
				var ps = [];
				var start;
				start = $scope.currentPage;
				if ( start > $scope.pageCount() - rangeSize ) {
					start = $scope.pageCount() - rangeSize + 1;
				}
				if (start > 1){ rangeSize--; ps.push(start - 2); }
				if (start > 0){ rangeSize--; ps.push(start - 1); }
				for (var i = start; i < start + rangeSize; i++) {
					if (i >= 0){
						ps.push(i);
					}
				}
				return ps;
			};

			$scope.prevPage = function() {
				if ($scope.currentPage > 0) {
					$scope.currentPage--;
					$scope.sparkline();
				}
			};
			$scope.DisablePrevPage = function() {
				return $scope.currentPage === 0 ? 'disabled' : '';
			};
			$scope.DisableNextPage = function() {
				return $scope.currentPage === $scope.pageCount() ? 'disabled' : '';
			};

			$scope.pageCount = function() {
				return Math.ceil($scope.procedimientosfiltrados.length / $scope.itemsPerPage) - 1;
			};
			$scope.nextPage = function() {
				if ($scope.currentPage < $scope.pageCount()) {
					$scope.currentPage++;
					$scope.sparkline();
				}
			};
			$scope.setPage = function(n) {
				$scope.currentPage = n;
				$scope.sparkline();
			};

			$scope.anyoSelected = '';
			$scope.actualizando = 0;

			$scope.updateAnyoSelected = function(code) {
				$scope.anyoSelected = code;
			};

			$scope.descargarExcel = function () {
				if (typeof $scope.seleccionado === 'undefined') {
					$scope.respuesta = {
						clase: 'alert-warning',
						mensaje: 'Debe seleccionar un nodo.'
					};
					return;
				}
				$scope.actualizando = 1;
				ExportarResultadosJerarquia.get({jerarquia: $scope.seleccionado.id}, function (token) {
					$scope.actualizando = 0;
					if (token){
						$scope.respuesta = {
							clase: 'alert-success',
							mensaje: 'Ha funcionado correctamente.'
						};
						var url = '/download/' + token.time + '/' + token.hash;
						$window.location = url;
					}else{
						$scope.respuesta = {
							clase: 'alert-warning',
							mensaje: 'Error al descargar el informe.'
						};
					}
				}, function () {
					$scope.actualizando = 0;
					$scope.respuesta = {
						clase: 'alert-warning',
						mensaje: 'Error al descargar el informe.'
					};
				});
			};
		}
	]);
})(angular, $);
