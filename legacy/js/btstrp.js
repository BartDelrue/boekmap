// jQuery to collapse the navbar on scroll
$(window).scroll(function() {
    if ($(".navbar").offset().top > 50) {
        $(".navbar-fixed-top").addClass("navbar-scroll");
    } else {
        $(".navbar-fixed-top").removeClass("navbar-scroll");
    }
});

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

$(document).on('click',function(e) {
    if($(".navbar-collapse.in").length > 0){
        $(".navbar-collapse").collapse('hide');}
});

