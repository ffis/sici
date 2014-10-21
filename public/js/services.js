'use strict';

/* Services */

angular.module('sici.services', ['ngResource'])
    .factory('Arbol', ['$resource',
        function ($resource) {
            return $resource('/api/arbol', {}, { query: {method:'GET', isArray:true} });
		}])
    .factory('Procedimiento', ['$resource',
        function ($resource) {
            return $resource('/api/procedimiento/:CODIGO', {}, {  });
		}])
    .factory('ProcedimientoList', ['$resource',
        function ($resource) {
            return $resource('/api/procedimientoList/:idjerarquia', {}, { query: {method:'GET', isArray:true} });
		}])
	.factory('DetalleCarmProcedimiento', ['$resource',
        function ($resource) {
            return $resource('/api/gs/:CODIGO', {}, {});
		}])
	.factory('DetalleCarmProcedimiento2', ['$resource',
        function ($resource) {
            return $resource('/api/cr/:CODIGO', {}, {});
		}])
	.factory('Raw', ['$resource',
        function ($resource) {
            return $resource('/api/raw/:model', {}, {});
		}])
	.factory('Aggregate', ['$resource',
        function ($resource) {
            return $resource('/api/aggregate/:campo/:restriccion', {}, { query: {method:'GET', isArray:true} });
		}])
	.value('version', '0.1');
