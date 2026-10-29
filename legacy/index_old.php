<?php
session_start();
// TODO: sessiesleutel verwijderd (secret), moet gelijk zijn aan die in postboeken.php. Nieuwe locaties bewaren werkt niet meer tot hier een waarde staat.
$_SESSION["key"] = "";
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">
    <title>Boekmap</title>
    <link href="http://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css" rel="stylesheet">
    <link href="css/map.min.css" rel="stylesheet">
    <link href="css/style.min.css" rel="stylesheet">
    <link href='https://fonts.googleapis.com/css?family=Architects+Daughter' rel='stylesheet' type='text/css'>
    <link href='https://fonts.googleapis.com/css?family=Lato:400,300,300italic,400italic,700,700italic' rel='stylesheet' type='text/css'>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
    <script src="http://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.3/jquery.easing.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
    <script src="js/map_old.min.js" charset="UTF-8"></script>
    <script src="js/form.min.js"></script>
    <script src="js/btstrp.min.js"></script>
    <script src="http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/src/markerclusterer.js"></script>
    <script src='https://www.google.com/recaptcha/api.js'></script>
</head>

<body id="page-top" data-spy="scroll" data-target=".navbar-fixed-top">

<nav class="navbar nav-custom navbar-fixed-top" role="navigation">
    <div class="container">
        <div class="navbar-header page-scroll">
            <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-main-collapse">
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </button>
            <a class="navbar-brand page-scroll" href="#page-top">Boekmap</a>
        </div>
        <div class="collapse navbar-collapse navbar-right navbar-main-collapse">
            <ul class="nav navbar-nav">
                <li class="hidden">
                    <a class="page-scroll" href="#page-top"></a>
                </li>
                <li class="">
                    <a class="page-scroll" href="#about">Introductie</a>
                </li>
                <li class="">
                    <a class="page-scroll" href="#map-container">De kaart</a>
                </li>
                <li class="">
                    <a class="page-scroll" href="#contact">Contact</a>
                </li>
            </ul>
        </div>
    </div>
</nav>

<header class="intro">
    <div class="intro-body">
        <div class="container">
            <div class="row">
                <div class="col-md-8 col-md-offset-4">
                    <h1>Boekmap</h1>
                    <p class="intro-text"><em>"That's the thing about books, they let you travel without moving your feet."</em> <br>Jhumpa Lahiri</p>
                    <a href="#about" class="btn btn-down page-scroll"></a>
                </div>
            </div>
        </div>
    </div>
</header>

<section id="about" class="container-fluid toplevelSection">
    <article class="row white">
        <section class="aboutImage noPadding col-lg-4 hidden-xs hidden-md hidden-sm"></section>
        <section class="container col-lg-6 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-10 col-sm-offset-1 col-xs-12">
            <h2><em>Over</em> Boekmap</h2>
            <h3>Een bibnet - google maps mashup</h3>
            <p>Droom je ook van verre reizen of zoek je een boek dat past bij je bestemming?</p>
              <p>Voor u verzamelt Boekmap Nederlandstalige fictie met als onderwerp een stad, land of regio.
                De app maakt hiervoor dankbaar gebruik van de <a href="http://www.bibnet.be/portaal/Bibnet/Bibliotheekportalen/API/">bibnet API</a> en van <a href="https://www.google.com/intx/en_uk/work/mapsearth/products/mapsapi.html">Google Maps.</a></p>
            <p>Per locatie worden maximaal 20 boeken geselecteerd inclusief korte omschrijving en link naar de catalogus op <a href="http://www.bibliotheek.be/">bibliotheek.be</a>.
            De meeste boeken op boekmap zijn tevens voorzien van een cover.</p>
            <h3>Crowd sourced</h3>
            <p>Boekmap groeit!</p>
            <p>De succesvolle zoekresultaten van elke gebruiker worden bijgehouden in onze database.
            Staan er bij jouw bestemming nog geen boeken? <b>Gebruik ons google autocomplete zoekveld en vul de kaart aan!</b></b></p>
            <article class="text-center noPadding col-lg-4 col-md-4 col-sm-4 col-xs-4 col-xxs">
                <img src="img/icons/country.png"/><br>
                <p class="text-btn">Land</p>
            </article>
            <article class="text-center noPadding col-lg-4 col-md-4 col-sm-4 col-xs-4 col-xxs">
                <img src="img/icons/city.png"/><br>
                <p class="text-btn">Stad</p></article>
            <article class="text-center noPadding col-lg-4 col-md-4 col-sm-4 col-xs-4 col-xxs">
                <img src="img/icons/region.png"/><br>
                <p class="text-btn">Regio</p></article>
        </section>
    </article>
</section>

<section id="map-container" class="">
    <div id="map">    </div>
    <input id="pac-input" class="controls" type="text"
           placeholder="Enter a location">
    <div id="map-overlay">
    </div>
    <input id="map-enable" class="btn" type="button" value="ontgrendel kaart">
</section>

<section id="contact" class="container toplevelSection">
    <article class="row">
        <section class="col-lg-8 col-md-8">
            <h2><em>Contacteer</em> Boekmap</h2>
            <p class="confirmation">Bedankt voor uw bericht!</p>
            <form class="form-horizontal" role="form">
                <input id="name" type="text" placeholder="naam">
                <input id="mail" type="text" placeholder="e-mail adres">   <br>
                <input id="subject" type="text" placeholder="onderwerp">    <br>
                <textarea id="message" placeholder="boodschap" rows="6"></textarea>
                <!-- TODO: reCAPTCHA site key verwijderd. Werkt niet meer: de captcha laadt niet zonder key. -->
                <div class="g-recaptcha" data-sitekey=""></div>
                <input type="button" class="button btn btn-default" id="submit" value="Verstuur">
            </form>
        </section>
        <section class="col-lg-4 col-md-4">
            <h2><em>Tweet</em> mee</h2>
            <div class="text-center">
            <a class="twitter-timeline"  href="https://twitter.com/search?q=BoekMap" data-widget-id="670590928365711360">Tweets over BoekMap</a>
            <script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+"://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>
            </div>
        </section>
    </article>
</section>


<footer>
    <section class="container-fluid">
        <div class="row">
            <article class="col-lg-8 col-lg-offset-2 text-center">
                <p>Created by Bart Delrue - Met dank aan <a href="http://www.bibnet.be/">www.bibnet.be</a></p>
            </article>
        </div>
    </section>
</footer>

<!-- TODO: Google Maps API-key verwijderd (secret). Werkt niet meer: de kaart laadt niet zonder key. Nieuwe versie gebruikt OpenStreetMap. -->
<script src="https://maps.googleapis.com/maps/api/js?key=&signed_in=true&libraries=places&callback=initMap" async defer></script>



</body>

</html>
