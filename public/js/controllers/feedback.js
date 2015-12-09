(function(angular){
	'use strict';
	angular.module('sici')
		.controller('FeedbackCtrl', [ '$rootScope', '$scope', '$window', '$routeParams', 'Feedback',
			function ($rootScope, $scope, $window, $routeParams, Feedback) {
				$rootScope.nav = 'feedback';
				$rootScope.setTitle('Feedback');
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
			}
		]);
})(angular);
