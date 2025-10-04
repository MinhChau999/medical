import { Request, Response } from 'express';
import HomepageSettings from '../models/homepage.model';
import { logger } from '../utils/logger';

export class HomepageController {
  // Get homepage settings
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      // Since we only have one set of homepage settings, we'll get the first record
      // Or create one if it doesn't exist
      let settings = await HomepageSettings.findOne();

      if (!settings) {
        // Create default settings if none exist
        settings = await HomepageSettings.create({
          heroTitle: 'Medical Electronics - Thiết bị Y tế Chất lượng Cao',
          heroSubtitle: 'Nhà cung cấp thiết bị y tế hàng đầu Việt Nam',
          heroButtonText: 'Khám phá ngay',
          heroButtonLink: '/products',
          aboutTitle: 'Về chúng tôi',
          aboutContent: 'Medical Electronics là đơn vị tiên phong trong lĩnh vực cung cấp thiết bị y tế chất lượng cao tại Việt Nam. Với hơn 10 năm kinh nghiệm, chúng tôi cam kết mang đến những sản phẩm tốt nhất cho sức khỏe cộng đồng.',
          yearsExperience: 10,
          happyCustomers: 5000,
          productsCount: 1000,
          showPromoBanner: true,
          promoBannerText: 'Giảm giá 20% cho đơn hàng đầu tiên! Sử dụng mã: FIRST20',
          showNewsletter: true,
          newsletterTitle: 'Đăng ký nhận thông tin mới nhất',
          primaryColor: '#00A6B8',
          secondaryColor: '#0088A0',
          features: [
            { id: 1, icon: '🔬', title: 'Thiết bị chẩn đoán', description: 'Công nghệ tiên tiến' },
            { id: 2, icon: '⚕️', title: 'Dụng cụ phẫu thuật', description: 'Chất lượng cao' },
            { id: 3, icon: '💊', title: 'Vật tư y tế', description: 'Đa dạng sản phẩm' },
          ],
          heroImages: [],
        });
      }

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error('Error fetching homepage settings:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching homepage settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update homepage settings
  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const updateData = req.body;

      // Get or create the first (and only) settings record
      let settings = await HomepageSettings.findOne();

      if (!settings) {
        // Create if doesn't exist
        settings = await HomepageSettings.create(updateData);
      } else {
        // Update existing
        await settings.update(updateData);
      }

      logger.info('Homepage settings updated successfully');

      res.status(200).json({
        success: true,
        message: 'Homepage settings updated successfully',
        data: settings,
      });
    } catch (error) {
      logger.error('Error updating homepage settings:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating homepage settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Subscribe to newsletter
  async subscribeNewsletter(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
        return;
      }

      // TODO: Save email to newsletter subscribers table
      // For now, just log it
      logger.info(`Newsletter subscription: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Subscribed successfully',
      });
    } catch (error) {
      logger.error('Error subscribing to newsletter:', error);
      res.status(500).json({
        success: false,
        message: 'Error subscribing to newsletter',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Upload hero images
  async uploadHeroImages(req: Request, res: Response): Promise<void> {
    try {
      // Get uploaded file URLs from req.files (assuming multer is configured)
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
        return;
      }

      // Get file URLs (this depends on your upload service configuration)
      const imageUrls = files.map(file => file.path || file.filename);

      // Update homepage settings with new images
      const settings = await HomepageSettings.findOne();

      if (settings) {
        const currentImages = Array.isArray(settings.heroImages) ? settings.heroImages : [];
        await settings.update({
          heroImages: [...currentImages, ...imageUrls],
        });
      }

      res.status(200).json({
        success: true,
        message: 'Images uploaded successfully',
        data: imageUrls,
      });
    } catch (error) {
      logger.error('Error uploading hero images:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading images',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new HomepageController();
