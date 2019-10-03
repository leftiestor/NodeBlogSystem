const express = require('express');
const router = express.Router();

const multer = require('multer');  //文件上传模块
const fs = require('fs');
const path = require('path');
let upload = multer({ dest: 'userHeadImg/' });

const mongoose = require('mongoose');  //数据
const moment = require('moment');
const Article = mongoose.model('Article');
const Post = mongoose.model('Post');
const DeletedPost = mongoose.model('DeletedPost');
const User = mongoose.model('User');
const Category = mongoose.model('Category');
const Comment = mongoose.model('Comment');



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

//基本信息0 我的关注1 粉丝团2 统计信息3
//用户中心
router.get('/:blogger/userInfo', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName,
		userid = req.session.userId;
	
	User.findOne({"_id":userid}).exec((err, user)=>{
		if(err) return next(err);
		res.render('admin/userInfo', {
	        title : '用户中心',
	        userId : userId,
	        userName : userName,
	        user: user,
	        navIndex : 0
	    });
	});
    
});

//基本信息
router.get('/:blogger/userInfo/baseInfo', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName,
		userid = req.session.userId;
    User.findOne({"_id":userid}).exec((err, user)=>{
		if(err) return next(err);
		res.render('admin/userInfo', {
	        title : '基本信息',
	        userId : userId,
	        userName : userName,
	        user: user,
	        navIndex : 0
	    });
	});
});


//关注管理
router.get('/:blogger/userInfo/caredManage', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName,
		userid = req.session.userId;
    User.findOne({"_id":userid}).exec((err, user)=>{
		if(err) return next(err);
		console.log(user);
		res.render('admin/userInfo', {
	        title : '关注管理',
	        userId : userId,
	        userName : userName,
	        user: user,
	        navIndex : 1
	    });
	});
});
//获取关注信息
router.post('/:blogger/userInfo/caredManage/getCaredInfo', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName,
		userid = req.session.userId,
		caredUserId = req.body.caredUserId,
		id = req.body.id;
		
    User.findOne({"_id":caredUserId}).exec((err, user)=>{
		if(err) return next(err);
		console.log(user);
		if(user){
			res.send({
				"code":"0",
				"message":"查询成功",
				"user":user
			});
		}else{
			res.send({
				"code":"-1",
				"message":"没有此用户",
				"user":""
			});
		}
		
	});
});


//粉丝管理
router.get('/:blogger/userInfo/fanManage', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName,
		userid = req.session.userId;
    User.findOne({"_id":userid}).exec((err, user)=>{
		if(err) return next(err);
		res.render('admin/userInfo', {
	        title : '粉丝管理',
	        userId : userId,
	        userName : userName,
	        user: user,
	        navIndex : 2
	    });
	});
});

//获取粉丝信息
router.post('/:blogger/userInfo/fanManage/getFanInfo', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName,
		userid = req.session.userId,
		fanUserId = req.body.fanUserId,
		id = req.body.id;
		
    User.findOne({"_id":fanUserId}).exec((err, user)=>{
		if(err) return next(err);
		if(user){
			res.send({
				"code":"0",
				"message":"查询成功",
				"user":user
			});
		}else{
			res.send({
				"code":"-1",
				"message":"没有此用户",
				"user":""
			});
		}
	});
});

//统计信息
router.get('/:blogger/userInfo/statistic', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName,
		userid = req.session.userId;
		
    User.findOne({"_id":userid}).exec((err, user)=>{
		if(err) return next(err);
		res.render('admin/userInfo', {
	        title : '统计信息',
	        userId : userId,
	        userName : userName,
	        user: user,
	        navIndex : 3
	    });
	});
});

