"use strict"

var   mongoose = require('mongoose'),
    timestamps = require('mongoose-timestamp'),
        Schema = mongoose.Schema

var File = new Schema({
	token: String,
	title: String,
	raw:   String,
	formatted: String
})

File.plugin(timestamps)
mongoose.model('File', File)
mongoose.connect('mongodb://localhost/proser')