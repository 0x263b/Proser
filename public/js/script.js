(function(){
	var token = window.location.href.substr(window.location.href.lastIndexOf('/') + 1),
		socket = io.connect('http://localhost:3000'),
		edited = false,
		textField = document.getElementById('text'),
		formattedField = document.getElementById('formatted'),
		timeField = document.getElementById('timestamp'),
		storedContent = textField.value.replace(/\r\n/g, '\n')

		var update_time = function(timestamp) {
			date = new Date(timestamp)
			stamp = "Updated " + date.toLocaleDateString() + ", " + date.toLocaleTimeString()
			timeField.value = stamp
		}

		// Update the text area
		var display = function(msg) {
			apply_change(storedContent, msg[0])
			formattedField.innerHTML = marked(msg[0])
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
				var newSelection = [transformCursor(textField.selectionStart), transformCursor(textField.selectionEnd)]
			}

			// Fixate the window's scroll while we set the element's value. Otherwise
			// the browser scrolls to the element.
			var scrollTop = textField.scrollTop
			textField.value = newText
			storedContent = textField.value // Not done on one line so the browser can do newline conversion.
			if (textField.scrollTop !== scrollTop) textField.scrollTop = scrollTop

			// Setting the selection moves the cursor. We'll just have to let your
			// cursor drift if the element isn't active, though usually users don't
			// care.
			if (newSelection && window.document.activeElement === textField) {
				textField.selectionStart = newSelection[0]
				textField.selectionEnd = newSelection[1]
			}
		}

		var insert_text = function(pos, text) {
			var transformCursor = function(cursor) {
				return pos < cursor ? cursor + text.length : cursor
			}

			// Remove any window-style newline characters. Windows inserts these, and
			// they mess up the generated diff.
			var prev = textField.value.replace(/\r\n/g, '\n')
			replace_text(prev.slice(0, pos) + text + prev.slice(pos), transformCursor)
		}

		var remove_text = function(pos, length) {
			var transformCursor = function(cursor) {
				// If the cursor is inside the deleted region, we only want to move back to the start
				// of the region. Hence the Math.min.
				return pos < cursor ? cursor - Math.min(length, cursor - pos) : cursor
			}

			var prev = textField.value.replace(/\r\n/g, '\n')
			replace_text(prev.slice(0, pos) + prev.slice(pos + length), transformCursor)
		}

		// Send the text to the socket
		var sendMsg = function() {
			setTimeout(function(){
				if (textField.value !== storedContent) {
					storedContent = textField.value
					apply_change(storedContent, textField.value.replace(/\r\n/g, '\n'))
					formattedField.innerHTML = marked(textField.value)
					socket.emit('msg', [storedContent])
				}
			}, 4)
		}


	// Bind events
	if (textField.addEventListener) {
		textField.addEventListener('change', sendMsg, false)
		textField.addEventListener('keydown', sendMsg, false)
	} else if(textField.attachEvent) {
		textField.attachEvent('onchange', sendMsg)
		textField.attachEvent('onkeydown', sendMsg)
	} else {
		textField.onchange = sendMsg
		textField.onkeydown = sendMsg
	}

	// Focus #text
	textField.focus()

	// Join the room
	socket.on('connect', function(){
		socket.emit('join', token)
	})

	// Begin socket connection
	socket.on('msg', display)

	socket.on('time', update_time)

})()