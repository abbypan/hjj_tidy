// --------------------------------------------------------------------
//
// ==UserScript==
// @name          hjj_tidy
// @namespace     http://abbypan.github.io/
// @version       0.1
// @author        Abby Pan (abbypan@gmail.com)
// @description   红晋江( http://bbs.jjwxc.net ) 贴子整理，去广告，加跳转，只看楼主，最少字数等等
// @copyright     2014, Abby Pan (http://abbypan.github.io/) 
// @include       http://bbs.jjwxc.net/showmsg.php?board=*&id=*
// @grant         none
// ==/UserScript==
//
// --------------------------------------------------------------------


function extract_floor_info(info) {
    var c = info.html()
    .replace(/\s*<font color="gray" size="-1">.*?<\/font><br>/,'')
    ;
    var w = info.text().length;
    var meta = info.parents("tr:eq(1)").next().text();

    var m = meta.match(/№(\d+).+?☆☆☆(.*?)于([\d\s:-]+)留言☆☆☆/);
    return {
        content: c,
        word_num: w,
        id: parseInt(m[1]),
        poster: m[2] || ' ',
        time: m[3]
    };
}

function format_floor_content(f) {
    var html = '<div class="floor" id="floor' + f.id + '" fid="'+ f.id +'">' +
        '<div class="flcontent" word_num="' + f.word_num + '">' + f.content + '</div>' +
        '<span class="chapter">№' + f.id + '<span class="star">☆☆☆</span><span class="floor_poster">' + f.poster + '</span><span class="star">于</span>' + f.time + '留言<span class="star">☆☆☆</span></span>' +
        '&nbsp;&nbsp;&nbsp;' +
        '<a  class="reply_thread_floor" reply_type="cite" href="#">&raquo;</a>' + 
        '&nbsp;&nbsp;&nbsp;' +
        '<a  class="reply_thread_floor" reply_type="default" href="#">&rsaquo;</a>' + 
        '&nbsp;&nbsp;&nbsp;' +
        '<a class="jump_to_top" href="#">&uArr;</a>' + 
        '&nbsp;&nbsp;&nbsp;' +
        '<a class="jump_to_bottom" href="#">&dArr;</a>' + 
        '&nbsp;&nbsp;&nbsp;' +
        '<a class="jump_to_prev" href="#">&uarr;</a>' + 
        '&nbsp;&nbsp;&nbsp;' +
        '<a class="jump_to_next" href="#">&darr;</a>' + 
        '&nbsp;&nbsp;&nbsp;' +
        '<span class="temp_floor"></span>' + 
        '</div>';
    //'<a href="#jump_floor" data-rel="popup" data-position-to="window" data-transition="pop">&#9735;</a>' + 
    //'&nbsp;&nbsp;&nbsp;' +
    //'<a class="mark_floor" href="#">&#9875;</a>' + 
    //'&nbsp;&nbsp;&nbsp;' +
    return html;
}

function extract_showmsg_content(d){
    var res = {};
    var tm = d.match(/<title>(.+?)<\/title>/);
    res["title"]  = tm[1].replace(/ ―― 晋江文学城网友交流区/,'');


    var pm = d.match(/\>(共\d+页:.+?)<\/div>/);
    res["pager"] = pm ? pm[1].replace(/<\/a>/g, '</a>&nbsp;') : '';

    var h = $.parseHTML(d);

    res["banner"] = $(h).find('a').eq(0).parent().html();
    res["reply_form"] = $(h).find('input[name="last_floor"]').parent().prop('outerHTML');

    var poster = '';

    var floors_info = new Array();
    $(h).find('td[class="read"]').each(function() {
        var bot = $(this);
        var f_i =  extract_floor_info(bot);
        if(!poster) poster = f_i.poster;

        var html = format_floor_content(f_i);
        floors_info.push(html);
    }).promise().done(function(){
        var all_floor = floors_info.join("\n");
        res["floor_list"] = all_floor;
        res["poster"] = poster;
    });

    return res;
}

