// Javascript for Twitter clone app

$(document).ready(function() {
    $('.fa-thumbs-o-up').on('click', function() {
      var el = $('.fa .like');
      var value = parseInt(el.html());
      el.html(++value);
    });

    
    $('.fa-thumbs-o-down').on('click', function() {
      var el = $('.fa .dislike');
      var value = parseInt(el.html());
      el.html(++value);
    });
    
});

