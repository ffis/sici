# SICI


Sistema Integrado de Control de Indicadores.
Comunidad Autónoma de la Región de Murcia.

### Enlaces de interés

* [BORM]
* [Carta de Servicios]


### Instalación


1. Clonar repositorio

```sh
$ sudo apt-get update
$ sudo apt-get upgrade
$ sudo apt-get install build-essential
$ npm cache clean
$ npm update
$ npm install node-gyp eslint nodemon -g
$ git clone https://github.com/ffis/sici
$ cd sici
$ npm install
$ cd node_modules/mongodb
$ npm install # workaround bug mongodb bson module not found
$ npm install -g braces #workaround bug 2
```

2. Establecer en fichero /etc/hosts la ip del servidor mongodb, con el nombre mongosvr.
3. Desplegar aplicación CAS. (Aún no distribuida por github).
4. Ejecutar
```sh
$ nodemon app.js
```

### Todo:
* Desplegar este sistema mediante Vagrant.
* Mejorar el sistema de gestión de versiones de dependencias.
* Mejorar la separación entre la funcionalidad y el API Rest.
* Añadir test.
* Añadir seguridad mejorada siguiendo [best-practices].


 [best-practices]: <https://strongloop.com/strongblog/best-practices-for-express-in-production-part-one-security/>
 [BORM]: http://www.borm.es/borm/documento?obj=anu&id=699315
 [Carta de Servicios]: https://www.carm.es/web/pagina?IDCONTENIDO=2469&IDTIPO=100&RASTRO=c672$m


