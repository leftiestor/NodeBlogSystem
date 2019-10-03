const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment');
const Article = mongoose.model('Article');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Category = mongoose.model('Category');
const SystemTask = mongoose.model('SystemTask');
const SysAdmin = mongoose.model('Sysadmin');

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
    
//分类      帖子列表0 新建帖子1 分类2 评论3  草稿箱6 回收站7 个人中心8  编辑帖子9
router.get('/:blogger/categoryManage', (req, res, next) => {
	let userId = req.params.blogger;
	let userName = req.session.userName;
    res.render('admin/index', {
        title: '分类列表',
        navIndex: 2,
        userId : userId,
        userName : userName
    });
	
});

//初始化渲染数据
router.get('/:blogger/categoryManage/getCateList', isLogin, (req, res, next) => {
	let userId = req.params.blogger;
	let mongoUserId = mongoose.Types.ObjectId(userId);
	
	//分页
    pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : pageSize;  //每页大小
    pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : pageIndex;    //第几页

 	//排序条件  默认创建时间倒序排列
    let sortObj = {"created":"desc"};
    
    //查询条件   
    let _filter = {
        creator: mongoUserId
    };
    
    Category.count(_filter, (err, totalCount) => {
        if (err) return next(err);
        console.log("总条数：", totalCount);
        let pageNum = Math.ceil(totalCount / pageSize);  //一共有多少页
        pageIndex = pageIndex > pageNum ? pageNum : pageIndex;
        pageIndex = pageIndex === 0 ? 1 : pageIndex;

        Category.find(_filter).sort(sortObj)
            .limit(pageSize).skip((pageIndex - 1) * pageSize)
            .exec((err, cates) => {
                if (err) return next(err);
                let timeList = []; //创建时间
                cates.forEach((item, index) => {
                    timeList.push(moment(item.created).format("YYYY-MM-DD HH:mm"));
                });
                res.send({
                    categories: cates,
                    timeList: timeList,
                    pageSize: pageSize,
                    totalCount: totalCount,
                    pageIndex: pageIndex,
                    pageNum: pageNum
                });
            });
    });
	
});

//发起删除分类申请
router.post('/:blogger/categoryManage/delete', isLogin, (req, res, next) => {
	let categoryId = req.body.categoryId;
	
	Category.findOne({"_id":categoryId}).exec((err, categoryOne)=>{
		if (err) return next(err);
		if(categoryOne){
			SysAdmin.findOne({"name":"admin1"}).exec((err, admin)=>{
				if(err) return next(err);
				console.log(admin);
				if(admin){
					let time = new Date();
					let Obj={
						"content" : "删除分类",
						"desc" : "分类Id："+categoryOne._id.toString()+"\n分类名称："+categoryOne.name+
					 			"\n创建时间："+moment(categoryOne.created).format("YYYY-MM-DD HH:mm"),
					 	"type" : "3",
					 	"launchUser" : categoryOne.creator,
					 	"taskUser" : admin._id,
					 	"status" : false,
					 	"created" : time,
					 	"finished" : time
					}; 
					 	
					let systask = new SystemTask(Obj);
					systask.save((err,result)=>{
						console.log("保存结果-------------",result);
						res.send({
							"code": "0",
							"message": "发起删除成功，请耐心等待系统管理员处理"
						});
					});
				}else{
					res.send({
						"code": "-1",
						"message": "系统服务故障，请稍后再试"
					});
				}
				
			});
		}else{
			return new Error("出错，未找到对应分类。");
		}
	});
});


