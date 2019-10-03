const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment');
const Article = mongoose.model('Article');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Category = mongoose.model('Category');

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

//全局变量
let pageSize = 10,
    pageIndex = 1;
    
//草稿列表      帖子列表0 新建帖子1 分类2 评论3  草稿箱4 回收站5 个人中心6  编辑帖子7
router.get('/:blogger/templatePost', (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName;
    res.render('admin/index', {
        title: '草稿列表',
        navIndex: 4,
        userId : userId,
        userName : userName
    });
	
});

//初始化渲染数据
router.get('/:blogger/templatePost/getTemplateList', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let mongoUserId = mongoose.Types.ObjectId(userId);
	//分页
    pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : pageSize;  //每页大小
    pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : pageIndex;    //第几页

 	//排序条件  默认创建时间倒序排列
    let sortObj = {"created":"desc"};
    
    //查询条件  未删除并且未发布的
    let _filter = {
        $and: [
            {recycled: false},
            {published: false},
            {author: mongoUserId}
        ]
    };
    
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

//发布一个草稿
router.get('/:blogger/templatePost/toPublished', isLogin, (req, res, next) => {
	let postId = req.query.id;
	let conditions = {};
    conditions._id = mongoose.Types.ObjectId(postId);
    console.log("*********",postId);
	Post.update(conditions,{$set:{
            published : true,
            created : new Date(),
            updated: new Date()
        }},(err,post)=>{
            if (err){
                res.send({
                    code:"-1",
                    message: "噢不，发布失败！"
                });
            }else{
                res.send({
                    code:"0",
                    message:"哇，发布成功！"
                });
            }
        })
	
});
//删除--加入回收站
router.get('/:blogger/templatePost/delete', isLogin, (req, res, next) => {
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

