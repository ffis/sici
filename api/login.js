exports.authenticate = function(config){

	var jwt = config.jwt;
	var secret = config.secret;
	var Persona = config.models.persona();
	var Permisos = config.models.permiso();

	if (!jwt || !secret || !Persona || ! Permisos)
		throw new Error('bad config for authenticate method');

	return function(req, res){

		//should delegate 
		//if is invalid, return 401
		//for testing this should be enough
		if (req.body.password !== 'password') {
		  res.send(401, 'Wrong user or password');		  
		  return;
		}

		Persona.find( { login: req.body.username, habilitado:true },
			function(err,personas){			
				if (err ||personas.length===0)
				{
					res.send(401, 'Wrong user or password');					
					return;
				}
				personas[0].ultimologin = new Date();
				personas[0].save();
				
				//Permisos are bound using login or codplaza
				Permisos.find(
 					{ $or:[ {login: personas[0].login},{codplaza: personas[0].codplaza} ] },
 					function(err, permisos){
 						var o = JSON.parse(JSON.stringify(personas[0]));

						o.permisos = permisos ? permisos : [];
						o.permisoscalculados = o.permisos[0];
						for(var i=1,j=o.permisos.length; i<j;i++ ){
							o.permisoscalculados.jerarquialectura   = o.permisoscalculados.jerarquialectura.concat( o.permisos[i].jerarquialectura);
							o.permisoscalculados.jerarquiaescritura = o.permisoscalculados.jerarquiaescritura.concat( o.permisos[i].jerarquiaescritura);
						}
						var token = jwt.sign(o, secret, { expiresInMinutes: 60*5 });
						res.json({ profile: o, token: token, permisos : permisos });
					}
				)
			}
		);
  }
}
