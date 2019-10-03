
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const slug = require('slug');
const pinyin = require('pinyin');
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

//新建帖子     帖子列表0 新建帖子1 分类2 评论3 关注4 粉丝团5  草稿箱6 回收站7 个人中心8  编辑帖子9
router.get('/:blogger/newPost',isLogin, (req, res, next) => {
    let userId = req.params.blogger;
    res.render('admin/index', {
        title: '发表新文',
        postId:"",
        navIndex: 1,
        userId :userId,
        userName: req.session.userName
    });
});
router.get('/:blogger/newPost/edit', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	console.log(req.query.id);
    if (!req.query.id) {
        return next(new Error("no post id provided"));
    }else{
    	
        res.render('admin/index', {
            title: '编辑文章',
            postId:req.query.id,
            navIndex: 7,
            userId :userId,
            userName: req.session.userName
        });
    }
});
//返回帖子信息
router.post('/:blogger/newPost/edit', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
    let postId = req.body.id;
    if (!postId) {
        return next(new Error("no post id provided"));
    }else{
        let conditions = {};
        try {
            conditions._id = mongoose.Types.ObjectId(postId);
        } catch (err) {
            conditions.slug = postId;
        }
        Post.findOne(conditions).populate('category')
            .exec((err, post) => {
            if (err)  return console.log("find the post error.");
            if(post != null){
                res.send({
                    code:"0",
                    message: "查询到此条信息",
                    post:post
                });
            }else{
                res.send({
                    code:"-1",
                    message: "没有此条信息"
                });
            }
        });

    }
});
//新建 更新 一个帖子
router.post("/:blogger/newPost/publishPost", isLogin, (req, res, next)=>{
	let userId = req.params.blogger;
    let postId = req.body.id,
        title = req.body.title,
        categoryTitle = req.body.category,
        tag = req.body.tag,
        content = req.body.content,
        published = req.body.published;
    console.log(postId,title,categoryTitle);
    if(postId !== ""){
        //更新一个帖子
        let conditions = {};
        try {
            conditions._id = mongoose.Types.ObjectId(postId);
        } catch (err) {
            conditions.slug = postId;
        }

        let pySlug = pinyin(title,{
            style: pinyin.STYLE_NORMAL, // 设置拼音风格
            heteronym: false    // 不启用多音字模式
        }).map((item)=>{
            return item[0];
        }).join(" ");
        Post.update(conditions,{$set:{
            title: title,
            slug: slug(pySlug),
            content: content,
            tag : tag,
            published : published,
            updated: new Date()
        }},(err,result)=>{
            if (err){
                res.send({
                    code: "-1",
                    message: "噢不，更新失败！"
                });
            }else{
            	Post.findOne(conditions).exec((err,post)=>{
            		if(err) return new Error("can't find the post.");
            		res.send({
            		    code: "0",
            		    message: "哇，更新成功！",
            		    postId: post._id.toString()
            		});
            	});
            }
        })
    }
    //新增一个帖子
    else{
    	let titleSlug = pinyin(title,{
            style: pinyin.STYLE_NORMAL,
            heteronym: false
        }).map((item)=>{ return item[0];  }).join(" ");
    	Post.findOne({'slug':titleSlug}).populate('user').exec((err, findpost)=>{
    		if (err) {
                return console.log("find the post error.");
            }
    		if(findpost != null){  
    			if(findpost.author.name == req.session.userName){  //查到自己相同的别名的文章
    				return res.send({
    					code:"-2",
                        message:"此标题与已存在的文章“"+findpost.title+"”具有相同别名，请更换标题。"
    				});
    			}
    		}else{
    			//没有查到相同文章，可以新增
    			//下判断是否有此分类，没有则创建一个
    			Category.findOne({'name': categoryTitle,'creator':userId}).exec((err, category1) => {
		            if (err) {
		                return console.log("find the category error.");
		            }
		           
	                let newCategory ;
	                if (category1 == null) {  //不存在此分类则创建一个分类
	                    let pySlug = pinyin(categoryTitle,{
	                        style: pinyin.STYLE_NORMAL, // 设置拼音风格
	                        heteronym: false    // 不启用多音字模式
	                    }).map((item)=>{
	                        return item[0];
	                    }).join(" ");
	                    console.log(pySlug);
	                    let category = new Category({
	                        name: categoryTitle,
	                        slug: slug(pySlug),
	                        creator: userId,
	                        created: new Date(),
	                        updated: new Date()
	                    });
	                    category.save((err, returnCategory) => {
	                        newCategory = returnCategory;
	
	                        let py = pinyin(title,{
	                            style: pinyin.STYLE_NORMAL,
	                            heteronym: false
	                        }).map((item)=>{ return item[0];  }).join(" ");
	
	                        console.log("!!",newCategory);
	                        let post = new Post({
	                            title: title,
	                            slug: slug(py),
	                            content: content,
	                            category: newCategory,
	                            tag : tag,
	                            author: userId,
	                            published: published,
	                            meta: {favorites: 0,clicks:0,dislikes:0},
	                            comments: [],
	                            recycled: false,
	                            created: new Date(),
	                            updated: new Date()
	                        });
	                        post.save((err, post) => {
	                            if(err){
	                                console.log("can't save post.");
	                                res.send({
	                                    code:"-1",
	                                    message:"can't save post"
	                                });
	                            }else{
	                                console.log("created a new post!");
	                                res.send({
	                                    code:"0",
	                                    message:"保存成功",
	                                    postId : post._id.toString()
	                                });
	                            }
	                        });
	                    });
	                } else {
	                    newCategory = category1;
	                    let py = pinyin(title,{
	                        style: pinyin.STYLE_NORMAL,
	                        heteronym: false
	                    }).map((item)=>{ return item[0];  }).join(" ");
	
	                    let post = new Post({
	                        title: title,
	                        slug: slug(py),
	                        content: content,
	                        category: newCategory,
	                        tag : tag,
	                        author: userId,
	                        published: published,
	                        meta: {favorites: 0,clicks:0,dislikes:0},
	                        comments: [],
	                        recycled: false,
	                        created: new Date(),
	                        updated: new Date()
	                    });
	                    post.save((err, post) => {
	                        if(err){
	                            console.log("can't save post.");
	                            res.send({
	                                code:"-1",
	                                message:"can't save post"
	                            });
	                        }else{
	                            console.log("created a new post!");
	                            res.send({
	                                code:"0",
	                                message:"保存成功",
	                                postId : post._id.toString()
	                            });
	                        }
	                    });
	                }
	
	           
		        });
    		}
    	});
        
    }
});

