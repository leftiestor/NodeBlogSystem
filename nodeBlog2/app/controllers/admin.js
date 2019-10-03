const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment');
const Article = mongoose.model('Article');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Category = mongoose.model('Category');


module.exports = (app) => {
    app.use('/', router);
};

//是否登录状态
function isLogin(req, res, next){
	if(req.session.userName){
		next();
	}else{
		return res.redirect("/login");
	}
}

//文章列表           帖子列表0 新建帖子1 草稿箱2 回收站3  编辑帖子4
router.get('/:blogger/admin', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName;
    res.render('admin/index', {
        title: '帖子列表',
        navIndex: 0,
        userId: userId,
        userName : userName
    });

});
//全局变量
let pageSize = 10,
    pageIndex = 1,
    sortWay = "created",
    sortType = "desc",
    title = "",
    content = "";
    
//初始化调用接口
router.get('/:blogger/admin/getPostList', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    //分页
    pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : pageSize;  //每页大小
    pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : pageIndex;    //第几页


    //排序条件
    if (['title', 'category', 'created', 'meta.clicks'].indexOf(sortWay) === -1) {
        sortWay = "created";
    }
    if (['desc', 'asc'].indexOf(sortType) === -1) {
        sortType = "desc";
    }
    let sortObj = {};
    sortObj[sortWay] = sortType;
    //查询条件
    let _filter = {
        $and: [
            {recycled: false},
            {author: userId},
            {title: {$regex: title, $options: '$i'}},
            {content: {$regex: content, $options: '$i'}}
        ]
    };
    //console.log(pageSize,pageIndex,sortType,sortWay,title,content);
    Post.count(_filter, (err, totalCount) => {
        if (err) return next(err);
        console.log("总条数：", totalCount);
        let pageNum = Math.ceil(totalCount / pageSize);  //一共有多少页
        pageIndex = pageIndex > pageNum ? pageNum : pageIndex;
        pageIndex = pageIndex === 0 ? 1 : pageIndex;

        Post.find(_filter).sort(sortObj).populate('category').populate('author')
            .limit(pageSize).skip((pageIndex - 1) * pageSize)
            .exec((err, posts) => {
                if (err) return next(err);
                let timeList = [];
                timeList[0] = [];  //创建时间
                timeList[1] = [];   //更新时间
                posts.forEach((item, index) => {
                    timeList[0].push(moment(item.created).format("YYYY-MM-DD HH:mm"));
                    timeList[1].push(moment(item.updated).format("YYYY-MM-DD HH:mm"));
                });
                res.send({
                    posts: posts,
                    timeList: timeList,
                    pageSize: pageSize,
                    totalCount: totalCount,
                    pageIndex: pageIndex,
                    pageNum: pageNum
                });
            });
    });

});


//文章查看
router.get('/:blogger/admin/look', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    res.redirect("/"+userId+"/postOne/dis/" + req.query.id);
});

//编辑修改
router.get('/:blogger/admin/edit', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    res.redirect("/"+userId+"/newPost/edit?id=" + req.query.id);

});
//删除--加入回收站
router.get('/:blogger/admin/delete', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    let postId = req.query.id;
    let condition = {_id: postId};
    Post.update(condition, {
        $set: {
            recycled: true
        }
    }, (err, post) => {
        if (err) {
            res.send({
                code: "-1",
                message: "噢不，删除失败！"
            });
        } else {
            res.send({
                code: "0",
                message: "成功收回到回收站！"
            });
        }

    });
});

//查询
router.post("/:blogger/admin/search", isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    if (req.body.title === undefined || req.body.title === "") {
        title = "";
    } else {
        title = req.body.title;
    }
    if (req.body.content === undefined || req.body.content === "") {
        content = "";
    } else {
        content = req.body.content;
    }
    res.redirect('/'+userId+'/admin/getPostList?title=' + title + '&content=' + content);


});
//排序方式
router.get("/:blogger/admin/sort", isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    sortWay = req.query.sortWay ? req.query.sortWay : sortWay;
    sortType = req.query.sortType ? req.query.sortType : sortType;
    pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : pageIndex;   //第几页
    res.redirect("/"+userId+"/admin/getPostList?sortWay=" + sortWay + "&sortType=" + sortType + "&pageIndex=" + pageIndex);

});


