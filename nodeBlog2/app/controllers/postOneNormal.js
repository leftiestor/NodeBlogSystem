const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const Post = mongoose.model('Post');
const Comment = mongoose.model('Comment');
const User = mongoose.model('User');
const Category = mongoose.model('Category');

/*
  save(err,result)   exec(err,result) find(,(err,result)=>{})  then(result) .
  update().then()不返回更新对象   findOneAndUpdate().then()返回更新对象
   帖子内容 /postOne/dis/[id]
 */

module.exports = (app) => {
	app.use('/', router);
};

//是否登录状态
function isLogin(req, res, next) {
	if(req.session.userName) {
		next();
	} else {
		return res.redirect("/login");
	}
}

//首页
router.get('/postOne/dis/:id', (req, res, next) => {
	
	
	if(!req.params.id) {
		return next(new Error("no post id provided"));
	}
	let conditions = {};
	try {
		conditions._id = mongoose.Types.ObjectId(req.params.id);
	} catch(err) {
		conditions.slug = req.params.id;
	}

	Post.findOne(conditions).populate('category').populate('author')
		.exec((err, post) => {
			if(err) return next(err);
			if(!post) return next(new Error("没有查询到数据"));
			
			if(req.session.userId && req.session.userName == post.author.name){  //跳转自己的主页文章详情
				console.log("--------------pipei--------",req.session.userId,req.session.userName,post.author.name);
				return res.redirect('/'+req.session.userId+'/postOne/dis/'+req.params.id);
			}else{
				console.log("--------------不配--------",req.session.userId,req.session.userName,post.author.name);
				//阅读量++
				post.meta.clicks = post.meta.clicks ? (post.meta.clicks + 1) : 1;
				post.markModified('meta');
				post.save((err) => {
					Comment.find({
						belong: post._id
					}).sort('-created').exec((err, coms) => {
						if(err) return next(err);
						let username = "",
							userid = "",
							isSelf = false, //是否是自己的文章
							isCared = false; //是否关注了此文章作者
	
						if(req.session.userName) { //登录了
							username = req.session.userName;
							userid = req.session.userId;
							if(userid == post.author._id.toString()) {
								isSelf = true; //是自己的文章
							}
							User.findOne({
								'_id': userid
							}).exec((err, user) => {
	
								user.cared.forEach((item, index) => {
									if(item.toString() == post.author._id.toString()) {
										isCared = true;
									}
								});
								res.render('front/normaldis', {
									title: post.title + " -- blog",
									post: post,
									userName: username,
									userId: userid,
									isSelf: isSelf,
									isCared: isCared,
									comments: coms,
									pretty: true
								});
							});
						} else {
							res.render('front/normaldis', {
								title: post.title + " -- blog",
								post: post,
								userName: username,
								userId: userid,
								isSelf: isSelf,
								isCared: isCared,
								comments: coms,
								pretty: true
							});
						}
					});
	
				});
				
			}
			

		});

});

//点赞
router.get('/postOne/favorite/:id', isLogin, (req, res, next) => {

	if(!req.params.id) {
		return next(new Error("no post id provided"));
	}
	let conditions = {};
	try {
		conditions._id = mongoose.Types.ObjectId(req.params.id);
	} catch(err) {
		conditions.slug = req.params.id;
	}

	Post.findOne(conditions).populate('category').populate('author')
		.exec((err, post) => {
			if(err) return next(err);
			if(!post) return next(new Error("没有查询到数据"));
			//阅读量++
			post.meta.favorites = post.meta.favorites ? (post.meta.favorites + 1) : 1;
			post.markModified('meta');
			post.save((err, result) => {
				res.render('front/normaldis', {
					title: post.title + " -- blog",
					post: post,
					pretty: true
				});
			});

		});

});
//评论提交后台逻辑
router.post('/postOne/commentSubmit', isLogin, (req, res, next) => {

	let thisBody = req.body;
	console.log(thisBody);
	Post.findById(thisBody.postId, (err, postOne) => {
		if(err) return next(err);
		if(!postOne) return next(new Error("空 postOne."));

		User.findOne({
			"_id": req.session.userId
		}).exec((err, userOne) => {
			if(err) return next(err);
			let oneComment = new Comment({
				content: thisBody.content,
				user: userOne._id,
				userName: userOne.name,
				belong: postOne._id,
				meta: {
					likes: 0,
					dislikes: 0
				},
				created: new Date()
			});
			oneComment.save((err, result) => {
				if(result) {
					Post.update({
						_id: oneComment.belong
					}, {
						$push: {
							comments: oneComment._id
						}
					}).then((result) => {
						res.send({
							code: "0",
							message: "评论成功！"
						});
					});
				} else {
					res.send({
						code: "-1",
						message: "服务器异常！"
					});
				}
			});

		});

	});

});

