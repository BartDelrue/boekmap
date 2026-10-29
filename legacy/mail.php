<?php
header("Access-Control-Allow-Origin: *");
if (empty($_POST["mail"])) return;
$mail = $_POST["mail"];
// TODO: reCAPTCHA secret verwijderd (secret). Werkt niet meer: elke captcha-controle faalt tot hier een geldige secret staat.
$recaptcha_secret = "";
$response = file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret=".$recaptcha_secret."&response=".$_POST["captcha"]);
$response = json_decode($response, true);
if($response["success"] === true)
{
    if(empty($mail["name"]) || empty($mail["email"]) || empty($mail["subject"]) || empty($mail["message"]) ) return;
    if(!filter_var($mail["email"], FILTER_VALIDATE_EMAIL)) return;
    // TODO: gedeelde sleutel met receiveMail.php en het adres van de mailserver verwijderd. Werkt niet meer; de mailfunctie is in de nieuwe versie geschrapt.
    file_get_contents('http://MAILSERVER/api/mail.php?mail='.base64_encode(serialize($mail)).'&key='.base64_encode(md5("")));
}
else {
    print "pwoat pwoat pwoat";
}


