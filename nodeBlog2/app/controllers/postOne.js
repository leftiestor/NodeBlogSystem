const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const Post = mongoose.model('Post');
const Comment = mongoose.model('Comment');
const User = mongoose.model('User');

/*
  save(err,result)   exec(err,result) find(,(err,result)=>{})  then(result) .
  update().then()不返回更新对象   findOneAndUpdate().then()返回更新对象
   帖子内容 /postOne/dis/[id]
 */

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


//首页
router.get('/:blogger/postOne/dis/:id', isLogin, (req, res, next) => {
		let userId = req.params.blogger; 
    if (!req.params.id) {
        return next(new Error("no post id provided"));
    }
    let conditions = {};
    try {
        conditions._id = mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
        conditions.slug = req.params.id;
    }
		
    Post.findOne(conditions).populate('category').populate('author')
        .exec((err, post) => {
            if (err) return next(err);
            if (!post) return next(new Error("没有查询到数据"));
            if(post.author.name != req.session.userName){
            	return res.redirect("/postOne/dis/"+req.params.id);
            }
            
            //阅读量++
            post.meta.clicks = post.meta.clicks ? (post.meta.clicks + 1) : 1;
            post.markModified('meta');
            post.save((err) => {
                Comment.find({belong:post._id}).sort('-created').exec((err,coms)=>{
                    if(err) return next(err);
                    let username = "",
                    	isSelf = false,   //是否是自己的文章
                    	isCared = false;  //是否关注了此文章作者
                    		
                    if(req.session.userName){ //登录了
                    	username = req.session.userName;
                   
				            		if(userId == post.author._id){
				            			isSelf = true;  //是自己的文章
				            		}
				            		User.findOne({'_id':userId}).exec((err, user)=>{
					            		user.cared.forEach((item, index)=>{
					        		 		if(item.toString()  == post.author._id.toString() ){
					        		 			isCared = true;
					        		 		}
					            		});
					            		res.render('front/dis', {
			                        title: post.title + " -- blog",
			                        post: post,
			                        userName: username,
			                        userId :userId,
			                        isSelf : isSelf,
			                        isCared: isCared,
			                        comments: coms,
			                        pretty: true
			                    });
			                  });
                    }else{
                    	res.render('front/dis', {
                    	    title: post.title + " -- blog",
                    	    post: post,
                    	    userName: username,
                    	    userId :userId,
                    	    isSelf :isSelf,
                    	    isCared: isCared,
                    	    comments: coms,
                    	    pretty: true
                    	});
                    }
                });


            });

        });
    
});

//点赞
router.get('/:blogger/postOne/favorite/:id', isLogin, (req, res, next) => {
		let userId = req.params.blogger;
    if (!req.params.id) {
        return next(new Error("no post id provided"));
    }
    let conditions = {};
    try {
        conditions._id = mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
        conditions.slug = req.params.id;
    }
		
			  Post.findOne(conditions).populate('category').populate('author')
			      .exec((err, post) => {
			          if (err) return next(err);
			          if (!post) return next(new Error("没有查询到数据"));
			          //阅读量++
			          post.meta.favorites = post.meta.favorites ? (post.meta.favorites + 1) : 1;
			          post.markModified('meta');
			          post.save((err,result) => {
			              res.render('front/dis', {
			                  title: post.title + " -- blog",
			                  post: post,
			                  pretty: true
			              });
			          });

			      });
			  
		

});
//评论提交后台逻辑
router.post('/:blogger/postOne/commentSubmit', isLogin, (req, res, next)=>{
    let userId = req.params.blogger;
    let thisBody = req.body;
    console.log(thisBody);
    Post.findById(thisBody.postId, (err, postOne)=>{
        if(err) return next(err);
        if(!postOne) return next(new Error("空 postOne."));
        User.findOne({"_id":userId}).exec((err, userOne)=>{
            if(err) return next(err);
            let oneComment = new Comment({
                content: thisBody.content,
                user: userOne._id,
                userName: userOne.name,
                belong: postOne._id,
                meta:{ likes: 0, dislikes: 0 },
                created: new Date()
            });
            oneComment.save((err,result)=>{
                if(result){
                    Post.update({_id: oneComment.belong },{$push:{comments:oneComment._id}}).then((result)=>{
                        res.send({code:"0",message:"评论成功！"});
                    });
                }else{
                    res.send({code:"-1",message:"服务器异常！"});
                }
            });

        });

    });

});



