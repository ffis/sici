

var schemas = {};

var schemasfields = {
	crawled : { 'id': Number, 'jerarquia': [String], 'completo':'String' },
	guiacarm: {	'id':Number,'titulo':String },
	enexcelperonoenguia : { id: Number},		
	enexcelperonoenprocedimiento : { id: Number},
	enguiaperonoencrawler : { id: Number},
	enguiaperonoenexcel : { id: Number},
	excel : { 'id': Number},
	reglasinconsistencias : { 'titulo':String, 'restriccion':String},
	acl:{
		'login':String,
		'correo':String,
		'pwd':String,
		'habilitado':Boolean,
		'ultimologin':Date,
		'visibilidad': [Number],
		'idjerarquia': [Number],
	},
	jerarquia: {
		'nombre':String,
		'orden':Number,
		'id':Number,
		'descendientes':[{ type: Number }],
		'ancestros':[{ type: Number }],
/*
		'descendientes':[{ type: Schema.Types.ObjectId, ref: 'Jerarquia' }],
		'ancestros':[{ type: Schema.Types.ObjectId, ref: 'Jerarquia' }],
*/	
	},
	procedimiento : {
		'CODIGO':Number,
		'DENOMINACION DEL PROCEDIMIENTO':String,
		'Codigo Nivel 1':Number,
		'Denominacion Nivel 1':String,
		'Codigo Nivel 2':Number,
		'Denominacion Nivel 2':String,
		'Codigo Nivel 3':Number,
		'Denominacion Nivel 3':String,
		'Codigo plaza responsable':String,
		'Login responsable':String,
		'Nombre responsable':String,
		'Correo-e responsable':String,
		'Teléfono responsable':String,
		'Plazo maximo legal para resolver (dias naturales)':Number,
		'Plazo maximo legal para responder (dias habiles)':Number,
		'Plazo CS /ANS (dias naturales)':Number,
		'Plazo CS /ANS (dias habiles)':Number,
		'Pendientes iniciales (a 31-12)':Number,
		'Enero':Number,
		'Febrero':Number,
		'Marzo':Number,
		'Abril':Number,
		'Mayo':Number,
		'Junio':Number,
		'Julio':Number,
		'Agosto':Number,
		'Septiembre':Number,
		'Octubre':Number,
		'Noviembre':Number,
		'Diciembre':Number,
		'Tramitados 2013':[Number],
		'Solicitados':[Number],
		'Iniciados':[Number],
		'Resueltos [1]':[Number],
		'Resueltos [5]':[Number],
		'Resueltos [10]':[Number],
		'Resueltos [15]':[Number],
		'Resueltos [30]':[Number],
		'Resueltos [45]':[Number],
		'Resueltos [>45]':[Number],
		'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)':[Number],
		'Resueltos por Prescripcion/Caducidad (Resp_Admon)':[Number],
		'T_ medio dias naturales':[Number],
		'T_ medio dias habiles descontando T_ de suspensiones':[Number],
		'En plazo':[Number],
		'Quejas presentadas en el mes':[Number],
		'Recursos presentados en el mes':[Number],
		'idjerarquia': Number ,
		'Total resueltos':[Number],
		'Fuera de plazo':[Number],
		'Pendientes':[Number],
		'totalsolicitudes' : Number,
		'Incidencias': {
			'Se han resuelto expedientes fuera de Plazo': [Number],
			'Aumenta el N de expedientes pendientes': [Number],
			'Hay quejas presentadas': [Number],
			'Hay expedientes prescritos/caducados': [Number],
			'Las solicitudes aumentan al menos 20%': [Number],
			'Posible incumplimiento de compromisos': [Number],
		}
	}
	
}

exports.getSchema = function(name){
 return schemasfields[name];
}

function schemaConstructor(name,mongoose){
	if (typeof schemas[name] !== 'undefined') return schemas[name];
	if (typeof mongoose === 'undefined'){  throw new Error('Debe inicializar el schema previamente a su uso.'); }
	var Schema = mongoose.Schema;
	var fields = schemasfields[name];
	var objSchema = new Schema (fields, { collection: name });
	schemas[name]= mongoose.model(name,objSchema);
// 	console.log('inicializado:'+name + ' con '+JSON.stringify(fields));
 	if (typeof schemasfields[name] === 'undefined')
		console.error(schemasfields[name]);
	return schemas[name];
}

exports.init = function(mongoose) {
	var Schema = mongoose.Schema;
	schemasfields.crawled.any = Schema.Types.Mixed;
	for(var name in schemasfields){
		exports[name](mongoose);
	}
}

function constructorschema(name){
	return function(mongoose) { return schemaConstructor(name,mongoose); };
}

for(var name in schemasfields){
	exports[name] = constructorschema(name);
}






