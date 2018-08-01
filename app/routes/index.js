const express = require('express');
const router = express.Router();
const { catchErrors } = require('../handlers/errorHandlers');
const BlogPost = require('../server/models/postsModel');
const Comment = require('../server/models/commentsModel');

const getBlogs = async (req, res) => {
    const limit = 5;
    const blogs = BlogPost.find()
        .limit(limit)
        .sort({ created: -1 });
    const arrayOfComments = Comment.find().sort({ created: -1 });
    const [oneRecord, comments] = await Promise.all([blogs, arrayOfComments]);

    res.render('index', {
        pageTitle: 'Main Page',
        pageID: 'index',
        posts: oneRecord,
        comments
    });
};

router.get('/', catchErrors(getBlogs));

module.exports = router;
