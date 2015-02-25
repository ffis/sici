'use strict';

/* Services */
var modulo = angular.module('sici.services', ['ngResource']);

/* public services */
modulo
        .factory('Aggregate', ['$resource', function ($resource) {
                return $resource('/api/v1/public/aggregate/:anualidad/:campo/:restriccion', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('Arbol', ['$resource', function ($resource) {
                return $resource('/api/v1/public/arbol', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('ArbolWithEmptyNodes', ['$resource', function ($resource) {
                return $resource('/api/v1/public/arbol/1', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('DetalleCarmProcedimiento', ['$resource', function ($resource) {
                return $resource('/api/v1/public/gs/:codigo', {}, {}); }])
        .factory('DetalleCarmProcedimiento2', ['$resource', function ($resource) {
                return $resource('/api/v1/public/cr/:codigo', {}, {}); }])
        .factory('Etiqueta', ['$resource', function ($resource) {
                return $resource('/api/v1/public/etiqueta/:id', {id: '@_id'}, {update: {method: 'PUT'}}); }])
        .factory('ExportarInforme', ['$resource', function ($resource) {
                return $resource('/api/v1/public/exportador/informe/:year', {year: '@year'}, {get: {method: 'GET', isArray: false}}); }])
        .factory('ExportarResultadosProcedimiento', ['$resource', function ($resource) {
                return $resource('/api/v1/public/exportador/procedimiento/:codigo/:year', {codigo: '@codigo', year: '@year'}, {get: {method: 'GET', isArray: false}}); }])
        .factory('ExportarResultadosJerarquia', ['$resource', function ($resource) {
                return $resource('/api/v1/public/exportador/jerarquia/:jerarquia', {jerarquia: '@jerarquia'}, {get: {method: 'GET', isArray: false}}); }])
        .factory('Importacion', ['$resource', function ($resource) {
                return $resource('/api/v1/public/importacion/:id', {id: '@_id'}, {update: {method: 'PUT'}}); }])
        .factory('Jerarquia', ['$resource', function ($resource) {
                return $resource('/api/v1/public/jerarquia/:id', {}, {get: {method: 'GET', isArray: false},query: {method: 'GET', isArray: false}} ); }])
        .factory('JerarquiaAncestros', ['$resource', function ($resource) {
                return $resource('/api/v1/public/jerarquiaancestros/:idjerarquia', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('PermisosCalculados', ['$resource', function ($resource) {
                return $resource('/api/v1/public/permisoscalculados', {}, {query: {method: 'GET', isArray: false}}); }])
        .factory('PorcentajeTramitesResultos', ['$resource', function ($resource) {
                return $resource('/api/v1/public/ratioResueltos/:anualidad', {}, {}); }])
        .factory('Procedimiento', ['$resource', function ($resource) {
                return $resource('/api/v1/public/procedimiento/:codigo', {codigo: '@codigo'}, {get: {method: 'GET', isArray: false}, update: {method: 'PUT'}, create: {method: 'POST'}}); }])
        .factory('ProcedimientosByResponsable', ['$resource', function ($resource) {
                return $resource('/api/v1/public/procedimientosByResponsable/:codplaza', {}, {query: {method: 'GET', isArray:true}}); }])                   
        .factory('ProcedimientoCount', ['$resource', function ($resource) {
                return $resource('/api/v1/public/procedimientoCount', {}, {}); }])
        .factory('ProcedimientoHasChildren', ['$resource', function ($resource) {
                return $resource('/api/v1/public/procedimientoHasChildren/:codigo', {}, {query: {method: 'GET', isArray:false}}); }])
        .factory('ProcedimientoList', ['$resource', function ($resource) {
                return $resource('/api/v1/public/procedimientoList/:idjerarquia/:recursivo', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('ProcedimientosSinExpedientes', ['$resource', function ($resource) {
                return $resource('/api/v1/public/procedimientosSinExpedientes/:anualidad', {}, {}); }])
        .factory('Raw', ['$resource', function ($resource) {
                return $resource('/api/v1/public/raw/:model', {}, {}); }])
        .factory('ResumenNodoJerarquia', ['$resource', function ($resource) {
                return $resource('/api/v1/public/jerarquia/resumen/:jerarquia', {},  {jerarquia: '@jerarquia'}, {get: {method: 'GET', isArray: false}}); }])
        .factory('TestExpediente', ['$resource', function ($resource) {
                return $resource('/api/v1/public/expediente/:procedimiento/:id', {procedimiento: '@procedimiento'}, { create: {method: 'POST', isArray: false}, update: {method: 'PUT', isArray: false} }); }])
        .factory('TramitesCount', ['$resource', function ($resource) {
                return $resource('/api/v1/public/tramiteCount/:anualidad', {}, {}); }])
        .factory('TramitesMes', ['$resource', function ($resource) {
                return $resource('/api/v1/public/tramitesMediaMes/:anualidad', {}, {}); }])
        .factory('PeriodosStats', ['$resource', function ($resource) {
                return $resource('/api/v1/public/mapReducePeriodos'); }])

;
/* restricted services */

modulo
        .factory('Anualidad', ['$resource', function ($resource) {
                return $resource('/api/v1/restricted/anualidad/:anualidad', {}, { save: {method: 'POST'},query: {method: 'GET', isArray:false}}); }]) 
        .factory('ReglasInconsistencias', ['$resource', function ($resource) {
                return $resource('/api/v1/restricted/reglasinconsistencias/:id', {id: '@_id'}, {update: {method: 'PUT'}}); }])
        .factory('Periodo', ['$resource', function ($resource) {
                return $resource('/api/v1/restricted/periodos/:id', {id: '@_id'}, {update: {method: 'PUT'}}); }])
        .factory('Persona', ['$resource', function ($resource) {
                return $resource('/api/v1/restricted/persona/:id', {id: '@id'}, {create: {method: 'POST'}, update: {method: 'PUT'}}); }])
        
;
/* private services */

modulo
        .factory('PermisosList', ['$resource', function ($resource) {
                return $resource('/api/v1/private/permisosList/:idjerarquia/:recursivo', {}, {query: {method: 'GET', isArray: false}}); }])
        .factory('PermisosDirectosProcedimientoList', ['$resource', function ($resource) {
                return $resource('/api/v1/private/permisosDirectosProcedimientoList/:codigoprocedimiento', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('PermisosProcedimientoList', ['$resource', function ($resource) {
                return $resource('/api/v1/private/permisosProcedimientoList/:codigoprocedimiento', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('PermisoToDelete', ['$resource', function ($resource) {
                return $resource('/api/v1/private/permisos/delete-jerarquia/:idpermiso/:idjerarquia', {}, {delete_permiso: {method: 'GET'}}); }])
        .factory('PermisoProcedimientoToDelete', ['$resource', function ($resource) {
                return $resource('/api/v1/private/permisos/delete-procedimiento/:idpermiso/:idprocedimiento', {}, {delete_permiso: {method: 'GET'}}); }])        
        .factory('Permiso', ['$resource', function ($resource) {
                return $resource('/api/v1/private/permisos/:id', {id: '@id'}, {get:{method:'GET',isArray:false}, update: {method: 'PUT'}, create: {method: 'POST'}, 'delete': {method:'DELETE'}}); }])
        .factory('PermisosDelegar', ['$resource', function ($resource) {
                return $resource('/api/v1/private/permisosdelegar/:login/:cod_plaza', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('PermisosDelegarSeleccionado', ['$resource', function ($resource) {
                return $resource('/api/v1/private/permisosdelegar/:login/:cod_plaza/:procedimiento', {}, {query: {method: 'GET', isArray: false}}); }])			
        .factory('PermisosByLoginPlaza', ['$resource', function ($resource) {
                return $resource('/api/v1/private/permisosByLoginPlaza/:login/:cod_plaza', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('PersonasByPuesto', ['$resource', function ($resource) {
                return $resource('/api/v1/private/personasByPuesto/:cod_plaza', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('PersonasByLogin', ['$resource', function ($resource) {
                return $resource('/api/v1/private/personasByLogin/:login', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('PersonasByRegexp', ['$resource', function ($resource) {
                return $resource('/api/v1/private/personasByRegexp/:regex', {}, {query: {method: 'GET', isArray: true}}); }])
        .factory('PersonasSearchList', ['$resource', function ($resource) {
                return $resource('/api/v1/private/searchpersonas', {}, {query: {method: 'GET', isArray: true}}); }])

        .value('version', '0.1')

;