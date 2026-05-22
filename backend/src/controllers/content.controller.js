const Banner = require('../models/Banner');
const Blog = require('../models/Blog');
const FAQ = require('../models/FAQ');
const logger = require('../utils/logger');

// ============= BANNER MANAGEMENT =============

/**
 * @route   GET /api/banners
 * @desc    Get active banners for a position
 * @access  Public
 */
exports.getBanners = async (req, res) => {
  try {
    const { position = 'homepage' } = req.query;

    const now = new Date();

    // Hai điều kiện ngày phải cùng đúng → bọc trong $and.
    // (Trước đây dùng 2 key `$or` trùng nhau nên JS chỉ giữ cái sau →
    //  bộ lọc startDate bị mất, "ngày bắt đầu hiển thị" không có tác dụng.)
    // Cũng chấp nhận startDate/endDate = null vì form admin lưu null khi
    // không đặt lịch.
    const banners = await Banner.find({
      position,
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
    }).sort({ order: 1 });

    res.json({
      status: 'success',
      data: banners,
    });
  } catch (error) {
    logger.error('Lỗi lấy banner:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách banner',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/banners/:id/view
 * @desc    Track banner view
 * @access  Public
 */
exports.trackBannerView = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy banner',
      });
    }

    await banner.incrementView();

    res.json({
      status: 'success',
      message: 'Đã ghi nhận lượt xem',
    });
  } catch (error) {
    logger.error('Lỗi theo dõi lượt xem banner:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi ghi nhận lượt xem',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/banners/:id/click
 * @desc    Track banner click
 * @access  Public
 */
exports.trackBannerClick = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy banner',
      });
    }

    await banner.incrementClick();

    res.json({
      status: 'success',
      message: 'Đã ghi nhận lượt click',
      data: {
        linkUrl: banner.linkUrl,
      },
    });
  } catch (error) {
    logger.error('Lỗi theo dõi lượt nhấp banner:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi ghi nhận lượt click',
      error: error.message,
    });
  }
};

// ============= BLOG MANAGEMENT =============

/**
 * @route   GET /api/blogs
 * @desc    Get published blogs
 * @access  Public
 */
exports.getBlogs = async (req, res) => {
  try {
    const {
      category,
      tag,
      search,
      page = 1,
      limit = 10,
      sort = '-publishedAt',
    } = req.query;

    // Build query
    const query = {
      status: 'published',
      publishedAt: { $lte: Date.now() },
    };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const blogs = await Blog.find(query)
      .populate('author', 'fullName avatar')
      .select('-content') // Exclude full content for list view
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Blog.countDocuments(query);

    res.json({
      status: 'success',
      data: blogs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy blog:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách bài viết',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/blogs/:slug
 * @desc    Get blog by slug
 * @access  Public
 */
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published',
    }).populate('author', 'fullName avatar email');

    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy bài viết',
      });
    }

    // Increment view count
    await blog.incrementView();

    // Get related blogs (same category, exclude current)
    const relatedBlogs = await Blog.find({
      category: blog.category,
      status: 'published',
      _id: { $ne: blog._id },
    })
      .select('-content')
      .limit(3)
      .sort({ publishedAt: -1 });

    res.json({
      status: 'success',
      data: {
        blog,
        relatedBlogs,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy blog:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy bài viết',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/blogs/:id/like
 * @desc    Like a blog post
 * @access  Public
 */
exports.likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy bài viết',
      });
    }

    await blog.incrementLike();

    res.json({
      status: 'success',
      message: 'Đã thích bài viết',
      data: {
        likeCount: blog.likeCount,
      },
    });
  } catch (error) {
    logger.error('Lỗi thích blog:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi thích bài viết',
      error: error.message,
    });
  }
};

// ============= FAQ MANAGEMENT =============

/**
 * @route   GET /api/faqs
 * @desc    Get FAQs
 * @access  Public
 */
exports.getFAQs = async (req, res) => {
  try {
    const { category, search } = req.query;

    let faqs;

    if (search) {
      faqs = await FAQ.search(search);
    } else if (category) {
      faqs = await FAQ.getByCategory(category);
    } else {
      faqs = await FAQ.find({ isActive: true }).sort({ category: 1, order: 1 });
    }

    // Group by category
    const groupedFAQs = faqs.reduce((acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    }, {});

    res.json({
      status: 'success',
      data: {
        faqs,
        grouped: groupedFAQs,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy FAQ:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách FAQ',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/faqs/:id
 * @desc    Get FAQ by ID
 * @access  Public
 */
exports.getFAQById = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy FAQ',
      });
    }

    // Increment view count
    await faq.incrementView();

    res.json({
      status: 'success',
      data: faq,
    });
  } catch (error) {
    logger.error('Lỗi lấy FAQ:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy FAQ',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/faqs/:id/helpful
 * @desc    Mark FAQ as helpful
 * @access  Public
 */
exports.markFAQHelpful = async (req, res) => {
  try {
    const { helpful } = req.body;

    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy FAQ',
      });
    }

    if (helpful === true) {
      await faq.markHelpful();
    } else {
      await faq.markNotHelpful();
    }

    res.json({
      status: 'success',
      message: 'Cảm ơn phản hồi của bạn',
      data: {
        helpfulCount: faq.helpfulCount,
        notHelpfulCount: faq.notHelpfulCount,
      },
    });
  } catch (error) {
    logger.error('Lỗi đánh dấu FAQ hữu ích:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi ghi nhận phản hồi',
      error: error.message,
    });
  }
};

module.exports = exports;
