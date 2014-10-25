// Javascript for Twitter clone app

$(document).ready(function() {
    $('.fa-thumbs-o-up').on('click', function() {
      var el = $(this).children(".like");
      var value = parseInt(el.html());
      el.html(++value);
      var id = $(this).parents('.post').data('id');
      var u = '/update/'+id.toString()+'/'+value.toString()+'/like';
      console.log(u);
      $.ajax({
        type: "GET",
        url: u,
      });
    });

    
    $('.fa-thumbs-o-down').on('click', function() {
      var el = $(this).children('.dislike');
      var value = parseInt(el.html());
      el.html(++value);
      var id = $(this).parents('.post').data('id');
      var u = '/update/'+id.toString()+'/'+value.toString()+'/dislike';
      console.log(u);
      $.ajax({
        type: "GET",
        url: u,
      });
    });
    
});

