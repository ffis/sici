(function(angular){
	'use strict';
function makeid()
{
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for( var i = 0; i < 5; i++ ){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

	angular.module('sici.ui', [])
	;
	/*
		.directive('gaugeChart', [
			function() {
				return {
					restrict: 'AC',
					scope: {
						animationTime: '=',
						value: '=',
						options: '=',
						maxvalue: '=',
						dato: '='
					},
					controller: ['$scope', '$element', function($scope, $element) {
						if ($scope.gaugeType === 'donut') {
							$scope.gauge = new Donut($element[0]);
							$element.data('gauge', $scope.gauge);
						} else {
							$scope.gauge = new Gauge($element[0]);
							$element.data('gauge', $scope.gauge);
						}
						$scope.gauge.maxValue = parseInt($scope.maxvalue);
						$scope.$watchCollection('[options, value, maxvalue]', function(newValues) {
							$scope.gauge.setOptions(newValues[0]);
							if (!isNaN(newValues[1])){
								$scope.gauge.set(newValues[1]);
							}
							if (!isNaN(newValues[2])){
								$scope.gauge.maxValue = parseInt(newValues[2]);
							}
						});
						$element.on('$destroy', function(){
							if ($scope.gauge) {
								delete $scope.gauge;
							}
						});
					}]
				};
			}
	]);
*/	
})(angular);
/*
https://github.com/bernii/gauge.js/blob/gh-pages/dist/gauge.js
*/
