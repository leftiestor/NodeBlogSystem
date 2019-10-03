const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment');
const truncate = require('truncate');
const Article = mongoose.model('Article');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Comment = mongoose.model('Comment');
const Category = mongoose.model('Category');

function delHtmlTag(str){
    let title = str.replace(/<[^>]+>/g," ");//去掉所有的html标记,转换为空格
    let regEx = /\s+/g;
    title = title.replace(regEx, " ");   //将多个空格转换为一个空格
    return title;
}
//数组去重
function uniq(array){
    var temp = []; //一个新的临时数组
    for(var i = 0; i < array.length; i++){
        if(temp.indexOf(array[i]) == -1){
            temp.push(array[i]);
        }
    }
    return temp;
}

module.exports = (app) => {
    app.use('/', router);
};
//登录
router.get('/login', (req, res, next) => {
    res.render("login/login");
});
//首页
router.get('/', (req, res, next) => {
    res.redirect("/sysHome");
});

//系统主页
router.get('/sysHome', (req, res, next) => {
	
	//推荐文章
	let nowDate = +new Date();
	let rang = 1000*60*60*24*1000;
	let passDate = nowDate - rang;
	
	
	let pagesize = 20;  //每页大小
    let pageIndex = parseInt(req.query.pageIndex) || 1;    //第几页

//  let condition = {};
//  condition.recycled = false;
    Post.count({"recycled":false,"created":{$gte: passDate,$lt: nowDate}}, (err, totalCount) => {
        if (err) return next(err);
        console.log("总条数：", totalCount);
        let pageArr = [];
        if(totalCount <= 0){
        	
        }else{
        	
        }
        let pageNum = Math.ceil(totalCount / pagesize);  //一共有多少页
        for (let i = 1; i <= pageNum; i++) {
            pageArr.push(i);
        }
        if (pageIndex > pageNum) {
            pageIndex = pageNum;
            return res.redirect("/sysHome?pageIndex=" + pageIndex);
        }
	
	
		Post.find({"recycled":false,"created":{$gte: passDate,$lt: nowDate}}).populate("author")
			.sort({"created":"desc"}).limit(100).exec((err, posts) => {
		        if (err) return next(err);
		        
		        let trunPost = posts;
		        posts.forEach((item,index) => {
	                trunPost[index].content = delHtmlTag(item.content);
	            });
	            
			    if(req.session.userName){
					let name = req.session.userName,
						id = req.session.userId;
					
					res.render("sysHome/sysHome",{
						title: "系统主页",
						userName: name,
						userId : id,
						posts: trunPost,
						pageSize: pagesize,
	                    totalCount: totalCount,
	                    pageIndex: pageIndex,
	                    pageNum: pageNum,
	                    pageArr: pageArr,
	                    pretty: true	
					});
				}else{
					//res.render("login/login");
					res.render("sysHome/sysHome",{
						title: "系统主页",
						userName: "",
						userId : "",
						posts: trunPost,
						pageSize: pagesize,
	                    totalCount: totalCount,
	                    pageIndex: pageIndex,
	                    pageNum: pageNum,
	                    pageArr: pageArr,
	                    pretty: true
					});
				}
			
			
			});
	    
	});
	

});

//getAsideCategory 侧边栏分类信息
router.get('/getAsideCategory', (req, res, next) => {
    Category.find().sort({"created":"desc"}).exec((err, categories) => {
        if (err) return next(err);
        res.send(categories);
    });
});

//getAsideBlogger 侧边栏推荐博主信息
router.get('/getAsideBlogger', (req, res, next) => {
	
    User.find().exec((err, users) => {
        if (err) return next(err);
        res.send({
        	"users":users
        });
    });
});
//getAsideComment 侧边栏推荐博主信息
router.get('/getAsideComment', (req, res, next) => {
	
	let nowDate = +new Date();
	let rang = 1000*60*60*24*10;
	let passDate = nowDate - rang;
	
    Comment.find({"created":{$gte: passDate,$lt: nowDate}})
    .sort({"created":"desc"}).limit(10).exec((err, comments) => {
        if (err) return next(err);
        res.send(comments);
    });
});