//查找注册博龄
router.get('/:blogger/userInfo/statistic/registerInfo', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName,
		userid = req.session.userId;
		
    User.findOne({"_id":userId}).exec((err, user)=>{
		if(err) return next(err);
		if(user){
			let registTime = moment(user.created).format("YYYY-MM-DD");
			let nowTime = 	moment(new Date()).format("YYYY-MM-DD");
			let timeArr = getDiffDate(registTime, nowTime);
			let ageYear = timeArr[0];
			let ageMonth = timeArr[1];
			let ageDay = timeArr[2]; 
			//console.log("时间时间时间-----------：",timeArr);
			res.send({
				"code":"0",
				"message":"获取成功",
		        "user": user,
		        "registTime": registTime,
		        "ageYear": ageYear,
		        "ageMonth" : ageMonth,
		        "ageDay" : ageDay
		    });
		}
		
	});
});

//查找文章总数
router.get('/:blogger/userInfo/statistic/postInfo', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName,
		userid = req.session.userId;
	Post.count({"author":userId},(err, totalPostNum) => {
   	 	if (!err){
			DeletedPost.count({"author":userId,"recycled":true},(err, delPostNum) => {
	   	 	    if (!err){
					Category.count({"creator":userId},(err, totalCategoryNum) => {
						if (!err) {
							res.send({
								"code":"0",
								"message":"查找成功",
								"postNum":totalPostNum,
								"delPostNum":delPostNum,
								"categoryNum":totalCategoryNum
							});
						}else{
							res.send({
								"code":"-3",
								"message":"查找失败"
							});
						}
					});	
				}else{
					res.send({
						"code":"-2",
						"message":"查找失败"
					});
				}
			});
		}else{
			res.send({
				"code":"-1",
				"message":"查找失败"
			});
		}
	});
});

//查找关注总数
router.get('/:blogger/userInfo/statistic/caredInfo', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName,
		userid = req.session.userId;
	User.findOne({"_id":userId}).exec((err, user)=>{
		if(err) return next(err);
		if(user){
			res.send({
				"code":"0",
				"message":"查找成功",
				"fanNum":user.fans.length,
				"caredNum":user.cared.length
			});
		}else{
			res.send({
				"code":"-1",
				"message":"查找失败"
			});
		}
	});
});
//查找评论总数
router.get('/:blogger/userInfo/statistic/commentInfo', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName,
		userid = req.session.userId;
	Comment.count({"user":userid}).exec((err, commentNum)=>{
		if(err) return next(err);
		if(commentNum >= 0){
			res.send({
				"code":"0",
				"message":"查找成功",
				"commentNum":commentNum
			});
		}else{
			res.send({
				"code":"-1",
				"message":"查找失败"
			});
		}
	});
	
});

//提交修改   昵称1 邮箱2 电话3 密码4
router.post('/:blogger/userInfo/changeInfo', isLogin, (req, res) => {
	let userId = req.params.blogger,
		userName = req.session.userName,
		id = req.body.id,
		changeNum = req.body.changeNum,
		changeCont = req.body.changeCont;
	
	let sets = {};
	if(changeNum == 1){
		sets.name = changeCont;
	}else if(changeNum == 2){
		sets.email = changeCont;
	}else if(changeNum == 3){
		sets.phone = changeCont;
	}else if(changeNum == 4){
		sets.password = changeCont;
	}
	User.findOne(sets).exec((err, user)=>{
		if(err) return next(err);
		if(user){
			//存在信息
			if(user.name == userName){
				return res.send({
					"code":"0",
					"message": "无需更新"
				});
			}else{
				if(changeNum == 4){
					User.findOneAndUpdate({"_id":id},{$set:sets}).exec((err, user)=>{
						if (err){
							res.send({
								"code":"-1",
								"message": new Error(err)
							});
						}else{
							res.send({
								"code":"0",
								"message": "更新成功"
							});
						}
					})
				}else{
					let str = "此信息已经存在，请更换。";
					switch (changeNum){
						case 1:
							str = "此昵称已存在，请更换";
							break;
						case 2:
							str = "此邮箱已被使用，请更换";
							break;
						case 3:
							str = "此电话已存在，请更换";
							break;
						default:
							break;
					}
					return res.send({
						"code":"-2",
						"message": str
					});
				}
			}
		}else{
			User.findOneAndUpdate({"_id":id},{$set:sets}).exec((err, user)=>{
				if (err){
					res.send({
						"code":"-1",
						"message": new Error(err)
					});
				}else{
					if(changeNum == 1){
						req.session.userName = changeCont;
					}
					res.send({
						"code":"0",
						"message": "更新成功"
					});
				}
			})
		}
	});
	
});
//返回加密密码
router.get('/:blogger/userInfo/changeInfo/getOldPassword', isLogin, (req, res) => {
	let userId = req.params.blogger;
	User.findOne({"_id":userId}).exec((err, user)=>{
		if (err){
			res.send({
				"code":"-1",
				"message": new Error(err)
			});
		}else{
			res.send({
				"code":"0",
				"message": "查找成功",
				"oldPassword": user.password
			});
		}
	});
	
});

