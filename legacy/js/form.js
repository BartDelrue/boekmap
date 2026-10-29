window.addEventListener("load", function () {init();});

var submit = null;
var form = null;
var conf = null;
var name, email, subject, message;

function init(){
    'use strict';

    submit = document.getElementById("submit");
    submit.addEventListener("click", function () {formSend();});
    form = document.forms[0];
    form.addEventListener("change", function () {formValidate();});
    conf = document.getElementsByClassName("confirmation")[0];
}

function formSend(){
    'use strict';

    var name = document.getElementById("name");
    var email = document.getElementById("mail");
    var subject = document.getElementById("subject");
    var message = document.getElementById("message");

    if (formValidate()){
        var mail = {
            "name":name.value,
            "email":email.value,
            "subject":subject.value,
            "message":message.value
        };

        if (grecaptcha.getResponse() != "") {
            $.ajax({
                type: "POST",
                url: "./mail.php",
                data: {mail: mail, captcha:grecaptcha.getResponse()}
            });
        }
        else {
            return;
        }

        form.style.maxHeight = "0px";
        setTimeout(function () {
            conf.style.maxHeight = 1000 + "px";
            conf.style.fontSize = 2 + "em";
            conf.style.padding = 50 + "px";},900);
    }
}

function formValidate()
{
    'use strict';

    var Tname = /^[^ ][\u0080-\u00FF\w ']{2,35}$/igm; //unicode, geen leestekens behalve ' en 2 tot 35 tekens
    var Tmail= /^[\u0080-\u00FF\w.0-9]{2,35}[@]{1}[\u0080-\u00FF\w.0-9]{2,25}[.]{1}[\u0080-\u00FF\w.0-9]{2,14}$/igm; //unicode + nummers + puntjes + één @ plus zelfde als ervoor
    var Ttekst= /^[\u0080-\u00FF\w "'.!?:\n\t\r,()]+$/igm; //geen ; of < of >


    var name = document.getElementById("name");
    var mail = document.getElementById("mail");
    var subject = document.getElementById("subject");
    var message = document.getElementById("message");

    var check = true;

    if(!Tname.test(name.value) && name.value != "") {name.style.border = "2px solid #800000"; check=false; console.log(name.value);}
    else {name.style.cssText = null;}
    if(!Tmail.test(mail.value) && mail.value != "") {mail.style.border = "2px solid #800000";check=false;}
    else {mail.style.cssText = null;}
    if(!Ttekst.test(subject.value) && subject.value != "") {subject.style.border = "2px solid #800000";check=false;}
    else {subject.style.cssText = null;}
    Ttekst= /^[\u0080-\u00FF\w "'.!?:\n\t\r,()]+$/igm;
    if(!Ttekst.test(message.value) && message.value != "") {message.style.border = "2px solid #800000";check=false;}
    else {message.style.cssText = null;}

    if (name.value == "" || mail.value == "" || subject.value == "" || message.value == "") check = false;

    submit.disabled = !check;
    return check;
}
