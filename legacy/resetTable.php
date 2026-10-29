<?php

$place = $_POST["place"];

function makeConn(){
    // TODO: databasegegevens verwijderd (secrets). Werkt niet meer: vul host/gebruiker/wachtwoord in.
    $host="";
    $username="";
    $password="";
    $db_name="";

    $mysqli = new mysqli($host, $username, $password, $db_name, "3306");
    return $mysqli;
}

$conn = makeConn();
if ($conn->connect_errno) {
    die("connection failed:" . $conn->connect_errno);
}

$stmt = $conn->prepare("INSERT INTO books_new(name, id, type, lat, lng) VALUES(?,?,?,?,?)");

$stmt->bind_param("sssdd", $place["name"], $place["id"], $place["type"], $place["lat"], $place["lng"]);

$stmt->execute();

$stmt->close();
$conn->close();