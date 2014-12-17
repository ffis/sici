'use strict';

/* Services */

angular.module('sici.services', ['ngResource'])
        .factory('Arbol', ['$resource',
            function ($resource) {
                return $resource('/api/arbol', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('ArbolWithEmptyNodes', ['$resource',
            function ($resource) {
                return $resource('/api/arbol/1', {}, {query: {method: 'GET', isArray: true}});
            }])			
        .factory('Procedimiento', ['$resource',
            function ($resource) {
                return $resource('/api/procedimiento/:codigo', {codigo: '@codigo'}, {get: {method: 'GET', isArray: false}, update: {method: 'PUT'}, create: {method: 'POST'}});
            }])
        .factory('ProcedimientoList', ['$resource',
            function ($resource) {
                return $resource('/api/procedimientoList/:idjerarquia/:recursivo', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('ProcedimientoCount', ['$resource',
            function ($resource) {
                return $resource('/api/procedimientoCount', {}, {});
            }])
        .factory('ProcedimientoHasChildren', ['$resource',
            function ($resource) {
                return $resource('/api/procedimientoHasChildren/:codigo', {}, {query: {method: 'GET', isArray:false}});
            }])        
        .factory('Anualidad', ['$resource',
            function ($resource) {
                return $resource('/api/createAnualidad/:anualidad', {}, {query: {method: 'GET', isArray:false}});
            }])                
        .factory('TramitesCount', ['$resource',
            function ($resource) {
                return $resource('/api/tramiteCount', {}, {});
            }])
        .factory('PorcentajeTramitesResultos', ['$resource',
            function ($resource) {
                return $resource('/api/ratioResueltos', {}, {});
            }])
        .factory('ProcedimientosSinExpedientes', ['$resource',
            function ($resource) {
                return $resource('/api/procedimientosSinExpedientes', {}, {});
            }])
        .factory('TramitesMes', ['$resource',
            function ($resource) {
                return $resource('/api/tramitesMediaMes', {}, {});
            }])
        .factory('PermisosList', ['$resource',
            function ($resource) {
                return $resource('/api/permisosList/:idjerarquia/:recursivo', {}, {query: {method: 'GET', isArray: false}});
            }])
        .factory('Jerarquia', ['$resource',
            function ($resource) {
                return $resource('/api/jerarquia/:idjerarquia', {}, {query: {method: 'GET', isArray: false}});
            }])
        .factory('PermisosDirectosProcedimientoList', ['$resource',
            function ($resource) {
                return $resource('/api/permisosDirectosProcedimientoList/:codigoprocedimiento', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('PermisosProcedimientoList', ['$resource',
            function ($resource) {
                return $resource('/api/permisosProcedimientoList/:codigoprocedimiento', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('PermisoToDelete', ['$resource',
            function ($resource) {
                return $resource('/api/permisos/delete-jerarquia/:idpermiso/:idjerarquia', {}, {delete_permiso: {method: 'GET'}});
            }])
        .factory('PermisoProcedimientoToDelete', ['$resource',
            function ($resource) {
                return $resource('/api/permisos/delete-procedimiento/:idpermiso/:idprocedimiento', {}, {delete_permiso: {method: 'GET'}});
            }])        
        .factory('Permiso', ['$resource',
            function ($resource) {
                return $resource('/api/permisos/:id', {id: '@id'}, {get:{method:'GET',isArray:false}, update: {method: 'PUT'}, create: {method: 'POST'}, 'delete': {method:'DELETE'}});
            }])
        .factory('PermisosCalculados', ['$resource',
            function ($resource) {
                return $resource('/api/permisoscalculados', {}, {query: {method: 'GET', isArray: false}});
            }])
        .factory('PermisosDelegar', ['$resource',
            function ($resource) {
                return $resource('/api/permisosdelegar/:login/:cod_plaza', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('PermisosDelegarSeleccionado', ['$resource',
            function ($resource) {
                return $resource('/api/permisosdelegar/:login/:cod_plaza/:procedimiento', {}, {query: {method: 'GET', isArray: false}});
            }])			
        .factory('PermisosByLoginPlaza', ['$resource',
            function ($resource) {
                return $resource('/api/permisosByLoginPlaza/:login/:cod_plaza', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('PersonasByLoginPlaza', ['$resource',
            function ($resource) {
                return $resource('/api/permisosByLoginPlaza/:login/:cod_plaza', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('PersonasActualizacionGesper', ['$resource',
            function ($resource) {
                return $resource('/api/personas/actualizarGesper', {}, {query: {method: 'POST', isArray: false}});
            }])
        .factory('PersonasByPuesto', ['$resource',
            function ($resource) {
                return $resource('/api/personasByPuesto/:cod_plaza', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('PersonasByLogin', ['$resource',
            function ($resource) {
                return $resource('/api/personasByLogin/:login', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('PersonasByRegexp', ['$resource',
            function ($resource) {
                return $resource('/api/PersonasByRegexp/:regex', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('PersonasSearchList', ['$resource',
            function ($resource) {
                return $resource('/api/searchpersonas', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('Persona', ['$resource',
            function ($resource) {
                return $resource('/api/persona/:id', {id: '@id'}, {create: {method: 'POST'}, update: {method: 'PUT'}});
            }])
        .factory('ExportarInforme', ['$resource',
            function ($resource) {
                return $resource('/api/exportador/informe/:year', {year: '@year'}, {get: {method: 'GET', isArray: false}});
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
                return $resource('/api/aggregate/:campo/:restriccion', {}, {query: {method: 'GET', isArray: true}});
            }])
        .factory('ReglasInconsistencias', ['$resource',
            function ($resource) {
                return $resource('/api/reglasinconsistencias/:id', {id: '@_id'}, {update: {method: 'PUT'}});
            }])
        .factory('Etiqueta', ['$resource',
            function ($resource) {
                return $resource('/api/etiqueta/:id', {id: '@_id'}, {update: {method: 'PUT'}});
            }])
        .factory('Periodo', ['$resource',
            function ($resource) {
                return $resource('/api/periodos/:id', {id: '@_id'}, {update: {method: 'PUT'}});
            }])
        .factory('Importacion', ['$resource',
            function ($resource) {
                return $resource('/api/importacion/:id', {id: '@_id'}, {update: {method: 'PUT'}});
            }])
        .factory('TipoLogin', ['$resource',
            function ($resource) {
                return $resource('/tipologin');
            }])
        .factory('TestExpediente', ['$resource',
            function ($resource) {
                return $resource('api/v1/expediente/:procedimiento/:id', {procedimiento: '@procedimiento'}, {
                    create: {method: 'POST', isArray: false},
                    update: {method: 'PUT', isArray: false}
                });
            }])
        .value('version', '0.1');
