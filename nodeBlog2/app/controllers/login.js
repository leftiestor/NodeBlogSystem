const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
//const passport = require('passport');
const Article = mongoose.model('Article');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Category = mongoose.model('Category');


module.exports = (app) => {
    app.use('/login', router);
};
//登录页面
router.get('/', (req, res, next) => {
    res.render("login/login");
});

//注册
router.get('/register', (req, res, next) => {
    res.render("login/register");
});

//提交登录信息 
// 中间件 验证登录 passport.authenticate('local', { failureRedirect: '/login/login' }),
router.post('/login', (req, res, next) => {
    let account = req.body.userName,
		newPassword = req.body.password;
	
	console.log();
    User.findOne({"name":account}).exec((err, user)=>{
    	if (err)  return console.log("find the user error.");
    	if(user == null){
    	 	res.send({
		        "code":"-2",
		        "message":"此账号未注册。"
		    });
    	 }else{ 
    	 	if(newPassword !== user.password){
    	 		res.send({
			        "code":"-1",
			        "message":"账号与密码不匹配。"
			    });
    	 	}else{
    	 		req.session.userName = account;  //设置session
    	 		req.session.userId = user._id.toString();  
    	 		res.send({
			        "code":"0",
			        "message":"登录成功。"
			    });
    	 	}
    	 }
    });
   
});

//提交注册信息
router.post('/register', (req, res, next) => {
	let pname = req.body.pname,
		newPassword = req.body.password;
		
    console.log(req.body.pname,req.body.password);
    User.findOne({"name":pname}).exec((err, user) => {
    	if (err)  return console.log("find the user error.");
    	 if(user != null){
    	 	res.send({
		        "code":"-1",
		        "message":"此昵称已经被注册，请换一个昵称。"
		    });
    	 }else{  
    	 	//可以注册
    	 	let oneUser = new User({
    	 		name: pname,
			    password: newPassword,
			    email: "",
			    img:"",
			    phone:"",
			    fans:[],
			    cared:[],
			    created: new Date()
    	 	});
    	 	oneUser.save((err, user) => {
    	 		if(err){
                    console.log("can't save this user.");
                    res.send({
                        code:"-1",
                        message:"注册失败，请稍后再试。"
                    });
                }else{
                    console.log("saved this user.");
                    res.send({
                        code:"0",
                        message:"注册成功！"
                    });
                }
    	 	});
    	 	
    	 }
    
    });
    
    
  
});


