(function(process, logger){
	'use strict';
	var os = require('os'),
		express = require('express'),
		bodyParser = require('body-parser'),
		http = require('http'),
		Q = require('q'),
		Crawler = (os.platform() === 'linux') ? require('crawler') : false,
		path = require('path'),
		mongoose = require('mongoose'),
		md5 = require('md5'),
		fs = require('fs'),
		serveStatic = require('serve-static'),
		crypto = require('crypto'),
		multer = require('multer'),
		expressJwt = require('express-jwt'),
		jwt = require('jsonwebtoken'),
		compress = require('compression'),
		/* specific api&routes */
		recalculate = require('./api/recalculate'),
		routes = require('./routes'),
		models = require('./api/models'),
		api = require('./api/api'),
		login = require('./api/login'),
		jerarquia = require('./api/jerarquia'),
		importador = require('./api/importador'),
		reglainconsistencia = require('./api/reglainconsistencia'),
		expediente = require('./api/expediente'),
		etiqueta = require('./api/etiqueta'),
		operador = require('./api/operador'),
		periodos = require('./api/periodos'),
		procedimiento = require('./api/procedimiento'),
		persona = require('./api/persona'),
		permiso = require('./api/permiso'),
		upload = require('./api/upload'),
		logincarm = require('./api/login.carm'),
		exportador = require('./api/exportador'),
		csvsici = require('./api/csvsici'),
		feedback = require('./api/feedback'),
		carta = require('./api/carta'),
		entidadobjeto = require('./api/entidadobjeto');
		/* app */
	var	app = module.exports = express();

	function setProgressMessage(msg){
		process.stdout.write('                                                                                                                                            ' + '\u000d');
		process.stdout.write( msg + '\u000d' );
	}

	app.set('mongosrv', process.env.MONGOSVR || 'mongodb://mongosvr/sici');

	logger.log('Estableciendo conexión a ' + app.get('mongosrv'));
	//Inicialización mongoose
	mongoose.connect(app.get('mongosrv'));
	models.init(mongoose);

	var ObjectId = mongoose.Types.ObjectId;
	var Settings = models.settings();

	Settings.find().sort({'version': -1}).limit(1).exec(function (err, cfgs) {
		if (err){
			throw err;
		}
		logger.log('Cargada configuración de forma exitosa');

		var tmpdirectory = path.join(__dirname, 'tmp') + path.sep;
		var cfg = cfgs[0];

		app.disable('x-powered-by');
		app.set('port', process.env.PORT || cfg.port || 6000);
		app.set('prefixtmp', tmpdirectory);
		app.use(compress());
		app.use(serveStatic( path.join(__dirname, 'public')) );

		mongoose.set('debug', false);

		app.use(bodyParser.json({limit: '10mb'}));
		app.use('/api', expressJwt({secret: cfg.secret}));
		app.use('/api', login.setpermisoscalculados({models: models}));
		app.use('/api', api.log(models));

		setProgressMessage('Estableciendo rutas: restricciones permisos 1/2');

		app.use('/api/v1/public/updateByFile', multer({ dest: path.join( __dirname, 'tmp') + path.sep}));

		var filetipologin = (cfg.logincarm) ? path.join(__dirname, 'public', 'js', 'logincarm.util.js') : path.join(__dirname, 'public', 'js', 'login.util.js');
		app.get('/tipologin.js', function (req, res) {
			res.sendFile(filetipologin);
		});

		if (cfg.logincarm){
			app.post('/authenticate', logincarm.uncrypt(cfg.urlbasedecrypt), login.authenticate({secret: cfg.secret, jwt: jwt, models: models, crypto: crypto}));
		}else{
			app.post('/authenticate', login.authenticate({secret: cfg.secret, jwt: jwt, models: models, crypto: crypto}));
		}

		app.use('/api/v1/restricted/', function(req, res, next){
			if (req.user.permisoscalculados.superuser){ if (next){ next(); } }
			else{ res.status(403).json({error: 'Unathorized'}); }
		});
		app.use('/api/v1/private/', function(req, res, next){
			if (req.user.permisoscalculados.superuser || req.user.permisoscalculados.grantoption){ if (next){ next(); } }
			else{ res.status(403).json({error: 'Unathorized'}); }
		});
		app.use('/bot/', function(req, res, next){
			if (req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1' ){ if (next){ next(); } }
			else{ res.status(403).json({ error: 'Unathorized' }); }
		});

		setProgressMessage('Estableciendo rutas: restricciones permisos 2/2');

		/* funcionalidad bots */
		app.get('/bot/personas/actualizarGesper', persona.updateCodPlazaByLogin(models, Q, cfg));
		app.get('/bot/personas/actualizarGesper/:login', persona.updateCodPlazaByLogin(models, Q, cfg));

		setProgressMessage('Estableciendo rutas: rutas superuser');
		/* funcionalidad superuser */

		app.get('/api/v1/restricted/fprocedimiento', recalculate.fprocedimiento(Q, models, procedimiento));
		app.get('/api/v1/restricted/fjerarquia', recalculate.fjerarquia(Q, models));
		app.get('/api/v1/restricted/fpermiso', recalculate.fpermiso(Q, models));

		app.get('/api/v1/restricted/periodos', periodos.getPeriodo(models));
		app.get('/api/v1/restricted/periodos/:id', periodos.getPeriodo(models));
		app.put('/api/v1/restricted/periodos/:id', periodos.updatePeriodo(models));
		app.post('/api/v1/restricted/periodos/:id', periodos.newPeriodo(models));
		app.delete('/api/v1/restricted/periodos/:id', periodos.removePeriodo(models));

		app.post('/api/v1/restricted/anualidad/:anyo', periodos.nuevaAnualidad(models, Q));

		app.post('/api/v1/restricted/pretend/:username', login.pretend({secret: cfg.secret, jwt: jwt, models: models}));

		app.post('/api/v1/restricted/persona', persona.newPersona(models));
		app.put('/api/v1/restricted/persona/:id', persona.updatePersona(models));
		app.post('/api/v1/restricted/habilitar/persona/:id', persona.setHabilitado(models));

		/*fake public */
		app.delete('/api/v1/public/procedimiento/:codigo', procedimiento.deleteProcedimiento(Q, models, recalculate));

		app.get('/api/v1/restricted/reglasinconsistencias', reglainconsistencia.getReglaInconsistencia(models));
		app.get('/api/v1/restricted/reglasinconsistencias/:id', reglainconsistencia.getReglaInconsistencia(models));
		app.post('/api/v1/restricted/reglasinconsistencias', reglainconsistencia.newReglaInconsistencia(models));
		app.put('/api/v1/restricted/reglasinconsistencias/:id', reglainconsistencia.updateReglaInconsistencia(models));
		app.delete('/api/v1/restricted/reglasinconsistencias/:id', reglainconsistencia.removeReglaInconsistencia(models));

		app.get('/api/v1/restricted/feedback', feedback.get(models));
		app.get('/api/v1/restricted/feedback/:_id', feedback.get(models));
		app.put('/api/v1/restricted/feedback/:_id', feedback.update(models));
		app.delete('/api/v1/restricted/feedback/:_id', feedback.remove(models));

		app.get('/api/v1/restricted/excelgesper', persona.importarGesper(models, Q));
               

		/* funcionalidad grantuser */
		setProgressMessage('Estableciendo rutas: rutas grantuser');
		app.get('/api/v1/private/permisosList', permiso.permisosList(models, Q));
		app.get('/api/v1/private/permisosList/:idjerarquia/:recursivo', permiso.permisosList(models, Q));

		app.get('/api/v1/private/permisosDirectosProcedimientoList/:codigoprocedimiento', permiso.permisosDirectosProcedimientoList(models));
		app.get('/api/v1/private/permisosProcedimientoList/:codigoprocedimiento', permiso.permisosProcedimientoList(models));		

		app.get('/api/v1/private/permisosDirectosEntidadObjetoList/:codigoentidadobjeto', permiso.permisosDirectosEntidadObjetoList(models));
		app.get('/api/v1/private/permisosEntidadObjetoList/:codigoentidadobjeto', permiso.permisosEntidadObjetoList(models));		

		app.put('/api/v1/private/permisos/:id', permiso.update(models, recalculate, Q));
		app.get('/api/v1/private/permisos/:id', permiso.get(models));
		app.delete('/api/v1/private/permisos/:id', permiso.removePermiso(models, Q, recalculate, ObjectId));
		app.post('/api/v1/private/permisos', permiso.create(models, Q, recalculate));

		app.get('/api/v1/private/permisosByLoginPlaza/:login/:cod_plaza', permiso.permisosByLoginPlaza(models, Q));
		app.get('/api/v1/private/personasByPuesto/:cod_plaza', persona.personasByPuesto(models));
		app.get('/api/v1/private/personasByLogin/:login', persona.personasByLogin(models));
		app.get('/api/v1/private/personasByRegexp/:regex', persona.personasByRegex(models, Q, cfg));
		app.get('/api/v1/private/searchpersonas', persona.personassearchlist(models, Q));

		//cambiar por post
		app.get('/api/v1/private/permisos/delete-jerarquia/:idpermiso/:idjerarquia', permiso.removePermisoJerarquia(models, Q, recalculate));
		app.get('/api/v1/private/permisos/delete-procedimiento/:idpermiso/:idprocedimiento', permiso.removePermisoJerarquia(models, Q, recalculate));
		app.get('/api/v1/private/permisosdelegar/:login/:cod_plaza', permiso.delegarpermisos(models, Q, recalculate));
		app.get('/api/v1/private/permisosdelegar/:login/:cod_plaza/:procedimiento', permiso.delegarpermisosProcedimiento(models));


		/* funcionalidad user */
		setProgressMessage('Estableciendo rutas: rutas user');
		app.get('/api/v1/public/mapReducePeriodos', function(req, res){ exportador.mapReducePeriodos(Q, models, null, req.user.permisoscalculados).then(function(r){ res.json(r); }); });
		app.post('/api/v1/public/updateByFile', upload.update(), csvsici.parse(models));
		app.post('/api/v1/public/updateByFileIE', upload.update(), csvsici.parse(models));
		app.get('/api/v1/public/aggregate/:anualidad/:campo', api.aggregate(cfg, models));
		app.get('/api/v1/public/aggregate/:anualidad/:campo/:match', api.aggregate(cfg, models));
		app.get('/api/v1/public/arbol', api.arbol(Q, models));
		app.get('/api/v1/public/arbol/:withemptynodes', api.arbol(Q, models));
		app.get('/api/v1/public/cr/:id', importador.parseCr(Q, models, Crawler));
		app.get('/api/v1/public/gs/:id', importador.parseGS());

		app.get('/api/v1/public/etiqueta', etiqueta.getEtiqueta(models));
		app.put('/api/v1/public/etiqueta/:id', etiqueta.updateEtiqueta(models));
		app.post('/api/v1/public/etiqueta/:id', etiqueta.newEtiqueta(models));
		app.delete('/api/v1/public/etiqueta/:id', etiqueta.removeEtiqueta(models));

		app.get('/api/v1/public/operador', operador.getOperador(models));
		app.put('/api/v1/public/operador/:id', operador.updateOperador(models));
		app.post('/api/v1/public/operador', operador.newOperador(models));
		app.delete('/api/v1/public/operador/:id', operador.removeOperador(models));

		app.get('/api/v1/public/exportador/informe/:year', exportador.exportarInforme(models, app, md5, Q, cfg));
		app.get('/api/v1/public/exportador/jerarquia/:jerarquia', exportador.tablaResultadosJerarquia(models, app, md5, Q, cfg));
		app.get('/api/v1/public/exportador/procedimiento/:codigo/:year', exportador.tablaResultadosProcedimiento(models, app, md5, Q, cfg));

		app.get('/api/v1/public/importacion', importador.importacionesprocedimiento(models));
		app.post('/api/v1/public/importacion/:_id', importador.applyImportacionProcedimiento(models, Q, recalculate, procedimiento));
		app.delete('/api/v1/public/importacion/:_id', importador.removeImportacionProcedimiento(models));

		app.get('/api/v1/public/jerarquia/:idjerarquia', jerarquia.getNodoJerarquia(models));
		app.get('/api/v1/public/jerarquiaancestros/:idjerarquia', jerarquia.getAncestros(models));
		app.get('/api/v1/public/jerarquia/resumen/:idjerarquia', jerarquia.getResumenJerarquia(models, Q, exportador));

		app.get('/api/v1/public/permisoscalculados', login.getpermisoscalculados(models));


		app.get('/api/v1/public/entidadobjetoList/:idjerarquia', entidadobjeto.entidadobjetoList(models));
		app.get('/api/v1/public/entidadobjetoList/:idjerarquia/:recursivo', entidadobjeto.entidadobjetoList(models, Q));		

		app.get('/api/v1/public/procedimiento', procedimiento.procedimiento(models));
		app.get('/api/v1/public/procedimiento/:codigo', procedimiento.procedimiento(models));
		app.get('/api/v1/public/procedimientosByResponsable/:codplaza', procedimiento.procedimientosByResponsable(models));
		app.get('/api/v1/public/procedimientoCount', procedimiento.totalProcedimientos(models));
		app.get('/api/v1/public/procedimientoHasChildren/:codigo', procedimiento.hasChildred(models));


		app.get('/api/v1/public/procedimientoList/:idjerarquia', procedimiento.procedimientoList(models));
		app.get('/api/v1/public/procedimientoList/:idjerarquia/:recursivo', procedimiento.procedimientoList(models, Q));
		app.get('/api/v1/public/procedimientosSinExpedientes', procedimiento.procedimientosSinExpedientes(cfg, models));
		app.get('/api/v1/public/procedimientosSinExpedientes/:anualidad', procedimiento.procedimientosSinExpedientes(cfg, models));
		app.get('/api/v1/public/raw/:modelname', api.raw(models));

		app.put('/api/v1/public/procedimiento/:codigo', procedimiento.updateProcedimiento(Q, models, recalculate, persona, cfg));
		//app.post('/api/procedimiento', procedimiento.createProcedimiento(Q, models, recalculate) );
		app.post('/api/v1/public/procedimiento/:codigo', procedimiento.createProcedimiento(Q, models, recalculate));

		app.post('/api/v1/public/expediente/:procedimiento', expediente.initExpediente(models));
		app.put('/api/v1/public/expediente/:procedimiento/:id', expediente.updateExpediente(models));
		app.get('/api/v1/public/expediente/:procedimiento/:id', expediente.expediente(models));
		app.delete('/api/v1/public/expediente/:procedimiento/:id', expediente.deleteExpediente(models));

		app.get('/api/v1/public/tramiteCount', procedimiento.totalTramites(cfg, models));
		app.get('/api/v1/public/tramiteCount/:anualidad', procedimiento.totalTramites(cfg, models));
		app.get('/api/v1/public/ratioResueltos', procedimiento.ratioResueltos(cfg, models));
		app.get('/api/v1/public/ratioResueltos/:anualidad', procedimiento.ratioResueltos(cfg, models));
		app.get('/api/v1/public/tramitesMediaMes', procedimiento.mediaMesTramites(cfg, models));
		app.get('/api/v1/public/tramitesMediaMes/:anualidad', procedimiento.mediaMesTramites(cfg, models));

		app.get('/api/v2/public/objetivo', carta.objetivo(models, Q));
		app.get('/api/v2/public/objetivo/:id', carta.objetivo(models, Q));
		app.put('/api/v2/public/objetivo/:id', carta.actualizaobjetivo(models, Q));

		app.put('/api/v2/public/updateformula', carta.updateFormula(models, Q));

		app.get('/api/v2/public/indicador', carta.indicador(models));
		app.get('/api/v2/public/indicador/:id', carta.indicador(models));
		app.put('/api/v2/public/indicador/:id', carta.actualizaindicador(models, Q));
		app.delete('/api/v2/public/indicador/:id', carta.removeindicador(models));

		app.get('/api/v2/public/entidadobjeto', entidadobjeto.get(models));
		app.get('/api/v2/public/entidadobjeto/:id', entidadobjeto.get(models));
		app.put('/api/v2/public/entidadobjeto/:id', entidadobjeto.update(models));

		app.get('/api/v1/public/entidadesObjetoByResponsable/:codplaza', entidadobjeto.entidadobjetoByResponsable(models));
		/*app.get('/api/v2/public/testDownloadCarta/:id', carta.testDownloadCarta(models, Crawler, Q));*/
		app.post('/api/v2/public/testDownloadCarta/:id', carta.testDownloadCarta(models, Crawler, Q));
		app.post('/api/v2/public/dropCarta/:id', carta.dropCarta(models, Q));

		//app.use('/api/v1/public/feedback', multer({ dest: path.join( __dirname, 'tmp') + path.sep}));
		app.post('/api/v1/public/feedback', feedback.log(models));

		app.get('/download/:token/:hash', exportador.download(app, cfg, fs, md5, path));

		if (process.env.DEBUG_MEMORY && os.platform() === 'linux'){
			setProgressMessage('Estableciendo rutas: memory');
			var memwatch = require('memwatch-next');
			process.nextTick(function(){
				var previousinvoke = new memwatch.HeapDiff();
				app.get('/memory', function(req, res){
					if (global && global.gc){ global.gc(); }
					var diff = previousinvoke.end();
					previousinvoke = new memwatch.HeapDiff();
					diff.change.details.sort(function(a, b){ return (b.size_bytes - a.size_bytes); });
					res.json(diff);
				});
			});
		}

		// redirect all others to the index (HTML5 history)
		app.get('/', routes.index);
		app.get('*', routes.index);//devolver el index.html del raiz

		logger.log('Establecidas las rutas.                                                                         ');

		var server = http.createServer(app);
		server.listen(app.get('port'), function () {
			require('./api/socketioconsole')(server);
			logger.log('Servidor escuchando en puerto ' + app.get('port'));
		});
	});
})(process, console);
