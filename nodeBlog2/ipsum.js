//随机生成大量数据

const loremipsum = require('lorem-ipsum').loremIpsum;
const loremipsum2 = require('lorem-ipsum').LoremIpsum;
const slug = require('slug');
const config = require('./config/config');
const glob = require('glob');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect(config.db,{useMongoClient: true});
const db = mongoose.connection;
db.on('error', () => {
    throw new Error('unable to connect to database at ' + config.db);
});

const models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
    require(model);
});

const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Category = mongoose.model('Category');
const Comment = mongoose.model('Comment');

/*
   在post中添加评论
 */


/*
User.findOne((err, user) => {
    if (err) {
        return console.log("cannot find user.");
    }
    Post.find((err, posts) => {
        posts.forEach((post) => {
            for (let j = 0; j < 2; j++) {
                let comment_lorem = lorem.generateSentences(1);
                let commentone = new Comment({
                    content: comment_lorem,
                    user: user._id,
                    belong: post._id,
                    meta: {likes: 0, dislikes: 0},
                    created: new Date()
                });
                commentone.save((err, comment) => {
                    console.log('saving comment:', comment.content);
                    post.comments.push(comment._id);
                    post.markModified('comments');
                    post.save((err)=>{
                        if(err) return new Error("!!!");
                    });
                });

            }
        });
    });
});
*/

/*
  添加post及comment
 */
/*
User.findOne((err, user) => {
    if (err) {
        return console.log("cannot find user.");
    }
    Category.find((err, categories) => {
        if (err) {
            return console.log("cannot find categories");
        }
        categories.forEach((category) => {
            for (let i = 0; i < 4; i++) {
                let title = loremipsum({count: 1, units: 'sentence'});
                let post = new Post({
                    title: title,
                    slug: slug(title),
                    content: loremipsum({count: 30, units: 'sentence'}),
                    category: category,
                    author: user,
                    published: true,
                    meta: {favorites: 0,clicks:0,dislikes:0},
                    comments: [],
                    recycled: false,
                    created: new Date(),
                    updated: new Date()
                });
                post.save((err, post) => {
                    let lorem = new loremipsum2({
                        sentencesPerParagraph: {
                            max: 2,
                            min: 1
                        },
                        wordsPerSentence: {
                            max: 7,
                            min: 2
                        }
                    });
                    for (let j = 0; j < 2; j++) {
                        let comment_lorem = lorem.generateSentences(1);
                        let commentone = new Comment({
                            content: comment_lorem,
                            user: user._id,
                            userName: user.name,
                            belong: post._id,
                            meta: {likes: 0, dislikes: 0},
                            created: new Date()
                        });
                        commentone.save((err, comment) => {
                            console.log('saving comment:', comment.content);
                        });

                    }


                });

            }

        })

    })

});
*/
/*
  post 关联评论
 */
Comment.find((err,comments)=>{
    comments.forEach((comment)=>{
        Post.update({_id: comment.belong },{$push:{comments:comment._id}}).then((res)=>{
            console.log('saved post!');
        });
    })
});
