import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface HomepageSettingsAttributes {
  id: number;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  aboutTitle: string;
  aboutContent: string;
  yearsExperience: number;
  happyCustomers: number;
  productsCount: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImageUrl?: string;
  showPromoBanner: boolean;
  promoBannerText?: string;
  showNewsletter: boolean;
  newsletterTitle?: string;
  primaryColor: string;
  secondaryColor: string;
  features: object;
  heroImages: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HomepageSettingsCreationAttributes
  extends Optional<HomepageSettingsAttributes, 'id' | 'createdAt' | 'updatedAt' | 'metaTitle' | 'metaDescription' | 'metaKeywords' | 'ogImageUrl' | 'promoBannerText' | 'newsletterTitle'> {}

class HomepageSettings extends Model<HomepageSettingsAttributes, HomepageSettingsCreationAttributes>
  implements HomepageSettingsAttributes {
  public id!: number;
  public heroTitle!: string;
  public heroSubtitle!: string;
  public heroButtonText!: string;
  public heroButtonLink!: string;
  public aboutTitle!: string;
  public aboutContent!: string;
  public yearsExperience!: number;
  public happyCustomers!: number;
  public productsCount!: number;
  public metaTitle?: string;
  public metaDescription?: string;
  public metaKeywords?: string;
  public ogImageUrl?: string;
  public showPromoBanner!: boolean;
  public promoBannerText?: string;
  public showNewsletter!: boolean;
  public newsletterTitle?: string;
  public primaryColor!: string;
  public secondaryColor!: string;
  public features!: object;
  public heroImages!: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

HomepageSettings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    heroTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: 'Medical Electronics - Thiết bị Y tế Chất lượng Cao',
      field: 'hero_title',
    },
    heroSubtitle: {
      type: DataTypes.STRING(300),
      allowNull: false,
      defaultValue: 'Nhà cung cấp thiết bị y tế hàng đầu Việt Nam',
      field: 'hero_subtitle',
    },
    heroButtonText: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Khám phá ngay',
      field: 'hero_button_text',
    },
    heroButtonLink: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '/products',
      field: 'hero_button_link',
    },
    aboutTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: 'Về chúng tôi',
      field: 'about_title',
    },
    aboutContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'Medical Electronics là đơn vị tiên phong trong lĩnh vực cung cấp thiết bị y tế chất lượng cao...',
      field: 'about_content',
    },
    yearsExperience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      field: 'years_experience',
    },
    happyCustomers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5000,
      field: 'happy_customers',
    },
    productsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
      field: 'products_count',
    },
    metaTitle: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'meta_title',
    },
    metaDescription: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'meta_description',
    },
    metaKeywords: {
      type: DataTypes.STRING(300),
      allowNull: true,
      field: 'meta_keywords',
    },
    ogImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'og_image_url',
    },
    showPromoBanner: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'show_promo_banner',
    },
    promoBannerText: {
      type: DataTypes.STRING(300),
      allowNull: true,
      field: 'promo_banner_text',
    },
    showNewsletter: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'show_newsletter',
    },
    newsletterTitle: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'newsletter_title',
    },
    primaryColor: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#00A6B8',
      field: 'primary_color',
    },
    secondaryColor: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#0088A0',
      field: 'secondary_color',
    },
    features: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'features',
    },
    heroImages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
      field: 'hero_images',
    },
  },
  {
    sequelize,
    tableName: 'homepage_settings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: false,
        fields: ['id'],
      },
    ],
  }
);

export default HomepageSettings;
