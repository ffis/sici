(function (angular, $) {
    'use strict';
    angular.module('sici')
            .controller('ObjetivoCtrl', ['$q', '$scope', '$routeParams', 'Objetivo',
                function ($q, $scope, $routeParams, Objetivo) {
                    $scope.idobjetivo = ($routeParams.idobjetivo) ? parseInt($routeParams.idobjetivo) : false;
                    $scope.objetivo = Objetivo.get({id : $scope.idobjetivo});
                    console.log($scope.objetivo);
                }]);
})(angular, $);