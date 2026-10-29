var map = null;

var mc = null;
var mcSteden = null;
var mcLanden = null;
var mcRegios = null;

var infowindow;
var input = null;
var autocomplete = null;

var arrMarkers = null;
var arrStadMarkers= [];
var arrLandMarkers= [];
var arrRegioMakers= [];

var locations = [];
var locationHistory;
//aantal boeken tellen
var localCount;

var initExisting = true;

function initMap() {

    var mapOptions = {
        center: {lat: 53.3, lng: 3.42},
        zoom: 5,
        mapTypeControl: false,
        styles: [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#B3BDBB"},{"visibility":"on"}]}]
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    var clusterStylesLand = [
        {
            textColor: 'black',
            url: 'img/icons/country.png',
            height: 60,
            width: 60
        }
    ];
    var mcOptionsLand = {
        gridSize: 60,
        maxZoom: 14,
        styles: clusterStylesLand
    };
    var clusterStylesRegio = [
        {
            textColor: 'black',
            url: 'img/icons/region.png',
            height: 40,
            width: 40
        }
    ];
    var mcOptionsRegio = {
        gridSize: 60,
        maxZoom: 11,
        styles: clusterStylesRegio
    };
    var clusterStylesStad = [
        {
            textColor: 'black',
            url: 'img/icons/city.png',
            height: 40,
            width: 40
        }
    ];
    var mcOptionsStad = {
        gridSize: 60,
        maxZoom: 14,
        styles: clusterStylesStad
    };
    mcSteden = new MarkerClusterer(map, [], mcOptionsStad);
    mcLanden = new MarkerClusterer(map, [], mcOptionsLand);
    mcRegios = new MarkerClusterer(map, [], mcOptionsRegio);

    google.maps.event.addListener(mcSteden, 'clusterclick', function (cluster) {
        map.setCenter(cluster.getCenter());
        map.setZoom(14);
    });
    google.maps.event.addListener(mcLanden, 'clusterclick', function (cluster) {
        map.setCenter(cluster.getCenter());
        map.setZoom(9);
    });
    google.maps.event.addListener(mcRegios, 'clusterclick', function (cluster) {
        map.setCenter(cluster.getCenter());
        map.setZoom(11);
    });

    input = (document.getElementById('pac-input'));
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    var is_android = navigator.userAgent.toLowerCase().indexOf('android') > -1;

    // extra margin onder autocomplete, eerste item is anders onselecteerbaar
    if(is_firefox && is_android){
        $('html').addClass('FirefoxAndroid');
    }

    autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);
    autocomplete.setTypes(['(regions)']);
    autocomplete.addListener('place_changed', function(){placeChanged();
        setTimeout(function(){
        $('html, body').stop().animate({
        scrollTop: $("#map-container").offset().top
        }, 1500, 'easeInOutExpo')},500);
        });

    //elementen dynamisch aanmaken... because opdracht
    //toch setattribute ipv jquery? Is sneller en nauwelijks meer moeite.
    var loadingContainer = document.createElement("div");
    loadingContainer.setAttribute("id","loading-container");

    var loading = document.createElement("div");
    loading.setAttribute("class","loading");
    loadingContainer.appendChild(loading);

    var expl = document.createElement("div");
    expl.setAttribute("id","expl");
    expl.innerHTML = "<p>Gekende locaties verzamelen...</p><p id='loading-city'></p>";
    loadingContainer.appendChild(expl);

    var loadingButton = document.createElement("input");
    loadingButton.setAttribute("id","loading-button");
    loadingButton.setAttribute("class", "btn");
    loadingButton.setAttribute("type","button");
    loadingButton.setAttribute("value","Ik kan niet meer wachten...");
    loadingContainer.appendChild(loadingButton);

    $(loadingButton).click(function () {
        $("#map-overlay").fadeOut();
        $("#map-enable").fadeIn();
        map.panBy(1, 1);
    });
    $("#map-overlay").append(loadingContainer);
    //einde dynamisch aanmeken

    infowindow = new google.maps.InfoWindow();

    $.getJSON( "http://student.howest.be/bart.delrue/mashup/boeken.php", function(data) {
        locationHistory = data;
        localCount = locationHistory.length;
        jQuery.each(locationHistory, function (i) {
            // gekende plaatsen inladen
            getbooks(this);
        });
    });

    google.maps.event.addListener(map, 'idle',loadCovers);
    $("#map-enable").click(function(){enableScroll();});
}

function enableScroll(){
    var map =  $("#map");
    var btn = $("#map-enable");
    if (map.css("pointer-events") == "none") {
        map.css("pointer-events","auto");
        btn.prop("value","vergrendel kaart");
        btn.css("bottom","25px");
        $('html, body').stop().animate({
            scrollTop: $("#map-container").offset().top
        }, 1500, 'easeInOutExpo');
    }
    else {
        map.css("pointer-events","none");
        btn.prop("value","ontgrendel kaart");
        btn.css("bottom","50%");}
}

function loadCovers(){
    var bounds = map.getBounds();

    if(map.getZoom() >= 14){
        $(arrRegioMakers).each
        (function(){changeIcon(bounds,this);});
        $(arrStadMarkers).each
        (function(){changeIcon(bounds,this);});
        $(arrLandMarkers).each
        (function(){changeIcon(bounds,this);});
    }
    else if(map.getZoom()>=11){
        $(arrRegioMakers).each
        (function(){changeIcon(bounds,this);});
        $(arrLandMarkers).each
        (function(){changeIcon(bounds,this);});
    }
    else if(map.getZoom()>=9){
        $(arrLandMarkers).each
        (function(){changeIcon(bounds,this);});
    }
}

function changeIcon(bounds, marker){
    if(bounds.contains(marker.getPosition()) && marker.cover != null){

        // probleem 1: bibnet api keert sowieso afbeeldingen terug, helaas zijn sommige slechts 1 pixel groot...
        // oplossing 1: dummy covers voorzien, pas nadien echte cover inladen (werd toegegoevd aan marker object) en grootte controleren
        // probleem 2: alle covers laden vergt veel bandbreedt
        // oplossing 2: pas inladen binnen bounds en correct zoomniveau

        var img = new Image();
        img.src = marker.cover;
        img.onload = function () {
            if (img.width > 10){
                marker.icon.url = img.src;
                marker.icon.size = new google.maps.Size(img.width, img.height);
                marker.setMap(null);
                marker.setMap(map);}
        };
        marker.cover = null;
    }
}

function placeChanged(){
    infowindow.close();

    var place = autocomplete.getPlace();
    if (!place.geometry) return;

    map.setCenter(place.geometry.location);

    var simplePlace = {
        name: encodeURIComponent(place.address_components[0].long_name) ,
        id: place.place_id,
        type:place.address_components[0].types[0],
        lat:place.geometry.location.lat(),
        lng:place.geometry.location.lng() };

    if (simplePlace.type == 'country')
        map.setZoom(9);

    else if (simplePlace.type == 'locality')
        map.setZoom(14);

    else
        map.setZoom(11);

    if(isExistingLocation(locations,simplePlace) == false)
    {   localCount++;
        getbooks(simplePlace);}
}

function getbooks(place){
    $.ajax({
        type: "GET",
        url: "boeken_subject.php?subject=" + place.name,
        dataType: "xml",
        success: function (xml) {createBookMarkers(xml, place);}
    });
}

function placeBookMarkers(res,i,place){

    var disperseBooks;

    if (place.type == 'country')
    {   //if (initExisting == false) map.setZoom(9);
        disperseBooks = {la:1.2, lo:3.4, dst:0.25};
        arrMarkers = arrLandMarkers;
        mc = mcLanden;
    }
    else if (place.type == 'locality')
    {
        //if (initExisting == false) map.setZoom(14);
        disperseBooks = {la:40, lo:100, dst:0.01};
        arrMarkers = arrStadMarkers;
        mc = mcSteden;
    }
    else
    {
        //if (initExisting == false) map.setZoom(11);
        disperseBooks = {la:6, lo:15, dst:0.02};
        arrMarkers = arrRegioMakers;
        mc = mcRegios;
    }

    var title = $(res).find("title").text();

    var position = {
        lat: place.lat + (((i/3) % 1).toFixed(1) / disperseBooks.la) - disperseBooks.dst,
        lng: place.lng + (Math.floor(i/3) / disperseBooks.lo) - disperseBooks.dst*2
    };

    var icon = {
        url: 'img/icons/cover.png'
    };

    var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: title,
        icon: icon,
        zIndex: Math.round(position.lat * -100000) << 5,
        cover: $(res).find("coverimage").find("url").text()
    });

    marker.addListener('click', function() {
        infowindow.setContent(
            "<div class='bookDetails'>" +
            "<h2>" + title + "</h2>" +
            "<p><em>"+ $(res).find("main-author").text() + "</em>" +
            "<br/> ( "+ $(res).find("publisher").text() + " - " + $(res).find("isbn-id").text() +" )" + "</p>" +
            "<p>"+ $(res).find("summary").text() +"</p>" +
            "<a target='_blank' href='" + $(res).find("detail-page").text() + "'>" + "Details en beschikbaarheid" + "</a>" +
            "</div>"
        );

        infowindow.open(map,marker);
    });

    arrMarkers.push(marker);
    mc.addMarkers(arrMarkers, true);
}

