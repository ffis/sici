'use strict';
var os = require('os'),
	express = require('express'),
	bodyParser = require('body-parser'),
	http = require('http'),
	Q = require('q'),
	path = require('path'),
	mongoose = require('mongoose'),
	md5 = require('MD5'),
	path = require('path'),
	fs = require('fs'),
	serveStatic = require('serve-static'),
	crypto = require('crypto'),
	multer = require('multer'),
	expressJwt = require('express-jwt'),
	jwt = require('jsonwebtoken'),
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
	periodos = require('./api/periodos'),
	procedimiento = require('./api/procedimiento'),
	persona = require('./api/persona'),
	permiso = require('./api/permiso'),
	upload = require('./api/upload'),
	logincarm = require('./api/login.carm'),
	exportador = require('./api/exportador'),
	csvsici = require('./api/csvsici'),
	/* app */
	app = module.exports = express()
;


app.set('mongosrv', process.env.MONGOSVR || 'mongodb://mongosvr/sici');


//Inicialización mongoose
mongoose.connect(app.get('mongosrv'));
models.init(mongoose);

var ObjectId = mongoose.Types.ObjectId;
var Settings = models.settings();

Settings.find().sort({'version': -1}).limit(1).exec(function (err, cfgs) {
	if (err){
		throw err;
	}

	var tmpdirectory = path.join(__dirname, 'tmp') + path.sep;
	var cfg = cfgs[0];

	app.disable('x-powered-by');
	app.set('port', process.env.PORT || cfg.port || 6000);
	app.set('prefixtmp', tmpdirectory);
	app.use(serveStatic( path.join(__dirname, 'public')) );

	mongoose.set('debug', false);

	app.use(bodyParser.json());
	app.use('/api', expressJwt({secret: cfg.secret}));
	app.use('/api', login.setpermisoscalculados({models: models}));
	app.use('/api', api.log(models));

	app.use('/api/v1/public/updateByFile', multer({ dest: path.join( __dirname, 'tmp') + path.sep}));

	app.get('/tipologin.js', function (req, res) {
		var r = (cfg.logincarm) ?
				'$("body").append("<script src=\'/js/logincarm.util.js\'></script>");' :
				'$("body").append("<script src=\'/js/login.util.js\'></script>");';

		res.status(200).type('application/javascript').send(r);
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
		if (req.user.permisoscalculados.superuser || req.user.permisoscalculados.grantoption){ if (next){ next();} }
		else{ res.status(403).json({error: 'Unathorized'}); }
	});
	app.use('/bot/', function(req, res, next){
		if (req.ip === '127.0.0.1'){ if (next){ next();} }
		else{ res.status(403).json({error: 'Unathorized'}); }
	});

	/* funcionalidad bots */
	app.get('/bot/personas/actualizarGesper', persona.updateCodPlazaByLogin(models, Q, cfg));

	/* funcionalidad superuser */
	app.get('/api/v1/restricted/mapReducePeriodos', function(req, res){ exportador.mapReducePeriodos(Q, models).then(function(r){ res.json(r); }); });

	app.get('/api/v1/restricted/fprocedimiento', recalculate.fprocedimiento(Q, models, procedimiento));
	app.get('/api/v1/restricted/fjerarquia', recalculate.fjerarquia(Q, models));
	app.get('/api/v1/restricted/fpermiso', recalculate.fpermiso(Q, models));

	app.get('/api/v1/restricted/periodos', periodos.getPeriodo(models));
	app.get('/api/v1/restricted/periodos/:id', periodos.getPeriodo(models));
	app.put('/api/v1/restricted/periodos/:id', periodos.updatePeriodo(models));
	app.post('/api/v1/restricted/periodos/:id', periodos.newPeriodo(models));
	app.delete('/api/v1/restricted/periodos/:id', periodos.removePeriodo(models));

	app.post('/api/v1/restricted/anualidad/:anyo', periodos.nuevaAnualidad(models));

	app.post('/api/v1/restricted/pretend/:username', login.pretend({secret: cfg.secret, jwt: jwt, models: models}));

	app.post('/api/v1/restricted/persona', persona.newPersona(models));
	app.put('/api/v1/restricted/persona/:id', persona.updatePersona(models));

	/*fake public */
	app.delete('/api/v1/public/procedimiento/:codigo', procedimiento.deleteProcedimiento(Q, models, recalculate));

	app.get('/api/v1/restricted/reglasinconsistencias', reglainconsistencia.getReglaInconsistencia(models));
	app.post('/api/v1/restricted/reglasinconsistencias', reglainconsistencia.newReglaInconsistencia(models));
	app.put('/api/v1/restricted/reglasinconsistencias/:id', reglainconsistencia.updateReglaInconsistencia(models));
	app.delete('/api/v1/restricted/reglasinconsistencias/:id', reglainconsistencia.removeReglaInconsistencia(models));

	app.get('/api/v1/restricted/excelgesper', persona.importarGesper(models, Q));

	/* funcionalidad grantuser */
	app.get('/api/v1/private/permisosList', permiso.permisosList(models, Q));
	app.get('/api/v1/private/permisosList/:idjerarquia/:recursivo', permiso.permisosList(models, Q));

	app.get('/api/v1/private/permisosDirectosProcedimientoList/:codigoprocedimiento', permiso.permisosDirectosProcedimientoList(models, Q));
	app.get('/api/v1/private/permisosProcedimientoList/:codigoprocedimiento', permiso.permisosProcedimientoList(models, Q));

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
	app.get('/api/v1/private/permisosdelegar/:login/:cod_plaza/:procedimiento', permiso.delegarpermisosProcedimiento(models, Q));


	/* funcionalidad user */

	app.post('/api/v1/public/updateByFile', upload.update(), csvsici.parse(models));
	app.post('/api/v1/public/updateByFileIE', upload.update(), csvsici.parse(models));
	app.get('/api/v1/public/aggregate/:anualidad/:campo', api.aggregate(cfg, models));
	app.get('/api/v1/public/aggregate/:anualidad/:campo/:match', api.aggregate(cfg, models));
	app.get('/api/v1/public/arbol', api.arbol(Q, models));
	app.get('/api/v1/public/arbol/:withemptynodes', api.arbol(Q, models));
	app.get('/api/v1/public/cr/:id', importador.parseCr(Q, models));
	app.get('/api/v1/public/gs/:id', importador.parseGS());

	app.get('/api/v1/public/etiqueta', etiqueta.getEtiqueta(models));
	app.put('/api/v1/public/etiqueta/:id', etiqueta.updateEtiqueta(models));
	app.post('/api/v1/public/etiqueta/:id', etiqueta.newEtiqueta(models));
	app.delete('/api/v1/public/etiqueta/:id', etiqueta.removeEtiqueta(models));

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

	app.put('/api/v1/public/procedimiento/:codigo', procedimiento.updateProcedimiento(Q, models, recalculate, persona));
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

	app.get('/download/:token/:hash', exportador.download(app, cfg, fs, md5, path));

	if (os.platform() === 'linux'){
		var memwatch = require('memwatch');
		var previousinvoke = new memwatch.HeapDiff();
		app.get('/memory', function(req, res){
			if (global && global.gc){ global.gc(); }
			var diff = previousinvoke.end();
			previousinvoke = new memwatch.HeapDiff();
			diff.change.details.sort(function(a, b){ return (b.size_bytes - a.size_bytes); });
			res.json(diff);
		});
	}

	// redirect all others to the index (HTML5 history)
	app.get('/', routes.index);
	app.get('*', routes.index);//devolver el index.html del raiz

	var server = http.createServer(app);
	server.listen(app.get('port'), function () {
		require('./api/socketioconsole')(server);
		console.log('Express server listening on port ' + app.get('port'));
	});
});
