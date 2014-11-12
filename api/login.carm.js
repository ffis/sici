
exports.uncrypt = function(encryption_key){
	return function(req,res,next)
	{//espera en body un objeto json {t:sesionencriptada}
		var decipher = crypto.createDecipher('aes-128-ecb', encryption_key),
		chunks = [];
		var fullBuffer = new Buffer(req.body.t);
		chunks.push( decipher.update( new Buffer(fullBuffer, "base64").toString("binary")) );
		chunks.push( decipher.final('binary') );
		var txt = chunks.join("");
		txt = new Buffer(txt, "binary").toString("utf-8");
		console.log(fullBuffer);
		if (txt){
			//aqui debería comprobarse si el lapso de tiempo es válido
			console.log('Token password OK');
			console.log(txt);
			var parsed = {};
			try{
				parsed = JSON.parse(txt);
				req.body.token = parsed;
				console.log(parsed);
				next();
			}catch(exc){
				console.error('Error parseando JSON token-sesión '+txt);
				console.error('Wrong token password');
				res.status(401).send('Wrong token password');
			}
		}else{
			console.error('Wrong token password');
			res.status(401).send('Wrong token password');
		}
	}
}

