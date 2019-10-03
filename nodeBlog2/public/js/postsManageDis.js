let isCared = $("#cared_div").attr("data-iscared");
window.onload = function () {

    let pageIndex = parseInt($("#dataTotal").val());  //当前页码
    let pagenum = parseInt($("#dataTotal").prop("data-total"));  //总共页数
    let userId = $("#categories").attr("data-userid");
    console.log(pageIndex);
    init();

    //发布评论
    $("#commentSubmit").click(() => {
        let content = $("textarea[name='content']").val(),
            userName = $("input[name='userName']").val(),
            postId = $("input[name='postId']").val();
        $("textarea[name='content']").val("");
        if (content.trim() == "") {
            alert("还没有输入评论内容。");
        } else {
            $.ajax({
                url: "/"+userId+"/postOne/commentSubmit",
                type: "post",
                data: {
                    content: content,
                    userName: userName,
                    postId: postId
                },
                success: (result) => {
                    if (result.code == "0") {
                        alert(result.message);
                        window.location.reload();
                    }else{
                        alert(result.message);
                        //window.location.reload();
                    }
                },
                error: (err) => {
                    console.log(err);
                }
            })
        }

    })

};
function init(){
	userId = $("#categories").attr("data-userid");
	//获取关于信息 -博龄
    $.ajax({
        url: "/"+userId+"/userInfo/statistic/registerInfo",
        type: "get",
        data: {},
        success: (result) => {
			let timeStr = "";
			if(result.ageYear == 0){
				if(result.ageMonth == 0){
					timeStr = result.ageDay+" 天";
				}else{
					timeStr =result.ageMonth+" 月 " + result.ageDay+" 天";
				}
			}else if(result.ageYear){
				timeStr = result.ageYear + " 年 ";
				if(result.ageMonth == 0){
					timeStr += result.ageDay+" 天";
				}else{
					timeStr +=result.ageMonth+" 月 " + result.ageDay+" 天";
				}
			}
			$("#age").html(timeStr);
        },
        error: (err) => {
            console.log(err);
        }
    });
	//获取关注和粉丝数量
	$.ajax({
        url: "/"+userId+"/userInfo/statistic/caredInfo",
        type: "get",
        data: {},
        success: (result) => {
			if(result.code == "0"){
				$("#fanNum").html(result.fanNum);
				$("#caredNum").html(result.caredNum);
			}
        },
        error: (err) => {
            console.log(err);
        }
    });
	
    //获取侧边栏信息
    $.ajax({
        url: "/getAsideCategory/"+userId,
        type: "get",
        data: {},
        success: (result) => {
            let str = "";
            result.forEach((item, index) => {
                str += `<li><a href="/${userId}/posts/category/${item._id.toString()}">${item.name}</a></li>`;
            });
            $("#categories").html(str);
        },
        error: (err) => {
            console.log(err);
        }
    });
    
    //是否显示评论栏
    if($("#myCommentForm").attr("data-username") !== ""){
    	$("#userName").val($("#myCommentForm").attr("data-username"));
    }else{
    	$("#myCommentForm").html('<p class="alert alert-info">登录后可以评论，<a href="/login">去登录</a></p>');
    }
    
}


//关注和取关 此人
function caredOnOff(postUserName){
	isCared = $("#cared_div").attr("data-iscared");
	if(isCared === "true"){
		isCared = "false";
	}else{
		isCared = "true";
	}
	if(isCared === "true"){  //要关注此人
		$.ajax({
	        url: "/postOne/care/"+postUserName,
	        type: "get",
	        data: {},
	        success: (result) => {
	            if(result.code === "0"){
	           		//关注成功
	           		let thisDiv = $("#cared_div").children('button');
	           		thisDiv.removeClass("btn-outline-danger").addClass("btn-outline-info");
	           		thisDiv.children('a').html('已关注');
	           		$("#cared_div").attr("data-iscared","true");
	           		init();
	            }
	        },
	        error: (err) => {
	            console.log(err);
	        }
	    });
		
	}else{  //要取关此人
		$.ajax({
	        url: "/postOne/careOff/"+postUserName,
	        type: "get",
	        data: {},
	        success: (result) => {
	            if(result.code === "0"){
	           		//取关成功
	           		let thisDiv = $("#cared_div").children('button');
	           		thisDiv.removeClass("btn-outline-info").addClass("btn-outline-danger");
	           		thisDiv.children('a').html('关注');
	           		$("#cared_div").attr("data-iscared","false");
	           		init();
	            }
	        },
	        error: (err) => {
	            console.log(err);
	        }
	    });
	}
}