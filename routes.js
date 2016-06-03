"use strict"

var mongoose = require('mongoose'),
	    File = mongoose.model('File'),
	  marked = require('marked')

// Heroku-like random IDs
var haiku = function() {
	var adjs, nouns, rnd
	adjs = ["aged", "ancient", "autumn", "billowing", "bitter", "black", "blue", "bold", "broken", "cold", "cool", "crimson", "damp", "dark", "dawn", "delicate", "divine", "dry", "empty", "falling", "floral", "fragrant", "frosty", "green", "hidden", "holy", "icy", "late", "lingering", "little", "lively", "long", "misty", "morning", "muddy", "nameless", "old", "patient", "polished", "proud", "purple", "quiet", "red", "restless", "rough", "shy", "silent", "small", "snowy", "solitary", "sparkling", "spring", "still", "summer", "throbbing", "twilight", "wandering", "weathered", "white", "wild", "winter", "wispy", "withered", "young"]
	nouns = ["bird", "breeze", "brook", "bush", "butterfly", "cherry", "cloud", "darkness", "dawn", "dew", "dream", "dust", "feather", "field", "fire", "firefly", "flower", "fog", "forest", "frog", "frost", "glade", "glitter", "grass", "haze", "hill", "lake", "leaf", "meadow", "moon", "morning", "mountain", "night", "paper", "pine", "pond", "rain", "resonance", "river", "sea", "shadow", "shape", "silence", "sky", "smoke", "snow", "snowflake", "sound", "star", "sun", "sunset", "surf", "thunder", "tree", "violet", "voice", "water", "waterfall", "wave", "wildflower", "wind", "wood"]
	rnd = Math.floor(Math.random() * Math.pow(2, 12))
	return adjs[rnd >> 6 % 64] + "-" + nouns[rnd % 64] + "-" + rnd
}

exports.markdown = function(req, res) {
	res.render('views/markdown')
}

exports.index = function(req, res) {
	var foundUniqueKey = false, key

	var keygen = function() {
		key = haiku()
		File.findById(key, function(err, file){
			if (!file) {
				foundUniqueKey = true
			}
		})
	}

	if (foundUniqueKey === false) {
		keygen()
	}

	res.redirect(key)
}

exports.edit = function(req, res) {
	var token = req.params.token
	File.find({ token: token }, function (err, file, count) {

		if (file[0]) {
			file = file[0]
		}

		if (typeof file.raw !== "undefined") {
			file.formatted = marked(file.raw)
		}

		res.render('views/index', {
			title:     err || file.raw == undefined ? "Proser" : file.raw.split(/\n/)[0].replace(/^#+/g, ""),
			raw:       err || file.raw == undefined ? "" : file.raw,
			formatted: err || file.formatted == undefined ? "" : file.formatted,
			updatedAt: err || file.updatedAt == undefined ? "" : file.updatedAt,
			empty:     err || file.raw == "",
			token:     err || token
		})
	})
}

exports.preview = function(req, res) {
	var token = req.params.token
	File.find({ token: token }, function (err, file, count) {

		if (file[0]) {
			file = file[0]
		}

		if (typeof file.raw !== "undefined") {
			file.formatted = marked(file.raw)
		}

		res.render('views/preview', {
			title:     err || file.raw == undefined ? "Proser" : file.raw.split(/\n/)[0].replace(/^#+/g, ""),
			formatted: err || file.formatted == undefined ? "" : file.formatted,
			updatedAt: err || file.updatedAt == undefined ? "" : file.updatedAt,
			token:     err || token
		})
	})
}

exports.raw = function(req, res) {
	var token = req.params.token
	File.find({ token: token }, function (err, file, count) {

		if (file[0]) {
			file = file[0]
		}

		res.set('Content-Type', 'text/markdown')
		res.send(err || file.raw == undefined ? "" : file.raw)
	})
}

exports.download = function(req, res) {
	var token = req.params.token
	var format = req.query.format
	File.find({ token: token }, function (err, file, count) {

		if (file[0]) {
			file = file[0]
		}

		if (typeof file.raw !== "undefined") {
			file.formatted = marked(file.raw)
		}

		if (format === 'html') {
			// Download unstyle html
			res.set('Content-disposition', `attachment; filename=${token}.html`)
			res.render('views/preview', {
				title:     err || file.raw == undefined ? "Proser" : file.raw.split(/\n/)[0].replace(/^#+/g, ""),
				formatted: err || file.formatted == undefined ? "" : file.formatted,
				updatedAt: err || file.updatedAt == undefined ? "" : file.updatedAt,
				token:     err || token
			})
		} else if (format === 'markdown') {
			// Download raw markdown
			res.set('Content-disposition', `attachment; filename=${token}.md`)
			res.set('Content-Type', 'text/markdown')
			res.send(err || file.raw == undefined ? "" : file.raw)
		} else {
			// Redirect to editor
			res.redirect('/' + token)
		}
	})
}