//文件上传
router.post('/:blogger/userInfo/addPicture', isLogin, upload.single('file'), (req, res) => {
	let userId = req.params.blogger;
	let userName = req.session.userName;
	
	console.log("文件上传初始化……………………");
    
	//post传输方法要用body
    console.log(req.files);
    var load=path.join(__dirname,'../..');
    
    var fname=req.files[0].filename;//获取上传文件的名字
    var oname=req.files[0].originalname;//获取上传文件的原始名字
	/*
	 * 文件上传后默认是一堆字符串的名字并且没有后缀名称的未知格式文件，
	 * 这里我们要用req.files查看原始文件的数据并且读取，待读取成功后进行写操作
	 */
    fs.readFile(load+'/userHeadImg/'+fname,function(err,data){
    	let timeStamp = new Date();
    	let standStamp = moment(timeStamp).format("YYYYMMDDHHmmSS")+"$"+oname;
    	console.log(standStamp);
	    fs.writeFile('./public/userImg/'+standStamp, data, function(err,data){
			//写入文件
		    if(!err){     
		    	console.log("文件写入成功……………………");
		    	User.findOneAndUpdate({"_id":req.session.userId},
		    		{$set: {"img": standStamp}},{ new: true }).exec((err, user)=>{
		    			if(err) return next(err);
					    res.redirect("/"+userId+"/userInfo/baseInfo");
		    	});
		    	
		    }else{
		    	console.log(err);
		    	res.redirect("/"+userId+"/userInfo/baseInfo");
		    }
	    });
	});

    
     
});


/**
   **datestr:形如‘2017-06-12’的字符串
  **return Date 对象
   **/
   function getDate (datestr) {
        var temp = datestr.split("-");
        if (temp[1] === '01') {
            temp[0] = parseInt(temp[0],10) - 1;
            temp[1] = '12';
        } else {
            temp[1] = parseInt(temp[1],10) - 1;
        }
        //new Date()的月份入参实际都是当前值-1
        var date = new Date(temp[0], temp[1], temp[2]);
        return date;
    }
  /**
  ***获取两个日期间的所有日期
  ***默认start<end
  **/
  function getDiffDate (start, end) {
        var startTime = getDate(start);
        var endTime = getDate(end);
        var dateArr = [];
        while ((endTime.getTime() - startTime.getTime()) > 0) {
            var year = startTime.getFullYear();
            var month = startTime.getMonth().toString().length === 1 ? "0" + (parseInt(startTime.getMonth().toString(),10) + 1) : (startTime.getMonth() + 1);
            var day = startTime.getDate().toString().length === 1 ? "0" + startTime.getDate() : startTime.getDate();
            dateArr.push(year + "-" + month + "-" + day);
            startTime.setDate(startTime.getDate() + 1);
        }
        let len = dateArr.length +1 ;
        console.log("xxxxxxxxxxxxxxxxxxxxxxx-------",len);
        let y = Math.floor(len / 365);
        let m = Math.floor(len % 365 / 30);
        let d =  Math.floor(len % 365 % 30);
        let arr = [y,m,d];
        return arr;
        
        
    }
