const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const uuid = require('uuid');
const jimp = require('jimp');
const cloudinary = require('cloudinary');

const BlogPost = require('../server/models/postsModel');
const Comment = require('../server/models/commentsModel');
const { catchErrors } = require('../handlers/errorHandlers');
const { mongodbUrl, herokuDepl, localUrl } = require('../server/config/configFile');
const {
    cloud_name,
    api_key,
    api_secret
} = require('../server/config/configFile');

cloudinary.config({ cloud_name, api_key, api_secret });

mongoose.Promise = global.Promise;
mongoose.connect(herokuDepl || mongodbUrl);

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true);
        } else {
            next({ message: `This file type is not allowed!` }, false);
        }
    }
};

/*eslint-disable no-console */
const getNewPost = async (req, res) => {
    console.log(`server getNewPost req.body: `, req.body);
    const record = await BlogPost.find();
    res.render('post', {
        pageTitle: 'Record creator',
        pageID: 'create__record',
        record
    });
};
router.get('/post/create', catchErrors(getNewPost));

const upload = multer(multerOptions).single('photo');

const resize = async (req, res, next) => {
    if (!req.file) {
        next();
        return;
    }

    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;

    const photo = await jimp.read(req.file.buffer);

    const resizePhoto = photo.resize(600, jimp.AUTO);
    const writePhoto = photo.write(`${localUrl}${req.body.photo}`);
    await Promise.all([resizePhoto, writePhoto]);

    next();
};

const jsonParse = bodyParser.json();
const createPost = async (req, res) => {
    if (!req.body) return res.sendStatus(400);
    const {
        body: { name },
        body: { text },
        body: { photo }
    } = req;
    const extension = photo.split('.')[1];
    if (extension === 'gif') {
        req.flash(
            'error',
            `Gif-files can't be uploaded.`
        );
        return res.redirect('back');
    }
    cloudinary.uploader.upload(
        `app/public/img/uploads/${photo}`,
        async result => {
            await new BlogPost({
                author: name,
                text,
                photo: result.secure_url,
                photoId: result.public_id
            }).save();
            req.flash(
                'success',
                `The post successfully created. Write your comment.`
            );
            res.redirect(`/`);
        }
    );
};
router.post('/post/create', jsonParse, upload, resize, catchErrors(createPost));

const objectId = require('mongodb').ObjectID;
const getOnePost = async (req, res) => {
    const id = new objectId(req.params.id);
    const onePost = BlogPost.findOne({ _id: id });
    const arrayOfComments = BlogPost.findComments(id).sort({ created: 1 });

    const [post, comments] = await Promise.all([onePost, arrayOfComments]);
    res.render('post', {
        pageTitle: 'Post Record',
        pageID: 'postRecord',
        post,
        comments
    });
};
router.get('/post/:id', catchErrors(getOnePost));

const editGetPost = async (req, res) => {
    const id = new objectId(req.params.id);
    const onePost = await BlogPost.findOne({ _id: id });

    res.render('post', {
        pageTitle: 'Post Edit',
        pageID: 'postEdit',
        post : onePost,
    });
};
router.get('/post/edit/:id', catchErrors(editGetPost));

const editPostPost = async (req, res) => {
    if (!req.body) return res.sendStatus(400);
    const {
        body: { name },
        body: { text },
        body: { photo }
    } = req;
    const extension = photo.split('.')[1];
    if (extension === 'gif') {
        req.flash(
            'error',
            `Gif-files can't be uploaded.`
        );
        return res.redirect('back');
    }
    const record = await BlogPost.findById(req.params.id);
    await cloudinary.v2.uploader.destroy(record.photoId);

    const id = new objectId(req.params.id);
    const result = await cloudinary.uploader.upload(
        `app/public/img/uploads/${photo}`
    );
    const newData = {
        author: name,
        text,
        photo: result.secure_url,
        photoId: result.public_id
    };
    await BlogPost.findByIdAndUpdate(id, { $set: newData }, { new: true });
    res.redirect(`/`);
};
router.post('/post/edit/:id', upload, resize, catchErrors(editPostPost));

