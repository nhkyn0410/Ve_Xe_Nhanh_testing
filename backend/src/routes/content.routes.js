const express = require('express');

const router = express.Router();
const contentController = require('../controllers/content.controller');

/**
 * Content Routes (Public-facing)
 * /api/v1/content
 */

// Banner routes
router.get('/banners', contentController.getBanners);
router.post('/banners/:id/view', contentController.trackBannerView);
router.post('/banners/:id/click', contentController.trackBannerClick);

// Blog routes
router.get('/blogs', contentController.getBlogs);
router.get('/blogs/:slug', contentController.getBlogBySlug);
router.post('/blogs/:id/like', contentController.likeBlog);

// FAQ routes
router.get('/faqs', contentController.getFAQs);
router.get('/faqs/:id', contentController.getFAQById);
router.post('/faqs/:id/helpful', contentController.markFAQHelpful);

module.exports = router;
