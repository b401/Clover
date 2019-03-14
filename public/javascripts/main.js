// Initialize Worker
var worker = new Worker('javascripts/webworker.js');

/**
 * Check if still needed
 *
 *
 *
function stop(id){
    $.ajax({
        type: "GET",
        url: "/stream/"+id+"/stop",
    });
}
 */

/**
 *
 * Get status for current torrents
 *
 * @params [object] $elements
 * @return void
 *
 */
function tstatus(elements){
    $.get('/torrent/status',
        function(returnedData){
            createDropDown(returnedData);
        }
    );
    updateDropDown();
}

/**
 *
 * Change torrent status.
 * Values:
 *  - done
 *  - stopped
 *  - active
 *
 * @params  [object] $elements,
 *          [bool]   $del
 * @return void
 *
 *
 */
function change(elements,del=true){
    let pbar = $(elements).siblings('div.progress-bar')[0];
    let func = $(elements).attr("role");
    worker.postMessage(
        data = {
            id : pbar.id,
            status   : "done"
        }
    );
    $.post('/torrent/change', {torrentID:pbar.id,state:func},()=>{});
}

/**
 *
 * Wait till dropdown exist and change data (torrent list)
 *
 * @params -
 * @return void
 *
 */
function updateDropDown(){
    const ul = $('ul.dropdown-menu')
    ul.arrive("div.active",{onceOnly: true},() => {
        let ids = $('div.active');
        for ( let elements of ids){
            data = {
                hash : elements.id,
                id : $(elements).attr("data"),
                status   : "start"
            };

            worker.postMessage(data);
        };

        $("span.control").on('click',function(){
            change(this);
        });

    })
}

/**
 *
 * Change DOM to show current torrent status.
 *
 * @params [object] ob
 * @return void
 *
 */
function changeTorrentData(ob){
    for( let elements of JSON.parse(ob)){
        let color = {
            state: function(state,id){
                switch(state){
                    case "STOPPED":
                        this.grey(id);
                        break;
                    case "DONE":
                        change(id,false);
                        break;
                    default:
                        this.def(id);
                        break;
                }
            },
            grey: function(id){
                $("#"+id).removeClass("active");
                $("#"+id).addClass("inactive");
            },
            def: function(id){
                $("#"+id).removeClass("inactive");
                $("#"+id).addClass("active");
            },
        }

        $('[data="'+elements.id+'"]')
            .attr("style",`width:${elements.down}%`)
            .attr("aria-valuenow",elements.down)
            .attr("title",`D-Speed:${elements.Dspeed}\nU-Speed:${elements.Uspeed}\nLeft:${elements.left}`);
        if(elements.down == 100){
            data = {
                id : $('[data="'+elements.id+'"]')[0].id,
                status   : "done"
            };
            worker.postMessage(data);
        }


        let bar = $('[data="'+elements.id+'"]')[0].id;
        color.state(elements.tstate,bar);

    }
}



/**
 *
 * Create new dropdown menu
 *
 * @params [array] $data
 * @return void
 *
 */
function createDropDown(data){
    let dropdown = $("ul.dropdown-menu.dropdown-menu-right");
    dropdown.empty();
    data.forEach(function(torrent){
        $('<li/>').prepend(
            $('<div/>',{
                text: torrent.name,
                role: "progressbar",
                id: torrent.id,
                class: "progress-bar progress-bar-striped active",
                style: "width:"+torrent.down+"%",
            }).attr({
                "data": torrent.realid,
                "aria-valuenow":torrent.down,
                "aria-valuemin":"0",
                "aria-valuemax":"100",
        })).append(
            $('<span/>',{
                class: "glyphicon glyphicon-play control",
                role: "play"
        })).append(
            $('<span/>',{
                class: "glyphicon glyphicon-pause control",
                role: "pause"
        })).append(
            $('<span/>',{
                class: "glyphicon glyphicon-remove control",
                role: "remove"
        })).appendTo(dropdown);


    });


}

/**
 *
 * Start download of clicked torrent link
 *
 * @params [string] $id
 * @return void
 *
 */
function download(id){
    $.post('/torrent', {tid:$(id)[0].id},
        function(returnedData){}
    );
}


/**
 *
 * Manipulate DOM to create a new streaming overlay.
 * Add all movie types for more compatibility
 *
 * @params [object] $obj
 * @return void
 *
 */
