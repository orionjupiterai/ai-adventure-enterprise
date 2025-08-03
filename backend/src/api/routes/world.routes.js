const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { World, User, WorldRating } = require('../../models');
const rateLimiter = require('../../middleware/rateLimiter');
const authentication = require('../../middleware/authentication');
const logger = require('../../utils/logger');

const router = express.Router();

// Configure multer for world file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../../uploads/worlds');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '.json');
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== '.json') {
      return cb(new Error('Only JSON files are allowed'));
    }
    cb(null, true);
  }
});

// Get all public worlds
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tags,
      sortBy = 'created_at',
      order = 'DESC',
      featured
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { is_public: true };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (tags) {
      where.tags = { [Op.overlap]: tags.split(',') };
    }

    if (featured === 'true') {
      where.is_featured = true;
    }

    const worlds = await World.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'display_name']
      }],
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      worlds: worlds.rows,
      total: worlds.count,
      page: parseInt(page),
      totalPages: Math.ceil(worlds.count / limit)
    });
  } catch (error) {
    next(error);
  }
});

// Get single world
router.get('/:id', async (req, res, next) => {
  try {
    const world = await World.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'display_name', 'avatar_url']
      }]
    });

    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Check if private and user has access
    if (!world.is_public) {
      if (!req.user || (req.user.id !== world.author_id && !req.user.is_admin)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Increment play count
    await world.increment('play_count');

    res.json(world);
  } catch (error) {
    next(error);
  }
});

// Create new world
router.post('/',
  authentication.required,
  rateLimiter.upload,
  upload.single('worldFile'),
  [
    body('name').optional().isLength({ min: 1, max: 255 }),
    body('description').optional().isLength({ max: 1000 }),
    body('tags').optional().isArray(),
    body('isPublic').optional().isBoolean()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let worldData;
      
      if (req.file) {
        // Upload from file
        const fileContent = await fs.readFile(req.file.path, 'utf8');
        worldData = JSON.parse(fileContent);
        
        // Clean up uploaded file
        await fs.remove(req.file.path);
      } else if (req.body.worldData) {
        // Direct JSON submission
        worldData = req.body.worldData;
      } else {
        return res.status(400).json({ error: 'World data required' });
      }

      // Validate world structure
      if (!worldData.worldInfo || !worldData.locations || !worldData.startLocation) {
        return res.status(400).json({ error: 'Invalid world data structure' });
      }

      const world = await World.create({
        name: req.body.name || worldData.worldInfo.name,
        description: req.body.description || worldData.worldInfo.description,
        author_id: req.user.id,
        world_data: worldData,
        tags: req.body.tags || [],
        is_public: req.body.isPublic !== false,
        version: worldData.worldInfo.version || '1.0.0'
      });

      await world.reload({
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'display_name']
        }]
      });

      logger.info(`New world created: ${world.name} by user ${req.user.username}`);

      res.status(201).json(world);
    } catch (error) {
      next(error);
    }
  }
);

// Update world
router.put('/:id',
  authentication.required,
  [
    body('name').optional().isLength({ min: 1, max: 255 }),
    body('description').optional().isLength({ max: 1000 }),
    body('tags').optional().isArray(),
    body('isPublic').optional().isBoolean(),
    body('worldData').optional()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const world = await World.findByPk(req.params.id);

      if (!world) {
        return res.status(404).json({ error: 'World not found' });
      }

      // Check ownership
      if (world.author_id !== req.user.id && !req.user.is_admin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update fields
      if (req.body.name) world.name = req.body.name;
      if (req.body.description) world.description = req.body.description;
      if (req.body.tags) world.tags = req.body.tags;
      if (req.body.isPublic !== undefined) world.is_public = req.body.isPublic;
      if (req.body.worldData) {
        // Validate world data structure
        if (!req.body.worldData.worldInfo || !req.body.worldData.locations || !req.body.worldData.startLocation) {
          return res.status(400).json({ error: 'Invalid world data structure' });
        }
        world.world_data = req.body.worldData;
        world.version = req.body.worldData.worldInfo.version || world.version;
      }

      await world.save();

      res.json(world);
    } catch (error) {
      next(error);
    }
  }
);

// Delete world
router.delete('/:id',
  authentication.required,
  async (req, res, next) => {
    try {
      const world = await World.findByPk(req.params.id);

      if (!world) {
        return res.status(404).json({ error: 'World not found' });
      }

      // Check ownership
      if (world.author_id !== req.user.id && !req.user.is_admin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await world.destroy();

      logger.info(`World deleted: ${world.name} by user ${req.user.username}`);

      res.json({ message: 'World deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Rate world
router.post('/:id/rate',
  authentication.required,
  [
    body('rating').isInt({ min: 1, max: 5 }),
    body('review').optional().isLength({ max: 1000 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const world = await World.findByPk(req.params.id);

      if (!world) {
        return res.status(404).json({ error: 'World not found' });
      }

      // Create or update rating
      const [rating, created] = await WorldRating.findOrCreate({
        where: {
          world_id: world.id,
          user_id: req.user.id
        },
        defaults: {
          rating: req.body.rating,
          review: req.body.review
        }
      });

      if (!created) {
        rating.rating = req.body.rating;
        rating.review = req.body.review;
        await rating.save();
      }

      // Update world rating average
      const ratings = await WorldRating.findAll({
        where: { world_id: world.id },
        attributes: ['rating']
      });

      const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      
      world.rating_average = average;
      world.rating_count = ratings.length;
      await world.save();

      res.json({
        rating,
        worldRating: {
          average: world.rating_average,
          count: world.rating_count
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;