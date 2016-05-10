"use strict"

var	   express = require('express'),
	       app = module.exports = express(),
	    server = app.listen(3030),
	        io = require('socket.io').listen(server),
	        db = require('./db'),
	  mongoose = require('mongoose'),
	timestamps = require('mongoose-timestamp'),
	      File = mongoose.model('File'),
	    marked = require('marked')

// Setup templating
app.set('view engine', 'html')
app.engine('html', require('hbs').__express)
app.set('views', __dirname)

// Initiate sockets
io.sockets.on('connection', function (socket) {
	socket.on('join', function(data) {
		socket.join(data)
		socket.token = data
	})

	socket.on('msg', function(data) {
		socket.broadcast.in(socket.token).emit('msg', data)

		if (data == "" || data == "<br>" || data == undefined) {
			File.findOne({token: socket.token }, function(err, file) {
				if (file != null) {
					file.remove(function(err) {
						if (!err) {
							console.log("Destroyed " + socket.token)
						}
					})
				}
			})
		} else {
			File.findOne({token: socket.token}, function(err, file) {
				if (!err) {
					if (!file) {
						file = new File()
						file.token = socket.token
					}
					file.raw = data[0]
					file.formatted = marked(data[0])
					file.save(function(err) {
						if (!err) {
							socket.broadcast.in(socket.token).emit('time', file.updatedAt)
							//console.log("Saved " + socket.token + " - " + file.updatedAt)
						}
					})
				}
			})
		}
	})

	socket.on('disconnect', function(data) {
		socket.leave(socket.token)
	})
})

// Routes
var routes = require('./routes.js')

app.get('/', routes.index)
app.get('/:token(\\w+-\\w+-\\d+)/', routes.edit)
app.get('/:token(\\w+-\\w+-\\d+)/preview', routes.preview)
app.get('/:token(\\w+-\\w+-\\d+)/raw', routes.raw)
app.use(express.static('public'))

app.use(function(req, res, next) {
	res.status(404).render('views/error')
})

