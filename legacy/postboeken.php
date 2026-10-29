<?php
header("Access-Control-Allow-Origin: *");

session_start();
if(empty($_SESSION["key"])) {print "no key"; return;}
// TODO: sessiesleutel verwijderd (secret), moet gelijk zijn aan die in index.php. Werkt niet meer tot hier een waarde staat.
if($_SESSION["key"] != "") {print "no valid key"; return;}

$place = $_POST["place"];

insertPlace($place);

function makeConn(){
    // TODO: databasegegevens verwijderd (secrets). Werkt niet meer: vul host/gebruiker/wachtwoord in.
    $host="";
    $username="";
    $password="";
    $db_name="boekmap";

    $mysqli = new mysqli($host, $username, $password, $db_name, "3306");
    return $mysqli;
}
function insertPlace($place)
{
    $conn = makeConn();
    if ($conn->connect_errno) {
        die("connection failed:" . $conn->connect_errno);
    }

    $stmt = $conn->prepare("INSERT INTO books(name, id, type, lat, lng) VALUES(?,?,?,?,?)");

    $stmt->bind_param("sssdd", $place["name"], $place["id"], $place["type"], $place["lat"], $place["lng"]);

    $stmt->execute();

    $stmt->close();
    $conn->close();
}
?>