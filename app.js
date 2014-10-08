

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
  models = require('./api/models');

var secret = __dirname;

app.set('port', process.env.PORT || 5000);
app.set('views', __dirname + '/views');
app.set('mongosrv', process.env.MONGOSVR || 'mongodb://mongosvr/sici');
app.disable( 'x-powered-by' );

//Inicialización mongoose
mongoose.connect(app.get('mongosrv'));
models.init(mongoose);



app.use(express.json());
app.use(express.urlencoded());
app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', expressJwt({secret: secret}));
app.use('/api', api.log(models));


app.post('/authenticate', login.authenticate({secret: secret, jwt:jwt, models:models }));

// Routes

app.get('/', routes.index);
app.get('/partial/:name', routes.partial);



// JSON API
app.get('/api/arbol', api.arbol(Q, models) );
app.get('/api/procedimiento/:CODIGO', api.procedimiento(models) );
app.get('/api/procedimiento', api.procedimiento(models) );
app.get('/api/procedimientoList/:idjerarquia', api.procedimientoList(models) );
app.get('/api/raw/:modelname',api.raw(models));
app.get('/api/aggregate/:campo',api.aggregate(models));
app.get('/api/aggregate/:campo/:match',api.aggregate(models));

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);//devolver el index.html del raiz


http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
