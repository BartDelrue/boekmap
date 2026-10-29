<?php
header("Access-Control-Allow-Origin: *");
header("Content-type: application/xml");
error_reporting(0);
$subject = "";
if (!empty($_GET["subject"])) $subject = str_replace(' ','%20',$_GET["subject"]);
// TODO: bibnet API-key verwijderd (secret). Werkt sowieso niet meer: de bibnet API v0 is offline,
// opvolger is de Cultuurconnect Catalogus API (zie server.js in de nieuwe versie).
$url = 'http://zoeken.bibliotheek.be/api/v0/search/?q=subject:%22' . $subject . '%22format:%22boek%22type:%22fiction%22language:%22dut%22&authorization=';

$string = file_get_contents($url);

echo "<root>" . $string . "</root>";
?>