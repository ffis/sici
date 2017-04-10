(function(angular){
	'use strict';
	angular.module('sici').controller('ActividadCartaCtrl',
			['$rootScope', '$scope', '$routeParams', '$location', 'Arbol', 'EntidadObjetoList',
			function ($rootScope, $scope, $routeParams, $location, Arbol, EntidadObjetoList) {
				$rootScope.nav = 'carta';
				$scope.idjerarquia = ($routeParams.idjerarquia) ? parseInt($routeParams.idjerarquia, 10) : 1;
				$scope.arbol = Arbol.query({}, function(){ $scope.setJerarquiaById($scope.idjerarquia); });
				

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
				$scope.goToJerarquia = function(selection){
					$location.path('/carta/' + selection.id);
				};
				$scope.setSeleccionado = function(selection){
					if (selection) {
						$scope.seleccionado = selection;
						$rootScope.setTitle(selection.title);
						$scope.cartas = EntidadObjetoList.query({'tipoentidad': 'CS', 'idjerarquia': selection.id, 'recursivo': true});
					}
				};
			}
		]
	);

})(angular);
