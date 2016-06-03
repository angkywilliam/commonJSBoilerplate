var $ = require('jquery')

var button = $('<button/>').html('click me').on('click', function() {
  alert('It works')
})

$('body').append(button)