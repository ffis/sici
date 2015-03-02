(function(module){
	'use strict';

	module.exports.log = function(models){
		return function(req, res){

			var obj = {
				usr: req.user.login,
				fecha: new Date(),
				url: req.get('referer'),
				estado: 'Registrada',
				tipo: 'Por determinar',
				destinatario: 'Por determinar'
			};

			for(var idx in req.body){
				if (typeof req.body[idx] === 'object'){
					if (typeof req.body[idx].Comentario !== 'undefined'){
						obj.comentario = req.body[idx].Comentario;
					}
					if (typeof req.body[idx].Contacto !== 'undefined'){
						obj.contacto = req.body[idx].Contacto;
					}

				}else if (typeof req.body[idx] === 'string'){
					obj.captura = req.body[idx];
				}
			}

			var Feedback = models.feedback();

			new Feedback(obj).save( function(e){
				if (e){
					res.status(400).json({'error': 'An error has occurred'});
				}else{
					res.status(200).json({'OK': true});
				}
			});
		};
	};

})(module);
