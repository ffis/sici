
var express = require('express'),
  http = require('http'),
  Q = require('q'),
  path = require('path'),
  mongoose = require('mongoose'),
  app = module.exports = express(),
	expressJwt = require('express-jwt'),

	jwt = require('jsonwebtoken'),
  routes = require('./routes'),
  api = require('./api/api'),
  login = require('./api/login'),
  importador = require('./api/importador'),
  models = require('./api/models');

  app.set('mongosrv', process.env.MONGOSVR || 'mongodb://mongosvr/sici');
  

  //Inicialización mongoose
  mongoose.connect(app.get('mongosrv'));
  models.init(mongoose);

  var Settings = models.settings();
  Settings.find().sort({'version': -1}).limit(1).exec(function(err,cfgs){
    if (err)
      throw err;

    cfg = cfgs[0];

    app.disable( 'x-powered-by' );
    app.set('port', process.env.PORT || cfg.port ||6000);
    app.set('views', __dirname + '/views');

    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.bodyParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use(express.errorHandler());
    mongoose.set('debug', true);

    app.use('/api', expressJwt({secret: cfg.secret}));
    app.use('/api', api.log(models));

    app.post('/authenticate', login.authenticate({secret: cfg.secret, jwt:jwt, models:models }));

    // Routes
    app.get('/', routes.index);


    // JSON API
    app.get('/api/arbol', api.arbol(Q, models) );
    app.get('/api/procedimiento/:codigo', api.procedimiento(models) );
    app.get('/api/procedimiento', api.procedimiento(models) );
    app.get('/api/procedimientoList/:idjerarquia', api.procedimientoList(models, Q) );
    app.get('/api/raw/:modelname',api.raw(models));
    app.get('/api/aggregate/:campo',api.aggregate(models));
    app.get('/api/aggregate/:campo/:match',api.aggregate(models));
    app.get('/api/personasByPuesto/:cod_plaza',api.personasByPuesto(models));
    
    app.get('/api/gs/:id',importador.parseGS());
    app.get('/api/cr/:id',importador.parseCr(Q, models));

    // redirect all others to the index (HTML5 history)
    app.get('*', routes.index);//devolver el index.html del raiz

    http.createServer(app).listen(app.get('port'), function () {
      console.log('Express server listening on port ' + app.get('port'));
    });
  })
  