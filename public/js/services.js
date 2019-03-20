(function(angular, d3){
	'use strict';

	/* Services */
	const modulo = angular.module('sici.services', ['ngResource']);
	const standardQuery = {'get': {'method': 'GET', 'isArray': false}, 'query': {'method': 'GET', 'isArray': true}},
		standardCrud = {'get': {'method': 'GET', 'isArray': false}, 'update': {'method': 'PUT'}, 'create': {'method': 'POST'}, 'delete': {'method': 'DELETE'}};

	/* public services */
	modulo.factory('Aggregate', ['$resource', function($resource) {
		return $resource('/api/v1/public/aggregate/:anualidad/:campo/:restriccion', {}, standardQuery);
	}]).factory('Arbol', ['$resource', function($resource) {
		return $resource('/api/v1/public/arbol', {}, standardQuery);
	}]).factory('ArbolWithEmptyNodes', ['$resource', function($resource) {
		return $resource('/api/v1/public/arbol/1', {}, standardQuery);
	}]).factory('DetalleCarmProcedimiento', ['$resource', function($resource) {
		return $resource('/api/v1/public/gs/:codigo');
	}]).factory('DetalleCarmProcedimiento2', ['$resource', function($resource) {
		return $resource('/api/v1/public/cr/:codigo');
	}]).factory('Etiqueta', ['$resource', function($resource) {
		return $resource('/api/v1/public/etiqueta/:id', {'id': '@_id'}, {'update': {'method': 'PUT'}});
	}]).factory('Operador', ['$resource', function($resource) {
		return $resource('/api/v1/public/operador/:id', {'id': '@_id'}, {'update': {'method': 'PUT'}});
	}]).factory('ExportarInforme', ['$resource', function($resource) {
		return $resource('/api/v1/public/exportador/informe/:year', {'year': '@year'}, standardQuery);
	}]).factory('ExportarResultadosProcedimiento', ['$resource', function($resource) {
		return $resource('/api/v1/public/exportador/procedimiento/:codigo/:year', {'codigo': '@codigo', 'year': '@year'}, standardQuery);
	}]).factory('ExportarResultadosJerarquia', ['$resource', function($resource) {
		return $resource('/api/v1/public/exportador/jerarquia/:jerarquia', {'jerarquia': '@jerarquia'}, standardQuery);
	}]).factory('Importacion', ['$resource', function($resource) {
		return $resource('/api/v1/public/importacion/:id', {'id': '@_id'}, {'update': {'method': 'PUT'}});
	}]).factory('Jerarquia', ['$resource', function($resource) {
		return $resource('/api/v1/public/jerarquia/:id', {}, standardCrud);
	}]).factory('JerarquiaAncestros', ['$resource', function($resource) {
		return $resource('/api/v1/public/jerarquiaancestros/:idjerarquia', {}, standardQuery);
	}]).factory('jerarquiaDescendientes', ['$resource', function($resource) {
		return $resource('/api/v1/public/jerarquiadescendientes/:idjerarquia', {}, standardQuery);
	}]).factory('PermisosCalculados', ['$resource', function($resource) {
		return $resource('/api/v1/public/permisoscalculados', {}, {'query': {'method': 'GET', isArray: false}});
	}]).factory('PorcentajeTramitesResultos', ['$resource', function($resource) {
		return $resource('/api/v1/public/ratioResueltos/:anualidad', {}, {});
	}]).factory('Procedimiento', ['$resource', function($resource) {
		return $resource('/api/v1/public/procedimiento/:codigo', {'codigo': '@codigo'}, standardCrud);
	}]).factory('ProcedimientosByResponsable', ['$resource', function($resource) {
		return $resource('/api/v1/public/procedimientosByResponsable/:codplaza', {}, standardQuery);
	}]).factory('ProcedimientoCount', ['$resource', function($resource) {
		return $resource('/api/v1/public/procedimientoCount', {}, {});
	}]).factory('ProcedimientoHasChildren', ['$resource', function($resource) {
		return $resource('/api/v1/public/procedimientoHasChildren/:codigo', {}, {'query': {'method': 'GET', 'isArray': false}});
	}]).factory('ProcedimientoList', ['$resource', function($resource) {
		return $resource('/api/v1/public/procedimientoList/:idjerarquia/:recursivo', {}, standardQuery);
	}]).factory('ProcedimientosSinExpedientes', ['$resource', function($resource) {
		return $resource('/api/v1/public/procedimientosSinExpedientes/:anualidad', {}, {});
	}]).factory('EntidadObjeto', ['$resource', function($resource) {
		return $resource('/api/v1/public/entidadobjeto/:codigo', {'codigo': '@codigo'}, standardCrud);
	}]).factory('EntidadesObjetoByResponsable', ['$resource', function($resource) {
		return $resource('/api/v1/public/entidadesObjetoByResponsable/:codplaza', {}, standardQuery);
	}]).factory('Raw', ['$resource', function($resource) {
		return $resource('/api/v1/public/raw/:model', {}, {});
	}]).factory('ResumenNodoJerarquia', ['$resource', function($resource) {
		return $resource('/api/v1/public/jerarquia/resumen/:jerarquia', {}, {'jerarquia': '@jerarquia'}, standardQuery);
	}]).factory('TestExpediente', ['$resource', function($resource) {
		return $resource('/api/v1/public/expediente/:procedimiento/:id', {'procedimiento': '@procedimiento'}, {'create': {'method': 'POST', 'isArray': false}, 'update': {'method': 'PUT', 'isArray': false}});
	}]).factory('TramitesCount', ['$resource', function($resource) {
		return $resource('/api/v1/public/tramiteCount/:anualidad', {}, {});
	}]).factory('TramitesMes', ['$resource', function($resource) {
		return $resource('/api/v1/public/tramitesMediaMes/:anualidad', {}, {});
	}]).factory('EntidadObjetoList', ['$resource', function($resource) {
		return $resource('/api/v1/public/entidadobjetoList/:idjerarquia/:recursivo', {}, standardQuery);
	}]).factory('PeriodosStats', ['$resource', function($resource) {
		return $resource('/api/v1/public/mapReducePeriodos');
	}]).factory('PlanMejoraList', ['$resource', function($resource) {
		return $resource('/api/v2/public/planmejora/list/:idjerarquia/:recursivo', {}, standardQuery);
	}]).factory('PlanMejora', ['$resource', function($resource) {
		return $resource('/api/v2/public/planmejora/:id', {'id': '@_id'}, standardCrud);
	}]).factory('AccionMejora', ['$resource', function($resource) {
		return $resource('/api/v2/public/accionmejora/:id', {'id': '@_id'}, standardCrud);
	}]).factory('Anualidad', ['$resource', function($resource) {
		return $resource('/api/v1/restricted/anualidad/:anualidad', {'anualidad': '@anualidad'}, {'save': {'method': 'POST'}, 'query': {'method': 'GET', 'isArray': false}});
	}]).factory('ReglasInconsistencias', ['$resource', function($resource) {
		return $resource('/api/v1/restricted/reglasinconsistencias/:id', {'id': '@_id'}, {'update': {'method': 'PUT'}});
	}]).factory('Periodo', ['$resource', function($resource) {
		return $resource('/api/v1/restricted/periodos/:id', {'id': '@_id'}, {'update': {'method': 'PUT'}});
	}]).factory('PersonaPrivate', ['$resource', function($resource) {
		return $resource('/api/v1/private/persona/:id', {'id': '@id'}, standardQuery);
	}]).factory('Persona', ['$resource', function($resource) {
		return $resource('/api/v1/restricted/persona/:id', {'id': '@id'}, standardCrud);
	}]).factory('Feedback', ['$resource', function($resource) {
		return $resource('/api/v1/restricted/feedback/:id', {'id': '@id'}, {'update': {'method': 'PUT'}});
	}]).factory('RegistroActividad', ['$resource', function($resource) {
		return $resource('/api/v2/restricted/registro', {}, standardQuery);
	}]).factory('UsosIndicadores', ['$resource', function($resource){
		return $resource('/api/v2/restricted/usosIndicadores');
	}]).factory('PermisosList', ['$resource', function($resource) {
		return $resource('/api/v1/private/permisosList/:idjerarquia/:recursivo', {}, standardQuery);
	}]).factory('PermisosDirectosProcedimientoList', ['$resource', function($resource) {
		return $resource('/api/v1/private/permisosDirectosProcedimientoList/:codigoprocedimiento', {}, standardQuery);
	}]).factory('PermisosProcedimientoList', ['$resource', function($resource) {
		return $resource('/api/v1/private/permisosProcedimientoList/:codigoprocedimiento', {}, standardQuery);
	}]).factory('PermisoToDelete', ['$resource', function($resource) {
		return $resource('/api/v1/private/permisos/delete-jerarquia/:idpermiso/:idjerarquia', {}, {'delete_permiso': {method: 'GET'}});
	}]).factory('PermisoProcedimientoToDelete', ['$resource', function($resource) {
		return $resource('/api/v1/private/permisos/delete-procedimiento/:idpermiso/:idprocedimiento', {}, {'delete_permiso': {'method': 'GET'}});
	}]).factory('Permiso', ['$resource', function($resource) {
		return $resource('/api/v1/private/permisos/:id', {id: '@id'}, standardCrud);
	}]).factory('PermisosDelegar', ['$resource', function($resource) {
		return $resource('/api/v1/private/permisosdelegar/:login/:cod_plaza', {}, standardQuery);
	}]).factory('PermisosDelegarSeleccionado', ['$resource', function($resource) {
		return $resource('/api/v1/private/permisosdelegar/:login/:cod_plaza/:procedimiento', {}, {'query': {'method': 'GET', 'isArray': false}});
	}]).factory('PermisosByLoginPlaza', ['$resource', function($resource) {
		return $resource('/api/v1/private/permisosByLoginPlaza/:login/:cod_plaza', {}, standardQuery);
	}]).factory('PersonasByPuesto', ['$resource', function($resource) {
		return $resource('/api/v1/private/personasByPuesto/:cod_plaza', {}, standardQuery);
	}]).factory('PersonasByLogin', ['$resource', function($resource) {
		return $resource('/api/v1/private/personasByLogin/:login', {}, standardQuery);
	}]).factory('PersonasByRegexp', ['$resource', function($resource) {
		return $resource('/api/v1/private/personasByRegexp/:regex', {}, standardQuery);
	}]).factory('Objetivo', ['$resource', function($resource) {
		return $resource('/api/v2/public/objetivo/:newFormula/:id', {'id': '@_id', 'newFormula': '@newFormula'}, standardCrud);
	}]).factory('ObjetivoStats', ['$resource', function($resource) {
		return $resource('/api/v2/public/objetivosStats/:id', {'id': '@_id'}, standardQuery);
	}]).factory('Indicador', ['$resource', function($resource) {
		return $resource('/api/v2/public/indicador/:id', {'id': '@_id'}, standardCrud);
	}]).factory('ImportarObjetivo', ['$resource', function($resource) {
		return $resource('/api/v2/public/importarobjetivo/:idjerarquia', {'idjerarquia': '@idjerarquia'}, standardQuery);
	}]).factory('StatsCartas', ['$resource', function($resource) {
		return $resource('/api/v2/public/statsCartas', {}, standardQuery);
	}]).factory('InformeCarta', ['$resource', function($resource) {
		return $resource('/api/v2/public/informeCarta/:id', {'id': '@_id', 'idjerarquia': '@idjerarquia'}, standardQuery);
	}]).factory('EntidadObjeto', ['$resource', function($resource) {
		return $resource('/api/v2/public/entidadobjeto/:id', {'id': '@_id'}, standardCrud);
	}]).factory('PermisosDirectosEntidadObjetoList', ['$resource', function($resource) {
		return $resource('/api/v1/private/permisosDirectosEntidadObjetoList/:codigoentidadobjeto', {}, standardQuery);
	}]).factory('PermisosEntidadObjetoList', ['$resource', function($resource) {
		return $resource('/api/v1/private/permisosEntidadObjetoList/:codigoentidadobjeto', {}, standardQuery);
	}]).factory('RecalculateJerarquia', ['$resource', function($resource) {
		return $resource('/api/v1/restricted/fjerarquia', {}, standardQuery);
	}]).factory('PastelColor', function(){
		const colorsfn = d3.scale.category20();
		const colors = [];

		return function(i){
			if (typeof colors[i] === 'undefined'){
				if (i < 19){
					colors[i] = colorsfn(i + 2);
				} else {
					const hue = Math.floor(Math.random() * 360);
					colors[i] = 'hsl(' + hue + ', 100%, 87.5%)';
				}
			}

			return colors[i];
		};
	}).constant('PREFERENCES', 'PREFERENCES'
	).constant('acumulatorFunctions', [
		{'name': 'Media', 'value': 'mean'},
		{'name': 'Suma', 'value': 'sum'},
		{'name': 'Máximo', 'value': 'max'},
		{'name': 'Mínimo', 'value': 'min'}
	]).constant('COLORES_OBJETIVOS', [
		{'name': 'Peligro', 'value': '#C50200'},
		{'name': 'Aviso', 'value': '#FF7700'},
		{'name': 'Normal', 'value': '#FDC702'},
		{'name': 'Éxito', 'value': '#C6E497'},
		{'name': 'Superado éxito', 'value': '#8DCA2F'}
	]).constant('UNIDADESINDICADOR', [
		{'nombre': 'Segundos', 'tipo': 'Tiempo'},
		{'nombre': 'Minutos', 'tipo': 'Tiempo'},
		{'nombre': 'Horas', 'tipo': 'Tiempo'},
		{'nombre': 'Días', 'tipo': 'Tiempo'},
		{'nombre': 'Días naturales', 'tipo': 'Tiempo'},
		{'nombre': 'Días laborales', 'tipo': 'Tiempo'},
		{'nombre': 'Meses', 'tipo': 'Tiempo'},
		{'nombre': 'Años', 'tipo': 'Tiempo'},
		{'nombre': 'Documentos', 'tipo': 'Expedientes'},
		{'nombre': 'Miles de documentos', 'tipo': 'Expedientes'}
	]).factory('Util', function() {
		return {
			subirOrden: function(array, pos) {
				if (pos === 0) {
					return;
				}
				const temporal = array[pos - 1];
				array[pos - 1] = array[pos];
				array[pos] = temporal;
			},
			bajarOrden: function(array, pos) {
				if (pos >= array.length) {
					return;
				}
				const temporal = array[pos + 1];
				array[pos + 1] = array[pos];
				array[pos] = temporal;
			}
		};
	}).service('Preferencias', ['$window', 'PREFERENCES', function($window, PREFERENCES){
		let configuracion = {};
		try{
			configuracion = $window.localStorage && $window.localStorage[PREFERENCES] ? JSON.parse($window.localStorage[PREFERENCES]) : {};
		}catch(e){}

		return {
			'sync': function(){
				if ($window.localStorage){
					$window.localStorage[PREFERENCES] = JSON.stringify(configuracion);
				}
			},
			'condensed': function(value){
				if (typeof value !== 'undefined'){
					configuracion.condensed = value;
					this.sync();
				}
				return configuracion.condensed;
			},
			'itemsPerPage': function(value){
				if (typeof value !== 'undefined'){
					configuracion.itemsPerPage = value;
					this.sync();
				}
				return configuracion.itemsPerPage;
			},
		};
	}])
	.value('version', '2.0');

})(angular, d3);