function popup(obj){
    console.log("fired once");
    let id = $(obj).closest('div.wrapper').attr('id')

    $('#popup').append("<video> ");
    $("<source type='video/ogg'> <source type='video/webm'> <source type='video/mp4'>").appendTo("video");
    $('video').attr("id","controls");
    $('video').attr("class","video-js");
    $('video').attr("controls","controls");
    $('video').attr("preload","auto");
    $('source').attr("autoplay","autoplay");
    $('source').attr("src","/stream/"+id);
    $('#popup').bPopup({
        onOpen: function() {

            $('#popup').css("visibility","visible");
        },
        onClose: function(){
            $('source').remove();
            $('video').remove();
        }
    });
}


/**
 *
 * Create a Modal for user interactions
 *
 * @params  [string] $title,
 *          [string] $text,
 *          [bool]   $q,
 * @return  [string] $cb
 *
 */
function createModal(title,text,q=false,cb){
    // clear last messages
    $('#infotitle').text("");
    $('#infomessage').text("");
    $('#infoquestion').text("");

    $('#infotitle').text(title);
    $('#infomessage').html(text);
    //

    if(q){
        console.log("Is that a question?");
        let q = `
            <button type='button' id='removebtn' class='btn btn-primary' data-dismiss='modal'>Yes</button>
            <button type='button' class='btn btn-secondary' data-dismiss='modal'>No</button>
        `;
        $('#infoquestion').html(q);
    }else{
        let q = `
            <button type='button' id='okbtn' class='btn btn-primary' data-dismiss='modal'>ok</button>
        `;
        $('#infoquestion').html(q);
    }
    $('#infobox').modal();
    cb("#infobox");
}

/**
 *
 * Remove listed movie and send information to backend.
 *
 * @params [object] $obj
 * @return void
 *
 */
function remove(obj){
    let id = $(obj).closest('div.wrapper').attr('id');
    $.post('/movie/delete', {tid:id},
        function(err,returnedData){
            console.log("ERROR: " + err);
            console.log("RETURN: " +returnedData);
            $(obj).closest($("div.dex")).fadeOut();
        }
    );
}

/**
 *
 * Remove tag for filtering and send information to backend
 *
 * @params [object] $obj
 * @return void
 *
 */
function removeTag(obj){
    let dtag = $(obj)[0].id;
    $.post('/dtag', {dtag},
        function(callback){
            console.log(callback);
            $(obj).parent().fadeOut();
        }
    );
}

/**
 *
 * Add new tag for filtering and send information to backend.
 * Also stop next exectuion
 *
 * @params [object] $obj
 * @return void
 *
 */
function addTag(obj){
    let inputele = "<input class='tagname form-control addnew form-control-sm'></input>"
    const glyph = "<span class='deladd glyphicon glyphicon-minus'></span>"
    let eletoCopy = $(".blacklist").first();
    eletoCopy.clone().html(inputele).insertBefore('#add').append(glyph);
    $("input.tagname").focus();
    $("span.deladd").on('click',function(){
        $("span.deladd").parent().fadeOut();
    });
    $("input.tagname").on('keypress',function(e){
        let keycode = e.keyCode || e.which;
        // Prevent form send.
        if(keycode == 13 || keycode == 9){
            e.preventDefault();
            saveTag($(this).val());
        }
    });
}

/**
 *
 * Send Tag to backend
 *
 * @params [string] $tag
 * @return void
 *
 */
function saveTag(tag){
    $.post('/atag', {tag},function(callback){}
    );
}


// Eventlistener
$(function(){

    /** Security fix - See vulnerability report
    * Only accept values from the webworker object.
    * No message-listener is needed that way :)
    */
    worker.onmessage = function(e) {
        changeTorrentData(e.data);
    }

    $("span.remove").on('click',function(){
        let that = this;
        createModal("Remove","Do you really want to remove this movie?",1,function(answer) {
            $("button#removebtn").on('click',function(){
                $(answer).on('hidden.bs.modal',function(e){
                    remove(that);
                });
            });
        });
    });

    // click on view
    $("button.location.view").on('click',function(){
        popup(this);
    });


    // Download torrent
    $("img.media-object").on('click',function(){
        download(this);
    });

    // Get current status
    $("button#status").on('click',function(){
        tstatus(this);
    });

    // remove tag
    $("span.del").on('click',function(){
        removeTag(this);
    });

    // add tag
    $("span#add").on('click',function(){
        addTag(this);
    });

    // Keep dropdown open after click
    // https://stackoverflow.com/questions/21982308/bootstrap3-keep-the-dropdown-menu-open-after-click-on-the-item
    $(".dropstatus .dropdown-menu").on({
        "click":function(e){
            e.stopPropagation();
        }
    });
});