function niksGevonden(place){

    if(initExisting) return;

    var marker = new google.maps.Marker({
        position: {lat: place.lat, lng: place.lng},
        map: map,
        title: "Niks Gevonden",
        icon: {url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png", size:new google.maps.Size(1,1)}
    });

    infowindow.setContent("<h3> geen boeken gevonden </h3><p>De Bibnet API gaf geen resultaten voor deze locatie.</p>");
    infowindow.open(map,marker);
}

function createBookMarkers(xml, place){

    $("#loading-city").text(decodeURIComponent(place.name));

    if(!$(xml).find("results").length){
        niksGevonden(place);
        substractLocalCount();
        return;}

    $(xml).find("results").each(function () {

        var results = $(this).find("result");
        results.each(function (i) {
            var res = this;
            placeBookMarkers(res, i, place);
        });
        loadCovers();
        substractLocalCount();
        locations.push(place);
    });

    if(isExistingLocation(locationHistory,place) == false) {
        $.ajax({
            type: "POST",
            url: "http://student.howest.be/bart.delrue/mashup/postboeken.php",
            data: {place:place}
        });
    }
}

function substractLocalCount(){
    localCount--;
    if (localCount == 0) {
        $("#map-overlay").fadeOut();
        $("#map-enable").fadeIn();
        map.panBy(1, 1);
        initExisting = false;}
}

function isExistingLocation($arr, place){
    var res = false;
    jQuery.each($arr,function(){
        if (this.id == place.id) {res = true; return false;}
    });

    return res;
}