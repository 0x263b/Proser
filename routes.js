"use strict"

var mongoose = require('mongoose'),
	    File = mongoose.model('File'),
	  marked = require('marked')

// Heroku-like random IDs
var haiku = function() {
	var adjs, nouns, rnd
	adjs = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter", "patient", "twilight", "dawn", "crimson", "wispy", "weathered", "blue", "billowing", "broken", "cold", "damp", "falling", "frosty", "green", "long", "late", "lingering", "bold", "little", "morning", "muddy", "old", "red", "rough", "still", "small", "sparkling", "throbbing", "shy", "wandering", "withered", "wild", "black", "young", "holy", "solitary", "fragrant", "aged", "snowy", "proud", "floral", "restless", "divine", "polished", "ancient", "purple", "lively", "nameless"]
	nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter", "forest", "hill", "cloud", "meadow", "sun", "glade", "bird", "brook", "butterfly", "bush", "dew", "dust", "field", "fire", "flower", "firefly", "feather", "grass", "haze", "mountain", "night", "pond", "darkness", "snowflake", "silence", "sound", "sky", "shape", "surf", "thunder", "violet", "water", "wildflower", "wave", "water", "resonance", "sun", "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper", "frog", "smoke", "star"]
	rnd = Math.floor(Math.random() * Math.pow(2, 12))
	return adjs[rnd >> 6 % 64] + "-" + nouns[rnd % 64] + "-" + rnd
}

exports.index = function(req, res) {
	var foundUniqueKey = false, 
		key

	var keygen = function() {
		key = haiku()
		File.findById(key, function(err, file){
			if (!file) {
				foundUniqueKey = true
			}
		})
	}

	// Start keygen process
	if (foundUniqueKey === false) {
		keygen()
	}

	res.redirect(key)
}

exports.edit = function(req, res) {
	var token = req.params.token
	File.find({ token: token }, function (err, file, count) {
		// Flatten array
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
		// Flatten array
		if (file[0]) {
			file = file[0]
		}

		if (typeof file.raw !== "undefined") {
			file.formatted = marked(file.raw)
		}

		res.render('views/preview', {
			title:     err || file.raw == undefined ? "Proser" : file.raw.split(/\n/)[0].replace(/^#+/g, ""),
			raw:       err || file.raw == undefined ? "" : file.raw,
			formatted: err || file.formatted == undefined ? "" : file.formatted,
			updatedAt: err || file.updatedAt == undefined ? "" : file.updatedAt,
			empty:     err || file.raw == "",
			token:     err || token
		})
	})
}

exports.raw = function(req, res) {
	var token = req.params.token
	File.find({ token: token }, function (err, file, count) {
		// Flatten array
		if (file[0]) {
			file = file[0]
		}

		res.set('Content-Type', 'text/markdown')
		res.send(err || file.raw == undefined ? "" : file.raw)
	})
}

