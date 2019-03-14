// create object for thread holding
var threads = {}

// setup initial ajax function
var ajax = function(url, callback){
    let data_array, req, value;
    if (callback == null){
        callback = ()=>{};
    }
    req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onreadystatechange= function(){
        if (req.readyState === 4 && req.status === 200){
            return callback(req.responseText);
        }
    };
    req.send(null);
    return req;
};

// Add eventlistener for messages
self.addEventListener('message',function(e){
    if(e.data.status === "start"){
        threads[e.data.hash] = setInterval(() => {
            // ask for download status
            ajax("/torrent/percent/"+e.data.hash,function(data){
                // set targetOrigin to webworker location //
                // protocol://fqdn
                self.postMessage([data]);
            })

        },2000);
    }else{
        // remove thread if download is finished
        clearInterval(threads[e.data.id]);
    }
}, 'POST');


