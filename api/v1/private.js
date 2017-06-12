
(function(module){
	'use strict';
	const express = require('express');

	function Api(metaenvironment){
		const app = new express.Router();
		app.get('/permisosList', metaenvironment.permiso.permisosList);
		app.get('/permisosList/:idjerarquia/:recursivo', metaenvironment.permiso.permisosList);

		app.get('/permisosDirectosProcedimientoList/:codigoprocedimiento', metaenvironment.permiso.permisosDirectosProcedimientoList);
		app.get('/permisosProcedimientoList/:codigoprocedimiento', metaenvironment.permiso.permisosProcedimientoList);

		app.get('/permisosDirectosEntidadObjetoList/:codigoentidadobjeto', metaenvironment.permiso.permisosDirectosEntidadObjetoList);
		app.get('/permisosEntidadObjetoList/:codigoentidadobjeto', metaenvironment.permiso.permisosEntidadObjetoList);

		app.put('/permisos/:id', metaenvironment.permiso.update);
		app.get('/permisos/:id', metaenvironment.permiso.get);
		app.delete('/permisos/:id', metaenvironment.permiso.removePermiso);
		app.post('/permisos', metaenvironment.permiso.create);

		app.get('/permisosByLoginPlaza/:login/:cod_plaza', metaenvironment.permiso.permisosByLoginPlaza);
		app.get('/personasByPuesto/:cod_plaza', metaenvironment.persona.personasByPuesto);
		app.get('/personasByLogin/:login', metaenvironment.persona.personasByLogin);
		app.get('/personasByRegexp/:regex', metaenvironment.persona.personasByRegex);

		//cambiar por post
		app.get('/permisos/delete-jerarquia/:idpermiso/:idjerarquia', metaenvironment.permiso.removePermisoJerarquia);
		app.get('/permisos/delete-procedimiento/:idpermiso/:idprocedimiento', metaenvironment.permiso.removePermisoJerarquia);
		app.get('/permisosdelegar/:login/:cod_plaza', metaenvironment.permiso.delegarpermisos);
		app.get('/permisosdelegar/:login/:cod_plaza/:procedimiento', metaenvironment.permiso.delegarpermisosProcedimiento);

		app.get('/persona/:id', metaenvironment.persona.get);

		this.app = app;
	}

	module.exports = Api;

})(module);
