<?php
print_r($_GET);

if(empty($_GET) || empty($_GET["mail"]) || empty($_GET["key"])) return;

$mail = unserialize(base64_decode($_GET["mail"]));
$key = base64_decode($_GET["key"]);

// TODO: gedeelde sleutel met mail.php verwijderd (secret). Werkt niet meer; de mailfunctie is in de nieuwe versie geschrapt.
if ($key != md5("")) return;
if(empty($mail["name"]) || empty($mail["email"]) || empty($mail["subject"]) || empty($mail["message"]) ) return;

if(!filter_var($mail["email"], FILTER_VALIDATE_EMAIL)) return;

ini_set("sendmail_from", $mail["email"]);
// TODO: ontvangstadres verwijderd. Werkt niet meer tot hier een adres staat.
$result = mail("", htmlentities($mail["subject"]), htmlentities($mail["message"]));

if(!$result) {
    echo "Error";
} else {
    echo "Success";
}
