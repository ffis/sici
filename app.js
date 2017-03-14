(function(process, logger){
	'use strict';
	var os = require('os'),
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

		/* config */
		config = require('./config.json');
		/* app */
	var	app = module.exports = express();

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

	var Settings = models.settings();

	Settings.find().sort({'version': -1}).limit(1).exec(function (err, cfgs) {
		if (err){
			throw err;
		}
		logger.log('Cargada configuración de forma exitosa');

		var tmpdirectory = path.join(__dirname, config.tmpdir) + path.sep;
		var cfg = cfgs[0];
		cfg.prefixtmp = tmpdirectory;

		app.disable('x-powered-by');
		app.set('port', process.env.PORT || cfg.port || 6000);
		app.set('prefixtmp', tmpdirectory);
		app.use(compress());
		app.use(serveStatic( path.join(__dirname, config.publicdir )) );
		app.use(bodyParser.json({limit: '10mb'}));

		const api = new Api(models, cfg, config);

		app.use('/api', api.app);

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


		var filetipologin = (cfg.logincarm) ? path.join(__dirname, 'public', 'js', 'logincarm.util.js') : path.join(__dirname, 'public', 'js', 'login.util.js');
		app.get('/tipologin.js', function (req, res) {
			res.sendFile(filetipologin);
		});

		// redirect all others to the index (HTML5 history)
		app.get('/', routes.index);
		app.get('*', routes.index);

		logger.log('Establecidas las rutas.                                                                         ');

		var server = http.createServer(app);
		server.listen(app.get('port'), function () {
			require('./api/socketioconsole')(server);
			logger.log('Servidor escuchando en puerto ' + app.get('port'));
		});
	});
})(process, console);
