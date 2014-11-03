if (typeof jQuery === 'undefined') { 
  throw new Error(); 
}

var $ = jQuery; 

function popup(opts) {
  var newwindow = window.open(opts.url, opts.title, 'height=' + opts.height + ', width=' + opts.width);
  if (window.focus) {
    newwindow.focus();
  }
  return false;
}

