(function(process, logger){
	'use strict';
	const os = require('os'),
		express = require('express'),
		bodyParser = require('body-parser'),
		http = require('http'),
		path = require('path'),
		mongoose = require('mongoose'),
		serveStatic = require('serve-static'),
		compress = require('compression'),
		Api = require('./api/api'),
		models = require('./api/models'),
		routes = require('./routes'),
		config = require('./config.json');

	const app = module.exports = express();

	function setProgressMessage(msg){
		process.stdout.write('                                                                                                                                            ' + '\u000d');
		process.stdout.write( msg + '\u000d' );
	}

	app.set('mongosrv', process.env.MONGOSVR || config.mongodb.connectionString );

	logger.log('Estableciendo conexión a ' + app.get('mongosrv'));

	//Inicialización mongoose
	mongoose.Promise = require('q').Promise;
	mongoose.connect(app.get('mongosrv'));
	mongoose.set('debug', config.mongodb.debug);
	models.init(mongoose);

	const settingsmodel = models.settings();

	process.on('error', function(err){
		logger.error(err);
	});

	settingsmodel.find().sort({'version': -1}).lean().limit(1).exec(function (err, cfgs) {
		if (err){
			throw err;
		}

		logger.log('Cargada configuración de forma exitosa');

		const tmpdirectory = path.join(__dirname, config.tmpdir) + path.sep;
		const cfg = cfgs[0];
		cfg.prefixtmp = tmpdirectory;

		app.disable('x-powered-by');
		app.set('port', process.env.PORT || cfg.port || 6000);
		app.set('prefixtmp', tmpdirectory);
		app.use(compress());
		app.use(serveStatic( path.join(__dirname, config.publicdir )) );
		app.use(bodyParser.json({limit: '10mb'}));

		const api = new Api(models, cfg, config);

		app.use('/api', api.app);
		app.post('/logout', function(req, res, next){ res.json({ok: 'ok'}); });

		const filetipologin = path.join(__dirname, 'public', 'js', 'login.cas.js');
		app.get('/tipologin.js', function (req, res) {
			res.sendFile(filetipologin);
		});

		// redirect all others to the index (HTML5 history)
		app.get('/', routes.index);
		app.get('*', routes.index);

		logger.log('Establecidas las rutas.                                                                         ');

		const server = http.createServer(app);
		server.listen(app.get('port'), function () {
			require('./api/socketioconsole')(server);
			logger.log('Servidor escuchando en puerto ' + app.get('port'));
		});
	});
})(process, console);