function get_css(){
    return '<style> \
    body { margin-left : 10%; margin-right: 10% } \
    .pager,#thread_action { border: 0.1em solid rgb(153, 204, 0); } \
    .flcontent { padding-bottom : 0.5em; } \
    .floor,.onethread { \
    border-bottom: 0.1em solid rgb(153, 204, 0);  \
    margin: 0.8em 0.2em 1.2em;  \
    text-indent: 0em;  \
    padding-bottom: 0.25em; \
    } \
    #thread_title { font-weight: bold;backgound-color:#E8F3FF; } \
    .star { color: #d4db8e; font-weight: bold; } \
    </style> \
    ';
}

function div_thread_action(){
    return '<div id="thread_action"> \
        <input size="10" type="text" name="word_num" value=50 id="min_word_num_input" >  \
        <a href="#" id="min_word_num">字数</a> \
        &nbsp; <input size="10" type="text" name="floor_keyword" id="floor_keyword_input" placeholder="关键字">  \
        <a href="#" id="floor_keyword">抽取</a>  \
        &nbsp; <a href="#" id="floor_filter">过滤</a>  \
&nbsp; &nbsp; &nbsp; \
        <a href="#" id="only_poster">楼主</a>  \
        &nbsp; <a href="#" id="view_img">看图</a>  \
        &nbsp; <a href="#" id="reverse_floor">倒序</a>  \
        &nbsp; <a id="view_all_floor" href="#">全部</a>  \
        <span id="thread_action_temp"></span>  \
        </div>';
}

function get_js(){
return 'function filter_floor(is_to_filter,msg) { \
    var i = 0; \
    $(".floor").each(function() { \
        if(i>0 && is_to_filter($(this))) $(this).hide();  \
        i=1; \
    }); \
 \
    if(msg) $("#thread_action_temp").html(msg); \
} \
 \
function view_img(){ \
    var is_to_filter = function(f){ \
        var c = f.find(".flcontent").eq(0).html(); \
        return  c.match(/\\<img /i) ? 0 : 1; \
    }; \
 \
    filter_floor(is_to_filter, "只看图"); \
} \
 \
function floor_keyword(){ \
    var k = $("#floor_keyword_input").val(); \
 \
    var is_to_filter = function(f){ \
        var c = f.find(".flcontent").text().match(k); \
        var p =  f.find(".floor_poster").text().match(k); \
        return  (c || p) ? false : true; \
    }; \
 \
    filter_floor(is_to_filter, "抽取" + k); \
} \
 \
function floor_filter(){ \
    var k = $("#floor_keyword_input").val(); \
 \
    var is_to_filter = function(f){ \
        var c = f.find(".flcontent").text().match(k); \
        var p =  f.find(".floor_poster").text().match(k); \
        return  (c || p) ? true : false; \
    }; \
 \
    filter_floor(is_to_filter, "过滤" + k); \
} \
 \
function min_word_num(){ \
    var min = $("#min_word_num_input").val(); \
 \
    var is_to_filter = function(f){ \
        var c = f.find(".flcontent").attr("word_num"); \
        return  c<min; \
    }; \
 \
    filter_floor(is_to_filter, "最少" + min + "字"); \
} \
 \
function view_all_floor(){ \
    $(".floor").each(function() { \
        $(this).show(); \
    }); \
    $("#thread_action_temp").html("全部"); \
} \
 \
function get_showmsg_poster(){ \
    if($(".floor").eq(0).find(".floor_poster").length>0){ \
        return $(".floor").eq(0).find(".floor_poster").text(); \
    } \
    return; \
} \
 \
function only_poster(){ \
    var poster = get_showmsg_poster(); \
    var is_to_filter = function(f){ \
        var flposter = f.find(".floor_poster").text(); \
        return  flposter!=poster ; \
    }; \
 \
    filter_floor(is_to_filter, "只看楼主"); \
} \
 \
function reverse_floor(){ \
    var s = []; \
    $(".floor").each(function(){ \
        s.push($(this).prop("outerHTML")); \
    }); \
    var c = s.reverse().join("\\n"); \
    $("#thread_floor_list").html(c); \
    $("#thread_action_temp").html("倒序"); \
} \
 \
function reply_thread_floor(){ \
 \
                                    $("#reply").find("textarea").val(""); \
                                    var reply_type = $(this).attr("reply_type"); \
                                    var c = $(this).parent().children(".chapter").text().replace(/\\n/g, " "); \
                                    if(reply_type=="cite")  \
                                        c = "" +  \
                                        $(this).parent().children(".flcontent").text().replace(/(\\s*\\n)+/g, "\\n").trim().substr(0, 300) +  \
                                    "......\\n\\n" + c ; \
                                    $("#reply").find("textarea").val(c.trim()+"\\n"); \
 \
                                    var pos = $("#reply").offset().top; \
                                    $("html,body").animate({ scrollTop : pos },500); \
} \
';
}

