setInterval(showTime, 1000)
 
function showTime() {
    var x = new Date()
    document.getElementById('clock').innerHTML = x;    
}

showTime();