//博主跳转
router.get('/sysHome/blogger', function (req, res) {
	let userName = req.query.name,
		userId = req.query.id;
	User.findOne({"_id":userId}).exec((err, user)=>{
		if(err) return next(err);
		if(user){   //有此博主用户
			res.redirect('/'+userId+'/postsList');	
		}else{
			return new Error("此用户不存在");
		}
	});
	
});




// 检索博主1、文章2、分类3
router.post('/sysHome/search', function (req, res) {
    let type = req.body.type,
   		content = req.body.content;
   		
   	if(type == 1){  
   		//查博主
	   	let _filter = {
	       "name": {$regex: content, $options: '$i'}
	    };
   		User.find(_filter).sort({"created":"asc"}).exec((err, users) => {
   			if (err) {
   				res.send({
   					"code":"-1",
   					"message":"查询失败",
   					"type":type,
   					"dataList":[]
   				});
   			}else{
   				let userArr = [];
   				users.forEach((item,index)=>{
   					let userObj = {
   						"id": item._id.toString(),
   						"name":item.name,
					    "img":item.img,
					    "fans":item.fans,
					    "cared":item.cared,
					    "created": item.created
   					}
   					userArr.push(userObj);
   				});
   				res.send({
   					"code":"0",
   					"message":"查询成功",
   					"type":type,
   					"dataList":userArr
   				});
   			}
   		});
   	}else if(type == 2){
   		//查文章
   		let _filter = {
   			$or:[
   			{"title": {$regex: content, $options: '$i'}},
   			{"tag": {$regex: content, $options: '$i'}},
   			{"content": {$regex: content, $options: '$i'}}
   			]
	    };
	    Post.find(_filter).sort({"created":"asc"}).populate("author")
	    .exec((err, posts) => {
   			if (err) {
   				res.send({
   					"code":"-1",
   					"message":"查询失败",
   					"type":type,
   					"dataList":[]
   				});
   			}else{
   				
   				let postsArr = posts;
                posts.forEach((item, index) => {
                   postsArr[index].created = moment(item.created).format("YYYY-MM-DD HH:mm");
                   postsArr[index].content = truncate(delHtmlTag(item.content),120);
                });
   				
   				res.send({
   					"code":"0",
   					"message":"查询成功",
   					"type":type,
   					"dataList":postsArr,
   					
   				});
   			}
   		});
   		
   	}else if(type == 3){
   		//查分类
   		let _filter = {
	       "name": {$regex: content, $options: '$i'}
	    };
   		Category.find(_filter).sort({"created":"desc"}).exec(  (err, cates) => {
   			if (err) {
   				res.send({
   					"code":"-1",
   					"message":"查询失败",
   					"type":type,
   					"dataList":[]
   				});
   			}else{
   				let cateList = cates;
   				
   				/*cateList.forEach((item,index)=>{
   				    User.findOne({"_id":item.creator}).then((user)=>{
   						if(user){
   							cateList[index].creator = user.name;
   						}
   						if(index == cateList.length-1){
   						}
   					});
   				});*/
				res.send({
					"code":"0",
					"message":"查询成功",
					"type":type,
					"dataList":cateList
				});
	   				
   				
   				

   				
   			}
   		});
   	}
   	
   
    
});

router.get('/sysHome/comment', (req, res)=>{
	let postId = req.query.postId;
	
	Post.findOne({"_id":postId}).exec((err, post)=>{
		if (err) return next(err);
		if(post){
			if(req.session.userName){
				return res.redirect('/'+req.session.userId+'/postOne/dis/'+post.slug);
			}
			res.redirect('/postOne/dis/'+post.slug);
		}else{
			return new Error("出错，未找到对应文章。");
		}
	});
	
	
	
})

// 退出
router.get('/sysHome/loginOut', function (req, res) {
    //req.session.userName = null; // 删除session
    req.session.destroy(function(err){
        console.log(err);
    })
    //res.send('退出登录成功');
    res.redirect('/login');
});