(function(){
    $ = unsafeWindow.jQuery;
    var d = $('body').html();
    var res = extract_showmsg_content(d);
    $('head').html(
                   '<title>' + res["title"] + '</title>' + 
                   '<script>' + get_js() + '</script>' +
                   get_css()  
                  );
                  $('body').html( 
                                 '<div id="thread_info">' + res["banner"] + '<br><br>' + 
                                 '<div id="thread_title">' + res["title"] + "</div><br>" + 
                                 div_thread_action() + 
                                 '</div><br>' + 
                                 '<div id="pager_top" class="pager">' + res["pager"] + '</div>' +
                                 '<div id="thread_floor_list">' + res["floor_list"] + '</div>' +
                                 '<div id="pager_bottom" class="pager">' + res["pager"] + '</div>' +
                                 '<div id="reply">' + res["reply_form"] + '</div>'
                                );

                                $('body').on('click', '.jump_to_top', function(){
                                    $('html,body').animate({ 'scrollTop': 0 }, 500);
                                });

                                $('body').on('click', '.jump_to_bottom', function(){
                                    var f = $('#pager_bottom').offset();
                                    $("html,body").animate({ scrollTop : f.top },500);
                                });

                                $('body').on('click','.jump_to_next', function(){
                                    var x = $(this).parent().nextAll();
                                    var i = 50-1;
                                    if(x[i]) {
                                        var pos = $(x[i]).offset().top;
                                        $("html,body").animate({ scrollTop : pos },500);
                                    }
                                });

                                $('body').on('click','.jump_to_prev',  function(){
                                    var x = $(this).parent().prevAll();
                                    var i = 50-1;
                                    if(x[i]) {
                                        var pos = $(x[i]).offset().top;
                                        $("html,body").animate({ scrollTop : pos },500);
                                    }
                                });


                                $('body').on('click', '.reply_thread_floor',function(){
                                    $('#reply').find('textarea').val('');
                                    var reply_type = $(this).attr("reply_type");
                                    var c = $(this).parent().children('.chapter').text().replace(/\n/g, ' ');
                                    if(reply_type=="cite") 
                                        c = "" + 
                                        $(this).parent().children('.flcontent').text().replace(/(\s*\n)+/g, "\n").trim().substr(0, 300) + 
                                    "......\n\n" + c ;
                                    $('#reply').find('textarea').val(c.trim()+"\n");

                                    var pos = $('#reply').offset().top;
                                    $("html,body").animate({ scrollTop : pos },500);
                                });

    $('body').on('click', '#view_img', function(){ view_img(); });
    $('body').on('click', '#only_poster', function(){ only_poster(); return false; });
    $('body').on('click', '#min_word_num',function(){ min_word_num(); return false; });
    $('body').on('click', '#floor_keyword',function(){ floor_keyword(); return false; });
    $('body').on('click', '#floor_filter',function(){ floor_filter(); return false; });
    $('body').on('click', '#view_all_floor', function(){ view_all_floor();return false; });
    $('body').on('click', '#reverse_floor', function(){ reverse_floor();return false; });
})();
