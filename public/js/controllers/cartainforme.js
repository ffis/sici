(function(angular, saveAs){
	'use strict';
	angular.module('sici')
		.controller('CartaInformeCtrl',
			['EntidadObjeto', 'Objetivo', 'Indicador', '$scope', '$routeParams', '$rootScope', 'Jerarquia', 'InformeCarta', 'Arbol', '$http', '$window', '$log', 'PlanMejoraList',
			function(EntidadObjeto, Objetivo, Indicador, $scope, $routeParams, $rootScope, Jerarquia, InformeCarta, Arbol, $http, $window, $log, PlanMejoraList){
				$scope.indicadores = {};
				$scope.jerarquias = {};
				$scope.anualidad = parseInt($routeParams.anualidad);
				var loadJerarquia = function(idjerarquia){
					if (typeof $scope.jerarquias[idjerarquia] === 'undefined'){
						$scope.jerarquias[idjerarquia] = Jerarquia.get({id: idjerarquia});
					}
				};
				$scope.cartaservicio = EntidadObjeto.get({'id': $routeParams.idcarta}, function(){
					$rootScope.setTitle($scope.cartaservicio.denominacion);

					$scope.jerarquia = Jerarquia.get({id: $scope.cartaservicio.idjerarquia}, function(){
						$scope.jerarquias[$scope.cartaservicio.idjerarquia] = $scope.jerarquia;
						$scope.jerarquia.ancestros.forEach(loadJerarquia);
					});
				});
				$scope.arbol = Arbol.query();
				$scope.newAccion = function(){
					$scope.accion = {};
					$scope.persona = {};
					Jerarquia.get({id: 1}, function(dato){
						$scope.seleccionado = dato;
					});
				};
				$scope.filtro = function(){
					return true;
				};
				$scope.guardar = function(){
					$scope.acciones.push($scope.accion);
					delete $scope.accion;
				};
				$scope.cancelar = function(){
					if ($window.confirm('¿Está seguro/a? Si continúa perderá los cambios realizados sobre esta acción de mejora')){
						delete $scope.accion;
					}
				};
				$scope.setOrganicaCompleta = function(){
					$scope.setseleccionado({
						id: 1,
						title: 'COMUNIDAD AUTONOMA DE MURCIA'
					});
				};
				$scope.seleccionado = {

				};
				$scope.planesmejora = PlanMejoraList.query({idjerarquia: parseInt($routeParams.idjerarquia), anualidad: $scope.anualidad });
				$scope.setseleccionado = function(nodo){
					$scope.organicamostrada = false;
					$scope.accion.organica = nodo.id;
					if (typeof nodo.title !== 'undefined'){
						$scope.seleccionado = { nombrelargo: nodo.title };
						Jerarquia.get({id: nodo.id}, function(dato){
							$scope.seleccionado = dato;
						});
					} else {
						$scope.seleccionado = nodo;
					}
				};
				$scope.planmejora = {};
				$scope.acciones = [{
					_id: 1,
					numero: 1,
					descripcion: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur ac congue ex. Donec tempor erat commodo auctor aliquam. Sed pretium elit ac dolor congue, porttitor bibendum mi semper. Vestibulum diam urna, congue ac ornare nec, tempus at tortor. Cras suscipit, leo a pulvinar efficitur, tortor augue posuere ante, eu ornare diam neque non risus. Morbi vitae elit felis. Sed a dapibus libero. Ut fermentum a lacus ac sagittis. Duis scelerisque lorem erat. Morbi quis sem at turpis efficitur tempor eu sed urna. Proin lacinia neque a nunc hendrerit laoreet. In tincidunt tincidunt ipsum, non placerat velit pretium et. Vivamus ultricies, tortor ac ornare consequat, eros ipsum convallis mauris, a sollicitudin velit mi semper metus. Quisque convallis accumsan vestibulum. Aenean malesuada dignissim lacus sed sagittis. Nulla rutrum tortor quis arcu pulvinar, ut mollis lorem aliquam.Sed quis imperdiet lectus. Fusce cursus elit ac nisl eleifend, sed placerat ligula varius. Donec sit amet justo sed turpis volutpat egestas non eget diam. Pellentesque dictum vel libero quis fringilla. Morbi mollis nisi non eleifend consequat. Aliquam eu aliquam lectus, nec ullamcorper sapien. Suspendisse malesuada nisl sed egestas efficitur. Etiam vel placerat magna. Etiam nec tincidunt purus, quis ultrices neque. Integer ultrices augue nec elementum maximus. Nunc condimentum eros libero, a pellentesque dui aliquam et. Morbi eu tristique dolor. Suspendisse et justo ante.',
					eliminado: false,
					equipo: [
					],
					organica: $routeParams.idjerarquia,
					afecta: false,
					restricciones: {}
				}];
				$scope.organicamostrada = false;
				$scope.mostrarOrganica = function(){
					$scope.organicamostrada = true;
				};
				$scope.addPersonaEquipo = function(persona){
					$scope.accion.equipo.push(persona);
					$scope.persona = {};
				};
				$scope.editar = function(accion){
					var clon = JSON.parse(JSON.stringify(accion));
					$scope.accion = clon;
					$scope.persona = {};
					Jerarquia.get({id: accion.organica}, function(dato){
						$scope.setseleccionado(dato);
					});
				};
				$scope.restricciones = [
					'Presupuestos',
					'Personal',
					'Tecnología: Software',
					'Tecnología: Equipos',
					'Medios materiales',
					'Mod. legislación',
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
					'Mejora de la Responsabilidad y garantías de cumplimiento.',
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

					$http.get('/api/v2/public/informeCarta/' + $scope.cartaservicio._id + '/' + $scope.anualidad)
						.then(function (res) {
							var url = '/download/' + res.data.time + '/' + res.data.hash + '?extension=' + res.data.extension;
							$window.location = url;
						}, function() {
							$rootScope.toaster('Error  al descargar el informe', 'Error', 'error');
						});
				};
				//$scope.editar( $scope.acciones[0] );
				$scope.persona = {};
			}]
		);
})(angular, saveAs);