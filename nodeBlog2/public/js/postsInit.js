window.onload = function () {

    let pageIndex = parseInt($("#dataTotal").val());  //当前页码
    let pagenum = parseInt($("#dataTotal").prop("data-total"));  //总共页数
    let userId = $("#categories").attr("data-userid");
    console.log(pageIndex);
    //获取侧边栏信息
    $.ajax({
        url: "/"+userId+"/getAsideInfo",
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


}
