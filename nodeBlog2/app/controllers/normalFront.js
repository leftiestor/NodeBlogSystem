const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Comment = mongoose.model('Comment');
const Category = mongoose.model('Category');

/*
    帖子列表  /post?pageIndex
             /pageto?pageIndex
             /prevpage?pageIndex.
             /nextpage?pageIndex

 */

function delHtmlTag(str){
    let title = str.replace(/<[^>]+>/g," ");//去掉所有的html标记,转换为空格
    let regEx = /\s+/g;
    title = title.replace(regEx, " ");   //将多个空格转换为一个空格
    return title;
}
//是否登录状态
function isLogin(req, res, next){
	if(req.session.userName){
		next();
	}else{
		return res.redirect("/login");
	}
}
module.exports = (app) => {
    app.use('/', router);
};


router.get('/posts',  (req, res, next) => {
	let username = "";
	if(req.session.userName){
		username =req.session.userName;
	}
    let pagesize = 10;  //每页大小
    let pageIndex = parseInt(req.query.pageIndex) || 1,    //第几页
		postId = req.query.postId;
    let condition = {};
    condition.recycled = false;
    condition._id = postId;
    Post.count(condition, (err, totalCount) => {
        if (err) return next(err);
        console.log("总条数：", totalCount);
        let pageArr = [];
        let pageNum = Math.ceil(totalCount / pagesize);  //一共有多少页
        for (let i = 1; i <= pageNum; i++) {
            pageArr.push(i);
        }
        if (pageIndex > pageNum) {
            pageIndex = pageNum;
            return res.redirect("/posts?pageIndex=" + pageIndex+"&postId="+postId);
        }
        Post.find(condition).sort('-created').populate('category').populate('author')
            .limit(pagesize).skip((pageIndex - 1) * pagesize)
            .exec((err, posts) => {
                if (err) return next(err);
                let trunPost = posts;
                posts.forEach((item,index) => {
                    trunPost[index].content = delHtmlTag(item.content);
                });

                res.render('front/normalIndex', {
                    title: "帖子列表",
                    userName: username,
                    posts: trunPost,
                    pageSize: pagesize,
                    totalCount: totalCount,
                    pageIndex: pageIndex,
                    pageNum: pageNum,
                    pageArr: pageArr,
                    pretty: true
                });
            });
    });
});

//其他博主的首页
router.get('/:blogger/postsList', (req, res, next) => {
    if(!req.params.blogger){
    	return next(new Error("no blogger is provided"));
    }
    let authorId = req.params.blogger;  
    console.log("userId:",authorId);
    let username = "",userid = "",isSelf = false, isCared = false;
    
	if(req.session){
		username =req.session.userName;
		userid = req.session.userId;
		if(authorId == userid){
			isSelf = true;
		}
	}

    let pagesize = 10;  //每页大小
    let pageIndex = parseInt(req.query.pageIndex) || 1;    //第几页

    let condition = {};
    condition.recycled = false;
    User.findOne({"_id":authorId}).exec((err, user)=>{
    	if (err) return next(err);
    	
		user.fans.forEach((item, index)=>{
			console.log("-------",item.toString(),userid);
	 		if(item.toString() == userid){
	 			isCared = true;
	 		}
		});

    	condition.author = user;
	    Post.count(condition, (err, totalCount) => {
	        if (err) return next(err);
	        console.log("总条数：", totalCount);
	        let pageArr = [];
	        if(totalCount == 0){
	         	return res.render('front/normalIndex', {
	                    title: "文章列表",
	                    postAuthorName: user.name,
	                    postAuthorId: authorId,
	                    userName: username,
	                    userId : userid,
	                    isSelf: isSelf,
	                    isCared : isCared,
	                    posts: [],
	                    pageSize: pagesize,
	                    totalCount: 0,
	                    pageIndex: 1,
	                    pageNum: 1,
	                    pageArr: pageArr,
	                    pretty: true
	                });
	        }
	        let pageNum = Math.ceil(totalCount / pagesize);  //一共有多少页
	        for (let i = 1; i <= pageNum; i++) {
	            pageArr.push(i);
	        }
	        if (pageIndex > pageNum) {
	            pageIndex = pageNum;
	            return res.redirect("/"+authorId+"/postsList?pageIndex=" + pageIndex);
	        }
	        Post.find(condition).sort('-created').populate('category').populate('author')
	            .limit(pagesize).skip((pageIndex - 1) * pagesize)
	            .exec((err, posts) => {
	                if (err) return next(err);
	                 console.log("分页条：", posts.length);
	                let trunPost = posts;
	                posts.forEach((item,index) => {
	                    trunPost[index].content = delHtmlTag(item.content);
	                });
	
	                res.render('front/normalIndex', {
	                    title: "文章列表",
	                    postAuthorName: user.name,
	                    postAuthorId: authorId,
	                    userName: username,
	                    userId : userid,
	                    isSelf: isSelf,
	                    isCared : isCared,
	                    posts: trunPost,
	                    pageSize: pagesize,
	                    totalCount: totalCount,
	                    pageIndex: pageIndex,
	                    pageNum: pageNum,
	                    pageArr: pageArr,
	                    pretty: true
	                });
	            });
	    });
    });
});


router.get('/pageto', (req, res, next) => {
    let pagesize = 10;  //每页大小
    let pageindex = parseInt(req.query.pageIndex) || 1,
    	postId = req.query.postId;
    console.log("第：", pageindex, "页");
    res.redirect("/posts?pageIndex=" + pageindex+"&postId="+postId);
});
//上一页
router.get('/prevpage', (req, res, next) => {
    let pageindex = parseInt(req.query.pageIndex) - 1,
    	postId = req.query.postId;
    if (pageindex <= 0) {
        pageindex = 1;
    }
    res.redirect("/posts?pageIndex=" + pageindex+"&postId="+postId);
});
//下一页
router.get('/nextpage', (req, res, next) => {
    let pagesize = 10;  //每页大小
    Post.count({}, (err, totalCount) => {
        if (err) return next(err);
        let pageNum = Math.ceil(totalCount / pagesize);  //一共有多少页
        let pageindex = parseInt(req.query.pageIndex) + 1,
        	postId = req.query.postId;
        if (pageindex > pageNum) {
            pageindex = pageNum;
        }
        res.redirect("/posts?pageIndex=" + pageindex+"&postId="+postId);
    });
});








// 分类 跳转
router.get('/posts/category/:id', isLogin, (req, res, next) => {
    let id = req.params.id;
    res.send("暂空:" + id);
    //res.render();
});


//个人信息
router.get('/userCenter', isLogin, (req, res, next) => {
    res.redirect("/userInfo");
});



//我的后台
router.get('/myadmin', (req, res, next) => {
    res.redirect('/admin');
});


