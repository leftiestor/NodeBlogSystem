const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Category = mongoose.model('Category');


let loginUser = "";

function delHtmlTag(str){
    let title = str.replace(/<[^>]+>/g," ");//去掉所有的html标记,转换为空格
    let regEx = /\s+/g;
    title = title.replace(regEx, " ");   //将多个空格转换为一个空格
    return title;
}
//是否登录状态
function isLogin(req, res, next){
	if(req.session.userName){
		loginUser = req.session.userName;
		next();
	}else{
		return res.redirect("/login");
	}
}


module.exports = (app) => {
    app.use('/', router);
};




//首页
router.get('/', (req, res, next) => {
    res.redirect("/sysHome");
});


router.get('/:blogger/pageto', (req, res, next) => {
	let userId = req.params.blogger;
    let pagesize = 10;  //每页大小
    let pageindex = parseInt(req.query.pageIndex) || 1;
    console.log("第：", pageindex, "页");
    res.redirect("/"+userId+"/posts?pageIndex=" + pageindex);
});
//上一页
router.get('/:blogger/prevpage', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    let pageindex = parseInt(req.query.pageIndex) - 1;
    if (pageindex <= 0) {
        pageindex = 1;
    }
    res.redirect("/"+userId+"/posts?pageIndex=" + pageindex);
});
//下一页
router.get('/:blogger/nextpage', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    let pagesize = 10;  //每页大小
    Post.count({"author":userId}, (err, totalCount) => {
        if (err) return next(err);
        let pageNum = Math.ceil(totalCount / pagesize);  //一共有多少页
        let pageindex = parseInt(req.query.pageIndex) + 1;
        if (pageindex > pageNum) {
            pageindex = pageNum;
        }
        res.redirect("/"+userId+"/posts?pageIndex=" + pageindex);
    });
});


//getAsideInfo 侧边栏信息
router.get('/:blogger/getAsideInfo', (req, res, next) => {
	if(!req.params.blogger){
    	return next(new Error("no blogger is provided"));
    }
	let userId = req.params.blogger;
	console.log("'creator':",userId);
    Category.find({'creator': userId}).sort({"created":"desc"}).exec((err, categories) => {
        if (err) return next(err);
        res.send(categories);
    });
});
// 我的分类 跳转
router.get('/:blogger/category', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    
    res.send("暂空::");
    //res.render();
});
// 单个分类 跳转
router.get('/:blogger/posts/category/:id', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    let id = req.params.id;
    res.send("暂空:" + id);
    //res.render();
});


//个人信息
router.get('/:blogger/userCenter', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    res.redirect("/"+userId+"/userInfo");
});


//我的后台
router.get('/:blogger/myadmin', (req, res, next) => {
	let userId = req.params.blogger;
    res.redirect('/'+userId+'/admin');
});
//自己的首页
router.get('/:blogger/posts', isLogin, (req, res, next) => {
    if(!req.params.blogger){
    	return next(new Error("no blogger is provided"));
    }
    let userId = req.params.blogger;
    console.log("userId:",userId);
    let username = "";
	if(req.session.userName){
		username =req.session.userName;
	}else{
		res.redirect("/login");
		return;
	}
    let pagesize = 10;  //每页大小
    let pageIndex = parseInt(req.query.pageIndex) || 1;    //第几页

    let condition = {};
    condition.recycled = false;
    User.findOne({"_id":userId}).exec((err, user)=>{
    	if (err) return next(err);
    	
    	condition.author = user;
	    Post.count(condition, (err, totalCount) => {
	        if (err) return next(err);
	        console.log("总条数：", totalCount);
	        let pageArr = [];
	        if(totalCount == 0){
	         	return res.render('front/index', {
	                    title: "帖子列表",
	                    userName: username,
	                    userId : userId,
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
	            return res.redirect("/"+userId+"/posts?pageIndex=" + pageIndex);
	        }
	        Post.find(condition).sort('-created').populate('category').populate('author')
	            .limit(pagesize).skip((pageIndex - 1) * pagesize)
	            .exec((err, posts) => {
	                if (err) return next(err);
	                let trunPost = posts;
	                posts.forEach((item,index) => {
	                    trunPost[index].content = delHtmlTag(item.content);
	                });
	
	                res.render('front/index', {
	                    title: "帖子列表",
	                    userName: username,
	                    userId: userId,
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