//关注此人
router.get('/postOne/care/:name', isLogin, (req, res, next) => {

	if(!req.params.name) {
		return next(new Error("no user id provided"));
	}
	let myName = req.session.userName,
		myId = mongoose.Types.ObjectId(req.session.userId);
	User.findOne({
		"name": myName
	}).exec((err, mySelf) => {
		if(err) return next(err);
		User.findOne({
			"name": req.params.name
		}).exec((err, user) => {
			if(err) return next(err);

			User.update({
				"name": myName
			}, {
				$push: {
					"cared": user._id
				}
			}).then((result1) => {
				console.log("--------result1----");
				console.log(result1);
				if(result1.nModified == 1) {
					User.update({
						"name": req.params.name
					}, {
						$push: {
							"fans": myId
						}
					}).then((result2) => {
						console.log("---result2-------");
						console.log(result2);
						if(result2.nModified == 1) {
							res.send({
								code: "0",
								message: "关注成功！"
							});
						} else {
							res.send({
								code: "-1",
								message: "操作失败，请稍后再试！"
							});
						}
					});
				} else {
					res.send({
						code: "-2",
						message: "操作失败，请稍后再试！"
					});
				}
			});

		});

	});

});

//取消关注此人
router.get('/postOne/careOff/:name', isLogin, (req, res, next) => {

	if(!req.params.name) {
		return next(new Error("no user id provided"));
	}
	let myName = req.session.userName,
		myId = mongoose.Types.ObjectId(req.session.userId);
	User.findOne({
		"name": myName
	}).exec((err, mySelf) => {
		if(err) return next(err);
		User.findOne({
			"name": req.params.name
		}).exec((err, user) => {
			if(err) return next(err);
			let caredArr = [];
			caredArr = mySelf.cared.filter((item, index) => {
				return item.toString() != user._id.toString();
			});
			let fanArr = [];
			fanArr = user.fans.filter((item, index) => {
				return item.toString() != mySelf._id.toString();
			});
			console.log(caredArr,fanArr);
			User.update({
				"name": myName
			}, {
				"$set": {
					"cared": caredArr
				}
			}).then((result1) => {
				console.log("--------result1----");
				console.log(result1);
				if(result1.nModified == 1) {
					User.update({
						"name": req.params.name
					}, {
						"$set": {
							"fans": fanArr
						}
					}).then((result2) => {
						console.log("---result2-------");
						console.log(result2);
						if(result2.nModified == 1) {
							res.send({
								code: "0",
								message: "关注成功！"
							});
						} else {
							res.send({
								code: "-1",
								message: "操作失败，请稍后再试！"
							});
						}
					});

				} else {
					res.send({
						code: "-2",
						message: "操作失败，请稍后再试！"
					});
				}

			});

		});

	});

});

//getAsideCategory 侧边栏分类信息
router.get('/getAsideCategory/:author', (req, res, next) => {
	let authorId = req.params.author;

	Category.find({
		"creator": authorId
	}).sort({"created":"desc"}).exec((err, categories) => {
		if(err) return next(err);
		res.send(categories);
	});
});