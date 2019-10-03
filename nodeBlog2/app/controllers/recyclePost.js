const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment');
const Article = mongoose.model('Article');
const Post = mongoose.model('Post');
const DeletedPost = mongoose.model('DeletedPost');
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
    
//回收站列表      帖子列表0 新建帖子1 分类2 评论3 草稿箱4 回收站5 个人中心6  编辑帖子7
router.get('/:blogger/recyclePost', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName;
    res.render('admin/index', {
        title: '回收站列表',
        navIndex: 5,
        userId : userId,
        userName: userName
    });
	
});

//初始化获取回收列表
router.get('/:blogger/recyclePost/getRecycleList', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	//分页
    pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : pageSize;  //每页大小
    pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : pageIndex;    //第几页

 	//排序条件  默认创建时间倒序排列
    let sortObj = {"created":"desc"};
    
    //查询条件  已经删除的
    let _filter = {
    	recycled: true ,
    	author: userId
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

//恢复此条篇文章
router.get('/:blogger/recyclePost/comeBack', isLogin, (req, res, next) =>{
	let userId = req.params.blogger;
	let postId = req.query.id;
	let conditions = {
		_id : postId
	}
	
	Post.update(conditions, {$set:{
		recycled: false,
		updated:new Date() 
	}}, (err, post) =>{
		if (err){
                res.send({
                    code:"-1",
                    message: "噢不，操作失败，请稍后再试！"
                });
            }else{
                res.send({
                    code:"0",
                    message:"已恢复此篇文章！"
                });
            }
	})
	
});

//彻底删除文章（转移文章到deletePost数据表）
router.get('/:blogger/recyclePost/delete', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let postId = req.query.id;
	//从post数据表中移动到deletedPost数据表中，对外表现为彻底删除了
	Post.findOne({_id : postId}).populate('category').populate('author')
        .exec((err, post) => {
        	let oldId = post._id.toString();
        	let delPost = new DeletedPost({
        		title: post.title,
				content: post.content,
				slug: post.slug,
				category: post.category,
				tag : post.tag,
				author: post.author,
				published: post.published,   //是否发布，默认不发布
				meta : post.meta,   //clicks点击量 favorites喜欢 dislikes不喜欢
				comments: post.comments,
				recycled:post.recycled,   //是否被回收，默认没有被回收
				created : new Date(),
				updated: post.updated     //最近一次修改时间
        	});
        	delPost.save((err, post) => {
				if(err){
				    console.log("can't save this deletedpost!");
				    res.send({
					    code:"-2",
					    message:"不能成功移存。"
					});
				}else{
				    console.log("saved a new deletedpost.");
				    Post.findByIdAndRemove(oldId, (err, result) =>{
				    	if(err){
				    		return new Error("can't remove this post.");
				    		res.send({
							    code:"-1",
							    message:"操作失败，请稍后再试。"
							});
				    	}else{
				    		res.send({
							    code:"0",
							    message:"彻底删除成功！"
						    });
				    	}
				    });
				}
				
			});
        	
        });
	
	
});
