(function(angular){
	'use strict';
	angular.module('sici')
		.controller('CartaInformeCtrl',
			['EntidadObjeto', 'Objetivo', 'Indicador', '$scope', '$routeParams', '$rootScope', 'Jerarquia', 'InformeCarta', 'Arbol', '$http', '$window', '$log', 'PlanMejoraList', 'PlanMejora', 'AccionMejora', 'PersonasByRegexp', 'PersonaPrivate',
			function(EntidadObjeto, Objetivo, Indicador, $scope, $routeParams, $rootScope, Jerarquia, InformeCarta, Arbol, $http, $window, $log, PlanMejoraList, PlanMejora, AccionMejora, PersonasByRegexp, Persona){
				$scope.indicadores = {};
				$scope.jerarquias = {};
				$scope.seleccionado = {};
				$scope.persona = {};
				$scope.usuarioseleccionado = '';
				$scope.cachepersonas = {};
				$scope.personasById = {};
				$scope.acciones = [];
				$scope.cachePerson = function(persona){
					if (persona){
						$scope.personasById[persona._id] = persona;
					}
				};

				var loadJerarquia = function(idjerarquia){
					if (typeof $scope.jerarquias[idjerarquia] === 'undefined'){
						$scope.jerarquias[idjerarquia] = Jerarquia.get({'id': idjerarquia});
					}
				};
				$scope.cartaservicio = EntidadObjeto.get({'id': $routeParams.idcarta}, function(){
					$rootScope.setTitle($scope.cartaservicio.denominacion);

					$scope.jerarquia = Jerarquia.get({'id': $scope.cartaservicio.idjerarquia}, function(){
						$scope.jerarquias[$scope.cartaservicio.idjerarquia] = $scope.jerarquia;
						$scope.jerarquia.ancestros.forEach(loadJerarquia);
					});
				});
				$scope.arbol = Arbol.query();
				$scope.newAccion = function(){
					$scope.accion = {
						'eliminado': false,
						'numero': $scope.acciones.length + 1,
						'promotor': false,
						'responsable': false,
						'afectables': {},
						'equipo': [],
						'afecta': false,
						'organica': $routeParams.idjerarquia,
						'procedimientos': '',
						'gruposinteres': '',
						'fortalezas': '',
						'areasmejora': '',
						'contexto': '',
						'alternativas': '',
						'resultadoesperado': '',
						'restricciones': {},
						'rrhhdia': '',
						'presupuesto': '',
						'fechainicio': '',
						'plazo': '',
						'plan': $scope.planmejora._id
					};

					$scope.persona = {};
					Jerarquia.get({'id': 1}, function(dato){
						$scope.seleccionado = dato;
					});
				};
				$scope.filtro = function(){
					return true;
				};
				$scope.guardar = function(){
					if (typeof $scope.accion._id === 'undefined'){
						AccionMejora.save($scope.accion).$promise.then(function(){
							$scope.loadAcciones();
							Reflect.deleteProperty($scope, 'accion');
						}, function(e){
							if (typeof e.data !== 'undefined' && typeof e.data.error !== 'undefined'){
								$rootScope.toaster('Error durante la carga: ' + e.data.error, 'Error', 'error');
							} else {
								$rootScope.toaster('Error durante la carga', 'Error', 'error');
							}
						});
					} else {
						AccionMejora.update($scope.accion).$promise.then(function(){
							$scope.loadAcciones();
							Reflect.deleteProperty($scope, 'accion');
						}, function(e){
							if (typeof e.data !== 'undefined' && typeof e.data.error !== 'undefined'){
								$rootScope.toaster('Error durante la carga: ' + e.data.error, 'Error', 'error');
							} else {
								$rootScope.toaster('Error durante la carga', 'Error', 'error');
							}
						});
					}
				};
				$scope.cancelar = function(){
					if ($window.confirm('¿Está seguro/a? Si continúa perderá los cambios realizados sobre esta acción de mejora')){
						Reflect.deleteProperty($scope, 'accion');
					}
				};
				$scope.setOrganicaCompleta = function(){
					$scope.setseleccionado({
						'id': 1,
						'title': 'COMUNIDAD AUTONOMA DE MURCIA'
					});
				};

				function reloadAll(anualidad){
					$scope.planmejora = new PlanMejora();
					$scope.planesmejora = PlanMejoraList.query({'idjerarquia': parseInt($routeParams.idjerarquia, 10), 'anualidad': anualidad});
					$scope.planesmejora.$promise.then(function(planesmejora){
						if (planesmejora.length === 0){
							$scope.planmejora.anualidad = anualidad;
							$scope.planmejora.idjerarquia = parseInt($routeParams.idjerarquia, 10);
							$scope.planmejora.carta = ($routeParams.idcarta);
							PlanMejora.save($scope.planmejora, function(a) {
								if (a){
									$scope.planmejora = new PlanMejora(a);
								}
							});
						} else {
							$scope.planmejora = new PlanMejora(planesmejora[0]);
							$scope.loadAcciones();
						}
					});
				}

				const listener = $rootScope.$watch('anualidad', function(){
					reloadAll($rootScope.getIntAnualidad());
				});

				reloadAll($rootScope.getIntAnualidad());

				$scope.$on('$destroy', function() {
					listener();
				});

				$scope.loadAcciones = function(){
					if (typeof $scope.planmejora._id === 'string'){
						$scope.acciones = AccionMejora.query({'plan': $scope.planmejora._id});
						$scope.acciones.$promise.then(function(){
							$scope.acciones.forEach(function(accion){
								if (accion.promotor && accion.promotor !== ''){
									Persona.get({'id': accion.promotor}).$promise.then($scope.cachePerson);
								}
								if (accion.responsable && accion.responsable !== ''){
									Persona.get({'id': accion.responsable}).$promise.then($scope.cachePerson);
								}
								if (typeof accion.equipo && accion.equipo.length > 0){
									accion.equipo.forEach(function(iniciales){
										Persona.get({'id': iniciales}).$promise.then($scope.cachePerson);
									});
								}
							});
						});
					}
				};
				$scope.actualizarPlan = function(){
					PlanMejora.update($scope.planmejora, function(){
						$rootScope.toaster('Actualización realizada');
					});
				};
				$scope.setseleccionado = function(nodo){
					$scope.organicamostrada = false;
					$scope.accion.organica = nodo.id;
					if (typeof nodo.title !== 'undefined'){
						$scope.seleccionado = {'nombrelargo': nodo.title};
						Jerarquia.get({'id': nodo.id}, function(dato){
							$scope.seleccionado = dato;
						});
					} else {
						$scope.seleccionado = nodo;
					}
				};
				$scope.organicamostrada = false;
				$scope.mostrarOrganica = function(){
					$scope.organicamostrada = true;
				};
				$scope.addPersonaEquipo = function(persona){
					if (!persona || typeof persona !== 'object'){
						return;
					}
					if ($scope.accion.equipo.indexOf(persona._id) < 0){
						$scope.accion.equipo.push(persona._id);
					}
					$scope.usuarioseleccionado = '';
				};
				$scope.removePersonaEquipo = function(personaid){
					$scope.accion.equipo.splice($scope.accion.equipo.indexOf(personaid), 1);
				};
				$scope.editar = function(accion){
					var clon = JSON.parse(JSON.stringify(accion));
					$scope.accion = clon;
					$scope.usuarioseleccionado = '';
					Jerarquia.get({'id': accion.organica}, function(dato){
						$scope.setseleccionado(dato);
					});
				};
				$scope.eliminarAccion = function(accion){
					if ($window.confirm('¿Está seguro? Esta operación no es reversible.')){
						accion.$delete($scope.loadAcciones);
					}
				};
				$scope.setResponsable = function(persona){
					if (persona._id){
						$scope.accion.responsable = persona._id;
					}
				};
				$scope.removeResponsable = function(){
					Reflect.deleteProperty($scope.accion, 'responsable');
				};
				$scope.setPromotor = function(persona){
					if (persona._id){
						$scope.accion.promotor = persona._id;
					}
				};
				$scope.removePromotor = function(){
					Reflect.deleteProperty($scope.accion, 'promotor');
				};

				$scope.restricciones = [
					'Presupuestos',
					'Personal',
					'Tecnología: Software',
					'Tecnología: Equipos',
					'Medios materiales',
					'Mod legislación',
					'Organizativas'
				];
				$scope.plazos = [
					'1 semana',
					'15 días',
					'1 mes',
					'2 meses',
					'3 meses',
					'4 meses',
					'5 meses',
					'6 meses',
					'8 meses',
					'Más de 8 meses'
				];
				$scope.afectables = [
					'Incremento Capacidad de Respuesta Mejora de la atención, seguridad, empatia facilidades',
					'Acortamiento de Plazos (Disminuye tiempo de atención o Resolución de asuntos)',
					'Mejora de la Responsabilidad y garantías de cumplimiento',
					'Nuevos compromisos o reformulación de los existentes',
					'Nuevos compromisos, Nuevos indicadores (más claros y concisos)',
					'Nuevos procesos',
					'Mejora de la eficacia - Mejora de procesos o procedimientos',
					'Simplificación',
					'Informatización y e-Administración',
					'Eficiencia en mayor ahorro de costes, incremento de productividad o racionalización',
					'Buenas practicas: Definir la buena práctica',
					'Para solucionar cuestiones planteadas en quejas o sugerencias'
				];
				$scope.restricciones.sort();
				$scope.afectables.sort();
				$scope.downloadDocx = function(){
					$scope.descargando = true;
					$http.get('/api/v2/public/informeCarta/' + $scope.cartaservicio._id + '/' + $rootScope.getIntAnualidad()).then(function(res){
						$scope.descargando = false;
						if (typeof res.data === 'object'){
							$rootScope.cbDownload(res.data);
						} else {
							$rootScope.toaster('Error al descargar el informe', 'Error', 'error');
						}
					}, function(){
						$scope.descargando = false;
						$rootScope.toaster('Error al descargar el informe', 'Error', 'error');
					});
				};

				$scope.showPersona = function (persona){

					return (persona && persona.login && persona.codplaza && persona.nombre && persona.apellidos) ?
						(persona.login + '-' + persona.codplaza + '-' + persona.nombre + ' ' + persona.apellidos) : '';
				};
				$scope.getPersonas = function(busqueda){

					if (typeof $scope.cachepersonas === 'undefined'){
						$scope.cachepersonas = [];
					}

					if (busqueda === null){
						return '';
					}

					if (typeof $scope.cachepersonas[busqueda] === 'object') {

						return $scope.cachepersonas[busqueda];
					}

					return PersonasByRegexp.query({'regex': busqueda}, function(p){
						if (p && Array.isArray(p) && p.length > 0) {
							$scope.cachepersonas[busqueda] = p;
							p.forEach($scope.cachePerson);
						}
					}).$promise;

				};
			}]
		);
})(angular);