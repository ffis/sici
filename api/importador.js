// JavaScript Document
var Crawler = require("crawler").Crawler;
var Browser = require("zombie");
var encoding  = require("encoding");

function parseStr2Int (str){
	var valor = parseInt(str);
	if(isNaN(valor)) valor=0;
	return valor;
}

var turnObjToArray = function(obj) {
  return [].map.call(obj, function(element) {
    return element;
  })
};

exports.parseGS = function(){
	return function (req, res)
	{
			var id = parseInt(req.params.id);
			var url = "http://www.carm.es/web/pagina?IDTIPO=240&IDCONTENIDO="+id;
			var browser = new Browser();

			browser.visit(url).then(function() {
				var datos = {};
				var campos = browser.querySelectorAll('.campoProcedimiento');
				var lista = turnObjToArray(campos);
				lista.forEach(function(detalle){
					var campo = detalle.childNodes && detalle.childNodes.length>0 ? detalle.childNodes.item(0).textContent : detalle.textContent;
					var valorDiv = detalle.nextSibling;
					console.log(typeof detalle.nextSibling);
					
					var parent = valorDiv.parentNode;
					var valor = typeof parent.innerHTML == 'string' ? parent.innerHTML : typeof parent.innerHTML;
					
					datos[campo] = valor;
				});

				res.json(datos);			

			})
			/*
			.fail(function(e,b){
				res.json(b);
			});*/

	}
}

exports.parseCr = function(Q,models){
	return function (req, res)
	{
		var id = parseInt(req.params.id);
		var url = "http://www.carm.es/web/pagina?IDTIPO=240&IDCONTENIDO="+id;
		var Crawled = models.crawled();		
		var restriccion = {id:id, jerarquia: { '$exists': true}};
			
		Crawled.find(restriccion,function(err,data){
		if (err){
			console.error(err);
		}
		if (true){
		
			var deferred = Q.defer();
		
			var cb = function(df) {
				return function(error,result,$) {
				
					if (error){
						res.json ({});
						return;
					}
					var datos = {};
				
					$(".campoProcedimiento").each(function(index,campoProcedimiento) {
						  var campo = $(campoProcedimiento).text();
						  campo = campo.replace('.','_');
						  datos[campo] = $(campoProcedimiento).next().text();
					});
					var jerarquia = [];
					$("#primeraFilaProc li").each(function(i,n){
						var t = $(n).text().trim().split("\n")[0]; if (t){
							t =  encoding.convert(t, 'utf-8', 'utf-8');
							jerarquia.push(t);
						}
					});

					var completo = $('.procedimiento').text();

					var Crawled = models.crawled();
					Crawled.update({id:id}, { id:id, any:datos, jerarquia : jerarquia, completo:completo}, { upsert: true }, function(e){
							if (e){
								console.error(e);
							}
						});
				
					df.resolve(datos);
				}
			};

			var c = new Crawler({"maxConnections":10, "callback": cb(deferred) });
			c.queue(url);
			deferred.promise.then(function (v){
				res.json(v);
			});
		}else{
			res.json(data);
		}
		});
	}
}
