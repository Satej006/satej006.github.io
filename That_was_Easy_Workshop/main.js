function sayThatWasEasy()
{
    var thatWasEasy = new Audio("that_was_easy.mp3");
    thatWasEasy.play();
}

/* global $*/
$("#easy").on("click", sayThatWasEasy);