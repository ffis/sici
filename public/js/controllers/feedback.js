(function(angular){
	'use strict';
	angular.module('sici')
		.controller('FeedbackCtrl', [ '$rootScope', '$scope', '$window', '$routeParams', 'Feedback',
			function ($rootScope, $scope, $window, $routeParams, Feedback) {
				$rootScope.nav = 'feedback';
				$window.document.title = 'SICI: Feedback';
				$scope.cambios = [];
				$scope.feedbacks = Feedback.query();
				$scope.selected = null;
				$scope.setFeedback = function(f){
					if ($scope.selected && $scope.selected._id === f._id){
						$scope.selected = null;
					} else {
						$scope.selected = f;
					}
				};
				/*
				$scope.actualizar = function(regla){
					regla.$update(function(){
						$scope.cambios = [];
					});
				};

				$scope.eliminar = function(regla){
					if ($window.confirm('¿Está seguro? Esta operación no es reversible.'))
					{
						regla.$delete(function(){
							$scope.cambios = [];
							$scope.etiquetas = Etiqueta.query();
						});
					}
				};
				$scope.guardar = function(){
					Etiqueta.save($scope.nuevo, function() {
						$scope.etiquetas = Etiqueta.query();
						$scope.nuevo = new Etiqueta();
					});
				};
*/
			}
		]);
})(angular);
