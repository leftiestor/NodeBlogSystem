const express = require('express');
const multer = require('multer');
const glob = require('glob');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compress = require('compression');
//const passport = require('passport');
const methodOverride = require('method-override');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const swig = require('swig');
const path = require('path');
const moment = require('moment');
const truncate = require('truncate');
const ueditor = require('ueditor');


module.exports = (app, config) => {
    const env = process.env.NODE_ENV || 'development';
    app.locals.ENV = env;
    app.locals.ENV_DEVELOPMENT = env == 'development';


    app.engine('html', swig.renderFile);
    if (env == 'development') {
        app.set('view cache', false);
        swig.setDefaults({cache: false});   //设置 不要缓存
    }
    app.set('views', config.root + '/app/views');
    app.set('view engine', 'html');

	

    //中间传值
    app.use((req, res, next) => {
        app.locals.pageName = req.path;
        app.locals.moment = moment;
        app.locals.truncate = truncate;
        console.log(app.locals.pageName);

        next();
    });

    // app.use(favicon(config.root + '/public/img/favicon.ico'));
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
	app.use(cookieParser('secret'));
	
    // 使用 session 中间件
    app.use(session({
        secret: 'secret', // 对session id 相关的cookie 进行签名
        resave: false,    //强制保存 session 即使它并没有变化,。默认为 true。建议设置成 false。
        saveUninitialized: true, // 是否store保存未初始化的会话
        cookie: {
        	secure: false,
            maxAge: 1000 * 60 * 30 // 30分钟 设置 session 的有效时间，单位毫秒
        },
        rolling: true,  //在每次请求时强行设置 cookie，这将重置 cookie 过期时间（默认：false）
        store: new MongoStore({
            url: "mongodb://localhost:27017/sessiondb",   //数据库的地址
            touchAfter: 60                     //time period in seconds
        })
    }));
    
    
    app.use(compress());
	app.use(express.static(config.root + '/public'));
	app.use(methodOverride());
	
	var upload = multer({dest:'userHeadImg/'});
	app.use(multer({dest:"./userHeadImg"}).array("file"));
	
    app.use("/bowerComp", express.static(path.join(config.root, 'bower_components')));
    //ueditor
    app.use("/ueditor/getImg", ueditor(path.join(config.root, 'public'), function (req, res, next) {
        //客户端上传文件设置
        let imgDir = "/image/ueditor/";
        let ActionType = req.query.action;
        if (ActionType === "uploadimage" || ActionType === "uploadfile" || ActionType === "uploadvideo") {
            let file_url = imgDir;  //默认上传地址
            /*其他上传格式的地址*/
            if (ActionType === "uploadfile") {
                file_url = '/file/ueditor/'; //附件
            }
            if (ActionType === "uploadvideo") {
                file_url = '/video/ueditor/'; //视频
            }
            res.ue_up(file_url);  //你只需要输入要保存地址，保存操作ueditor来做
            res.setHeader('Content-Type', 'text/html');
        }
        //客户端发起图片列表请求
        else if (req.query.action === 'listimage') {
            let dir_url = imgDir;
            res.ue_list(dir_url);  //客户端会列出  dir_url  目录下的所有图片
        }
        //客户端发起其他请求
        else {
            res.setHeader('Content-Type', 'application/json');
            res.redirect('/ueditor/nodejs/config.json');
        }

    }));
	

    var controllers = glob.sync(config.root + '/app/controllers/*.js');
    controllers.forEach((controller) => {
        require(controller)(app);
    });

    app.use((req, res, next) => {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    if (app.get('env') === 'development') {
        app.use((err, req, res, next) => {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err,
                title: 'error'
            });
        });
    }

    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {},
            title: 'error'
        });
    });

    return app;
};