const removePost = async (req, res) => {
    const id = new objectId(req.params.id);

    const onePostToRemove = BlogPost.findOne({ _id: id });
    const arrayOfComments = BlogPost.findComments(id).sort({ created: -1 });

    const [postToRemove, commentsToRemove] = await Promise.all([
        onePostToRemove,
        arrayOfComments
    ]);

    req.flash(
        'success',
        `Your post was successfully deleted.`
    );

    const postRemove = cloudinary.v2.uploader.destroy(postToRemove.photoId);
    const commentsRemove = commentsToRemove.forEach(comment =>
        cloudinary.v2.uploader.destroy(comment.photoId)
    );
    await Promise.all([postRemove, commentsRemove]);
    postToRemove.remove();
    commentsToRemove.forEach(item => item.remove());
    res.redirect(`/`);
};
router.get('/post/remove/:id', catchErrors(removePost));

const getOneComment = async (req, res) => {
    const id = new objectId(req.params.id);
    const onePost = BlogPost.findOne({ _id: id });
    const oneComment = Comment.findOne({ _id: id });

    const [post, comment] = await Promise.all([onePost, oneComment]);
    res.render('post', {
        pageTitle: 'Comment Record',
        pageID: 'commentRecord',
        post,
        comment
    });
};
router.get('/post/comment/:id', catchErrors(getOneComment));

const commentCreate = async (req, res) => {
    if (!req.body) return res.sendStatus(400);
    const {
        params: { id },
        body: { name },
        body: { text },
        body: { photo }
    } = req;
    const extension = photo.split('.')[1];
    if (extension === 'gif') {
        req.flash(
            'error',
            `Gif-files can't be uploaded.`
        );
        return res.redirect('back');
    }
    cloudinary.uploader.upload(
        `app/public/img/uploads/${photo}`,
        async result => {
            try {
                await Comment.create({
                    post: id,
                    author: name,
                    text,
                    photo: result.secure_url,
                    photoId: result.public_id
                });
                res.redirect(`/`);
            } catch (err) {
                console.error(`Comment error: `, err);
            }
        }
    );
};
router.post(
    '/post/comment/:id',
    jsonParse,
    upload,
    resize,
    catchErrors(commentCreate)
);

const editGetComment = async (req, res) => {
    const id = new objectId(req.params.id);
    const arrayOfComments = await Comment.find({post: id})
    const oneComment = arrayOfComments.find(item => item.author? item : null);
    res.render('post', {
        pageTitle: 'Comment Edit',
        pageID: 'commentEdit',
        comment: oneComment
    });
};
router.get('/post/comment/edit/:id', catchErrors(editGetComment));

const editPostComment = async (req, res) => {
    if (!req.body) return res.sendStatus(400);
    const {
        body: { name },
        body: { text },
        body: { photo }
    } = req;
    const record = await Comment.findById(req.params.id);
    if (req.file) {
        await cloudinary.v2.uploader.destroy(record.photoId);
        try {
            const id = new objectId(req.params.id);
            const result = await cloudinary.uploader.upload(
                `app/public/img/uploads/${photo}`
            );
            const newData = {
                author: name,
                text,
                photo: result.secure_url,
                photoId: result.public_id
            };
            await Comment.findByIdAndUpdate(
                id,
                { $set: newData },
                { new: true }
            );
            res.redirect(`/`);
        } catch (err) {
            req.flash(
                'error',
                `Gif-files can't be uploaded.`
            );
            return res.redirect('back');
        }
    }
};
router.post(
    '/post/comment/edit/:id',
    upload,
    resize,
    catchErrors(editPostComment)
);

const removeComment = async (req, res) => {
    const id = new objectId(req.params.id);
    const arrayOfComments = await BlogPost.findComments(id);
    const oneCommentForDelete = arrayOfComments.find(item => item.photoId);

    req.flash(
        'success',
        `Comment was successfully deleted.`
    );

    oneCommentForDelete.remove();
    cloudinary.v2.uploader.destroy(oneCommentForDelete.photoId);
    res.redirect(`/`);
};
router.get('/post/comment/remove/:id', catchErrors(removeComment));

module.exports = router;
