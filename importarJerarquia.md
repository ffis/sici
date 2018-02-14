# Instrucciones para la importación de la jerarquía orgánica

## Prerequisitos:
	- Fichero en formato excel con, al menos los campos:
		* OS_ORG: de tipo numérico, por ejemplo: 2
		* OS_ORG_DEN: de tipo texto, por ejemplo: "PRESIDENCIA Y FOMENTO"
		* OS_: de tipo texto, por ejemplo: "CON"
		* OS_TIP_DEN: de tipo texto, por ejemplo "CONSEJERIA"
		* OS_PAD: de tipo numérico, por ejemplo: 1
		* OS_ORG_DEN_COMPLETA: de tipo texto, por ejemplo: "CONSEJERIA PRESIDENCIA Y FOMENTO"

## Pasos
	* Backup
	* Transformaciones desde Excel
	* Almacenamiento en DSV
	* Ejecución utilidad
	* Importación en mongodb
	* Recálculo de datos


Nota, ten en cuanta que los scripts que impliquen conexión con mongodb han sido modificados para no reflejar el
método de autenticación utilizado: contraseña o certificado. Adáptalos según la necesidad.


### Backup

Para garantizar que el proceso es reversible realice un backup de la colección jerarquía antes de continuar:

```bash
mongodump -h mongosvr --db sici -c jerarquia
```


### Transformación desde Excel

Es necesario renombrar las columnas para que coincidan con las que el programa espera, que son:
	* id, para el campo OS_ORG
	* ancestrodirecto, para el campo OS_PAD
	* nombre, para el campo OS_ORG_DEN
	* nombrelargo, para el campo OS_ORG_DEN_COMPLETA
	* inicialestipo, para el campo OS_
	* tipo, para el campo OS_TIP_DEN

El resto de columnas pueden ser eliminadas, a fin de quitar ruido para la depuración, en caso de que hubiera algún fallo posterior.
De no hacerse el programa las ignorará.

### Almacenamiento en DSV

Es necesario almacenar el fichero tratado en formato DSV, delimiter-separated values. El delimitador es un **el punto y coma**.
En excel/libreoffice el menú es "Guardar como..." -> la ruta es el directorio "data", nombre del fichero "organica.csv".
En la pantalla de configuración siguiente debes elegir UTF-8, como delimitador **el punto y coma** y las comillas dobles como delimitador de texto.


### Ejecución utilidad

Una vez realizado el paso previo el fichero "data/organica.csv" debe existir.
Ahora se ejecutará la utilidad:

```bash
node importarJerarquia.js
```

Si todo ha funcionado correctamente la salida será similar a la siguiente:

```txt
934 elementos leídos en el fichero origen de datos
185 jerarquias usadas en procedimientos y cartas
Running tests
Tests OK
Fichero volcado con éxito en: /home/loksly/sici/data/output.json
Pasos:
	mongodump -h mongosvr --db sici -c jerarquia
	mongoimport --host mongosvr --db sici --collection jerarquia --file data/output.json --jsonArray --drop
	mongo mongosvr/sici --eval 'db.jerarquia.update({id:1}, {$set: {ancestrodirecto : null}});'
En caso de crisis:
	mongorestore --db sici -c jerarquia -h mongosvr --drop dump/sici/jerarquia.bson
```

En caso de que algún elemento no cumpla su formato (debería ser un número y no lo es) o falte algún nodo importante la utilidad fallará.
Tenga en cuenta que se requiere conexión a la base de datos a fin de poder comprobarse que tras la importación no quedaría datos huérfanos,
por ejemplo procedimientos asociados a nodos inexistentes.


### Importación en mongodb


```bash
mongoimport --host mongosvr --db sici --collection jerarquia --file data/output.json --jsonArray --drop
mongo mongosvr/sici --eval 'db.jerarquia.update({id:1}, {$set: {ancestrodirecto : null}});'
```


### Recálculo de datos

Ahora es necesario que entres en la aplición web, en el apartado Administrar, Recalcular datos.
Pulsa sobre "Recalcular jerarquía" y luego sobre "Recalcular Procedimientos".


	