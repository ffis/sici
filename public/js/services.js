'use strict';

/* Services */

angular.module('sici.services', ['ngResource'])
    .factory('Arbol', ['$resource',
        function ($resource) {
            return $resource('/api/arbol', {}, { query: {method:'GET', isArray:true} });
		}])
    .factory('Procedimiento', ['$resource',
        function ($resource) {
            return $resource('/api/procedimiento/:codigo', {codigo:'@codigo'},   { update: {method:'PUT' } });
		}])
    .factory('ProcedimientoList', ['$resource',
        function ($resource) {
            return $resource('/api/procedimientoList/:idjerarquia', {}, { query: {method:'GET', isArray:true} });
		}])
	.factory('PermisosList',['$resource',
		function ($resource) {
			return $resource('/api/permisosList/:idjerarquia', {}, { query : {method:'GET', isArray:false} });
		}])
    .factory('PersonasByPuesto', ['$resource',
        function ($resource) {
            return $resource('/api/personasByPuesto/:cod_plaza', {}, { query: {method:'GET', isArray:true} });
        }])
	.factory('DetalleCarmProcedimiento', ['$resource',
        function ($resource) {
            return $resource('/api/gs/:codigo', {}, {});
		}])
	.factory('DetalleCarmProcedimiento2', ['$resource',
        function ($resource) {
            return $resource('/api/cr/:codigo', {}, {});
		}])
	.factory('Raw', ['$resource',
        function ($resource) {
            return $resource('/api/raw/:model', {}, {});
		}])
	.factory('Aggregate', ['$resource',
        function ($resource) {
            return $resource('/api/aggregate/:campo/:restriccion', {}, { query: {method:'GET', isArray:true} });
		}])
    .factory('ReglasInconsistencias', ['$resource',
        function ($resource) {
            return $resource('/api/reglasinconsistencias/:id', {id:'@_id'},   { update: {method:'PUT' } });
        }])
	.value('version', '0.1');
