'use strict';

module.exports =  function syncFor(index,len,status,post_id,func){
    func(index,status,post_id,function(res){
        if(res === "next"){
            if((index + 25) <= len) {
                console.log((index + 25) + '   is less than  ' + len);
                index = index + 25;
            } else {
                index = index + (len - index);
                console.log('current index is ' + index + 'Length is ' + len);
            }

            if(index<len){
                syncFor(index,len,"r",post_id,func);
            } else {
                return func(index,"done",function(){})
            }
        }
    });
}