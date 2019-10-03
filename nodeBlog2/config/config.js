const path = require('path');
const rootPath = path.normalize(__dirname + '/..');
const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    root: rootPath,
    app: {
      name: 'nodeblog2'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost:27027/nodeblog2'
  },

  test: {
    root: rootPath,
    app: {
      name: 'nodeblog2'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost:27027/nodeblog2-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'nodeblog2'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost:27027/nodeblog2-production'
  }
};

module.exports = config[env];

/*
  数据库 服务地址：D:\MongoDB\Server\4.0\bin

  开发环境数据：   地址：D\data\db   主机：localhost   端口号：27027
  开启服务方式： 服务地址> mongod --dbpath=D:\data\db --port=27027
  mongoDB查看： 服务地址> mongo --host=localhost --port=27027

  session存储：
  服务地址> mongod --dbpath=D:\data2\db --port=27017
 */