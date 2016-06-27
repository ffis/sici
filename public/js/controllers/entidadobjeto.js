(function(angular){
	'use strict';
	angular.module('sici')
		.controller('EntidadObjetoCtrl', ['$rootScope', '$scope', '$routeParams', '$window', '$http', 'EntidadObjeto', 'ObjetivoStats', 'Jerarquia', 'Indicador', 'PlanMejoraList', 'AccionMejora',
			function ($rootScope, $scope, $routeParams, $window, $http, EntidadObjeto, ObjetivoStats, Jerarquia, Indicador, PlanMejoraList, AccionMejora) {
				$rootScope.nav = 'EntidadObjeto';
				$rootScope.setTitle('Entidad Objeto');
				$scope.entidades = false;
				$scope.filtro = '';
				$scope.objetivostats = ObjetivoStats.query();
				$scope.indicadores = {};

				$scope.getCount = function(_id){
					for (var i = 0, j = $scope.objetivostats.length; i < j; i++){
						if ($scope.objetivostats[i]._id === _id){
							return $scope.objetivostats[i].count;
						}
					}
					return 0;
				};
				$scope.anualidades = [];
				for (var anualidad = 2015, maxanualidad = new Date().getFullYear(); anualidad <= maxanualidad; anualidad++ ){
					$scope.anualidades.push({label: anualidad, value: 'a' + anualidad});
				}
				$scope.anualidad = $scope.anualidades[ $scope.anualidades.length - 1];
				$scope.getFormulasStats = function(_id){
					for (var i = 0, j = $scope.objetivostats.length; i < j; i++){
						if ($scope.objetivostats[i]._id === _id){
							var formsOK = 0, forms = 0;
							for (var k = 0, l = $scope.objetivostats[i].formulas.length; k < l; k++){
								for (var q = 0, w = $scope.objetivostats[i].formulas[k].length; q < w; q++ ){
									if ($scope.objetivostats[i].formulas[k][q] !== '[]'){
										formsOK++;
									}
									forms++;
								}
							}
							return formsOK + '/' + forms;
						}
					}
					return '0/0';
				};

				$scope.getIndicadoresStats = function(idjerarquia, anualidad){
					if (!idjerarquia || typeof $scope.indicadores[idjerarquia] === 'undefined'){ return '';}
					var indicadoresOK = 0;
					for (var i = 0, j = $scope.indicadores[idjerarquia].length; i < j; i++){
						if ($rootScope.isIndicadorCumplimentado($scope.indicadores[idjerarquia][i], anualidad)){
							indicadoresOK++;
						}
					}
					return indicadoresOK + '/' + $scope.indicadores[idjerarquia].length;
				};

				$scope.planesmejora = {};
				$scope.acciones = {};


				var h = function(anualidad, id){
					return function(objs){
						$scope.acciones[anualidad][id] = 0;
						var inc = function(os){
							$scope.acciones[anualidad][id] += os.length;
						};
						for (var i = 0, j = objs.length; i < j; i++){
							AccionMejora.query({plan: objs[i]._id}, inc);
						}
					};
				};
				$scope.getPlanes = function(entidadobjeto, anualidad){
					if (typeof $scope.planesmejora[anualidad] === 'undefined'){
						$scope.planesmejora[anualidad] = {};
					}
					if (typeof $scope.acciones[anualidad] === 'undefined'){
						$scope.acciones[anualidad] = {};
					}
					if (typeof $scope.acciones[anualidad][entidadobjeto._id] === 'undefined'){
						$scope.acciones[anualidad][entidadobjeto.idjerarquia] = [];
					}
					if (entidadobjeto.idjerarquia === 0){
						$scope.planesmejora[anualidad][ entidadobjeto._id] = [];
						$scope.acciones[anualidad][entidadobjeto._id] = 0;
					}
					if (typeof $scope.planesmejora[anualidad][ entidadobjeto._id] === 'undefined'){
						$scope.planesmejora[anualidad][ entidadobjeto._id] =
							entidadobjeto.idjerarquia > 0
							? PlanMejoraList.query({idjerarquia: entidadobjeto.idjerarquia, anualidad: anualidad }, h(anualidad, entidadobjeto._id))
							: [];
					} else {
						return $scope.planesmejora[anualidad][ entidadobjeto._id].length;
					}
					return '-';
				};

				$scope.load = function(){
					$scope.entidades = EntidadObjeto.query( function(){
						for (var i = 0, j = $scope.entidades.length; i < j; i++){
							$scope.cargaJerarquia($scope.entidades[i].idjerarquia);
						}
					});
				};
				$scope.cargaJerarquia = function(idjerarquia){
					if (!idjerarquia){ return; }
					if (parseInt(idjerarquia) <= 0 ){ return; }
					idjerarquia = parseInt(idjerarquia);
					if (typeof $scope.jerarquias['' + idjerarquia] === 'undefined'){
						$scope.jerarquias['' + idjerarquia] = Jerarquia.get({id: idjerarquia});
						$scope.indicadores[idjerarquia] = Indicador.query({idjerarquia: idjerarquia });
					}
				};
				$scope.load();

				$scope.actualizar = function(entidadobjeto, clave){
					if (clave === 'idjerarquia'){
						$scope.cargaJerarquia(entidadobjeto[clave]);
					}
					entidadobjeto[clave] = entidadobjeto[clave].trim();
					delete entidadobjeto.$editar;
					entidadobjeto.$update().then(function(){
						$scope.cambios = [];
						$rootScope.toaster('Carta de servicios actualizada');
					}, function(err){
						$rootScope.toaster('Carta de servicios fallida: ' + err.data.error, 'Error', 'error');
					});
				};
				$scope.jerarquias = {};
				$scope.download = function(entidadobjeto){
					$http.post('/api/v2/public/testDownloadCarta/' + entidadobjeto._id, {}).then(function(dato){
						$rootScope.toaster('Carta de servicios importada correctamente. Registrados ' + dato.data.objetivos.length + ' objetivos y ' + dato.data.indicadoresobtenidos.length + ' indicador/es.');
					}, function(err){
						if (err.data && err.data.error){
							$rootScope.toaster('Carta de servicios fallida: ' + err.data.error, 'Error', 'error');
						} else {
							$rootScope.toaster('Carta de servicios fallida', 'Error', 'error');
						}
					});
				};
				$scope.newCarta = function(){
					if ($window.confirm('¿Está seguro/a? La carta generada tomará valores por defecto y será editable en la tabla inferior')){
						var params = {};
						for (var campo in $scope.entidades[0]){
							params[campo] = $scope.entidades[0][campo];
						}
						params.tipoentidad = 'CS';
						params.eliminado = false;
						params.idjerarquia = 1;
						params.codigo = $scope.entidades.length + 1;
						params.denominacion = 'Nueva carta de servicios';
						params.url = 'http://';
						params.fechaalta = new Date();
						delete params._id;

						//var nueva = new EntidadObjeto(params);
						EntidadObjeto.save(params).$promise.then(function(){
							$rootScope.toaster('Carta de servicios creada');
							$scope.load();
						}, function(err){
							if (err.data && err.data.error){
								$rootScope.toaster('Carta de servicios fallida: ' + err.data.error, 'Error', 'error');
							} else {
								$rootScope.toaster('Carta de servicios fallida', 'Error', 'error');
							}
						});
					}
				};
				$scope.dropCarta = function(entidadobjeto){
					if ($window.confirm('¿Está seguro/a? Esta operación es irreversible')){
						if ($window.confirm('PERMÍTEME QUE INSISTA. Esta operación es irreversible.')){
							$http.post('/api/v2/public/dropCarta/' + entidadobjeto._id, {}).then(function(){
								$rootScope.toaster('Carta de servicios reseteada correctamente');
							}, function(err){
								if (err.data && err.data.error){
									$rootScope.toaster('Carta de servicios fallida: ' + err.data.error, 'Error', 'error');
								} else {
									$rootScope.toaster('Carta de servicios fallida', 'Error', 'error');
								}
							});
						}
					}
				};
			}
		]);
})(angular);
