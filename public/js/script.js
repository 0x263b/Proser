"use strict"

var token = window.location.href.substr(window.location.href.lastIndexOf('/') + 1),
	socket = io.connect(location.origin),
	edited = false,
	body = document.querySelector("body"),
	text_area = document.getElementById('text'),
	formatted = document.getElementById('formatted'),
	timestamp = document.getElementById('timestamp'),
	storedContent = text_area.value.replace(/\r\n/g, '\n')

var update_time = function(stamp) {
	var date = new Date(stamp)
	var update = "Updated " + date.toLocaleDateString() + ", " + date.toLocaleTimeString()
	timestamp.innerHTML = update
}

if(timestamp.innerHTML !== "") {
	update_time(timestamp.innerHTML)
}

// Update the text area
var display = function(msg) {
	apply_change(storedContent, msg[0])
	formatted.innerHTML = marked(msg[0])
}

var apply_change = function(oldval, newval) {
	// Strings are immutable and have reference equality. I think this test is O(1), so its worth doing.
	if (oldval === newval) return

	var commonStart = 0
	while (oldval.charAt(commonStart) === newval.charAt(commonStart)) {
		commonStart++
	}

	var commonEnd = 0
	while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) &&
			commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {
		commonEnd++
	}

	if (oldval.length !== commonStart + commonEnd) {
		remove_text(commonStart, oldval.length - commonStart - commonEnd)
	}
	if (newval.length !== commonStart + commonEnd) {
		insert_text(commonStart, newval.slice(commonStart, newval.length - commonEnd))
	}
}

var replace_text = function(newText, transformCursor) {
	if (transformCursor) {
		var newSelection = [transformCursor(text_area.selectionStart), transformCursor(text_area.selectionEnd)]
	}

	// Fixate the window's scroll while we set the element's value. Otherwise
	// the browser scrolls to the element.
	var scrollTop = text_area.scrollTop
	text_area.value = newText
	storedContent = text_area.value // Not done on one line so the browser can do newline conversion.
	if (text_area.scrollTop !== scrollTop) text_area.scrollTop = scrollTop

	// Setting the selection moves the cursor. We'll just have to let your
	// cursor drift if the element isn't active, though usually users don't
	// care.
	if (newSelection && window.document.activeElement === text_area) {
		text_area.selectionStart = newSelection[0]
		text_area.selectionEnd = newSelection[1]
	}
}

var insert_text = function(pos, text) {
	var transformCursor = function(cursor) {
		return pos < cursor ? cursor + text.length : cursor
	}

	// Remove any window-style newline characters. Windows inserts these, and
	// they mess up the generated diff.
	var prev = text_area.value.replace(/\r\n/g, '\n')
	replace_text(prev.slice(0, pos) + text + prev.slice(pos), transformCursor)
}

var remove_text = function(pos, length) {
	var transformCursor = function(cursor) {
		// If the cursor is inside the deleted region, we only want to move back to the start
		// of the region. Hence the Math.min.
		return pos < cursor ? cursor - Math.min(length, cursor - pos) : cursor
	}

	var prev = text_area.value.replace(/\r\n/g, '\n')
	replace_text(prev.slice(0, pos) + prev.slice(pos + length), transformCursor)
}

// Send the text to the socket
var send_msg = function() {
	setTimeout(function(){
		if (text_area.value !== storedContent) {
			storedContent = text_area.value
			apply_change(storedContent, text_area.value.replace(/\r\n/g, '\n'))
			formatted.innerHTML = marked(text_area.value)
			socket.emit('msg', [storedContent])
		}
	}, 4)
}


// Bind events
if (text_area.addEventListener) {
	text_area.addEventListener('change', send_msg, false)
	text_area.addEventListener('keyup', send_msg, false)
} else if(text_area.attachEvent) {
	text_area.attachEvent('onchange', send_msg)
	text_area.attachEvent('onkeyup', send_msg)
} else {
	text_area.onchange = send_msg
	text_area.onkeydown = send_msg
}

// Focus #text
//text_area.focus()

// Join the room
socket.on('connect', function(){
	socket.emit('join', token)
})

// Begin socket connection
socket.on('msg', display)
socket.on('time', update_time)


document.querySelector('#edit').addEventListener('click', function(event) {
	event.preventDefault()

	if(body.classList.contains('editing')) {
		body.classList.remove('editing')
		text_area.readOnly = true
	} else {
		body.classList.add('editing')
		text_area.readOnly = false		
	}
})

