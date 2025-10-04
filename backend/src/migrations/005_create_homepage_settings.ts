import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('homepage_settings', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      hero_title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: 'Medical Electronics - Thiết bị Y tế Chất lượng Cao',
      },
      hero_subtitle: {
        type: DataTypes.STRING(300),
        allowNull: false,
        defaultValue: 'Nhà cung cấp thiết bị y tế hàng đầu Việt Nam',
      },
      hero_button_text: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Khám phá ngay',
      },
      hero_button_link: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: '/products',
      },
      about_title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: 'Về chúng tôi',
      },
      about_content: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'Medical Electronics là đơn vị tiên phong trong lĩnh vực cung cấp thiết bị y tế chất lượng cao...',
      },
      years_experience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      happy_customers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5000,
      },
      products_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1000,
      },
      meta_title: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      meta_keywords: {
        type: DataTypes.STRING(300),
        allowNull: true,
      },
      og_image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      show_promo_banner: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      promo_banner_text: {
        type: DataTypes.STRING(300),
        allowNull: true,
      },
      show_newsletter: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      newsletter_title: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      primary_color: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '#00A6B8',
      },
      secondary_color: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '#0088A0',
      },
      features: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      hero_images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Insert default homepage settings
    await queryInterface.bulkInsert('homepage_settings', [
      {
        hero_title: 'Medical Electronics - Thiết bị Y tế Chất lượng Cao',
        hero_subtitle: 'Nhà cung cấp thiết bị y tế hàng đầu Việt Nam',
        hero_button_text: 'Khám phá ngay',
        hero_button_link: '/products',
        about_title: 'Về chúng tôi',
        about_content: 'Medical Electronics là đơn vị tiên phong trong lĩnh vực cung cấp thiết bị y tế chất lượng cao tại Việt Nam. Với hơn 10 năm kinh nghiệm, chúng tôi cam kết mang đến những sản phẩm tốt nhất cho sức khỏe cộng đồng.',
        years_experience: 10,
        happy_customers: 5000,
        products_count: 1000,
        show_promo_banner: true,
        promo_banner_text: 'Giảm giá 20% cho đơn hàng đầu tiên! Sử dụng mã: FIRST20',
        show_newsletter: true,
        newsletter_title: 'Đăng ký nhận thông tin mới nhất',
        primary_color: '#00A6B8',
        secondary_color: '#0088A0',
        features: JSON.stringify([
          { id: 1, icon: '🔬', title: 'Thiết bị chẩn đoán', description: 'Công nghệ tiên tiến' },
          { id: 2, icon: '⚕️', title: 'Dụng cụ phẫu thuật', description: 'Chất lượng cao' },
          { id: 3, icon: '💊', title: 'Vật tư y tế', description: 'Đa dạng sản phẩm' },
        ]),
        hero_images: [],
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('homepage_settings');
  },
};
